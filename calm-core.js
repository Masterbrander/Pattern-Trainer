/* Independent selection, reporting and cancellable speech playback. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CalmCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KINDS=['ground','down','unstuck','humor'];
function validRating(value){return Number.isInteger(value)&&value>=1&&value<=10;}
function estimateSeconds(session){return Math.round(session.steps.reduce((n,s)=>n+s.text.trim().split(/\s+/).length*60/140+s.pauseMs/1000,0));}
function choose(sessions,kind='random',exclude=null,random=Math.random){
  const available=KINDS.filter(k=>sessions.some(s=>s.kind===k)&&(kind!=='random'||k!==exclude));
  const pick=a=>a[Math.min(a.length-1,Math.max(0,Math.floor(random()*a.length)))];
  const selected=kind==='random'?pick(available):kind;
  const variants=sessions.filter(s=>s.kind===selected);
  if(!variants.length)throw new Error('No guide is available for that choice.');
  return pick(variants);
}
function summarize(rows){
  const result={attempts:0,completed:0,endedEarly:0,switched:0,interrupted:0,random:0,paired:0,meanChange:null,byKind:{}};
  let totalChange=0;
  for(const kind of KINDS)result.byKind[kind]={attempts:0,paired:0,meanChange:null,helpful:0,worse:0,changes:[]};
  for(const r of rows.filter(x=>!x.deleted)){
    if(!KINDS.includes(r.kind))continue;
    result.attempts++;const group=result.byKind[r.kind];group.attempts++;
    if(r.selection==='random')result.random++;
    if(r.status==='completed')result.completed++;
    else if(r.status==='ended_early')result.endedEarly++;
    else if(r.status==='switched')result.switched++;
    else if(r.status==='interrupted')result.interrupted++;
    if(r.feedback==='helped_lot'||r.feedback==='helped_some')group.helpful++;
    if(r.feedback==='worse')group.worse++;
    if(['completed','ended_early'].includes(r.status)&&r.beforeSource==='before'&&validRating(r.before)&&validRating(r.after)){
      const change=r.before-r.after;result.paired++;totalChange+=change;group.paired++;group.changes.push(change);
    }
  }
  result.meanChange=result.paired?totalChange/result.paired:null;
  for(const g of Object.values(result.byKind)){g.meanChange=g.paired?g.changes.reduce((a,b)=>a+b,0)/g.paired:null;delete g.changes;}
  return result;
}
function splitSpeech(text,max=200){
  const chunks=[];const sentences=String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[String(text)];
  for(const sentence of sentences){let part='';for(const word of sentence.trim().split(/\s+/)){
    if(part&&part.length+word.length+1>max){chunks.push(part);part='';}part+=(part?' ':'')+word;
  }if(part)chunks.push(part);}
  return chunks.filter(Boolean);
}
class Player{
  constructor(options={}){
    this.synth=options.synth;this.Utterance=options.Utterance;
    this.clock=options.clock||{now:()=>performance.now(),set:(fn,ms)=>setTimeout(fn,ms),clear:k=>clearTimeout(k)};
    this.onStep=options.onStep||(()=>{});this.onState=options.onState||(()=>{});this.onFinish=options.onFinish||(()=>{});this.onError=options.onError||(()=>{});
    this.state='idle';this.index=0;this.generation=0;this.handles=new Set();this.rate=.93;this.voiceURI='';this.totalMs=0;this.activeSince=null;
  }
  _state(state){if(this.activeSince!==null){this.totalMs+=Math.max(0,this.clock.now()-this.activeSince);this.activeSince=null;}
    this.state=state;if(['starting','speaking','waiting','reading'].includes(state))this.activeSince=this.clock.now();this.onState(state);}
  get elapsedSeconds(){return Math.round((this.totalMs+(this.activeSince===null?0:Math.max(0,this.clock.now()-this.activeSince)))/1000);}
  _later(fn,ms){const gen=this.generation;let h;h=this.clock.set(()=>{this.handles.delete(h);if(gen===this.generation)fn();},ms);this.handles.add(h);return h;}
  _clear(){this.generation++;for(const h of this.handles)this.clock.clear(h);this.handles.clear();try{this.synth?.cancel();}catch{}this.utterance=null;}
  _voice(){let voices=[];try{voices=this.synth?.getVoices()||[];}catch{}
    return voices.find(v=>v.voiceURI===this.voiceURI)||voices.find(v=>/^en[-_]US$/i.test(v.lang)&&v.localService)||voices.find(v=>/^en/i.test(v.lang)&&v.localService)||voices.find(v=>/^en/i.test(v.lang));}
  start(script){this.stop();this.script=script;this.index=0;this.totalMs=0;this.readMode=false;this._step();}
  _step(){
    if(this.index>=this.script.steps.length){this._clear();this._state('finished');this.onFinish();return;}
    this._clear();const step=this.script.steps[this.index];this.onStep(step,this.index,this.script.steps.length);
    if(this.readMode){this._state('reading');return;}
    if(!this.synth||!this.Utterance){this._fail('This browser has no spoken voice available. Read instead, or try a device with text-to-speech.');return;}
    this.chunks=splitSpeech(step.text);this.chunkIndex=0;this._speakChunk();
  }
  _speakChunk(){
    const gen=this.generation;const step=this.script.steps[this.index];let ended=false,watch;
    const u=new this.Utterance(this.chunks[this.chunkIndex]);this.utterance=u;u.lang='en-US';u.rate=this.rate;u.pitch=1;u.volume=1;
    const voice=this._voice();if(voice)u.voice=voice;
    const clearWatch=()=>{if(watch!==undefined){this.clock.clear(watch);this.handles.delete(watch);}};
    const valid=()=>gen===this.generation&&!ended;
    u.onstart=()=>{if(!valid())return;clearWatch();this._state('speaking');watch=this._later(()=>this._fail('The voice stopped responding. Resume repeats this instruction; Read instead also works.'),Math.max(18000,u.text.split(/\s+/).length*900+10000));};
    u.onend=()=>{if(!valid())return;ended=true;clearWatch();this.utterance=null;
      this.chunkIndex++;
      if(this.chunkIndex<this.chunks.length){this._speakChunk();return;}
      this._state('waiting');this._later(()=>{this.index++;this._step();},step.pauseMs);
    };
    u.onerror=e=>{if(!valid())return;ended=true;clearWatch();this._fail('Audio could not play'+(e?.error?' ('+e.error+')':'')+'. Check media volume or choose Read instead.');};
    this._state('starting');watch=this._later(()=>this._fail('No voice started. Check media volume and text-to-speech settings, then Resume, or use Read instead.'),8000);
    try{this.synth.speak(u);}catch{this._fail('Audio could not start. You can read the same guide on screen.');}
  }
  _fail(message){this._clear();this._state('error');this.onError(message);}
  pause(){if(['idle','finished','paused'].includes(this.state))return;this._clear();this._state('paused');}
  resume(){if(!this.script||!['paused','error'].includes(this.state))return;this._step();}
  readInstead(){if(!this.script)return;this._clear();this.readMode=true;this._state('reading');this.onStep(this.script.steps[this.index],this.index,this.script.steps.length);}
  next(){if(!this.script||['idle','finished'].includes(this.state))return;this._clear();this.index++;this._step();}
  stop(){this._clear();this._state('idle');}
}
return {KINDS,validRating,estimateSeconds,choose,summarize,splitSpeech,Player};
});
