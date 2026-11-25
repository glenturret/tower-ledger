const assert=require('node:assert/strict'),M=require('./dist/model.js');
const records=M.PARTS.map(part=>({id:'reset-'+part,lineId:M.LINES[0].id,tower:1,part,status:'초기화',note:'',land:[],photos:[],photoPositions:[],photoAppliedAt:[],createdAt:'2026-11-25T00:00:00Z',...(part==='피뢰기'?{arresterCircuits:[]}:{})}));
assert.equal(M.validate(JSON.parse(JSON.stringify({format:'tower-ledger',version:5,records}))).length,M.PARTS.length);
for(const record of records)assert.equal(M.label(record),'미등록 (초기화)');
const scene=M.scene(records,M.LINES[0].id,1);assert.equal(scene.arresterRegistered,false);assert.equal(scene.towerType,undefined);assert.equal(scene.groundWires,undefined);
console.log('PASS reset markers for all parts, backup roundtrip and cleared scene');
