'use strict';
const APP_VERSION=33,$=id=>document.getElementById(id),M=LedgerModel;
let db,records=[],circuitLayouts={},lineId=M.LINES[0].id,tower=1,circuit=1,part='항공등',photos=[],processing=0,saving=false,dirty=false,current='linesView',previous='linesView';
const mainScene=TowerScene.mount($('mainScene')),editScene=TowerScene.mount($('editScene'));
const line=()=>M.LINES.find(l=>l.id===lineId),latest=p=>M.latest(scopedRecords(),lineId,tower,p),stamp=d=>new Date(d).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
function toast(message){const el=$('toast'),dialogs=[...document.querySelectorAll('dialog[open]')],host=dialogs.at(-1)||document.body;if(el.parentElement!==host)host.append(el);el.textContent=message;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,5000);}
function req(r){return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function transaction(stores,mode,action){return new Promise((resolve,reject)=>{const tx=db.transaction(stores,mode);action(tx);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('저장이 취소되었습니다.'));});}
async function reload(){records=(await req(db.transaction('records').objectStore('records').getAll())).map(M.migrate);const saved=await req(db.transaction('meta').objectStore('meta').get('circuitLayouts'));circuitLayouts=validatedLayouts(saved?.value);render();}
function ask(title,message,acceptLabel='확인'){return new Promise(resolve=>{const dialog=$('confirmDialog');$('confirmTitle').textContent=title;$('confirmMessage').textContent=message;$('acceptConfirm').textContent=acceptLabel;dialog.returnValue='';dialog.addEventListener('close',()=>resolve(dialog.returnValue==='accept'),{once:true});dialog.showModal();});}
async function confirmSave(summary){return await ask('1차 확인','저장할 내용을 확인해주세요.\n'+summary,'계속')&&await ask('2차 확인','이 내용으로 최종 저장할까요?\n'+summary,'최종 저장');}
function show(view){current=view;['linesView','listView','towerView','settingsView'].forEach(id=>$(id).hidden=id!==view);render();window.scrollTo(0,0);}
function summary(s){return layoutLabel()+' · 철탑 번호찰 '+(s.towerNumberPlate||'미확인')+' · '+(s.towerType||s.towerHeight?'철탑 '+(s.towerType||'형태 미등록')+' · '+(s.towerHeight?s.towerHeight+' m':'높이 미등록')+' · ':'')+'항공구 '+M.ballLabel(s)+ ' · 항공장애등 '+(s.lightIntensity||'미등록')+' · 애자련 '+(s.insulatorType||'미등록')+' '+(s.stringCount?s.stringCount+'련':'련수 미등록')+' · 가공지선 '+M.groundLabel(s.groundWires)+' · 지형 '+(s.terrain||'미등록');}
function render(){
 const recordedByLine=new Map(M.LINES.map(item=>[item.id,new Set()]));
 for(const record of records)recordedByLine.get(record.lineId)?.add(record.tower);
 if(current==='linesView'){
  const fragment=document.createDocumentFragment();
  for(const item of M.LINES){const b=document.createElement('button');b.className='linecard';const title=document.createElement('strong');title.textContent=item.name;const detail=document.createElement('span');detail.textContent=item.count+'기 · 등록 '+recordedByLine.get(item.id).size+'기';const arrow=document.createElement('span');arrow.textContent='›';b.append(title,detail,arrow);b.onclick=()=>{lineId=item.id;circuit=1;$('search').value='';show('listView');};fragment.append(b);}
  $('lineCards').replaceChildren(fragment);
  return;
 }
 if(current==='listView'){
  const recorded=recordedByLine.get(lineId),query=$('search').value.trim(),fragment=document.createDocumentFragment();
  $('leftCircuit').value=circuitLayouts[lineId]||'';$('rightCircuit').textContent=oppositeCircuit($('leftCircuit').value);$('circuitLayoutSummary').textContent=layoutLabel();$('lineTitle').textContent=line().name;$('towerCount').textContent=line().count;$('recorded').textContent=recorded.size;
  for(let n=1;n<=line().count;n++){if(query&&!String(n).includes(query))continue;const done=recorded.has(n),b=document.createElement('button');b.className='towercell'+(done?' done':'');const title=document.createElement('span');title.textContent=n+'호';const small=document.createElement('small');small.textContent=done?'● 기록 있음':'○ 기록 없음';b.append(title,small);b.onclick=()=>openTower(n);fragment.append(b);}
  $('towerGrid').replaceChildren(fragment);if(!$('towerGrid').children.length)$('towerGrid').textContent='해당 호수가 없습니다.';
  return;
 }
 if(current==='towerView'){
  $('towerLine').textContent=line().name;$('towerTitle').textContent=tower+'호 철탑';
  const state=towerSceneState();mainScene.update(state);$('sceneSummary').textContent=summary(state);
  renderParts();
 }
}
function preview(){const s=towerSceneState(),v=$('choiceInput').value;if(part==='항공구'){Object.assign(s,readBallInput());updateBallTotal();}if(part==='항공등'){s.lightIntensity=M.lampIntensity(readLamps());s.lampUnits=readLamps();}if(part==='애자련'){s.insulatorType=selected('insulatorType');s.stringCount=Number(selected('stringCount'))||undefined;}if(part==='가공지선'){groundVisibility();const g=readGround();s.groundWires=M.validGround(g)?g:undefined;}if(part==='지형')s.terrain=v;if(part==='철탑 기본정보'){updatePairedLineFields();Object.assign(s,readTower());}editScene.update(s);$('editSummary').textContent=summary(s);}
function openEditor(p){part=p;dirty=false;photos=[];$('recordForm').reset();$('editorTower').textContent=line().name+' / '+tower+'호';$('partTitle').textContent=M.sharedPart(p)?equipmentName(p):p+' #'+circuit;const last=latest(p),hasChoice=!!M.CHOICES[p]&&!['애자련','항공등'].includes(p);$('choiceField').hidden=!hasChoice;$('choiceInput').disabled=!hasChoice;$('choiceInput').required=hasChoice;$('choiceLabel').textContent=p==='항공등'?'항공장애등 광도':p==='애자련'?'애자련 형태':p==='피뢰기'?'피뢰기 설치 회선':'지형';$('choiceInput').replaceChildren(new Option('선택해주세요',''),...(M.CHOICES[p]||[]).map(v=>new Option(v,v)));fillBallFields(p,last);$('landOptions').hidden=p!=='부지';if(last){$('noteInput').value=last.note;photos=[...last.photos];$('choiceInput').value=last.lightIntensity||last.insulatorType||last.terrain||last.arresterCircuit||'';$('landOptions').querySelectorAll('input').forEach(el=>el.checked=last.land.includes(el.value));}$('insulatorFields').hidden=p!=='애자련';$('groundFields').hidden=p!=='가공지선';document.querySelectorAll('#insulatorFields input').forEach(el=>{el.disabled=p!=='애자련';if(el.type==='radio')el.checked=el.value===String(el.name==='insulatorType'?last?.insulatorType:last?.stringCount);});document.querySelectorAll('#groundFields input,#groundFields select,#groundFields button').forEach(el=>el.disabled=p!=='가공지선');$('insulatorYear').value=last?.insulatorYear??'';$('insulatorDiscs').value=last?.insulatorDiscs??'';$('lampFields').hidden=p!=='항공등';for(const key of M.LAMP_KEYS){$(key).disabled=p!=='항공등';$(key).value=last?.lampUnits?.[key]||'';}$('towerFields').hidden=p!=='철탑 기본정보';$('towerType').disabled=$('towerHeight').disabled=$('nationalPointPlate').disabled=$('towerNumberPlate').disabled=$('towerCircuitCount').disabled=p!=='철탑 기본정보';$('towerCircuitCount').value=last?.towerCircuitCount??'';fillPairedLineFields(p,last);$('nationalPointPlate').value=last?.nationalPointPlate||'';$('towerNumberPlate').value=last?.towerNumberPlate==='미확인'?'':last?.towerNumberPlate||'';$('towerType').value=last?.towerType||'';$('towerHeight').value=last?.towerHeight??'';fillGround(last?.groundWires);renderArresterEditor(p);renderPhotos();renderHistory();$('editor').showModal();editScene.reset();preview();}
function renderHistory(){$('history').replaceChildren();const items=scopedRecords().filter(r=>r.lineId===lineId&&r.tower===tower&&r.part===part).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));if(!items.length){$('history').textContent='등록 이력이 없습니다.';return;}items.forEach(r=>{const div=document.createElement('div');div.className='historyitem';const title=document.createElement('strong');title.textContent=(r.part==='애자련'&&r.circuit?'기존 #'+r.circuit+' · ':'')+M.label(r);const date=document.createElement('small');date.textContent=stamp(r.createdAt);const note=document.createElement('p');note.textContent=r.note;const pics=document.createElement('div');pics.className='historyphotos';r.photos.forEach((src,i)=>{const item=document.createElement('div');item.className='historyphoto';const img=document.createElement('img');img.src=src;img.alt=part+' 사진 '+(i+1);img.loading='lazy';const remove=document.createElement('button');remove.type='button';remove.textContent='사진 삭제';remove.onclick=()=>deleteHistoryPhoto(r,i);item.append(img,remove);pics.append(item);});div.append(title,document.createElement('br'),date,note,pics);$('history').append(div);});}
async function deleteHistoryPhoto(record,index){if(!await ask('사진 삭제','이 기록에서 선택한 사진을 삭제할까요? 삭제 후에는 복구할 수 없습니다.','삭제'))return;const wasLatest=latest(part)?.id===record.id,updated={...record,photos:record.photos.filter((_,photoIndex)=>photoIndex!==index)};try{await transaction('records','readwrite',tx=>tx.objectStore('records').put(updated));const position=records.findIndex(item=>item.id===record.id);if(position>=0)records[position]=updated;if(wasLatest)photos=[...updated.photos];renderPhotos();renderHistory();toast('사진을 삭제했습니다.');}catch{toast('사진을 삭제하지 못했습니다. 저장 공간을 확인해주세요.');}}
async function closeEditor(){if(saving)return toast('저장을 마치는 중입니다. 잠시만 기다려주세요.');if((dirty||arresterChanged())&&!await ask('저장하지 않고 닫기','입력한 변경 내용은 저장되지 않습니다.','닫기'))return;$('editor').close();}
$('closeEditor').onclick=closeEditor;$('editor').addEventListener('cancel',e=>{e.preventDefault();void closeEditor();});$('recordForm').oninput=e=>{if(e.target.closest('#arresterFields'))return;dirty=true;preview();};
$('recordForm').onsubmit=async e=>{e.preventDefault();if(processing)return toast('사진을 처리하는 중입니다. 잠시만 기다려주세요.');if(saving)return;if(arresterChanged())return toast('피뢰기 위치를 먼저 저장해주세요.');const choice=$('choiceInput').value,balls=readBallInput(),ballCount=balls.ballCount;if(part==='항공구'&&(!Number.isInteger(ballCount)||ballCount<0||ballCount>100))return toast('항공구 총수는 0~100개로 입력해주세요.');if(part==='항공구'&&balls.ballCircuits&&!M.validBallCircuits(balls.ballCircuits,ballCount))return toast('각 회선의 개수와 색상을 확인해주세요.');if(!['애자련','항공등'].includes(part)&&M.CHOICES[part]&&!M.CHOICES[part].includes(choice))return toast('항목을 선택해주세요.');const insulatorType=selected('insulatorType'),stringCount=Number(selected('stringCount')),groundWires=readGround();if(part==='애자련'&&(!['내장','현수'].includes(insulatorType)||![1,2].includes(stringCount)))return toast('애자련 형태와 1련·2련을 선택해주세요.');if(part==='가공지선'&&!M.validGround(groundWires))return toast('가공지선 조수와 종류를 선택해주세요.');if(part==='철탑 기본정보'&&!readTower().towerType&&!readTower().towerHeight&&!readTower().nationalPointPlate&&!readTower().towerNumberPlate&&!readTower().towerCircuitCount)return toast('철탑 기본정보를 한 항목 이상 입력해주세요.');if(part==='철탑 기본정보'){const {pairedLines}=readTower();if(pairedLines?.upper&&pairedLines.upper===pairedLines.lower)return toast('상부와 하부에 서로 다른 선로명을 입력해주세요.');}const lampUnits=readLamps(),insulatorYear=Number($('insulatorYear').value)||undefined,insulatorDiscs=Number($('insulatorDiscs').value)||undefined;const record={id:crypto.randomUUID(),lineId,tower,part,...(M.sharedPart(part)?{}:{circuit}),status:'등록',note:$('noteInput').value.trim(),land:part==='부지'?[...$('landOptions').querySelectorAll('input:checked')].map(x=>x.value):[],photos:[...photos],createdAt:new Date().toISOString(),...(part==='항공구'?balls:part==='항공등'?{lampUnits}:part==='애자련'?{insulatorType,stringCount,insulatorYear,insulatorDiscs}:part==='지형'?{terrain:choice}:part==='피뢰기'?{arresterCircuit:choice}:part==='가공지선'?{groundWires}:part==='철탑 기본정보'?readTower():{})};if(!await confirmSave(line().name+(M.sharedPart(part)?'':' #'+circuit)+' / '+tower+'호 / '+equipmentName(part)+' / '+M.label(record)))return;saving=true;$('saveRecord').disabled=true;try{await transaction('records','readwrite',tx=>tx.objectStore('records').add(record));records.push(record);dirty=false;$('editor').close();render();toast('관리대장에 저장했습니다.');navigator.storage?.persist?.().catch(()=>{});}catch(err){toast('저장하지 못했습니다. 저장 공간을 확인해주세요.');}finally{saving=false;$('saveRecord').disabled=false;}};
$('back').onclick=()=>show('listView');$('linesBack').onclick=()=>show('linesView');$('search').oninput=render;$('settingsBtn').onclick=()=>{if(current!=='settingsView')previous=current;show('settingsView');};$('settingsBack').onclick=()=>show(previous);
$('appVersion').textContent='v'+APP_VERSION;$('updateBtn').onclick=async()=>{const button=$('updateBtn'),status=$('updateStatus');button.disabled=true;status.textContent='최신 버전을 확인하는 중입니다.';try{const response=await fetch('version.json?check='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error();const latestVersion=Number((await response.json()).version);if(!Number.isInteger(latestVersion))throw Error();if(latestVersion>APP_VERSION){status.textContent='새 버전을 불러옵니다.';const url=new URL(location.href);url.searchParams.set('appVersion',latestVersion);location.replace(url);}else status.textContent='현재 최신 버전입니다.';}catch{status.textContent='버전을 확인하지 못했습니다. 인터넷 연결을 확인해주세요.';}finally{button.disabled=false;}};
$('exportBtn').onclick=()=>{const data={format:'tower-ledger',version:5,exportedAt:new Date().toISOString(),lines:M.LINES,records,circuitLayouts};const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='철탑대장-전체선로-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);$('backupStatus').textContent='두 선로 전체 백업을 요청했습니다. 파일 앱에서 저장 여부를 확인하세요.';};
$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());const incoming=M.validate(data);if(data.version<3&&!await ask('이전 백업 불러오기','이전 버전 백업은 345KV 신남원-의령에 연결됩니다.','계속'))return;const ids=new Set(records.map(r=>r.id)),add=incoming.filter(r=>!ids.has(r.id));if(!await confirmSave(add.length+'개 기록을 각 선로에 추가 (기존 기록 유지)'))return;const layouts={...validatedLayouts(data.circuitLayouts),...circuitLayouts};await transaction(['records','meta'],'readwrite',tx=>{add.forEach(r=>tx.objectStore('records').add(r));tx.objectStore('meta').put({key:'circuitLayouts',value:layouts});});await reload();toast(add.length+'개 기록을 불러왔습니다.');}catch(err){toast('불러오기 실패: '+err.message);}finally{e.target.value='';}};
window.addEventListener('beforeunload',e=>{if(dirty&&$('editor').open){e.preventDefault();e.returnValue='';}});
(async()=>{try{const open=indexedDB.open('tower-ledger-v1',1);open.onupgradeneeded=()=>{open.result.createObjectStore('records',{keyPath:'id'});open.result.createObjectStore('meta',{keyPath:'key'});};db=await req(open);await reload();}catch(err){toast('저장소를 열 수 없습니다. Safari 일반 모드에서 다시 열어주세요.');document.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);}})();
function renderPhotos(){$('photoStatus').textContent='현재 사진 '+photos.length+'/8장';$('photoPreview').replaceChildren();photos.forEach((src,i)=>{const box=document.createElement('div');box.className='photoitem';const img=document.createElement('img');img.src=src;img.alt='첨부 사진 '+(i+1);img.loading='lazy';const b=document.createElement('button');b.type='button';b.textContent='삭제';b.onclick=()=>{photos.splice(i,1);dirty=true;renderPhotos();};box.append(img,b);$('photoPreview').append(box);});}
function compress(file){return new Promise((resolve,reject)=>{if(!file.type.startsWith('image/'))return reject(new Error('이미지 파일을 선택해주세요.'));const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{try{const scale=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.8));}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}};im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('사진을 읽지 못했습니다. JPEG 사진으로 다시 선택해주세요.'));};im.src=url;});}
async function addPhotos(event){if(processing)return;processing++;$('saveRecord').disabled=true;try{const files=[...event.target.files];if(files.length+photos.length>8)throw new Error('한 기록에는 사진을 최대 8장 넣을 수 있습니다.');for(const file of files){const photo=await compress(file);if(!photos.includes(photo)){photos.push(photo);dirty=true;}}renderPhotos();}catch(e){renderPhotos();toast(e.message);}finally{event.target.value='';processing--;$('saveRecord').disabled=false;}}

