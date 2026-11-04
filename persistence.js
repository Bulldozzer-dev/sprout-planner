(function(root){'use strict';
const P=typeof module!=='undefined'?require('./core.js'):root.Planner,KEY='sprout-plans-v2';
function validate(v){
 if(!v||typeof v!=='object'||Array.isArray(v)||v.version!==2)throw Error('This is not a Sprout v2 backup.');
 for(const k of ['name','week','available','classes','tasks'])if(typeof v[k]!=='string')throw Error('Backup field missing: '+k);
 if(!v.name.trim()||v.name.length>80||v.available.length>20000||v.classes.length>20000||v.tasks.length>40000)throw Error('Backup fields are too large or the name is empty.');
 P.monday(v.week);const a=P.windows(v.available);if(!a.length)throw Error('Add available time.');const r=P.schedule(a,P.windows(v.classes),P.tasks(v.tasks));
 if(!Array.isArray(v.completed)||v.completed.length>200||v.completed.some(x=>!Number.isInteger(x)||!r.planned.some(t=>t.order===x))||new Set(v.completed).size!==v.completed.length)throw Error('Invalid completed sessions.');
 return {version:2,name:v.name.trim(),week:v.week,available:v.available,classes:v.classes,tasks:v.tasks,completed:[...v.completed]};
}
function read(s){const raw=s.getItem(KEY);if(!raw)return [];if(raw.length>2000000)throw Error('Saved data is too large.');let list;try{list=JSON.parse(raw);}catch{throw Error('Saved data is unreadable. Use a downloaded backup.');}if(!Array.isArray(list)||list.length>20)throw Error('Invalid saved-plan list.');return list.map(validate);}
function save(s,p){p=validate(p);const list=read(s),i=list.findIndex(x=>x.name===p.name&&x.week===p.week);if(i<0){if(list.length>=20)throw Error('Device holds 20 plans. Reuse a name and week or download a backup.');list.push(p);}else list[i]=p;s.setItem(KEY,JSON.stringify(list));return list;}
function restore(text){if(text.length>100000)throw Error('Backup is too large.');let v;try{v=JSON.parse(text);}catch{throw Error('Backup is not valid JSON.');}return validate(v);}
const api={validate,read,save,restore,KEY};if(typeof module!=='undefined')module.exports=api;else root.PlanStore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
