const assert=require('node:assert/strict'),M=require('./dist/model.js');
const time='2026-11-18T00:00:00Z';
const record={id:'tower-overview',lineId:M.LINES[2].id,tower:6,part:'철탑 전경',status:'등록',note:'철탑 전체 사진',land:[],photos:['data:image/jpeg;base64,/9j/2Q=='],photoPositions:['general'],photoAppliedAt:[time],createdAt:time};
assert.equal(M.sharedPart(record.part),true);
assert.deepEqual(M.validate(JSON.parse(JSON.stringify({format:'tower-ledger',version:5,records:[record]})))[0],record);
assert.equal(M.label(record),'사진 1장');
console.log('PASS tower overview shared across circuits, photo/timestamp backup roundtrip and summary');