$('camera').onchange=addPhotos;$('gallery').onchange=addPhotos;

function selected(name){return document.querySelector('[name="'+name+'"]:checked')?.value||'';}
function readGround(){const count=Number(selected('groundCount'));return {count,direction:'1호→2호 정방향',...(count===1?{position:'중앙',single:$('groundSingle').value}:count===2?{left:$('groundLeft').value,right:$('groundRight').value}:{})};}
function groundVisibility(){$('singleGround').hidden=selected('groundCount')!=='1';$('doubleGround').hidden=selected('groundCount')!=='2';}
function fillGround(g){document.querySelectorAll('[name="groundCount"]').forEach(el=>el.checked=el.value===String(g?.count??2));$('groundSingle').value=g?.single||'';$('groundLeft').value=g?.left||'';$('groundRight').value=g?.right||'';groundVisibility();}
document.querySelector('[data-ground="single"]').onclick=()=>{fillGround({count:1,single:'OPGW'});dirty=true;preview();};

function readLamps(){return Object.fromEntries(M.LAMP_KEYS.map(key=>[key,$(key).value]));}

function towerSceneState(){return {...M.scene(scopedRecords(),lineId,tower),circuitOneSide:circuitLayouts[lineId]};}
function scopedRecords(){return records.filter(r=>M.sharedPart(r.part)||r.circuit===undefined||r.circuit===circuit);}
function readTower(){return {towerType:$('towerType').value.trim(),towerHeight:Number($('towerHeight').value)||undefined,nationalPointPlate:$('nationalPointPlate').value||undefined,towerNumberPlate:$('towerNumberPlate').value||'미확인',towerCircuitCount:Number($('towerCircuitCount').value)||undefined,pairedLines:readPairedLines()};}
const detailedScene=TowerScene.mount($('largeScene'));
$('enlargeScene').onclick=()=>{const state=towerSceneState();$('detailTitle').textContent=line().name+' · '+tower+'호 철탑';detailedScene.update(state);$('detailSummary').textContent=summary(state);$('detailScene').showModal();};
$('closeDetail').onclick=()=>$('detailScene').close();

