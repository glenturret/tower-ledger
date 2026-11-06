const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('dist/app.js','utf8'),html=fs.readFileSync('dist/index.html','utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
for(const [,id] of js.matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(id),'Missing element '+id);
const context=vm.createContext({});
vm.runInContext("const PARTS=['항공구','항공등','애자련','부지'];"+js.match(/const statuses=p=>[^\n]+/)[0]+js.slice(js.indexOf('function validate('),js.indexOf("$('importFile').onchange")),context);
const valid={format:'tower-ledger',version:1,line:'테스트선로',records:[{id:'test-1',tower:1,part:'항공등',status:'정상 점멸',note:'테스트',land:[],photos:[],createdAt:'2026-11-06T00:00:00.000Z'}]};
context.data=valid;vm.runInContext('validate(data)',context);
for(const change of [d=>d.records[0].tower=137,d=>d.records[0].photos=['javascript:alert(1)'],d=>d.records[0].status='unknown',d=>d.records.push({...d.records[0]}),d=>d.records[0].createdAt='invalid',d=>d.records[0].insulatorType='invalid']){const copy=JSON.parse(JSON.stringify(valid));change(copy);context.data=copy;assert.throws(()=>vm.runInContext('validate(data)',context));}
context.data={...valid,version:2,records:[{...valid.records[0],tower:136,part:'애자련',status:'등록',insulatorType:'내장'}]};vm.runInContext('validate(data)',context);
context.data.records[0].insulatorType='현수';vm.runInContext('validate(data)',context);
vm.runInContext(js.slice(js.indexOf('function confirmSave('),js.indexOf('function recordLabel(')),context);
for(const [answers,expected,calls] of [[[false],false,1],[[true,false],false,2],[[true,true],true,2]]){let n=0;context.confirm=()=>answers[n++];assert.equal(vm.runInContext("confirmSave('test')",context),expected);assert.equal(n,calls);}
console.log('PASS: 136호, 내장/현수, old/new backups, cancel at either confirmation and save after both.');
console.log('PASS: DOM references; valid backup; invalid tower, photo, status, duplicate ID and date rejected.');
