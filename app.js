
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
    req.onsuccess=()=>resolve(req.result.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));
    req.onerror=()=>reject(req.error);
  });
}
function putEntry(entry){
  return new Promise((resolve,reject)=>{
    const req = txStore('readwrite').put(entry);
    req.onsuccess=()=>resolve(entry);
    req.onerror=()=>reject(req.error);
  });
}
function deleteById(id){
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

  qs('#backupBtn').addEventListener('click',()=>qs('#backupModal').classList.remove('hidden'));
  qsa('[data-action="close-backup"]').forEach(b=>b.addEventListener('click',()=>qs('#backupModal').classList.add('hidden')));

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
    if(confirm('Erase every saved entry from this device? This cannot be undone unless you exported a backup.')){
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
  refreshHome();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }
})();