function validatedLayouts(value){
  return Object.fromEntries(M.LINES.filter(line=>['left','right'].includes(value?.[line.id])).map(line=>[line.id,value[line.id]]));
}
function layoutLabel(){
  const side=circuitLayouts[lineId];
  if(!side)return '회선 좌우 배치 미지정';
  return side==='left'?'좌측 #1 · 우측 #2':'좌측 #2 · 우측 #1';
}
function oppositeCircuit(side){return side==='left'?'#2':side==='right'?'#1':'—';}
$('leftCircuit').onchange=()=>{const side=$('leftCircuit').value;$('rightCircuit').textContent=oppositeCircuit(side);if(side)saveLayout(side);else render();};
async function saveLayout(side){
  if(circuitLayouts[lineId]===side)return;
  if(!db)return toast('저장소를 여는 중입니다.');
  const selectedLine=lineId;
  $('leftCircuit').disabled=true;
  try{
    const updated={...circuitLayouts,[selectedLine]:side};
    await transaction('meta','readwrite',tx=>tx.objectStore('meta').put({key:'circuitLayouts',value:updated}));
    circuitLayouts=updated;
    render();
    toast('해당 선로의 모든 철탑에 회선 배치를 적용했습니다.');
  }catch{
    render();
    toast('회선 배치를 저장하지 못했습니다.');
  }finally{
    $('leftCircuit').disabled=false;
  }
}

