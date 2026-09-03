
const DB_NAME = 'patternTrainerDB';
const STORE = 'entries';
const DB_VERSION = 1;

let db;
let currentLevel = 2;
let currentEmotion = 'Irritation';
let reviewAnchor = new Date();

const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if(!d.objectStoreNames.contains(STORE)){
        const store = d.createObjectStore(STORE,{keyPath:'id'});
        store.createIndex('timestamp','timestamp');
      }
    };
    req.onsuccess = e => { db=e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}
function txStore(mode='readonly'){ return db.transaction(STORE,mode).objectStore(STORE); }
function getAllEntries(){
  return new Promise((resolve,reject)=>{
    const req = txStore().getAll();
    req.onsuccess=()=>resolve(req.result.filter(x=>!x._deleted).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));
    req.onerror=()=>reject(req.error);
  });
}
function putEntryLocal(entry){
  return new Promise((resolve,reject)=>{
    const req = txStore('readwrite').put(entry);
    req.onsuccess=()=>resolve(entry);
    req.onerror=()=>reject(req.error);
  });
}
function deleteByIdLocal(id){
  return new Promise((resolve,reject)=>{
    const req = txStore('readwrite').delete(id);
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}
function clearDB(){
  return new Promise((resolve,reject)=>{
    const req = txStore('readwrite').clear();
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}

// V3 cloud sync. A random sync ID acts as the shared key between your devices.
// The browser never receives a database admin key; sync goes through a small Edge Function.
const SUPABASE_URL = 'https://ykjqohkotetayuowaary.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SgFpVT105b1iMn-3twav9Q_gk2cCKPo';
const SYNC_URL = `${SUPABASE_URL}/functions/v1/pattern-sync`;
function getDeviceId(){
  let id=localStorage.getItem('patternTrainerSyncId');
  if(!id){ id=uuid(); localStorage.setItem('patternTrainerSyncId',id); }
  return id;
}
function setDeviceId(id){
  const clean=String(id||'').trim();
  if(!/^[a-zA-Z0-9._-]{20,100}$/.test(clean)) throw new Error('Invalid sync ID');
  localStorage.setItem('patternTrainerSyncId',clean);
  const input=qs('#syncIdInput'); if(input) input.value=clean;
}
function syncHeaders(){ return {'apikey':SUPABASE_KEY,'Content-Type':'application/json'}; }
function toCloud(e){return {
  id:e.id, device_id:getDeviceId(), timestamp:e.timestamp, level:e.level, emotion:e.emotion||null,
  event:e.event||null, thought:e.thought||null, physical_cues:e.physicalCues||null,
  behavioral_cues:e.behavioralCues||null, emotional_cues:e.emotionalCues||null, cognitive_cues:e.cognitiveCues||null,
  consequence:e.consequence||null, strategy:e.strategy||null, realistic:e.realistic||null, future:e.future||null,
  updated_at:e.updatedAt||new Date().toISOString(), deleted:!!e._deleted
};}
function fromCloud(x){return {id:x.id,timestamp:x.timestamp,level:x.level,emotion:x.emotion||'',event:x.event||'',thought:x.thought||'',physicalCues:x.physical_cues||'',behavioralCues:x.behavioral_cues||'',emotionalCues:x.emotional_cues||'',cognitiveCues:x.cognitive_cues||'',consequence:x.consequence||'',strategy:x.strategy||'',realistic:x.realistic||'',future:x.future||'',updatedAt:x.updated_at,_deleted:!!x.deleted};}
async function callSync(body){
  const r=await fetch(SYNC_URL,{method:'POST',headers:syncHeaders(),body:JSON.stringify({...body,syncId:getDeviceId()})});
  if(!r.ok) throw new Error('sync failed');
  return r.json();
}
async function cloudUpsert(entry){
  await callSync({action:'upsert',entry:toCloud(entry)});
}
async function getAllRecords(){
  return new Promise((resolve,reject)=>{
    const req=txStore().getAll();
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function syncCloud(){
  setSyncStatus('Syncing…');
  try{
    const local=await getAllRecords();
    const pulled=await callSync({action:'pull'});
    const remote=(pulled.entries||[]).map(fromCloud);
    const remoteById=new Map(remote.map(x=>[x.id,x]));
    const localById=new Map(local.map(x=>[x.id,x]));

    // Merge newest copy first, including deletion tombstones.
    for(const r of remote){
      const l=localById.get(r.id);
      if(!l || new Date(r.updatedAt||0)>new Date(l.updatedAt||0)) await putEntryLocal(r);
    }
    // Push local records only when they are newer than the cloud copy.
    for(const l of local){
      const r=remoteById.get(l.id);
      if(!r || new Date(l.updatedAt||0)>new Date(r.updatedAt||0)) await cloudUpsert(l);
    }
    setSyncStatus(`Synced • ${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`);
    await refreshHome();
    const active=qsa('.view.active')[0]?.id;
    if(active==='historyView') await refreshHistory();
    if(active==='reviewView') await refreshReview();
  }catch(e){ setSyncStatus('Offline • saved on this device'); }
}
function setSyncStatus(t){ const el=qs('#syncStatus'); if(el) el.textContent=t; }
function shareSyncId(){
  const id=getDeviceId();
  navigator.clipboard?.writeText(id).catch(()=>{});
  return id;
}
async function putEntry(entry){ await putEntryLocal({...entry,_deleted:false}); cloudUpsert({...entry,_deleted:false}).then(()=>setSyncStatus('Synced')).catch(()=>setSyncStatus('Offline • saved on this device')); return entry; }
async function deleteById(id){
  const all=await getAllRecords(); const e=all.find(x=>x.id===id); if(!e)return;
  const tomb={...e,_deleted:true,updatedAt:new Date().toISOString()};
  await putEntryLocal(tomb);
  cloudUpsert(tomb).catch(()=>setSyncStatus('Offline • deletion will sync later'));
}
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+Math.random(); }
function pad(n){ return String(n).padStart(2,'0'); }
function localDateStr(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function localTimeStr(d){ return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

function startOfWeek(d){
  const x = new Date(d); x.setHours(0,0,0,0);
  const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day);
  return x;
}
function endOfWeek(d){ const x=startOfWeek(d); x.setDate(x.getDate()+7); return x; }
function formatShortDate(d){ return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function formatEntryTime(ts){
  const d=new Date(ts);
  return d.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
}
function within(entries,start,end){
  return entries.filter(e=>{const t=new Date(e.timestamp); return t>=start && t<end;});
}
function levelClass(n){ return n<=3?'early':n<=6?'medium':'high'; }

const EMOTIONS = ['Irritation','Anger','Anxiety','Hurt','Resentment','Shame','Stress','Self-criticism','Other'];

function buildEmotionButtons(){
  const box=qs('#emotionButtons');
  EMOTIONS.forEach(name=>{
    const b=document.createElement('button');
    b.type='button'; b.dataset.emotion=name; b.textContent=name;
    b.addEventListener('click',()=>setEmotion(name));
    box.appendChild(b);
  });
}
function setEmotion(name){
  currentEmotion=name || 'Irritation';
  qsa('#emotionButtons button').forEach(b=>b.classList.toggle('selected',b.dataset.emotion===currentEmotion));
  const other=currentEmotion==='Other';
  qs('#otherEmotion').classList.toggle('hidden',!other);
  if(other) setTimeout(()=>qs('#otherEmotion').focus(),50);
}

function tokenize(text){
  return (text||'').toLowerCase()
    .replace(/[“”"'.,!?;:()[\]{}]/g,' ')
    .split(/\s+/).map(x=>x.trim()).filter(x=>x.length>2);
}
const STOP = new Set('the and that this with from have were what when your just into about then they them there here for but not you are was did had why can cant could would should its im ive dont doesnt didnt isnt wasnt very really some thing things got get being because still like'.split(' '));

function topPhrases(values, limit=4){
  const counts=new Map();
  for(const v of values){
    if(!v) continue;
    const cleaned=v.trim();
    if(cleaned.length<=40){
      const k=cleaned.toLowerCase();
      counts.set(k,(counts.get(k)||0)+1);
    } else {
      tokenize(cleaned).filter(w=>!STOP.has(w)).forEach(w=>counts.set(w,(counts.get(w)||0)+1));
    }
  }
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([text,count])=>({text,count}));
}
function cueValues(entries){
  return entries.flatMap(e=>[e.physicalCues,e.behavioralCues,e.emotionalCues,e.cognitiveCues]).filter(Boolean);
}

function renderPattern(containerId, values, empty='Not enough data yet'){
  const el=qs(containerId); el.innerHTML='';
  const top=topPhrases(values);
  if(!top.length){ el.innerHTML=`<span>${empty}</span>`; return; }
  top.forEach(x=>{
    const s=document.createElement('span');
    s.textContent=x.count>1?`${x.text} ×${x.count}`:x.text;
    el.appendChild(s);
  });
}

function makeEntryCard(entry){
  const node=qs('#entryTemplate').content.firstElementChild.cloneNode(true);
  const pill=node.querySelector('.level-pill');
  pill.textContent=`Intensity ${entry.level}${entry.level<=3?' • caught early':''}`;
  pill.classList.add(levelClass(entry.level));
  node.querySelector('.entry-time').textContent=formatEntryTime(entry.timestamp);
  const emotion = entry.emotion || 'Anger / irritation';
  node.querySelector('.entry-emotion').textContent=emotion;
  node.querySelector('.entry-event').textContent=entry.event || 'Thought capture';
  node.querySelector('.entry-thought').textContent=entry.thought || '—';
  const cues=node.querySelector('.entry-cues');
  const chips=[
    ['physical',entry.physicalCues],['behavior',entry.behavioralCues],
    ['emotion',entry.emotionalCues],['cognitive',entry.cognitiveCues],
    ['strategy',entry.strategy]
  ].filter(x=>x[1]);
  chips.slice(0,3).forEach(([k,v])=>{
    const s=document.createElement('span');s.className='chip';s.textContent=`${k}: ${v}`;cues.appendChild(s);
  });
  node.addEventListener('click',()=>openEntry(entry));
  return node;
}
function renderList(el, entries, emptyMsg){
  el.innerHTML=''; el.classList.remove('empty-state');
  if(!entries.length){el.classList.add('empty-state');el.textContent=emptyMsg;return;}
  entries.forEach(e=>el.appendChild(makeEntryCard(e)));
}

async function refreshHome(){
  const entries=await getAllEntries();
  const s=startOfWeek(new Date()), e=endOfWeek(new Date());
  const week=within(entries,s,e);
  qs('#weekCount').textContent=week.length;
  qs('#earlyCount').textContent=week.filter(x=>x.level<=3).length;
  qs('#highCount').textContent=week.length?Math.max(...week.map(x=>x.level)):0;
  qs('#weekNudge').textContent=week.length
    ? `${week.filter(x=>x.level<=3).length} of ${week.length} entries were caught at levels 1–3.`
    : 'Your first entry will start building your pattern map.';
  renderList(qs('#recentList'),entries.slice(0,4),'No entries yet.');
}

async function refreshHistory(mode='thisWeek'){
  const entries=await getAllEntries();
  let filtered=entries;
  const now=new Date();
  if(mode==='thisWeek') filtered=within(entries,startOfWeek(now),endOfWeek(now));
  if(mode==='lastWeek'){
    const anchor=startOfWeek(now); anchor.setDate(anchor.getDate()-7);
    filtered=within(entries,anchor,endOfWeek(anchor));
  }
  renderList(qs('#historyList'),filtered,'No entries in this range.');
}

async function refreshReview(){
  const entries=await getAllEntries();
  const s=startOfWeek(reviewAnchor), e=endOfWeek(reviewAnchor);
  const week=within(entries,s,e);
  const endLabel=new Date(e); endLabel.setDate(endLabel.getDate()-1);
  qs('#reviewRangeLabel').textContent=`${formatShortDate(s)} – ${formatShortDate(endLabel)}`;
  qs('#rCount').textContent=week.length;
  qs('#rEarly').textContent=week.length?`${Math.round(100*week.filter(x=>x.level<=3).length/week.length)}%`:'0%';
  qs('#rHigh').textContent=week.length?Math.max(...week.map(x=>x.level)):0;
  qs('#rAvg').textContent=week.length?(week.reduce((a,b)=>a+b.level,0)/week.length).toFixed(1):'0';
  renderPattern('#emotionPatterns',week.map(x=>x.emotion || 'Anger / irritation'));
  renderPattern('#triggerPatterns',week.map(x=>x.event));
  renderPattern('#thoughtPatterns',week.map(x=>x.thought));
  renderPattern('#cuePatterns',cueValues(week));
  renderPattern('#strategyPatterns',week.map(x=>x.strategy));
  renderList(qs('#reviewList'),week,'No entries this week.');
}

function showView(name){
  qsa('.view').forEach(v=>v.classList.remove('active'));
  qs(`#${name}View`).classList.add('active');
  qsa('.bottom-nav button[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  qs('#pageTitle').textContent = name==='home'?'Catch it early.':name==='history'?'Your entries.':'Find the pattern.';
  if(name==='home') refreshHome();
  if(name==='history') refreshHistory(qs('.segmented button.active')?.dataset.range || 'thisWeek');
  if(name==='review') refreshReview();
  window.scrollTo({top:0,behavior:'smooth'});
}

function setLevel(n){
  currentLevel=n; qs('#levelDisplay').textContent=n;
  qsa('#levelButtons button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.level)===n));
}
function buildLevelButtons(){
  const box=qs('#levelButtons');
  for(let i=1;i<=10;i++){
    const b=document.createElement('button'); b.type='button'; b.dataset.level=i; b.textContent=i; b.className=levelClass(i);
    b.addEventListener('click',()=>setLevel(i)); box.appendChild(b);
  }
}
function openSheet(){
  qs('#entrySheet').classList.remove('hidden');
  qs('#entrySheet').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeSheet(){
  qs('#entrySheet').classList.add('hidden');
  qs('#entrySheet').setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
function resetForm(quickThought=false){
  qs('#entryForm').reset();
  qs('#entryId').value='';
  setLevel(quickThought?1:2);
  setEmotion('Irritation');
  qs('#otherEmotion').value='';
  const now=new Date();
  qs('#entryDate').value=localDateStr(now);
  qs('#entryTime').value=localTimeStr(now);
  qs('#detailFields').classList.add('hidden');
  qs('#detailsToggle').textContent='Add more detail';
  qs('#deleteEntry').classList.add('hidden');
  qs('#entryModeLabel').textContent=quickThought?'THOUGHT CAPTURE':'QUICK CAPTURE';
  qs('#entryHeading').textContent=quickThought?'Catch the thought':'Catch the spark';
  if(quickThought) setTimeout(()=>qs('#thoughtInput').focus(),150);
}
function openNew(quickThought=false){ resetForm(quickThought); openSheet(); }
function openEntry(e){
  resetForm(false);
  qs('#entryId').value=e.id;
  setLevel(Number(e.level));
  const savedEmotion=e.emotion || 'Irritation';
  if(EMOTIONS.includes(savedEmotion)){
    setEmotion(savedEmotion);
  }else{
    setEmotion('Other');
    qs('#otherEmotion').value=savedEmotion;
  }
  qs('#eventInput').value=e.event||'';
  qs('#thoughtInput').value=e.thought||'';
  qs('#physicalCues').value=e.physicalCues||'';
  qs('#behavioralCues').value=e.behavioralCues||'';
  qs('#emotionalCues').value=e.emotionalCues||'';
  qs('#cognitiveCues').value=e.cognitiveCues||'';
  qs('#consequenceInput').value=e.consequence||'';
  qs('#strategyInput').value=e.strategy||'';
  qs('#realisticInput').value=e.realistic||'';
  qs('#futureInput').value=e.future||'';
  const d=new Date(e.timestamp);
  qs('#entryDate').value=localDateStr(d);
  qs('#entryTime').value=localTimeStr(d);
  qs('#detailFields').classList.remove('hidden');
  qs('#detailsToggle').textContent='Hide extra detail';
  qs('#deleteEntry').classList.remove('hidden');
  qs('#entryModeLabel').textContent='EDIT ENTRY';
  qs('#entryHeading').textContent='Review what happened';
  openSheet();
}

function formEntry(){
  const id=qs('#entryId').value||uuid();
  const date=qs('#entryDate').value||localDateStr(new Date());
  const time=qs('#entryTime').value||localTimeStr(new Date());
  const timestamp=new Date(`${date}T${time}`).toISOString();
  const emotion = currentEmotion==='Other' ? (qs('#otherEmotion').value.trim() || 'Other') : currentEmotion;
  return {
    id, timestamp, level:currentLevel, emotion,
    event:qs('#eventInput').value.trim(),
    thought:qs('#thoughtInput').value.trim(),
    physicalCues:qs('#physicalCues').value.trim(),
    behavioralCues:qs('#behavioralCues').value.trim(),
    emotionalCues:qs('#emotionalCues').value.trim(),
    cognitiveCues:qs('#cognitiveCues').value.trim(),
    consequence:qs('#consequenceInput').value.trim(),
    strategy:qs('#strategyInput').value.trim(),
    realistic:qs('#realisticInput').value.trim(),
    future:qs('#futureInput').value.trim(),
    updatedAt:new Date().toISOString()
  };
}

function downloadBlob(blob, filename){
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}


function exportWeeklyReport(){
  const entriesPromise=getAllEntries();
  entriesPromise.then(entries=>{
    const s=startOfWeek(reviewAnchor), e=endOfWeek(reviewAnchor), week=within(entries,s,e);
    const endLabel=new Date(e); endLabel.setDate(endLabel.getDate()-1);
    const early=week.length?Math.round(100*week.filter(x=>x.level<=3).length/week.length):0;
    const avg=week.length?(week.reduce((a,b)=>a+b.level,0)/week.length).toFixed(1):'0';
    const high=week.length?Math.max(...week.map(x=>x.level)):0;
    const patt=v=>topPhrases(v).map(x=>`${x.text}${x.count>1?' ×'+x.count:''}`).join(', ')||'Not enough data yet';
    const esc=t=>String(t||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const incidents=week.map(x=>`<tr><td>${esc(formatEntryTime(x.timestamp))}</td><td>${esc(x.emotion)}</td><td>${x.level}</td><td>${esc(x.event)}</td><td>${esc(x.thought)}</td><td>${esc(x.strategy)}</td></tr>`).join('');
    const w=window.open('','_blank');
    w.document.write(`<!doctype html><title>Pattern Trainer Weekly Report</title><style>body{font:14px system-ui;margin:32px;color:#18202b}h1{margin-bottom:4px}.sub{color:#667085}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:24px 0}.m{border:1px solid #ccd3dc;border-radius:12px;padding:14px}.m b{font-size:24px;display:block}.patterns{border:1px solid #ccd3dc;border-radius:12px;padding:16px;margin-bottom:20px}.patterns p{margin:8px 0}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border-bottom:1px solid #ddd;text-align:left;vertical-align:top;padding:8px}th{background:#f2f4f7}@media print{body{margin:12mm}.no-print{display:none}}</style><h1>Pattern Trainer - Weekly Review</h1><div class=sub>${formatShortDate(s)} - ${formatShortDate(endLabel)}</div><div class=metrics><div class=m><b>${week.length}</b>Entries</div><div class=m><b>${early}%</b>Caught at 1-3</div><div class=m><b>${high}</b>Highest intensity</div><div class=m><b>${avg}</b>Average intensity</div></div><div class=patterns><h2>Patterns</h2><p><b>Starting states:</b> ${esc(patt(week.map(x=>x.emotion)))}</p><p><b>Triggers:</b> ${esc(patt(week.map(x=>x.event)))}</p><p><b>Thoughts:</b> ${esc(patt(week.map(x=>x.thought)))}</p><p><b>Cues:</b> ${esc(patt(cueValues(week)))}</p><p><b>Strategies:</b> ${esc(patt(week.map(x=>x.strategy)))}</p></div><h2>Incident log</h2><table><thead><tr><th>Date/time</th><th>Starting state</th><th>Intensity</th><th>Trigger</th><th>Thought</th><th>Strategy</th></tr></thead><tbody>${incidents}</tbody></table><p class=no-print><button onclick=window.print()>Save / Print PDF</button></p>`); w.document.close();
  });
}

function registerEvents(){
  qsa('[data-nav]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.nav)));
  qsa('[data-action="new-entry"]').forEach(b=>b.addEventListener('click',()=>openNew(false)));
  qsa('[data-action="quick-thought"]').forEach(b=>b.addEventListener('click',()=>openNew(true)));
  qsa('[data-action="close-sheet"]').forEach(b=>b.addEventListener('click',closeSheet));

  qs('#detailsToggle').addEventListener('click',()=>{
    const hidden=qs('#detailFields').classList.toggle('hidden');
    qs('#detailsToggle').textContent=hidden?'Add more detail':'Hide extra detail';
  });

  qs('#entryForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const entry=formEntry();
    if(!entry.event && !entry.thought){
      qs('#thoughtInput').focus(); return;
    }
    await putEntry(entry); closeSheet(); await refreshHome();
  });

  qs('#deleteEntry').addEventListener('click',async()=>{
    const id=qs('#entryId').value;if(!id)return;
    if(confirm('Delete this entry?')){await deleteById(id);closeSheet();await refreshHome();await refreshHistory();await refreshReview();}
  });

  qsa('.segmented button').forEach(b=>b.addEventListener('click',()=>{
    qsa('.segmented button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    refreshHistory(b.dataset.range);
  }));

  qs('#applyDates').addEventListener('click',async()=>{
    const f=qs('#dateFrom').value,t=qs('#dateTo').value;if(!f||!t)return;
    const entries=await getAllEntries();
    const s=new Date(`${f}T00:00:00`),e=new Date(`${t}T23:59:59.999`);
    renderList(qs('#historyList'),entries.filter(x=>{const d=new Date(x.timestamp);return d>=s&&d<=e;}),'No entries in this range.');
    qsa('.segmented button').forEach(x=>x.classList.remove('active'));
  });

  qs('#prevWeek').addEventListener('click',()=>{reviewAnchor.setDate(reviewAnchor.getDate()-7);refreshReview();});
  qs('#nextWeek').addEventListener('click',()=>{reviewAnchor.setDate(reviewAnchor.getDate()+7);refreshReview();});
  qs('#printReview').addEventListener('click',()=>window.print());
  qs('#exportReport').addEventListener('click',exportWeeklyReport);

  qs('#backupBtn').addEventListener('click',()=>qs('#backupModal').classList.remove('hidden'));
  qsa('[data-action="close-backup"]').forEach(b=>b.addEventListener('click',()=>qs('#backupModal').classList.add('hidden')));

  qs('#syncNow').addEventListener('click',syncCloud);
  qs('#copySyncId').addEventListener('click',()=>{shareSyncId();alert('Sync ID copied. Paste it into Pattern Trainer on your other device.');});
  qs('#connectSyncId').addEventListener('click',async()=>{
    try{
      const id=qs('#syncIdInput').value;
      if(id===getDeviceId()){ await syncCloud(); return; }
      if(!confirm('Connect this device to that cloud history? Local entries will be merged, not erased.')) return;
      setDeviceId(id); await syncCloud(); alert('Connected. This device now shares the same Pattern Trainer history.');
    }catch(e){ alert('That sync ID does not look valid. Copy it directly from your other device.'); }
  });

  qs('#exportJson').addEventListener('click',async()=>{
    const entries=await getAllEntries();
    downloadBlob(new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),entries},null,2)],{type:'application/json'}),`pattern-trainer-backup-${localDateStr(new Date())}.json`);
  });
  qs('#importJson').addEventListener('change',async e=>{
    const file=e.target.files[0]; if(!file)return;
    try{
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.entries)) throw new Error('Invalid backup');
      for(const entry of data.entries) await putEntry(entry);
      alert(`Restored ${data.entries.length} entries.`);
      qs('#backupModal').classList.add('hidden'); refreshHome();
    }catch(err){ alert('Could not restore that backup file.'); }
    e.target.value='';
  });
  qs('#clearAll').addEventListener('click',async()=>{
    if(confirm('Erase local copies from this device? Cloud copies will download again on the next sync.')){
      await clearDB();qs('#backupModal').classList.add('hidden');refreshHome();
    }
  });
}

(async function init(){
  buildLevelButtons();
  buildEmotionButtons();
  setEmotion('Irritation');
  await openDB();
  registerEvents();
  qs('#syncIdInput').value=getDeviceId();
  refreshHome();
  syncCloud();
  window.addEventListener('online',syncCloud);
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }
})();
