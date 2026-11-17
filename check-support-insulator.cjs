const assert=require('node:assert/strict');
const M=require('./dist/model.js');
const legacy={id:'support-test',lineId:M.LINES[0].id,tower:1,part:'애자련',insulatorType:'현수',stringCount:2,note:'',land:[],photos:[],createdAt:'2026-11-17T00:00:00Z'};
const roundtrip=record=>M.validate(JSON.parse(JSON.stringify({format:'tower-ledger',version:5,records:[record]})))[0];
assert.equal(roundtrip(legacy).supportInsulatorCount,undefined);
for(const count of [1,2,3,4]){
 const restored=roundtrip({...legacy,supportInsulatorCount:count});
 assert.equal(restored.supportInsulatorCount,count);
 assert.match(M.label(restored),new RegExp('지지애자 '+count+'조'));
 assert.equal(restored.stringCount,2);
}
for(const invalid of [0,5,-1,1.5,'2',null])assert.throws(()=>roundtrip({...legacy,supportInsulatorCount:invalid}));
console.log('PASS support insulator 1–4 sets, backup roundtrip, legacy records, invalid values');