function renderParts(){
  const list=$('partList');
  list.replaceChildren();
  const groups=[
    ['기본정보',['철탑 기본정보']],
    ['설비',['가공지선','애자련','항공구','항공등']],
    ['주변 환경',['지형','부지']]
  ];
  for(const [title,parts] of groups){
    const section=document.createElement('section');
    section.className='equipmentSection';
    const heading=document.createElement('h3');
    heading.textContent=title;
    const grid=document.createElement('div');
    grid.className='equipmentGrid';
    for(const name of parts)grid.append(equipmentButton(name,equipmentName(name),latest(name)));
    section.append(heading,grid);
    list.append(section);
  }
}
function equipmentButton(name,title,record,number){
  const button=document.createElement('button');
  button.type='button';
  button.className='partrow';
  const heading=document.createElement('span');
  heading.textContent=title;
  const date=document.createElement('small');
  date.textContent=record?stamp(record.createdAt):'아직 등록하지 않았습니다';
  heading.append(date);
  const value=document.createElement('span');
  value.className='value';
  value.textContent=M.label(record)+' ›';
  button.append(heading,value);
  button.onclick=()=>{if(number)circuit=number;openEditor(name);};
  return button;
}

function arresterSelection(){
  return [1,2].filter(number=>$('arrester'+number).checked).map(number=>'#'+number);
}
function arresterChanged(){
  return part==='애자련'&&arresterSelection().join()!==M.arresterLocations(latest('피뢰기')).join();
}
function renderArresterEditor(name){
  $('insulatorCircuits').hidden=name!=='애자련';
  const record=latest('피뢰기');
  const locations=M.arresterLocations(record);
  for(const number of [1,2])$('arrester'+number).checked=locations.includes('#'+number);
  $('arresterSummary').textContent=record?'저장된 위치 '+M.label(record):'저장된 위치 없음';
}
$('saveArrester').onclick=async()=>{
  if(saving||processing)return;
  const previousRecord=latest('피뢰기');
  const arresterCircuits=arresterSelection();
  const record={
    id:crypto.randomUUID(),lineId,tower,part:'피뢰기',arresterCircuits,status:'등록',
    note:previousRecord?.note||'',photos:previousRecord?.photos||[],land:[],
    createdAt:new Date().toISOString()
  };
  if(!await confirmSave(line().name+' / '+tower+'호 / 피뢰기 / '+M.label(record)))return;
  saving=true;
  $('saveArrester').disabled=true;
  try{
    await transaction('records','readwrite',tx=>tx.objectStore('records').add(record));
    records.push(record);
    renderArresterEditor('애자련');
    toast('피뢰기 위치를 저장했습니다.');
  }catch{
    toast('피뢰기 위치를 저장하지 못했습니다.');
  }finally{
    saving=false;
    $('saveArrester').disabled=false;
  }
};

