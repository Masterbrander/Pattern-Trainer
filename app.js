
const DB_NAME = 'patternTrainerDB';
const STORE = 'entries';
const DB_VERSION = 1;

let db;
let currentLevel = 2;
let currentEmotions = ['Irritation'];
let rantEmotions = [];
let rantLevel = 2;
let deletedRants = [];
let activeRecognition = null;
let activeCueType = null;
let reviewAnchor = new Date();
let reviewStart = null;
let reviewEnd = null; // exclusive end

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
function currentUserId(){ return getSavedSession()?.user?.id || null; }
function getAllEntries(){
  return new Promise((resolve,reject)=>{
    const owner=currentUserId();
    const req = txStore().getAll();
    req.onsuccess=()=>resolve(req.result.filter(x=>!x._deleted && x._owner===owner).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));
    req.onerror=()=>reject(req.error);
  });
}
function putEntryLocal(entry){
  const owner=currentUserId();
  entry={...entry,_owner:entry._owner||owner};
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

// V4 account sync. Supabase Auth handles identity; the app keeps an offline copy per signed-in user.
const SUPABASE_URL = 'https://ykjqohkotetayuowaary.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SgFpVT105b1iMn-3twav9Q_gk2cCKPo';
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;
const AUTH_EDGE_URL = `${SUPABASE_URL}/functions/v1/pattern-auth`;
const SYNC_URL = `${SUPABASE_URL}/functions/v1/pattern-sync-v4`;
const SESSION_KEY = 'patternTrainerSessionV4';

function getSavedSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch{return null;}
}
function saveSession(session){
  if(session){
    if(!session.expires_at && session.expires_in) session.expires_at=Math.floor(Date.now()/1000)+Number(session.expires_in);
    localStorage.setItem(SESSION_KEY,JSON.stringify(session));
  }else localStorage.removeItem(SESSION_KEY);
  updateAccountUI();
}
function accountUsername(){
  const s=getSavedSession();
  return s?.user?.user_metadata?.username || (s?.user?.email||'').split('@')[0] || '';
}
function internalEmail(username){ return `${String(username||'').trim().toLowerCase()}@users.patterntrainer.local`; }
function authHeaders(extra={}){ return {'apikey':SUPABASE_KEY,'Content-Type':'application/json',...extra}; }
async function refreshSession(){
  const old=getSavedSession();
  if(!old?.refresh_token) return null;
  try{
    const r=await fetch(`${AUTH_URL}/token?grant_type=refresh_token`,{method:'POST',headers:authHeaders(),body:JSON.stringify({refresh_token:old.refresh_token})});
    if(!r.ok){ if(r.status===400||r.status===401) saveSession(null); return null; }
    const data=await r.json(); saveSession(data); return data;
  }catch{return old;}
}
async function getAccessToken(){
  let s=getSavedSession(); if(!s) return null;
  if(!s.expires_at || Number(s.expires_at)>Math.floor(Date.now()/1000)+60) return s.access_token;
  if(!navigator.onLine) return s.access_token;
  s=await refreshSession(); return s?.access_token||null;
}
async function signInAccount(username,password){
  const r=await fetch(`${AUTH_URL}/token?grant_type=password`,{method:'POST',headers:authHeaders(),body:JSON.stringify({email:internalEmail(username),password})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error('Username or password was not accepted.');
  saveSession(data); return data;
}
async function createAccount(username,password){
  const r=await fetch(AUTH_EDGE_URL,{method:'POST',headers:authHeaders(),body:JSON.stringify({action:'signup',username,password})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||'Could not create account.');
  return signInAccount(username,password);
}
async function signOutAccount(){
  const token=await getAccessToken();
  if(token){ fetch(`${AUTH_URL}/logout`,{method:'POST',headers:authHeaders({Authorization:`Bearer ${token}`})}).catch(()=>{}); }
  saveSession(null);
  setSyncStatus('Sign in to sync');
  await refreshHome();
  showAuth();
}
function showAuth(){ qs('#authModal')?.classList.remove('hidden'); }
function hideAuth(){ qs('#authModal')?.classList.add('hidden'); }
function updateAccountUI(){
  const u=accountUsername();
  const label=qs('#accountLabel'); if(label) label.textContent=u?`Signed in as ${u}`:'Not signed in';
  const signout=qs('#signOutBtn'); if(signout) signout.classList.toggle('hidden',!u);
}
function toCloud(e){return {
  id:e.id, device_id:'account-v4', timestamp:e.timestamp, level:e.level,
  emotion:(e.emotions||[]).join(', ') || e.emotion || null, emotions:e.emotions||[],
  entry_type:e.entryType||'log', raw_rant:e.rawRant||null, rant_status:e.rantStatus||null, ai_analysis:e.aiAnalysis||null,
  event:e.event||null, thought:e.thought||null, physical_cues:e.physicalCues||null,
  behavioral_cues:e.behavioralCues||null, emotional_cues:e.emotionalCues||null, cognitive_cues:null,
  consequence:e.consequence||null, strategy:e.strategy||null, realistic:e.realistic||null, future:e.future||null,
  updated_at:e.updatedAt||new Date().toISOString(), deleted:!!e._deleted
};}
function fromCloud(x){return {
  id:x.id,timestamp:x.timestamp,level:x.level,
  emotions:Array.isArray(x.emotions)&&x.emotions.length?x.emotions:(x.emotion?[x.emotion]:[]),
  emotion:x.emotion||'',entryType:x.entry_type||'log',rawRant:x.raw_rant||'',rantStatus:x.rant_status||'',aiAnalysis:x.ai_analysis||null,
  event:x.event||'',thought:x.thought||'',physicalCues:x.physical_cues||'',behavioralCues:x.behavioral_cues||'',emotionalCues:x.emotional_cues||'',
  consequence:x.consequence||'',strategy:x.strategy||'',realistic:x.realistic||'',future:x.future||'',updatedAt:x.updated_at,_deleted:!!x.deleted,_owner:currentUserId()
};}
async function callSync(body){
  const token=await getAccessToken();
  if(!token) throw new Error('not signed in');
  const r=await fetch(SYNC_URL,{method:'POST',headers:authHeaders({Authorization:`Bearer ${token}`}),body:JSON.stringify(body)});
  if(r.status===401){
    const refreshed=await refreshSession();
    if(refreshed?.access_token){
      const retry=await fetch(SYNC_URL,{method:'POST',headers:authHeaders({Authorization:`Bearer ${refreshed.access_token}`}),body:JSON.stringify(body)});
      if(!retry.ok) throw new Error('sync failed');
      return retry.json();
    }
  }
  if(!r.ok) throw new Error('sync failed');
  return r.json();
}
async function cloudUpsert(entry){ await callSync({action:'upsert',entry:toCloud(entry)}); }
async function getAllRecords(){
  return new Promise((resolve,reject)=>{
    const owner=currentUserId();
    const req=txStore().getAll();
    req.onsuccess=()=>resolve(req.result.filter(x=>x._owner===owner));
    req.onerror=()=>reject(req.error);
  });
}
async function adoptLegacyLocalEntries(){
  const owner=currentUserId(); if(!owner) return;
  const key=`patternTrainerLegacyLocalAdopted:${owner}`;
  if(localStorage.getItem(key)) return;
  const all=await new Promise((resolve,reject)=>{const req=txStore().getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  for(const e of all){ if(!e._owner) await putEntryLocal({...e,_owner:owner}); }
  localStorage.setItem(key,'1');
}
async function claimLegacyCloud(){
  const owner=currentUserId(); if(!owner) return;
  const key=`patternTrainerLegacyCloudClaimed:${owner}`;
  if(localStorage.getItem(key)) return;
  const syncId=localStorage.getItem('patternTrainerSyncId');
  if(!syncId) { localStorage.setItem(key,'none'); return; }
  try{ await callSync({action:'claimLegacy',syncId}); localStorage.setItem(key,'1'); }catch{}
}
async function prepareAccountData(){ await adoptLegacyLocalEntries(); await claimLegacyCloud(); }
async function syncCloud(){
  if(!getSavedSession()){ setSyncStatus('Sign in to sync'); return; }
  if(!navigator.onLine){ setSyncStatus('Offline • saved on this device'); return; }
  setSyncStatus('Syncing…');
  try{
    await flushPendingRantDeletes();
    const local=await getAllRecords();
    const pulled=await callSync({action:'pull'});
    const remote=(pulled.entries||[]).map(fromCloud);
    deletedRants=pulled.deletedRants||[];
    const remoteById=new Map(remote.map(x=>[x.id,x]));
    const localById=new Map(local.map(x=>[x.id,x]));
    for(const r of remote){
      const l=localById.get(r.id);
      if(!l || new Date(r.updatedAt||0)>new Date(l.updatedAt||0)) await putEntryLocal(r);
    }
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
async function putEntry(entry){
  const local={...entry,_deleted:false,_owner:currentUserId()};
  await putEntryLocal(local);
  if(getSavedSession()) cloudUpsert(local).then(()=>setSyncStatus('Synced')).catch(()=>setSyncStatus('Offline • saved on this device'));
  return local;
}
async function deleteById(id){
  const all=await getAllRecords(); const e=all.find(x=>x.id===id); if(!e)return;
  const tomb={...e,_deleted:true,updatedAt:new Date().toISOString(),_owner:currentUserId()};
  await putEntryLocal(tomb);
  if(getSavedSession()) cloudUpsert(tomb).catch(()=>setSyncStatus('Offline • deletion will sync later'));
}
function pendingRantDeletes(){try{return JSON.parse(localStorage.getItem('patternTrainerPendingRantDeletes')||'[]');}catch{return [];}}
function setPendingRantDeletes(v){localStorage.setItem('patternTrainerPendingRantDeletes',JSON.stringify([...new Set(v)]));}
async function flushPendingRantDeletes(){const pending=pendingRantDeletes();if(!pending.length)return;const left=[];for(const id of pending){try{await callSync({action:'deleteRant',id});}catch{left.push(id);}}setPendingRantDeletes(left);}
async function deleteRantById(id){
  await deleteByIdLocal(id);deletedRants=[...deletedRants,{id:uuid(),deleted_at:new Date().toISOString()}];
  if(getSavedSession()){try{await callSync({action:'deleteRant',id});setSyncStatus('Synced');}catch{setPendingRantDeletes([...pendingRantDeletes(),id]);setSyncStatus('Offline • rant deletion will sync later');}}
}

function clearCurrentAccountLocal(){
  return getAllRecords().then(rows=>Promise.all(rows.map(r=>deleteByIdLocal(r.id))));
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

const EMOTIONS = ['Irritation','Anger','Anxiety','Hurt','Resentment','Shame','Stress','Frustration','Fear','Sadness','Embarrassment','Guilt','Overwhelmed','Self-criticism','Other'];
function buildEmotionButtons(){
  const build=(selector,handler)=>{const box=qs(selector);if(!box)return;box.innerHTML='';EMOTIONS.forEach(name=>{const b=document.createElement('button');b.type='button';b.dataset.emotion=name;b.textContent=name;b.addEventListener('click',()=>handler(name));box.appendChild(b);});};
  build('#emotionButtons',toggleEmotion); build('#rantEmotionButtons',toggleRantEmotion);
}
function toggleEmotion(name){
  if(name==='Other'){qs('#otherEmotion').classList.toggle('hidden');if(!qs('#otherEmotion').classList.contains('hidden'))qs('#otherEmotion').focus();return;}
  currentEmotions=currentEmotions.includes(name)?currentEmotions.filter(x=>x!==name):[...currentEmotions,name];
  qsa('#emotionButtons button').forEach(b=>b.classList.toggle('selected',currentEmotions.includes(b.dataset.emotion)));
}
function setEmotions(values=[]){currentEmotions=[...new Set((values||[]).filter(x=>x&&x!=='Other'))];qsa('#emotionButtons button').forEach(b=>b.classList.toggle('selected',currentEmotions.includes(b.dataset.emotion)));}
function toggleRantEmotion(name){
  if(name==='Other'){qs('#rantOtherEmotion').classList.toggle('hidden');if(!qs('#rantOtherEmotion').classList.contains('hidden'))qs('#rantOtherEmotion').focus();return;}
  rantEmotions=rantEmotions.includes(name)?rantEmotions.filter(x=>x!==name):[...rantEmotions,name];qsa('#rantEmotionButtons button').forEach(b=>b.classList.toggle('selected',rantEmotions.includes(b.dataset.emotion)));
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
  return entries.flatMap(e=>[e.physicalCues,e.behavioralCues,e.emotionalCues]).filter(Boolean);
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

function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function makeEntryCard(entry){
  const node=qs('#entryTemplate').content.firstElementChild.cloneNode(true);
  const pill=node.querySelector('.level-pill');
  pill.textContent=`Intensity ${entry.level}${entry.level<=3?' • caught early':''}`;
  pill.classList.add(levelClass(entry.level));
  node.querySelector('.entry-time').textContent=formatEntryTime(entry.timestamp);
  const emotion=(entry.emotions||[]).join(', ')||entry.emotion||'Unrated';
  node.querySelector('.entry-emotion').innerHTML=(entry.entryType==='rant'?'<span class="rant-badge">RANT</span>':'')+escapeHtml(emotion);
  node.querySelector('.entry-event').textContent=entry.event || (entry.entryType==='rant'?'Raw rant':'Thought capture');
  node.querySelector('.entry-thought').textContent=entry.thought || '—';
  const cues=node.querySelector('.entry-cues');
  const chips=[
    ['physical',entry.physicalCues],['behavior',entry.behavioralCues],
    ['emotion',entry.emotionalCues],
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

function ensureReviewRange(){
  if(reviewStart && reviewEnd) return;
  reviewStart=startOfWeek(reviewAnchor);
  reviewEnd=endOfWeek(reviewAnchor);
}
function setReviewRange(start,endExclusive){
  reviewStart=new Date(start); reviewStart.setHours(0,0,0,0);
  reviewEnd=new Date(endExclusive); reviewEnd.setHours(0,0,0,0);
  reviewAnchor=new Date(reviewStart);
}
function resetReviewToThisWeek(){
  reviewAnchor=new Date();
  setReviewRange(startOfWeek(reviewAnchor),endOfWeek(reviewAnchor));
}
function shiftReviewRange(direction){
  ensureReviewRange();
  const span=Math.max(1,Math.round((reviewEnd-reviewStart)/86400000));
  const s=new Date(reviewStart),e=new Date(reviewEnd);
  s.setDate(s.getDate()+direction*span);
  e.setDate(e.getDate()+direction*span);
  setReviewRange(s,e);
}
async function refreshReview(){
  ensureReviewRange();
  const entries=await getAllEntries();
  const s=new Date(reviewStart), e=new Date(reviewEnd);
  const rangeEntries=within(entries,s,e);
  const endLabel=new Date(e); endLabel.setDate(endLabel.getDate()-1);
  qs('#reviewRangeLabel').textContent=`${formatShortDate(s)} – ${formatShortDate(endLabel)}`;
  qs('#reviewDateFrom').value=localDateStr(s);
  qs('#reviewDateTo').value=localDateStr(endLabel);
  qs('#rCount').textContent=rangeEntries.length;
  qs('#rEarly').textContent=rangeEntries.length?`${Math.round(100*rangeEntries.filter(x=>x.level<=3).length/rangeEntries.length)}%`:'0%';
  qs('#rHigh').textContent=rangeEntries.length?Math.max(...rangeEntries.map(x=>x.level)):0;
  qs('#rAvg').textContent=rangeEntries.length?(rangeEntries.reduce((a,b)=>a+b.level,0)/rangeEntries.length).toFixed(1):'0';
  qs('#rDeletedRants').textContent=deletedRants.filter(x=>{const d=new Date(x.deleted_at);return d>=s&&d<e;}).length;
  renderPattern('#emotionPatterns',rangeEntries.flatMap(x=>x.emotions?.length?x.emotions:(x.emotion?[x.emotion]:[])));
  renderPattern('#triggerPatterns',rangeEntries.map(x=>x.event));
  renderPattern('#thoughtPatterns',rangeEntries.map(x=>x.thought));
  renderPattern('#cuePatterns',cueValues(rangeEntries));
  renderPattern('#strategyPatterns',rangeEntries.map(x=>x.strategy));
  renderList(qs('#reviewList'),rangeEntries,'No entries in this range.');
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
function resetForm(){
  qs('#entryForm').reset();delete qs('#entryForm').dataset.aiAnalysis;qs('#entryId').value='';setLevel(2);setEmotions(['Irritation']);qs('#otherEmotion').value='';qs('#otherEmotion').classList.add('hidden');
  const now=new Date();qs('#entryDate').value=localDateStr(now);qs('#entryTime').value=localTimeStr(now);qs('#detailFields').classList.add('hidden');qs('#detailsToggle').textContent='Add more detail';qs('#deleteEntry').classList.add('hidden');qs('#rawRantBlock').classList.add('hidden');qs('#aiAnalysis').classList.add('hidden');qs('#aiAnalysis').innerHTML='';qs('#entryModeLabel').textContent='QUICK CAPTURE';qs('#entryHeading').textContent='Log what happened';
}
function openNew(){resetForm();openSheet();}
function openEntry(e){
  resetForm();qs('#entryId').value=e.id;setLevel(Number(e.level||2));const saved=(e.emotions&&e.emotions.length)?e.emotions:(e.emotion?[e.emotion]:[]);setEmotions(saved.filter(x=>EMOTIONS.includes(x)&&x!=='Other'));const custom=saved.filter(x=>!EMOTIONS.includes(x));if(custom.length){qs('#otherEmotion').classList.remove('hidden');qs('#otherEmotion').value=custom.join(', ');}
  qs('#eventInput').value=e.event||'';qs('#thoughtInput').value=e.thought||'';qs('#physicalCues').value=e.physicalCues||'';qs('#behavioralCues').value=e.behavioralCues||'';qs('#emotionalCues').value=e.emotionalCues||'';qs('#consequenceInput').value=e.consequence||'';qs('#strategyInput').value=e.strategy||'';qs('#realisticInput').value=e.realistic||'';qs('#futureInput').value=e.future||'';
  if(e.entryType==='rant'){qs('#rawRantBlock').classList.remove('hidden');qs('#rawRantInput').value=e.rawRant||'';qs('#entryModeLabel').textContent='RANT • EDIT LATER';qs('#entryHeading').textContent='Add what you noticed afterward';if(e.aiAnalysis){qs('#entryForm').dataset.aiAnalysis=JSON.stringify(e.aiAnalysis);renderAIAnalysis(e.aiAnalysis);}}
  const d=new Date(e.timestamp);qs('#entryDate').value=localDateStr(d);qs('#entryTime').value=localTimeStr(d);qs('#detailFields').classList.remove('hidden');qs('#detailsToggle').textContent='Hide extra detail';qs('#deleteEntry').classList.remove('hidden');openSheet();
}
function formEntry(){
  const id=qs('#entryId').value||uuid();const date=qs('#entryDate').value||localDateStr(new Date()),time=qs('#entryTime').value||localTimeStr(new Date());const isRant=!qs('#rawRantBlock').classList.contains('hidden');const custom=qs('#otherEmotion').value.trim();const emotions=[...currentEmotions,...(custom?custom.split(',').map(x=>x.trim()).filter(Boolean):[])];
  return {id,timestamp:new Date(`${date}T${time}`).toISOString(),level:currentLevel,emotions,emotion:emotions.join(', '),entryType:isRant?'rant':'log',rawRant:isRant?qs('#rawRantInput').value.trim():'',rantStatus:isRant?'captured':'',event:qs('#eventInput').value.trim(),thought:qs('#thoughtInput').value.trim(),physicalCues:qs('#physicalCues').value.trim(),behavioralCues:qs('#behavioralCues').value.trim(),emotionalCues:qs('#emotionalCues').value.trim(),consequence:qs('#consequenceInput').value.trim(),strategy:qs('#strategyInput').value.trim(),realistic:qs('#realisticInput').value.trim(),future:qs('#futureInput').value.trim(),aiAnalysis:JSON.parse(qs('#entryForm').dataset.aiAnalysis||'null'),updatedAt:new Date().toISOString()};
}

const CUE_OPTIONS={
  physical:['Jaw tension','Clenched teeth','Chest tightness','Heart racing','Feeling hot / flushed','Shallow or fast breathing','Stomach tension','Headache / pressure','Shaking','Muscle tension','Restlessness'],
  behavioral:['Raised voice','Interrupting','Arguing','Sarcasm','Pacing','Clenched fists','Staring / glaring','Withdrawing / shutting down','Slamming / rough movements','Sending an angry message','Driving more aggressively','Trying to control the situation'],
  emotional:['Hurt','Fear','Anxiety','Embarrassment','Shame','Guilt','Jealousy','Feeling disrespected','Feeling ignored','Feeling rejected','Sadness','Overwhelmed','Helplessness']
};
function startDictation(targetId,button){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert('Voice dictation is not supported by this browser. On Android, Chrome is recommended.');return;}
  if(activeRecognition){try{activeRecognition.stop();}catch{} activeRecognition=null;}
  const target=qs('#'+targetId);if(!target)return;const rec=new SR();activeRecognition=rec;rec.continuous=true;rec.interimResults=true;rec.lang=navigator.language||'en-US';
  const base=target.value.trim();let finalText='';button.classList.add('listening');button.textContent='■';
  rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=t+' ';else interim+=t;}target.value=[base,finalText.trim(),interim.trim()].filter(Boolean).join(base?' ':'');};
  rec.onend=()=>{button.classList.remove('listening');button.textContent='🎙';activeRecognition=null;};rec.onerror=rec.onend;rec.start();
}
function openCuePicker(type){activeCueType=type;qs('#cuePickerTitle').textContent=`Pick ${type} cues`;const box=qs('#cuePickerOptions');box.innerHTML='';(CUE_OPTIONS[type]||[]).forEach(v=>{const b=document.createElement('button');b.type='button';b.textContent=v;b.addEventListener('click',()=>b.classList.toggle('selected'));box.appendChild(b);});qs('#cuePickerModal').classList.remove('hidden');}
function applyCuePicker(){if(!activeCueType)return;const id={physical:'physicalCues',behavioral:'behavioralCues',emotional:'emotionalCues'}[activeCueType];const target=qs('#'+id);const selected=qsa('#cuePickerOptions button.selected').map(b=>b.textContent);const existing=target.value.split(',').map(x=>x.trim()).filter(Boolean);target.value=[...new Set([...existing,...selected])].join(', ');qs('#cuePickerModal').classList.add('hidden');}
function setRantLevel(n){rantLevel=n;qs('#rantLevelDisplay').textContent=n;qsa('#rantLevelButtons button').forEach(b=>b.classList.toggle('selected',Number(b.dataset.level)===n));}
function openRant(){rantEmotions=[];rantLevel=2;const draft=localStorage.getItem('patternTrainerRantDraft')||'';qs('#rantTranscript').value=draft;qs('#rantRating').classList.toggle('hidden',!draft);qs('#saveRant').disabled=!draft;qs('#rantOtherEmotion').value='';qs('#rantOtherEmotion').classList.add('hidden');qsa('#rantEmotionButtons button').forEach(b=>b.classList.remove('selected'));setRantLevel(2);qs('#rantSheet').classList.remove('hidden');document.body.style.overflow='hidden';}
function closeRant(){if(activeRecognition){try{activeRecognition.stop();}catch{}}qs('#rantSheet').classList.add('hidden');document.body.style.overflow='';}
function toggleRantRecording(){
  const btn=qs('#rantRecordBtn'),status=qs('#rantRecordingStatus');if(activeRecognition){activeRecognition.stop();return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert('Voice capture is not supported by this browser. Android Chrome is recommended.');return;}
  const target=qs('#rantTranscript'),rec=new SR();activeRecognition=rec;rec.continuous=true;rec.interimResults=true;rec.lang=navigator.language||'en-US';let committed=target.value.trim(),finalText='';btn.classList.add('recording');btn.textContent='■ STOP';status.textContent='Recording… say it raw.';
  rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=t+' ';else interim+=t;}target.value=[committed,finalText.trim(),interim.trim()].filter(Boolean).join(committed?' ':'');localStorage.setItem('patternTrainerRantDraft',target.value);};
  rec.onend=()=>{activeRecognition=null;btn.classList.remove('recording');btn.textContent='🎙 CONTINUE RANT';status.textContent='Stopped. Rate it below, or keep talking.';qs('#rantRating').classList.remove('hidden');qs('#saveRant').disabled=false;};rec.onerror=rec.onend;rec.start();
}
async function saveRantCapture(){
  const raw=qs('#rantTranscript').value.trim();if(!raw){alert('There is no rant to save yet.');return;}if(qs('#rantRating').classList.contains('hidden')){alert('Stop the rant and rate how you were feeling first.');return;}const custom=qs('#rantOtherEmotion').value.trim();const emotions=[...rantEmotions,...(custom?custom.split(',').map(x=>x.trim()).filter(Boolean):[])];
  localStorage.removeItem('patternTrainerRantDraft');const now=new Date();const entry={id:uuid(),timestamp:now.toISOString(),level:rantLevel,emotions,emotion:emotions.join(', '),entryType:'rant',rawRant:raw,rantStatus:'captured',event:'',thought:'',physicalCues:'',behavioralCues:'',emotionalCues:'',consequence:'',strategy:'',realistic:'',future:'',aiAnalysis:null,updatedAt:now.toISOString()};await putEntry(entry);closeRant();await refreshHome();
}
function renderAIAnalysis(a){const el=qs('#aiAnalysis');if(!a)return;const rows=[['Trigger',a.trigger],['Automatic thought',a.automatic_thought],['Possible cues',(a.cues||[]).join(', ')],['Escalated by',a.escalation],['De-escalation',a.deescalation],['Possible reframe',a.reframe]].filter(x=>x[1]);el.innerHTML='<h4>AI suggestions</h4><div class="field-help">Suggestions only. Your ratings and raw rant remain authoritative.</div><dl>'+rows.map(([k,v])=>`<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')+'</dl><button type="button" id="applyAIAnalysis" class="secondary wide">Apply useful suggestions</button>';el.classList.remove('hidden');qs('#applyAIAnalysis')?.addEventListener('click',()=>applyAIAnalysis(a));}
function applyAIAnalysis(a){if(a.trigger&&!qs('#eventInput').value)qs('#eventInput').value=a.trigger;if(a.automatic_thought&&!qs('#thoughtInput').value)qs('#thoughtInput').value=a.automatic_thought;if(a.reframe&&!qs('#futureInput').value)qs('#futureInput').value=a.reframe;const form=qs('#entryForm');form.dataset.aiAnalysis=JSON.stringify(a);alert('Suggestions added where fields were blank. Review them before saving.');}
async function analyzeCurrentRant(){
  const raw=qs('#rawRantInput').value.trim();if(!raw)return;const btn=qs('#analyzeRant');btn.disabled=true;btn.textContent='Analyzing…';
  try{const token=await getAccessToken();const r=await fetch(`${SUPABASE_URL}/functions/v1/pattern-rant-analysis`,{method:'POST',headers:authHeaders({Authorization:`Bearer ${token}`}),body:JSON.stringify({rawRant:raw,emotions:currentEmotions,intensity:currentLevel})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'AI analysis is not configured yet.');qs('#entryForm').dataset.aiAnalysis=JSON.stringify(data.analysis);renderAIAnalysis(data.analysis);}catch(e){alert(e.message||'Could not analyze this rant.');}finally{btn.disabled=false;btn.textContent='Analyze rant with AI';}
}

function downloadBlob(blob, filename){
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}


function exportRangeReport(){
  ensureReviewRange();
  getAllEntries().then(entries=>{
    const s=new Date(reviewStart), e=new Date(reviewEnd), rangeEntries=within(entries,s,e);
    const endLabel=new Date(e); endLabel.setDate(endLabel.getDate()-1);
    const early=rangeEntries.length?Math.round(100*rangeEntries.filter(x=>x.level<=3).length/rangeEntries.length):0;
    const avg=rangeEntries.length?(rangeEntries.reduce((a,b)=>a+b.level,0)/rangeEntries.length).toFixed(1):'0';
    const high=rangeEntries.length?Math.max(...rangeEntries.map(x=>x.level)):0;
    const patt=v=>topPhrases(v).map(x=>`${x.text}${x.count>1?' ×'+x.count:''}`).join(', ')||'Not enough data yet';
    const esc=t=>String(t||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const incidents=rangeEntries.map(x=>`<tr><td>${esc(formatEntryTime(x.timestamp))}</td><td>${esc(x.emotion)}</td><td>${x.level}</td><td>${esc(x.event)}</td><td>${esc(x.thought)}</td><td>${esc(x.strategy)}</td></tr>`).join('');
    const w=window.open('','_blank');
    w.document.write(`<!doctype html><title>Pattern Trainer Report</title><style>body{font:14px system-ui;margin:32px;color:#18202b}h1{margin-bottom:4px}.sub{color:#667085}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:24px 0}.m{border:1px solid #ccd3dc;border-radius:12px;padding:14px}.m b{font-size:24px;display:block}.patterns{border:1px solid #ccd3dc;border-radius:12px;padding:16px;margin-bottom:20px}.patterns p{margin:8px 0}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border-bottom:1px solid #ddd;text-align:left;vertical-align:top;padding:8px}th{background:#f2f4f7}@media print{body{margin:12mm}.no-print{display:none}}</style><h1>Pattern Trainer - Review</h1><div class=sub>${formatShortDate(s)} - ${formatShortDate(endLabel)}</div><div class=metrics><div class=m><b>${rangeEntries.length}</b>Entries</div><div class=m><b>${early}%</b>Caught at 1-3</div><div class=m><b>${high}</b>Highest intensity</div><div class=m><b>${avg}</b>Average intensity</div><div class=m><b>${deletedRants.filter(x=>{const d=new Date(x.deleted_at);return d>=s&&d<e;}).length}</b>Deleted rants</div></div><div class=patterns><h2>Patterns</h2><p><b>Starting states:</b> ${esc(patt(rangeEntries.flatMap(x=>x.emotions?.length?x.emotions:(x.emotion?[x.emotion]:[]))))}</p><p><b>Triggers:</b> ${esc(patt(rangeEntries.map(x=>x.event)))}</p><p><b>Thoughts:</b> ${esc(patt(rangeEntries.map(x=>x.thought)))}</p><p><b>Cues:</b> ${esc(patt(cueValues(rangeEntries)))}</p><p><b>Strategies:</b> ${esc(patt(rangeEntries.map(x=>x.strategy)))}</p></div><h2>Incident log</h2><table><thead><tr><th>Date/time</th><th>Starting state</th><th>Intensity</th><th>Trigger</th><th>Thought</th><th>Strategy</th></tr></thead><tbody>${incidents}</tbody></table><p class=no-print><button onclick=window.print()>Save / Print PDF</button></p>`); w.document.close();
  });
}

function registerEvents(){
  qsa('[data-nav]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.nav)));
  qsa('[data-action="new-entry"]').forEach(b=>b.addEventListener('click',openNew));
  qsa('[data-action="new-rant"]').forEach(b=>b.addEventListener('click',openRant));
  qsa('[data-action="close-sheet"]').forEach(b=>b.addEventListener('click',closeSheet));
  qsa('[data-action="close-rant"]').forEach(b=>b.addEventListener('click',closeRant));
  qs('#rantRecordBtn').addEventListener('click',toggleRantRecording);
  qs('#rantTranscript').addEventListener('input',()=>localStorage.setItem('patternTrainerRantDraft',qs('#rantTranscript').value));
  qs('#saveRant').addEventListener('click',saveRantCapture);
  qs('#cancelRant').addEventListener('click',()=>{if(qs('#rantTranscript').value.trim()&&!confirm('Discard this unsaved rant?'))return;localStorage.removeItem('patternTrainerRantDraft');closeRant();});
  qsa('[data-dictate-target]').forEach(b=>b.addEventListener('click',()=>startDictation(b.dataset.dictateTarget,b)));
  qsa('[data-cue-picker]').forEach(b=>b.addEventListener('click',()=>openCuePicker(b.dataset.cuePicker)));
  qsa('[data-action="close-cue-picker"]').forEach(b=>b.addEventListener('click',()=>qs('#cuePickerModal').classList.add('hidden')));
  qs('#applyCuePicker').addEventListener('click',applyCuePicker);
  qs('#analyzeRant').addEventListener('click',analyzeCurrentRant);

  qs('#detailsToggle').addEventListener('click',()=>{
    const hidden=qs('#detailFields').classList.toggle('hidden');
    qs('#detailsToggle').textContent=hidden?'Add more detail':'Hide extra detail';
  });

  qs('#entryForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const entry=formEntry();
    if(!entry.event && !entry.thought && !entry.rawRant){qs('#thoughtInput').focus();return;}
    await putEntry(entry); closeSheet(); await refreshHome();
  });

  qs('#deleteEntry').addEventListener('click',async()=>{
    const id=qs('#entryId').value;if(!id)return;
    const rows=await getAllRecords();const row=rows.find(x=>x.id===id);const isRant=row?.entryType==='rant';if(confirm(isRant?'Delete this rant permanently? Its content will be removed, but Review will retain a content-free deleted-rant count.':'Delete this entry?')){if(isRant)await deleteRantById(id);else await deleteById(id);closeSheet();await refreshHome();await refreshHistory();await refreshReview();}
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

  qs('#prevWeek').addEventListener('click',()=>{shiftReviewRange(-1);refreshReview();});
  qs('#nextWeek').addEventListener('click',()=>{shiftReviewRange(1);refreshReview();});
  qs('#thisWeekReview').addEventListener('click',()=>{resetReviewToThisWeek();refreshReview();});
  qs('#applyReviewDates').addEventListener('click',()=>{
    const f=qs('#reviewDateFrom').value,t=qs('#reviewDateTo').value;
    if(!f||!t)return;
    const start=new Date(`${f}T00:00:00`), endInclusive=new Date(`${t}T00:00:00`);
    if(endInclusive<start){alert('The end date must be on or after the start date.');return;}
    const endExclusive=new Date(endInclusive); endExclusive.setDate(endExclusive.getDate()+1);
    setReviewRange(start,endExclusive); refreshReview();
  });
  qs('#printReview').addEventListener('click',()=>window.print());
  qs('#exportReport').addEventListener('click',exportRangeReport);

  qs('#backupBtn').addEventListener('click',()=>qs('#backupModal').classList.remove('hidden'));
  qsa('[data-action="close-backup"]').forEach(b=>b.addEventListener('click',()=>qs('#backupModal').classList.add('hidden')));

  qs('#syncNow').addEventListener('click',syncCloud);
  qs('#signOutBtn').addEventListener('click',async()=>{ if(confirm('Sign out on this device? Your cloud history stays in your account.')) await signOutAccount(); });

  let authMode='signin';
  const setAuthMode=(mode)=>{
    authMode=mode; const signup=mode==='signup';
    qs('#authTitle').textContent=signup?'Create your account':'Sign in';
    qs('#authSubmit').textContent=signup?'Create account':'Sign in';
    qs('#authToggle').textContent=signup?'I already have an account':'Create a new account';
    qs('#confirmPasswordWrap').classList.toggle('hidden',!signup);
    qs('#authMessage').textContent='';
  };
  qs('#authToggle').addEventListener('click',()=>setAuthMode(authMode==='signin'?'signup':'signin'));
  qs('#authForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const username=qs('#authUsername').value.trim().toLowerCase();
    const password=qs('#authPassword').value;
    const confirmPassword=qs('#authConfirmPassword').value;
    const msg=qs('#authMessage'); msg.textContent='';
    if(!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)){msg.textContent='Use 3-30 letters, numbers, dots, dashes, or underscores.';return;}
    if(password.length<8){msg.textContent='Password must be at least 8 characters.';return;}
    if(authMode==='signup' && password!==confirmPassword){msg.textContent='Passwords do not match.';return;}
    qs('#authSubmit').disabled=true; msg.textContent=authMode==='signup'?'Creating account…':'Signing in…';
    try{
      if(authMode==='signup') await createAccount(username,password); else await signInAccount(username,password);
      await prepareAccountData(); hideAuth(); updateAccountUI(); await syncCloud();
      qs('#authForm').reset();
    }catch(err){ msg.textContent=err.message||'Could not sign in.'; }
    finally{ qs('#authSubmit').disabled=false; }
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
      await clearCurrentAccountLocal();qs('#backupModal').classList.add('hidden');refreshHome();
    }
  });
}

function handleDirectLaunch(){
  const params=new URLSearchParams(window.location.search);
  // Literal action=rant is intentionally kept here for regression tests and Samsung/PWA shortcuts.
  if(params.toString().includes('action=rant') && params.get('action')==='rant'){
    openRant();
    history.replaceState({},document.title,window.location.pathname);
  }
}

(async function init(){
  buildLevelButtons();
  buildEmotionButtons();
  const rantLevels=qs('#rantLevelButtons');for(let i=1;i<=10;i++){const b=document.createElement('button');b.type='button';b.dataset.level=i;b.textContent=i;b.className=levelClass(i);b.addEventListener('click',()=>setRantLevel(i));rantLevels.appendChild(b);}
  setEmotions(['Irritation']);setRantLevel(2);
  await openDB();
  registerEvents();
  updateAccountUI();
  if(getSavedSession()){
    await prepareAccountData();
    hideAuth();
    refreshHome();
    syncCloud();
  }else{
    refreshHome();
    setSyncStatus('Sign in to sync');
    showAuth();
  }
  window.addEventListener('online',()=>{ if(getSavedSession()) syncCloud(); });
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && navigator.onLine && getSavedSession()) syncCloud(); });
  setInterval(()=>{ if(document.visibilityState==='visible' && navigator.onLine && getSavedSession()) syncCloud(); },60000);
  handleDirectLaunch();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }
})();
