/* Account-scoped, transactional storage. No incident data or passwords live here. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CalmStorage=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const keys=['id','userId','kind','scriptId','selection','startedAt','endedAt','durationSeconds','before','after','beforeSource','feedback','status','delivery','linkedEntryId','updatedAt','deleted'];
function validate(r){
 const require=(ok,message)=>{if(!ok)throw new Error(message);};
 require(r&&uuid.test(r.id)&&uuid.test(r.userId),'Invalid session or account ID.');
 require(['ground','down','unstuck','humor'].includes(r.kind),'Unknown technique.');
 require(typeof r.scriptId==='string'&&r.scriptId.length>0&&r.scriptId.length<=100,'Invalid script ID.');
 require(['random','manual'].includes(r.selection),'Invalid selection.');
 for(const key of ['startedAt','updatedAt'])require(typeof r[key]==='string'&&Number.isFinite(Date.parse(r[key])),'Invalid session date.');
 require(r.endedAt===null||(typeof r.endedAt==='string'&&Number.isFinite(Date.parse(r.endedAt))),'Invalid end date.');
 require(Number.isInteger(r.durationSeconds)&&r.durationSeconds>=0&&r.durationSeconds<=86400,'Invalid duration.');
 for(const key of ['before','after'])require(r[key]===null||(Number.isInteger(r[key])&&r[key]>=1&&r[key]<=10),'Invalid rating.');
 require(['before','recalled','unrated'].includes(r.beforeSource),'Invalid baseline source.');
 require((r.beforeSource==='unrated')===(r.before===null),'Missing or inconsistent baseline.');
 require(r.feedback===null||['helped_lot','helped_some','no_change','worse'].includes(r.feedback),'Invalid feedback.');
 require(['in_progress','completed','ended_early','switched','interrupted'].includes(r.status),'Invalid status.');
 require(['speech','text','unavailable'].includes(r.delivery),'Invalid delivery method.');
 require(r.linkedEntryId===null||(typeof r.linkedEntryId==='string'&&r.linkedEntryId.length<=200),'Invalid incident link.');
 require(typeof r.deleted==='boolean','Invalid deletion flag.');
 return Object.fromEntries(keys.map(k=>[k,r[k]]));
}
function toCloud(r){r=validate(r);return {id:r.id,user_id:r.userId,kind:r.kind,script_id:r.scriptId,selection:r.selection,started_at:r.startedAt,ended_at:r.endedAt,duration_seconds:r.durationSeconds,before_level:r.before,after_level:r.after,before_source:r.beforeSource,feedback:r.feedback,status:r.status,delivery:r.delivery,linked_entry_id:r.linkedEntryId,updated_at:r.updatedAt,deleted:r.deleted};}
function fromCloud(x,owner){if(x.user_id!==owner)throw new Error('Cloud response belongs to another account.');return validate({id:x.id,userId:x.user_id,kind:x.kind,scriptId:x.script_id,selection:x.selection,startedAt:x.started_at,endedAt:x.ended_at,durationSeconds:x.duration_seconds,before:x.before_level,after:x.after_level,beforeSource:x.before_source,feedback:x.feedback,status:x.status,delivery:x.delivery,linkedEntryId:x.linked_entry_id,updatedAt:x.updated_at,deleted:x.deleted});}
class Store{
 constructor(options={}){this.options=options;this.ready=this._open(options.dbName||'patternTrainerCalmDB');this.inFlight=null;}
 _open(name){return new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const s=r.result.createObjectStore('sessions',{keyPath:'id'});s.createIndex('userId','userId');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Close other app tabs to finish opening Calm storage.'));});}
 async _tx(mode,fn){const db=await this.ready;return new Promise((resolve,reject)=>{const tx=db.transaction('sessions',mode);let value;try{fn(tx.objectStore('sessions'),x=>{value=x;});}catch(e){tx.abort();reject(e);return;}tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error||new Error('Storage failed.'));tx.onabort=()=>reject(tx.error||new Error('Storage write aborted.'));});}
 async save(record){const clean=validate(record);return this._tx('readwrite',(s,result)=>{const old=s.get(clean.id);old.onsuccess=()=>{if(old.result&&old.result.userId!==clean.userId){s.transaction.abort();return;}const row={...clean,_dirty:true,_rev:crypto.randomUUID()};s.put(row);result(row);};});}
 async list(owner,all=false){if(!owner)return [];return this._tx('readonly',(s,result)=>{const req=s.index('userId').getAll(owner);req.onsuccess=()=>result(req.result.filter(r=>all||!r.deleted).sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)));});}
 async get(id,owner){return this._tx('readonly',(s,result)=>{const req=s.get(id);req.onsuccess=()=>result(req.result?.userId===owner?req.result:null);});}
 async acknowledge(id,owner,revision){return this._tx('readwrite',(s,result)=>{const req=s.get(id);req.onsuccess=()=>{const r=req.result;if(r?.userId===owner&&r._rev===revision){s.put({...r,_dirty:false});result(true);}else result(false);};});}
 async mergeRemote(record,owner){const row=validate(record);if(row.userId!==owner)throw new Error('Account mismatch.');return this._tx('readwrite',(s,result)=>{const req=s.get(row.id);req.onsuccess=()=>{const old=req.result;if(old&&old.userId!==owner){result(false);return;}if(!old||(!old._dirty&&Date.parse(row.updatedAt)>=Date.parse(old.updatedAt))){s.put({...row,_dirty:false,_rev:crypto.randomUUID()});result(true);}else result(false);};});}
 async export(owner){return (await this.list(owner)).map(validate);}
 async import(rows,owner){if(!Array.isArray(rows)||rows.length>50000)throw new Error('Invalid Calm backup.');const now=new Date().toISOString();const valid=rows.map(r=>validate({...r,userId:owner,updatedAt:now,status:r.status==='in_progress'?'interrupted':r.status}));for(const r of valid)await this.save(r);return valid.length;}
 async remove(id,owner){const r=await this.get(id,owner);if(r)await this.save({...r,deleted:true,updatedAt:new Date().toISOString()});}
 async clearLocal(owner){return this._tx('readwrite',(s)=>{const req=s.index('userId').openCursor(IDBKeyRange.only(owner));req.onsuccess=()=>{const c=req.result;if(c){c.delete();c.continue();}};});}
 async _request(path,token,method='GET',body=null){const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);try{const response=await (this.options.fetch||fetch)(this.options.url+'/rest/v1/pattern_calm_sessions'+path,{method,cache:'no-store',signal:controller.signal,headers:{apikey:this.options.key,Authorization:'Bearer '+token,'Content-Type':'application/json',...(method==='POST'?{Prefer:'resolution=merge-duplicates,return=minimal'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw new Error('Calm sync failed (HTTP '+response.status+').');return method==='GET'?await response.json():null;}finally{clearTimeout(timeout);}}
 async sync(){if(this.inFlight)return this.inFlight;this.inFlight=this._sync();try{return await this.inFlight;}finally{this.inFlight=null;}}
 async _sync(){
   const owner=this.options.owner();if(!owner)return {state:'guest',pending:0};
   const rows=await this.list(owner,true);const dirty=rows.filter(r=>r._dirty);
   if(!navigator.onLine)return {state:'offline',pending:dirty.length};
   let authTimer;
   let token;try{token=await Promise.race([this.options.token(),new Promise((_,reject)=>{authTimer=setTimeout(()=>reject(new Error('Sign-in check timed out. Retry Calm sync.')),this.options.authTimeoutMs||12000);})]);}finally{clearTimeout(authTimer);}
   if(!token||this.options.owner()!==owner)return {state:'signed_out',pending:dirty.length};
   for(let offset=0;offset<dirty.length;offset+=100){if(this.options.owner()!==owner)return {state:'signed_out',pending:dirty.length};const batch=dirty.slice(offset,offset+100);await this._request('?on_conflict=id',token,'POST',batch.map(toCloud));for(const sent of batch)await this.acknowledge(sent.id,owner,sent._rev);}
   for(let offset=0;;offset+=500){if(this.options.owner()!==owner)return {state:'signed_out',pending:0};const remote=await this._request('?user_id=eq.'+encodeURIComponent(owner)+'&order=id.asc&limit=500&offset='+offset,token);if(!Array.isArray(remote))throw new Error('Invalid Calm sync response.');if(this.options.owner()!==owner)return {state:'signed_out',pending:0};for(const row of remote)await this.mergeRemote(fromCloud(row,owner),owner);if(remote.length<500)break;}
   return {state:'synced',pending:(await this.list(owner,true)).filter(r=>r._dirty).length};
 }
}
return {Store,toCloud,fromCloud,validate};
});
