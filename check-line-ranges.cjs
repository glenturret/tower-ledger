const assert=require('node:assert/strict'),M=require('./dist/model.js');
const line=M.LINES.find(l=>l.id==='sacheon-gaeyang');
assert.equal(line.count,81);assert.equal(line.start,6);assert.equal(line.end,86);
const base={id:'range',lineId:line.id,part:'철탑 번호찰',towerNumberPlate:'부착',note:'',land:[],photos:[],createdAt:'2026-11-17T00:00:00Z'};
for(const tower of [6,81,86])assert.equal(M.validate({format:'tower-ledger',version:5,records:[{...base,tower}]})[0].tower,tower);
for(const tower of [0,1,5,87,6.5])assert.throws(()=>M.validate({format:'tower-ledger',version:5,records:[{...base,tower}]}));
console.log('PASS Sacheon–Gaeyang 6–86 backup boundaries and count');
