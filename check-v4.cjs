const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const M=require('./dist/model.js'),D=require('./dist/scene.js');
const base={id:'one',lineId:M.LINES[0].id,tower:1,part:'애자련',insulatorType:'내장',stringCount:2,status:'등록',note:'',land:[],photos:[],createdAt:'2026-11-06T00:00:00Z'};
const validate=r=>M.validate({format:'tower-ledger',version:4,records:[r]});assert.doesNotThrow(()=>validate(base));assert.throws(()=>validate({...base,stringCount:3}));
for(const type of ['내장','현수'])for(const count of [1,2]){const html=D.diagram({insulatorType:type,stringCount:count});assert.equal([...html.matchAll(/data-kind="insulator-string"/g)].length,6*count);assert(html.includes('rotate('+(type==='내장'?90:0)+')'));}
const ballCircuits=[{count:9,color:'orange'},{count:6,color:'white'}];
for(const groundWires of [undefined,{count:1,single:'OPGW'},{count:2,left:'OPGW',right:'GW'}]){
  const svg=D.diagram({groundWires,ballCount:15,ballCircuits});
  const markers=svg.match(/<circle class="marker-ball"[^>]+>/g);
  assert.equal(markers.length,15);
  assert.equal(markers.filter(marker=>marker.includes('#dc854a')).length,9);
  assert.equal(markers.filter(marker=>marker.includes('#ffffff')).length,6);
}
assert.match(D.diagram({ballCount:15}),/기존 15개 · 회선별 미지정/);
const direction='1호→2호 정방향';for(const position of ['좌측','중앙','우측'])for(const single of ['OPGW','GW'])assert.doesNotThrow(()=>validate({...base,part:'가공지선',groundWires:{count:1,position,single,direction}}));
for(const left of ['OPGW','GW'])for(const right of ['OPGW','GW']){const groundWires={count:2,left,right,direction};assert(M.validGround(groundWires));assert.doesNotThrow(()=>validate({...base,part:'가공지선',groundWires}));const html=D.diagram({groundWires});assert(html.includes('좌 '+left));assert(html.includes('우 '+right));}
for(const g of [{count:1,single:'OPGW',position:'',direction},{count:2,left:'OPGW',right:'',direction},{count:2,left:'OPGW',right:'GW',direction:'reverse'}])assert.throws(()=>validate({...base,part:'가공지선',groundWires:g}));
const legacy={...base};delete legacy.stringCount;delete legacy.lineId;const migrated=M.validate({format:'tower-ledger',version:2,records:[legacy]})[0];assert.equal(migrated.lineId,M.LINES[0].id);assert.equal(migrated.stringCount,undefined);
const second={...base,id:'two',lineId:M.LINES[1].id,stringCount:1};assert.equal(M.scene([base,second],base.lineId,1).stringCount,2);assert.equal(M.scene([base,second],second.lineId,1).stringCount,1);
for(const [lineId,tower,ok] of [[M.LINES[0].id,136,true],[M.LINES[0].id,137,false],[M.LINES[1].id,56,true],[M.LINES[1].id,57,false]])ok?assert.doesNotThrow(()=>validate({...base,lineId,tower})):assert.throws(()=>validate({...base,lineId,tower}));
const js=fs.readFileSync('dist/app.js','utf8'),html=fs.readFileSync('dist/index.html','utf8'),ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);for(const [,id] of js.matchAll(/\$\('([^']+)'\)/g))assert(ids.includes(id),id);
const context=vm.createContext({});vm.runInContext(js.slice(js.indexOf('function confirmSave'),js.indexOf('function show')),context);for(const [answers,result] of [[[false],false],[[true,false],false],[[true,true],true]]){let i=0;context.confirm=()=>answers[i++];assert.equal(vm.runInContext("confirmSave('test')",context),result);assert.equal(i,answers.length);}
assert.notEqual(D.diagram({terrain:'산악지'}),D.diagram({terrain:'논'}));assert.notEqual(D.diagram({terrain:'도심지'}),D.diagram({terrain:'논'}));
console.log('PASS: 1/2 strings drawn, direct choices, OPGW/GW positions and direction, invalid combinations, legacy migration, separate lines, range limits, ball quantity, terrain, DOM references, two confirmations.');
