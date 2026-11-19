/* The quick journal uses a separate store so older apps cannot overwrite it. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PatternCheckin=factory();})(globalThis,function(){
'use strict';
const moods=Object.freeze(['Hollow','Down','Angry','Anxious','Steady','Good']);
const contexts=Object.freeze(['Work','Conflict','Sleep','Food','Social','Alone','Rest','Movement','Not sure']);
const actions=Object.freeze(['Went outside','Music','Moved around','Rested','Ate or drank water','Talked to someone','Grounding','Took one small step']);
const outcomes=Object.freeze(['better','same','worse']);
const trim=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
const tag=(value,list)=>list.includes(value)?value:null;
const time=(value)=>typeof value==='string'&&Number.isFinite(Date.parse(value));
function clean(value){
 const moodTags=Array.isArray(value.moodTags)?[...new Set(value.moodTags.filter(x=>moods.includes(x)))]:[];
 const actionTag=tag(value.actionTag,actions),actionNote=trim(value.actionNote,1000);
 const customMood=trim(value.customMood,100);
 return {moodTags,customMood,emotions:[...moodTags,...(customMood?[customMood]:[])],contextTag:tag(value.contextTag,contexts),
  contextNote:trim(value.contextNote,2000),thought:trim(value.thought,4000),actionTag,actionNote,
  outcome:actionTag||actionNote?tag(value.outcome,outcomes):null};
}
function build(input,existing,{now,id}){
 const entry=clean(input);
 if(!entry.emotions.length&&!entry.thought&&!entry.contextNote&&!entry.contextTag&&!entry.actionTag&&!entry.actionNote)return null;
 return {...entry,id:existing?.id||id,entryType:'checkin',timestamp:existing?.timestamp||now,capturedAt:existing?existing.capturedAt??null:now,updatedAt:now};
}
function toCloud(row,owner){
 const r=clean(row);
 return {id:row.id,user_id:owner,captured_at:row.capturedAt??null,occurred_at:row.timestamp,updated_at:row.updatedAt,deleted:!!row._deleted,
  mood_tags:r.moodTags,context_tag:r.contextTag,action_tag:r.actionTag,outcome:r.outcome,
  thought:r.thought||null,context_note:r.contextNote||null,custom_mood:r.customMood||null,action_note:r.actionNote||null};
}
function fromCloud(row,owner){
 if(row.user_id!==owner||!time(row.occurred_at)||!time(row.updated_at)||typeof row.id!=='string')throw new Error('Invalid check-in sync data.');
 const contents=clean({moodTags:row.mood_tags,customMood:row.custom_mood,contextTag:row.context_tag,contextNote:row.context_note,
  thought:row.thought,actionTag:row.action_tag,actionNote:row.action_note,outcome:row.outcome});
 return {...contents,id:row.id,entryType:'checkin',timestamp:row.occurred_at,capturedAt:row.captured_at??null,updatedAt:row.updated_at,_deleted:!!row.deleted,_owner:owner};
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class Store{
 constructor({url,key,owner,token,dbName='patternTrainerCheckinDB',request=(...args)=>fetch(...args)}) {
  this.options={url,key,owner,token,request};this.ready=new Promise((resolve,reject)=>{
   const req=indexedDB.open(dbName,1);
   req.onupgradeneeded=()=>{req.result.createObjectStore('checkins',{keyPath:'id'}).createIndex('_owner','_owner');};
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
 }
 async tx(mode,perform){
  const db=await this.ready;
  return new Promise((resolve,reject)=>{
   const t=db.transaction('checkins',mode);let result;
   perform(t.objectStore('checkins'),value=>{result=value;});
   t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);
   t.onabort=()=>reject(t.error||Error('Could not save this check-in.'));
  });
 }
 async list(owner,all=false){
  if(!owner)return [];
  return this.tx('readonly',(s,done)=>{const req=s.index('_owner').getAll(owner);req.onsuccess=()=>done(req.result.filter(x=>all||!x._deleted));});
 }
 async save(input,owner,deleted=false){
  if(!owner||owner!==this.options.owner()||!uuid.test(input.id)||!time(input.timestamp)||!time(input.updatedAt))throw Error('Please sign in to save this check-in.');
  const row={...fromCloud(toCloud(input,owner),owner),_deleted:deleted,_dirty:true,_rev:crypto.randomUUID()};
  return this.tx('readwrite',(s,done)=>{
   const req=s.get(row.id);req.onsuccess=()=>{
    if(req.result&&req.result._owner!==owner){s.transaction.abort();return;}
    row.capturedAt=req.result?.capturedAt??row.capturedAt;
    s.put(row);done(row);
   };
  });
 }
 async import(rows,owner){
  if(!owner||!Array.isArray(rows)||rows.length>50000)throw Error('Invalid check-in data.');
  if(rows.some(r=>!r||!uuid.test(r.id)||!time(r.timestamp))) throw Error('Invalid check-in backup record.');
  for(const row of rows)await this.save({...row,capturedAt:null,updatedAt:new Date().toISOString()},owner);
 }
 async clear(owner){
  if(!owner)return;
  return this.tx('readwrite',s=>{const req=s.index('_owner').openCursor(IDBKeyRange.only(owner));req.onsuccess=()=>{if(req.result){req.result.delete();req.result.continue();}};});
 }
 async remote(path,token,body=null){
  const opts=this.options;
  const r=await opts.request(opts.url+'/rest/v1/pattern_checkins'+path,{method:body?'POST':'GET',
   cache:'no-store',signal:AbortSignal.timeout(12000),headers:{apikey:opts.key,Authorization:'Bearer '+token,'Content-Type':'application/json',
   ...(body?{Prefer:'resolution=merge-duplicates,return=minimal'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error('Check-in sync unavailable.');
  return body?null:r.json();
 }
 async flush(){
  if(this.inFlight)return this.inFlight;
  this.inFlight=this.sync();
  try{return await this.inFlight;}finally{this.inFlight=null;}
 }
 async sync(){
  const owner=this.options.owner();
  if(!owner||!navigator.onLine)return false;
  const token=await this.options.token();
  if(!token||owner!==this.options.owner())return false;
  for(let offset=0;;offset+=400){
   const page=await this.remote('?user_id=eq.'+encodeURIComponent(owner)+'&order=id.asc&limit=400&offset='+offset,token);
   if(!Array.isArray(page)||owner!==this.options.owner())return false;
   const remote=page.map(x=>fromCloud(x,owner));
   await this.tx('readwrite',(s)=>{
    for(const row of remote){const req=s.get(row.id);req.onsuccess=()=>{
     const prior=req.result;
     if(!prior||(prior._owner===owner&&Date.parse(row.updatedAt)>Date.parse(prior.updatedAt)))s.put({...row,_dirty:false});
    };}
   });
   if(page.length<400)break;
  }
  const pending=(await this.list(owner,true)).filter(x=>x._dirty);
  for(let offset=0;offset<pending.length;offset+=100){
   if(owner!==this.options.owner())return false;
   const batch=pending.slice(offset,offset+100);
   await this.remote('?on_conflict=id',token,batch.map(x=>toCloud(x,owner)));
   await this.tx('readwrite',s=>{
    for(const row of batch){const req=s.get(row.id);req.onsuccess=()=>{
     if(req.result?._owner===owner&&req.result._rev===row._rev)s.put({...req.result,_dirty:false});
    };}
   });
  }
  return owner===this.options.owner();
 }
}
return {moods,contexts,actions,outcomes,build,toCloud,fromCloud,Store};
});
