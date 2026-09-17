/* Calm UI adapter. Existing incident capture and authentication remain separate. */
(function(root){
'use strict';
let adapter,store,player,current=null,returnFocus=null,previousOverflow='',writeChain=Promise.resolve(),wake=null,voiceTest=null;
let beforeChoice=null,beforeAtStart=null,lastKind=null,context=null,lastRange=null,syncTimer=null,initialized=false;
const core=root.CalmCore,content=root.CalmContent;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=kind=>content.categories.find(c=>c.id===kind)?.label||kind;
const statusNames={in_progress:'Not finished',completed:'Completed',ended_early:'Ended early',switched:'Switched guide',interrupted:'Interrupted'};
const feedbackNames={helped_lot:'Helped a lot',helped_some:'Helped some',no_change:'No change',worse:'Made it worse'};
const uid=()=>adapter?.owner()||null;
function notice(message){const el=$('#calmNotice');if(el)el.textContent=message;}
function syncNotice(message){const el=$('#calmSyncStatus');if(el)el.textContent=message;}
function ratings(id){return `<div id="${id}" class="calm-ratings" role="group" aria-label="Intensity from one to ten">${Array.from({length:10},(_,i)=>`<button type="button" data-rating="${i+1}" aria-pressed="false">${i+1}</button>`).join('')}</div>`;}
function selectRating(group,value){$$(group+' button').forEach(b=>{const selected=Number(b.dataset.rating)===value;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});$(group).dataset.value=value??'';}
function getRating(group){const value=Number($(group).dataset.value);return core.validRating(value)?value:null;}
function markup(){return `
 <div id="calmShell" class="calm-shell hidden" role="dialog" aria-modal="true" aria-labelledby="calmTitle">
  <div class="calm-window">
   <header class="calm-header"><div><div class="eyebrow">PATTERN TRAINER · CALM</div><h2 id="calmTitle">Get some control back.</h2></div><button id="calmClose" class="icon-btn" aria-label="Stop and return">×</button></header>
   <div id="calmNotice" class="calm-notice" role="status"></div>
   <section id="calmChoice" class="calm-body">
    <p class="calm-lede">You do not have to solve it right now.</p>
    <p class="calm-safety">Use while stopped, not driving or working machinery. Keep the app on screen. Close your eyes only where safe; some grounding guides use sight.</p>
    <button id="calmRandom" class="calm-random">🎲 RANDOM <span>Pick a guide for me. Start now.</span></button>
    <div class="calm-choices">${content.categories.map(c=>`<button type="button" data-calm-kind="${c.id}"><strong>${c.label}</strong><span>${c.detail}</span></button>`).join('')}</div>
    <details class="calm-options"><summary>Rate before starting (optional)</summary><p>How intense is it right now? Leave this unset when you need help first.</p>${ratings('calmBefore')}<button type="button" id="calmClearBefore" class="text-btn">Leave unrated</button></details>
    <details class="calm-options"><summary>Voice and playback</summary><label for="calmVoice">Device voice</label><select id="calmVoice"><option value="">Automatic · prefer local English voice</option></select><p>Uses your phone's text-to-speech, not a recording or AI voice service. A downloaded voice may work offline. Test it in airplane mode before relying on it.</p><button type="button" id="calmTestVoice" class="secondary">Test voice</button></details>
    <p class="calm-footnote">16 original guides, roughly 2–4 minutes. Research-informed techniques; these exact scripts have not been clinically tested. Humor has less direct evidence for anger.</p>
    <a class="calm-link" href="calm-evidence.html" target="_blank" rel="noopener">Research, limitations, and safety notes</a>
   </section>
   <section id="calmPlayer" class="hidden calm-player">
    <div class="calm-body"><div id="calmCategory" class="calm-kicker"></div><h3 id="calmGuideTitle"></h3>
     <div class="calm-progress"><progress id="calmProgress" value="0" max="1" aria-label="Guide progress"></progress><span id="calmStepNumber"></span></div>
     <div id="calmPlaybackState" class="calm-playback" role="status">Starting voice…</div>
     <div id="calmCaption" class="calm-caption"></div>
     <p id="calmVoiceError" class="calm-error hidden" role="alert"></p>
     <p class="calm-footnote">Silences are intentional. Keep breathing normally; no forced breaths or breath holds. Stop or switch if this makes you feel worse.</p>
    </div>
    <div class="calm-controls">
     <div class="calm-control-row"><button id="calmPause" class="secondary">Pause</button><button id="calmNext" class="secondary">Next instruction</button></div>
     <div class="calm-control-row"><button id="calmAnother" class="secondary">Try another</button><button id="calmRead" class="text-btn">Read instead</button></div>
     <button id="calmFinish" class="primary">Stop / I'm good now</button>
    </div>
   </section>
   <section id="calmOutcome" class="calm-body hidden">
    <h3>Check in, or just return.</h3><p id="calmOutcomeLabel"></p>
    <label>Intensity now (optional)</label>${ratings('calmAfter')}
    <details id="calmRecallWrap" class="calm-options"><summary>Remember how intense it was before? (optional)</summary><p>This is a recalled rating, not a measurement taken before the guide. It will be labeled that way.</p>${ratings('calmRecalled')}</details>
    <label class="calm-feedback-label">How was that for you?</label><div id="calmFeedback" class="calm-feedback">${Object.entries(feedbackNames).map(([k,v])=>`<button type="button" data-feedback="${k}" aria-pressed="false">${v}</button>`).join('')}</div>
    <p id="calmWorseNote" class="calm-error hidden">Leave this technique for now. Breathe normally and take some space. If you cannot stay safe, get immediate help rather than relying on the app.</p>
    <p id="calmSaveStatus" class="calm-footnote" role="status"></p>
    <div class="calm-outcome-actions"><button id="calmDone" class="primary">Save check-in & return</button><button id="calmSkip" class="secondary">Skip ratings & return</button><button id="calmGroundInstead" class="text-btn hidden">Try grounding instead</button></div>
   </section>
  </div>
 </div>`;}
function view(name){for(const id of ['Choice','Player','Outcome'])$('#calm'+id).classList.toggle('hidden',id!==name);$('.calm-window').scrollTop=0;}
function stopInput(){adapter?.stopCapture?.();}
function stopTestVoice(){if(voiceTest){try{root.speechSynthesis?.cancel();}catch{}voiceTest=null;}}
function populateVoices(){const select=$('#calmVoice');if(!select)return;let voices=[];try{voices=root.speechSynthesis?.getVoices()||[];}catch{}const selected=select.value||localStorage.getItem('patternTrainerCalmVoice')||'';select.innerHTML='<option value="">Automatic · prefer local English voice</option>';for(const v of voices.filter(v=>/^en/i.test(v.lang))){const o=document.createElement('option');o.value=v.voiceURI;o.textContent=v.name+(v.localService?' · local':' · may need internet');select.appendChild(o);}if([...select.options].some(o=>o.value===selected))select.value=selected;}
function open(from='home'){
 if(!initialized)return;
 if(!$('#calmShell').classList.contains('hidden'))return;
 stopInput();context={from,linkedEntryId:from==='entry'?$('#entryId')?.value||null:null};
 returnFocus=document.activeElement;previousOverflow=document.body.style.overflow;
 document.body.style.overflow='hidden';$('#calmShell').classList.remove('hidden');current=null;beforeChoice=null;beforeAtStart=null;
 selectRating('#calmBefore',null);view('Choice');notice(uid()?'':'Practice is available without signing in. Ratings will not be saved.');populateVoices();$('#calmRandom').focus();
}
function releaseWake(){const lock=wake;wake=null;if(lock)lock.release().catch(()=>{});}
function requestWake(){releaseWake();if(navigator.wakeLock&&document.visibilityState==='visible')navigator.wakeLock.request('screen').then(lock=>{if($('#calmPlayer').classList.contains('hidden')||['paused','idle','error','finished'].includes(player.state)){lock.release().catch(()=>{});}else wake=lock;}).catch(()=>{});}
function updateState(state){
 if(state==='speaking'&&current)current.delivery='speech';
 const phrases={starting:'Starting voice…',speaking:'Voice playing · follow at your own pace',waiting:'Quiet practice · next instruction follows',paused:'Paused · Resume repeats this instruction',reading:'Read at your own pace · tap Next instruction',error:'Audio stopped · text is still available',finished:'Guide finished',idle:'Stopped'};
 if($('#calmPlaybackState'))$('#calmPlaybackState').textContent=phrases[state]||state;
 if($('#calmPause')){$('#calmPause').textContent=['paused','error'].includes(state)?'Resume':'Pause';$('#calmPause').disabled=state==='reading';}
 if(['paused','error','finished','idle'].includes(state))releaseWake();
}
function persist(){
 if(!current?.userId)return Promise.resolve(null);
 const snapshot={...current,updatedAt:new Date().toISOString()};
 const job=writeChain.catch(()=>{}).then(()=>store.save(snapshot));writeChain=job;
 job.then(()=>{if($('#calmSaveStatus'))$('#calmSaveStatus').textContent='Saved on this device. Cloud sync is automatic when online.';if(uid()===snapshot.userId)scheduleSync();}).catch(()=>{if($('#calmSaveStatus'))$('#calmSaveStatus').textContent='Not saved: local storage could not be written. Keep this screen open and retry.';notice('Calm is still usable, but this session could not be saved locally.');});
 return job;
}
function start(kind='random',exclude=null){
 stopTestVoice();stopInput();const guide=core.choose(content.sessions,kind,exclude);
 lastKind=guide.kind;beforeAtStart=exclude?null:getRating('#calmBefore');const now=new Date().toISOString();
 current={id:crypto.randomUUID(),userId:uid(),kind:guide.kind,scriptId:guide.id,selection:kind==='random'?'random':'manual',startedAt:now,endedAt:null,durationSeconds:0,before:beforeAtStart,after:null,beforeSource:beforeAtStart===null?'unrated':'before',feedback:null,status:'in_progress',delivery:'speech',linkedEntryId:context?.linkedEntryId||null,updatedAt:now,deleted:false};
 if(current.userId)sessionStorage.setItem('patternTrainerActiveCalm:'+current.userId,current.id);
 view('Player');notice('');$('#calmCategory').textContent=label(guide.kind)+(kind==='random'?' · Random choice':'');$('#calmGuideTitle').textContent=guide.title;
 $('#calmVoiceError').classList.add('hidden');player.voiceURI=$('#calmVoice').value;player.start(guide);requestWake();persist();
}
function finish(status='ended_early',showOutcome=true){
 if(!current)return;
 const seconds=player.elapsedSeconds;player.stop();releaseWake();
 current={...current,status,endedAt:new Date().toISOString(),durationSeconds:Math.min(86400,seconds)};
 if(current.userId)sessionStorage.removeItem('patternTrainerActiveCalm:'+current.userId);
 persist();
 if(showOutcome){view('Outcome');$('#calmOutcomeLabel').textContent=label(current.kind)+' · '+statusNames[status]+'. No change is a useful result too.';
 selectRating('#calmAfter',null);selectRating('#calmRecalled',null);$('#calmRecallWrap').classList.toggle('hidden',current.beforeSource==='before');$('#calmRecallWrap').open=false;
 $('#calmFeedback').dataset.value='';$$('#calmFeedback button').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});$('#calmWorseNote').classList.add('hidden');$('#calmGroundInstead').classList.add('hidden');$('#calmSaveStatus').textContent=current.userId?'Saving session…':'Practice only. Sign in to keep session records.';$('#calmDone').focus();}
}
async function saveOutcome(closeAfter=true,skip=false){
 if(!current){close();return;}
 if(!skip){current.after=getRating('#calmAfter');if(current.beforeSource!=='before'){current.before=getRating('#calmRecalled');current.beforeSource=current.before===null?'unrated':'recalled';}current.feedback=$('#calmFeedback').dataset.value||null;}
 $('#calmDone').disabled=true;
 try{await persist();if(closeAfter)close();else if(lastRange)renderReview(...lastRange);}catch{notice('Check-in not saved. Please retry.');throw new Error('Check-in not saved.');}finally{$('#calmDone').disabled=false;}
}
function close(){
 if(!$('#calmShell')||$('#calmShell').classList.contains('hidden'))return;
 stopTestVoice();if(current?.status==='in_progress')finish('interrupted',false);else player?.stop();releaseWake();
 $('#calmShell').classList.add('hidden');document.body.style.overflow=previousOverflow;current=null;returnFocus?.focus?.();if(lastRange)renderReview(...lastRange).catch(()=>{});
}
async function sync(){
 if(!store||!uid())return;
 syncNotice('Calm sync: checking…');
 try{const result=await store.sync();if(result.state==='synced')syncNotice(result.pending?'Calm: saved here, newer changes waiting to sync.':'Calm synced · '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}));else if(result.state==='offline')syncNotice('Calm: offline · '+result.pending+' change(s) saved here, waiting to sync.');else syncNotice('Sign in to sync Calm sessions.');if(lastRange)await renderReview(...lastRange);}catch(e){syncNotice('Calm: saved here; sync needs retry. '+(e.message||'Network unavailable.'));}
}
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>sync(),500);}
function changeLabel(n){return n===null?'Not enough paired ratings':Math.abs(n).toFixed(1)+' point'+(Math.abs(n)===1?'':'s')+(n>=0?' lower':' higher');}
function summaryHTML(rows,controls=false){const stats=core.summarize(rows);
 if(!rows.length)return '<p>No Calm sessions in this date range.</p>';
 const table=content.categories.map(c=>{const g=stats.byKind[c.id];return `<tr><td>${c.label}</td><td>${g.attempts}</td><td>${g.paired}</td><td>${changeLabel(g.meanChange)}</td><td>${g.helpful}</td><td>${g.worse}</td></tr>`;}).join('');
 const list=(controls?rows.slice(0,30):rows).map(r=>{const dt=new Date(r.startedAt).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});return `<div class="calm-session-line"><div><strong>${label(r.kind)}</strong> · ${esc(dt)}<br><span>${esc(statusNames[r.status])}${r.selection==='random'?' · Random':''} · Before ${r.before??'not rated'}${r.beforeSource==='recalled'?' (recalled)':''} → After ${r.after??'not rated'}${r.feedback?' · '+feedbackNames[r.feedback]:''}${r.delivery==='text'?' · Read on screen':r.delivery==='unavailable'?' · Audio unavailable':''}</span></div>${controls?`<button type="button" class="text-btn" data-calm-delete="${esc(r.id)}" aria-label="Remove this Calm session">Remove</button>`:''}</div>`;}).join('');
 return `<p><strong>${stats.attempts}</strong> sessions started · ${stats.completed} completed · ${stats.endedEarly} ended early · ${stats.random} chosen with Random.</p><p>Average before-to-after change: <strong>${changeLabel(stats.meanChange)}</strong> (${stats.paired} paired ratings taken before and after a completed or early-ended session).</p><div class="calm-table-wrap"><table class="calm-table"><thead><tr><th>Guide</th><th>Started</th><th>Paired</th><th>Average change</th><th>Helped*</th><th>Worse*</th></tr></thead><tbody>${table}</tbody></table></div><p class="calm-footnote">*Your feedback. Not a treatment ranking or proof of cause and effect. Missing, recalled, switched, and interrupted rating pairs are not used in the average. No score is inferred. ${controls&&rows.length>30?'Latest 30 sessions shown below.':''}</p>${list}`;
}
async function rangeRows(start,end){const owner=uid();if(!owner)return [];const rows=await store.list(owner);if(uid()!==owner)return [];return rows.filter(r=>{const t=new Date(r.startedAt);return t>=start&&t<end;});}
async function renderReview(start,end){lastRange=[start,end];const el=$('#calmReview');if(!el||!store)return;try{el.innerHTML=summaryHTML(await rangeRows(start,end),true);}catch{el.textContent='Calm session history is unavailable on this device right now.';}}
async function reportHTML(start,end){if(!store)return '';try{return '<section class="calm-report"><h2>Calm sessions</h2>'+summaryHTML(await rangeRows(start,end))+'</section>';}catch{return '<section><h2>Calm sessions</h2><p>Calm history could not be read for this report. Incident history is shown separately.</p></section>';}}
async function recoverInterrupted(){const owner=uid();if(!owner)return;const key='patternTrainerActiveCalm:'+owner;const id=sessionStorage.getItem(key);if(!id)return;const r=await store.get(id,owner);if(r&&r.status==='in_progress')await store.save({...r,status:'interrupted',endedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});sessionStorage.removeItem(key);}
function init(options){if(initialized)return;adapter=options;initialized=true;
 document.body.insertAdjacentHTML('beforeend',markup());store=new root.CalmStorage.Store({url:options.url,key:options.key,owner:options.owner,token:options.token});store.ready.catch(()=>notice('Local storage is unavailable. Audio guides still work, but session results cannot be saved.'));
 player=new core.Player({synth:root.speechSynthesis,Utterance:root.SpeechSynthesisUtterance,onStep:(step,index,total)=>{$('#calmCaption').textContent=step.text;$('#calmProgress').max=total;$('#calmProgress').value=index+1;$('#calmStepNumber').textContent=(index+1)+' / '+total;},onState:updateState,onFinish:()=>finish('completed'),onError:message=>{$('#calmVoiceError').textContent=message;$('#calmVoiceError').classList.remove('hidden');if(current)current.delivery='unavailable';}});
 document.addEventListener('click',e=>{const openButton=e.target.closest('[data-calm-open]');if(openButton){open(openButton.dataset.calmOpen);return;}const del=e.target.closest('[data-calm-delete]');if(del&&confirm('Remove this Calm session from your history?'))store.remove(del.dataset.calmDelete,uid()).then(()=>{renderReview(...lastRange);scheduleSync();}).catch(()=>notice('Could not remove that session.'));});
 $('#calmRandom').onclick=()=>start('random');$$('[data-calm-kind]').forEach(b=>b.onclick=()=>start(b.dataset.calmKind));
 for(const id of ['#calmBefore','#calmAfter','#calmRecalled'])$$(id+' button').forEach(b=>b.onclick=()=>selectRating(id,Number(b.dataset.rating)));
 $('#calmClearBefore').onclick=()=>selectRating('#calmBefore',null);
 $('#calmClose').onclick=close;$('#calmPause').onclick=()=>{if(['paused','error'].includes(player.state)){$('#calmVoiceError').classList.add('hidden');player.resume();requestWake();}else player.pause();};
 $('#calmNext').onclick=()=>player.next();$('#calmRead').onclick=()=>{if(current)current.delivery='text';$('#calmVoiceError').classList.add('hidden');player.readInstead();};
 $('#calmFinish').onclick=()=>finish('ended_early');$('#calmAnother').onclick=()=>{const exclude=lastKind;finish('switched',false);start('random',exclude);};
 $$('#calmFeedback button').forEach(b=>b.onclick=()=>{$('#calmFeedback').dataset.value=b.dataset.feedback;$$('#calmFeedback button').forEach(x=>{const picked=x===b;x.classList.toggle('selected',picked);x.setAttribute('aria-pressed',String(picked));});const worse=b.dataset.feedback==='worse';$('#calmWorseNote').classList.toggle('hidden',!worse);$('#calmGroundInstead').classList.toggle('hidden',!worse);});
 $('#calmDone').onclick=()=>saveOutcome(true).catch(()=>{});$('#calmSkip').onclick=()=>saveOutcome(true,true).catch(()=>{});$('#calmGroundInstead').onclick=()=>saveOutcome(false).then(()=>{selectRating('#calmBefore',null);start('ground');}).catch(()=>{});
 $('#calmVoice').onchange=()=>localStorage.setItem('patternTrainerCalmVoice',$('#calmVoice').value);root.speechSynthesis?.addEventListener?.('voiceschanged',populateVoices);
 $('#calmTestVoice').onclick=()=>{stopTestVoice();if(!root.speechSynthesis||!root.SpeechSynthesisUtterance){notice('No device voice is available. The written guides still work.');return;}voiceTest=new SpeechSynthesisUtterance('This is the voice for Calm. Take a moment. You do not need to solve it right now.');voiceTest.rate=.93;voiceTest.lang='en-US';const voices=root.speechSynthesis.getVoices();voiceTest.voice=voices.find(v=>v.voiceURI===$('#calmVoice').value)||voices.find(v=>/^en/i.test(v.lang)&&v.localService)||null;voiceTest.onerror=()=>notice('Voice test failed. Check media volume and text-to-speech settings.');try{root.speechSynthesis.speak(voiceTest);}catch{notice('Voice test could not start.');}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(current?.status==='in_progress'){current.durationSeconds=player.elapsedSeconds;player.pause();persist();notice('Paused while the app was away. Tap Resume when ready.');}stopTestVoice();}else{scheduleSync();}});
 root.addEventListener('pagehide',()=>{if(current?.status==='in_progress')finish('interrupted',false);});
 root.addEventListener('online',scheduleSync);root.addEventListener('pattern:account-change',()=>{close();syncNotice('Calm: account changed.');if(lastRange)renderReview(...lastRange).catch(()=>{});recoverInterrupted().then(scheduleSync).catch(()=>{});});
 $('#calmShell').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const focusable=[...$('#calmShell').querySelectorAll('button,a,input,select,summary')].filter(el=>!el.disabled&&el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 setInterval(()=>{if(!document.hidden&&navigator.onLine)scheduleSync();},60000);recoverInterrupted().then(scheduleSync).catch(()=>{});
}
root.PatternCalm={init,open,sync,renderReview,reportHTML,exportData:()=>store?store.export(uid()):Promise.resolve([]),importData:rows=>store.import(rows,uid()),clearLocal:async()=>{const rows=await store.list(uid(),true);if(rows.some(r=>r._dirty))throw new Error('Calm has unsynced records. Export a backup or sync before clearing them.');return store.clearLocal(uid());}};
})(window);