function openTower(number){
  tower=number;
  mainScene.reset();
  show('towerView');
}
$('towerJump').onsubmit=event=>{
  event.preventDefault();
  const value=$('search').value.trim();
  const number=Number(value);
  if(!/^\d+$/.test(value)||number<1||number>line().count){
    toast('1~'+line().count+' 사이의 철탑 번호를 입력해주세요.');
    return;
  }
  $('search').blur();
  openTower(number);
};

function fillBallFields(name,record){
  const split=name==='항공구';
  $('ballCircuitFields').hidden=!split;
  for(const number of [1,2]){
    const entry=record?.ballCircuits?.[number-1];
    const count=$('ballCount'+number);
    const color=$('ballColor'+number);
    count.disabled=color.disabled=!split;
    count.required=split;
    count.value=entry?.count??'';
    color.value=entry?.color??'';
  }
}
function readBallInput(){
  const ballCircuits=[1,2].map(number=>({
    count:Number($('ballCount'+number).value),
    color:$('ballColor'+number).value
  }));
  return {ballCount:ballCircuits.reduce((sum,entry)=>sum+entry.count,0),ballCircuits};
}
function updateBallTotal(){
  if($('ballCircuitFields').hidden)return;
  const previous=latest('항공구');
  const empty=[1,2].some(number=>$('ballCount'+number).value==='');
  $('ballCircuitTotal').textContent=empty&&previous&&!previous.ballCircuits
    ?'기존 총수 '+previous.ballCount+'개 · 회선별 개수를 입력해주세요.'
    :'합계 '+readBallInput().ballCount+'개 (최대 100개)';
}

function equipmentName(part){return part==='항공등'?'항공장애등':part;}


function readPairedLines(){
  if($('towerCircuitCount').value!=='4')return undefined;
  return {upper:$('upperPairedLine').value.trim(),lower:$('lowerPairedLine').value.trim()};
}
function updatePairedLineFields(){
  const enabled=part==='철탑 기본정보'&&$('towerCircuitCount').value==='4';
  $('pairedLineFields').hidden=!enabled;
  $('pairedLineFields').disabled=!enabled;
}
function fillPairedLineFields(name,record){
  $('upperPairedLine').value=record?.pairedLines?.upper||'';
  $('lowerPairedLine').value=record?.pairedLines?.lower||'';
  if(name==='철탑 기본정보'){
    $('pairedLineNames').replaceChildren(...M.LINES.map(item=>new Option(item.name,item.name)));
    for(const id of ['upperPairedLine','lowerPairedLine'])$(id).placeholder='예: '+line().name;
  }
  updatePairedLineFields();
}
