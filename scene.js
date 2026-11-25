/* Front-oriented illustrative elevation, not a site-specific engineering drawing. */
(function(root){
let seq=0;
function lineKey(name){
  return (name||'').trim().replace(/^\d+\s*kV\s*/i,'').replace(/[\s\u2010-\u2014\u2212-]/g,'').toLowerCase();
}
function activePosition(s){
  if(s.towerCircuitCount!==4)return;
  const key=lineKey(s.activeLineName);
  const matches=['upper','lower'].filter(position=>key&&lineKey(s.pairedLines?.[position])===key);
  if(matches.length===1)return matches[0];
}
function diagram(s,id='tower'){
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const installedLamp=intensity=>['고광도','중광도','저광도'].includes(intensity);
let x='<svg viewBox="0 0 640 570" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="철탑 입체 개념도"><defs><linearGradient id="'+id+'-sky" x1="0" y1="0" x2="0" y2="100%"><stop stop-color="#3d5971"/><stop offset="1" stop-color="#8096a7"/></linearGradient><linearGradient id="'+id+'-steel"><stop stop-color="#486777"/><stop offset=".5" stop-color="#9eb6bf"/><stop offset="1" stop-color="#405e6b"/></linearGradient><linearGradient id="'+id+'-glass"><stop stop-color="#e5f3ed"/><stop offset=".45" stop-color="#72a99a"/><stop offset="1" stop-color="#366a61"/></linearGradient></defs><rect width="640" height="570" rx="20" fill="url(#'+id+'-sky)"/>';
// Soft daylight and galvanized steel retain contrast at phone sizes.
x=x.replace('#3d5971','#b4cddd').replace('#8096a7','#e8eff1').replace('#486777','#526773').replace('#9eb6bf','#eef4f6').replace('#405e6b','#718894');
x+='<g fill="#fff" opacity=".18"><ellipse cx="100" cy="105" rx="112" ry="25"/><ellipse cx="521" cy="167" rx="135" ry="19"/></g>';
const path=(d,c,w=2,fill='none')=>{x+='<path d="'+d+'" stroke="'+c+'" stroke-width="'+w+'" fill="'+fill+'" stroke-linecap="round" stroke-linejoin="round"/>';};
const text=(xx,y,t,c='#536c77',size=20)=>{x+='<text x="'+xx+'" y="'+y+'" text-anchor="middle" fill="'+c+'" font-size="'+size+'" font-family="system-ui,sans-serif">'+esc(t)+'</text>';};
const circle=(xx,y,r,c,cls='')=>{x+='<circle '+(cls?'class="'+cls+'"':'')+' cx="'+xx+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';};
if(s.terrain==='산악지'){path('M0 490 L65 380 L125 446 L190 351 L290 490Z','none',0,'#dce9e2');path('M410 490 L480 375 L550 433 L596 368 L640 440 V540 H0 V500Z','none',0,'#c4dbcc');for(const xx of [45,92,540,590]){path('M'+xx+' 481 v30','#728d7e',3);path('M'+(xx-17)+' 485 L'+xx+' 446 L'+(xx+17)+' 485Z','none',0,'#83aa91');}}
else if(s.terrain==='논'){path('M0 480 H640 V570 H0Z','none',0,'#dce6c9');for(let y=495;y<565;y+=19)path('M0 '+y+' H640','#aec29b',2);for(let xx=-100;xx<800;xx+=110)path('M320 470 L'+xx+' 570','#f7f5db',5);}
else if(s.terrain==='비닐하우스단지'){
  path('M0 491 Q320 478 640 491 V570 H0Z','none',0,'#b1c79d');
  for(const [left,top,width] of [[15,480,58],[82,490,64],[156,503,57],[430,494,58],[497,482,64],[570,495,56]]){
    const floor=top+29;
    path('M'+left+' '+floor+' V'+(top+15)+' Q'+(left+width/2)+' '+(top-11)+' '+(left+width)+' '+(top+15)+' V'+floor+' Z','#789597',1.6,'#eaf4ed');
    for(const offset of [width*.28,width*.55,width*.8])path('M'+(left+offset)+' '+floor+' V'+(top+10),'#b7cdca',1.2);
  }
}
else if(s.terrain==='도심지'){for(const [xx,y,w] of [[25,410,65],[105,441,40],[485,420,55],[556,390,65]]){x+='<rect x="'+xx+'" y="'+y+'" width="'+w+'" height="'+(515-y)+'" rx="3" fill="#d1dee2"/>';for(let yy=y+14;yy<500;yy+=18)for(let a=xx+10;a<xx+w-6;a+=16)x+='<rect x="'+a+'" y="'+yy+'" width="6" height="8" fill="#9ab2bd"/>';}path('M0 524 H640','#b3c5cb',24);path('M0 524 H640','#f9fbf9',2);}
else path('M0 515 Q320 495 640 515 V570 H0Z','none',0,'#e4ece6');
x+='<ellipse cx="350" cy="527" rx="134" ry="17" fill="#365160" opacity=".16"/>';
// The front attachment points stay fixed so left and right remain easy to compare.
const levels=[[512,92],[433,72],[352,51],[274,34],[201,23],[145,15],[111,8]];
const front=([y,w],side)=>[320+side*w,y];
const rear=([y,w],side)=>[320+side*w*.76+13+w*.28,y-5-w*.20];
const point=([px,py])=>px.toFixed(1)+' '+py.toFixed(1);
const segment=(from,to,color,width)=>path('M'+point(from)+' L'+point(to),color,width);
const face=(vertices,color)=>path('M'+vertices.map(point).join(' L')+' Z','none',0,color);
function foundation([xx,yy]){
  x+='<g data-kind="concrete-foundation">';
  face([[xx-15,yy],[xx+6,yy-8],[xx+23,yy-1],[xx+1,yy+8]],'#e0e3df');
  face([[xx-15,yy],[xx+1,yy+8],[xx+1,yy+22],[xx-15,yy+13]],'#8f9d9f');
  face([[xx+1,yy+8],[xx+23,yy-1],[xx+23,yy+13],[xx+1,yy+22]],'#b2bebd');
  path('M'+(xx-8)+' '+(yy-1)+' l15 2','#576b76',3);
  for(const dx of [-5,7])circle(xx+dx,yy,1.6,'#eef2ef');
  x+='</g>';
}
for(const side of [-1,1]){
  foundation(rear(levels[0],side));
}
for(let i=0;i<levels.length-1;i++){
  const lower=levels[i],upper=levels[i+1];
  // Open lattice: both faces and the opposite legs remain visible.
  for(const side of [-1,1]){
    segment(rear(lower,side),rear(upper,side),'#8ca4ae',3);
    segment(rear(lower,side),rear(upper,-side),'#b5c8ce',1.6);
    segment(front(lower,side),rear(lower,side),'#78939e',2.5);
    segment(front(lower,side),rear(upper,side),'#7f9ba5',2);
  }
  segment(rear(lower,-1),rear(lower,1),'#9eb4bc',1.8);
  const middle=[(lower[0]+upper[0])/2,(lower[1]+upper[1])/2];
  segment(front(middle,-1),front(middle,1),'#91a4ae',1.5);
  for(const side of [-1,1]){
    segment(front(lower,side),front(upper,-side),'#536d7b',2.8);
    const a=front(lower,side),b=front(upper,-side);
    segment([a[0]+.7,a[1]-1],[b[0]+.7,b[1]-1],'#cad7dc',.8);
    segment(front(lower,side),front(upper,side),'#4d626e',6);
    segment([a[0]-1,a[1]],front(upper,side),'url(#'+id+'-steel)',3.5);
    const mid=front(middle,side);
    segment(mid,[320,middle[0]+(lower[0]-upper[0])*.25],'#8298a3',1.2);
    face([[a[0]-4,a[1]-7],[a[0]+4,a[1]-7],[a[0]+5,a[1]+3],[a[0]-5,a[1]+3]],'#82949d');
    for(const dy of [-4,0])circle(a[0],a[1]+dy,1.1,'#e8eff2');
  }
  segment(front(lower,-1),front(lower,1),'#627f8d',2.6);
}
segment(front(levels.at(-1),-1),front(levels.at(-1),1),'#526f7e',5);
// Fixed access ladder and small attachment plates on the tower body.
path('M314 501 L317 151 M322 501 L323 151','#667e8b',1.4);
for(let y=158;y<502;y+=9)path('M317 '+y+' H322','#d6e2e7',1.1);
const fourCircuits=s.towerCircuitCount===4;
const armLevels=fourCircuits?[[153,100],[199,108],[245,117],[300,137],[346,146],[392,155]]:[[190,113],[267,133],[344,153]];
const armDepth=fourCircuits?16:23;
const highlighted=activePosition(s);
if(highlighted){
  const top=highlighted==='upper'?119:266;
  x+='<rect data-highlight="'+highlighted+'" x="62" y="'+top+'" width="516" height="135" rx="13" fill="#493b22" fill-opacity=".25" stroke="#ffd477" stroke-width="2"/>';
}
function bodyHalfWidth(y){
  for(let i=0;i<levels.length-1;i++){
    const [low,wide]=levels[i], [high,narrow]=levels[i+1];
    if(y>=high&&y<=low)return narrow+(wide-narrow)*(y-high)/(low-high);
  }
  return levels.at(-1)[1];
}
for(const [i,[y,width]] of armLevels.entries()){
  const lit=highlighted===(i<3?'upper':'lower');
  x+='<g data-kind="crossarm-level">';
  for(const side of [-1,1]){
    const rootX=320+side*bodyHalfWidth(y);
    const tipX=320+side*width;
    const lower=t=>[rootX+(tipX-rootX)*t,y];
    const upper=t=>[rootX+(tipX-rootX)*t,y-armDepth+(armDepth-4)*t];
    const back=([xx,yy])=>[xx+10,yy-8];
    segment(back(lower(0)),back(lower(1)),'#9db7c5',2.3);
    segment(back(upper(0)),back(upper(1)),'#a8c0ca',2.3);
    for(let i=0;i<4;i++){
      const t=i/4,next=(i+1)/4;
      segment(back(lower(t)),back(upper(next)),'#85a5b6',1.4);
      segment(upper(t),back(upper(t)),'#b1c9d4',1.5);
      segment(lower(t),upper(t),'#789cac',1.7);
      segment(i%2?upper(t):lower(t),i%2?lower(next):upper(next),'#b7ced9',2.1);
    }
    segment(upper(0),upper(1),lit?'#ffe6a3':'#c2d5dd',lit?4:3.2);
    segment(lower(0),lower(1),lit?'#ffd477':'#abc4d0',lit?4.8:3.4);
    segment(upper(1),lower(1),'#89a9ba',2.3);
    segment(lower(1),back(lower(1)),'#b3cad6',2.3);
    circle(tipX,y,3.4,'#d3e3e9');
    for(const t of [0,.5,1]){
      const [bx,by]=lower(t);
      circle(bx,by,2.3,'#6d818b');circle(bx-.5,by-.7,.9,'#f5f8f9');
    }
  }
  x+='</g>';
}
if(fourCircuits){
  if(highlighted){
    const y=highlighted==='upper'?115:262;
    const name=s.activeLineName.replace(/^\d+\s*kV\s*/i,'');
    const label=highlighted==='upper'?'\uc0c1\ubd80':'\ud558\ubd80';
    x+='<rect x="62" y="'+(y-23)+'" width="216" height="30" rx="8" fill="#ffdc86"/>';
    text(170,y,label+' \u00b7 '+name,'#302410',23);
  }
  for(const [label,top,bottom] of [['상부',153,245],['하부',300,392]]){
    path('M56 '+top+' H45 V'+bottom+' H56','#d6e5ee',2);
    text(24,(top+bottom)/2+5,label,'#263f50',15);
  }
}
text(517,115,s.towerCircuitCount?s.towerCircuitCount+'회선':'2회선 예시','#263f50',19);
path('M280 163 L268 93 L305 145 M360 163 L372 93 L335 145','#7897a4',4);
for(const side of [-1,1]){
  const tip=side<0?268:372,base=side<0?280:360;
  path('M'+tip+' 93 L'+(tip+side*12)+' 106 L'+base+' 163','#647e8b',2);
  for(let n=0;n<4;n++){
    const y=111+n*11,xx=tip+(base-tip)*(y-93)/70;
    path('M'+(xx-5)+' '+y+' l10 7 M'+(xx+5)+' '+y+' l-10 7','#9fb3bd',1.4);
  }
  foundation(front(levels[0],side));
}
const g=s.groundWires;const slots=g?(g.count===1?[[320,g.single,'중앙']]:[[268,g.left,'좌'],[372,g.right,'우']]):[];
for(const [xx,type,pos] of slots){const c=type==='OPGW'?'#387d9e':'#8d7862';path('M'+(xx-26)+' 62 L'+xx+' 93 L'+(xx+12)+' 119',c,3);circle(xx,93,5,c);text(xx<320?164:xx>320?476:320,81,pos+' '+type,c,22);}
if(!g)text(320,62,'가공지선 미등록','#8ca0a8',20);
const count=s.stringCount||0;
const stringScale=fourCircuits?.68:1;
if(s.insulatorType&&count){for(const [y,w] of armLevels)for(const side of [-1,1]){const xx=320+side*w;for(let n=0;n<count;n++){const offset=count===2?(n?7:-7):0;const horizontal=s.insulatorType==='내장';const cx=xx+(horizontal?side*24*stringScale:offset),cy=y+(horizontal?offset:25*stringScale);x+='<g data-kind="insulator-string" transform="translate('+cx+' '+cy+') rotate('+(horizontal?90:0)+') scale('+stringScale+')">';path('M0 -24 V24','#58777c',2.5);for(let j=-18;j<=18;j+=6)x+='<ellipse cx="0" cy="'+j+'" rx="8" ry="2.7" fill="url(#'+id+'-glass)" stroke="#4f8579" stroke-width=".8"/>';x+='</g>';}
const ex=xx+(s.insulatorType==='내장'?side*49*stringScale:0),ey=y+(s.insulatorType==='현수'?51*stringScale:0);circle(ex,ey,4,'#45616d');
// Bundled phase conductors recede toward the edge with a natural sag.
for(const offset of [-2,2])path('M'+ex+' '+(ey+offset)+' Q'+(ex+side*60)+' '+(ey+30+offset)+' '+(side<0?0:640)+' '+(ey+13+offset),'#637e8d',1.1);
path('M'+(ex+side*25)+' '+(ey+9)+' v8','#8296a0',1.5);}}
function drawLamp(xx,y,intensity){
  const high=intensity==='고광도';
  circle(xx,y,high?15:intensity==='중광도'?10:8,high?'#415e75':'#fce4bd');
  circle(xx,y,high?8:5,high?'#ffffff':'#d86e56',high?'signal high-intensity':'signal');
}
// The rows show quantity by color. Their positions are schematic.
function drawMarkerRow(y,count,color){
  count=Math.min(100,Math.max(0,Math.floor(count)||0));
  path('M38 '+y+' Q320 '+(y+17)+' 602 '+y,'#a2b4bc',1.5);
  for(let i=0;i<count;i++){
    const t=(i+.5)/count;
    circle(38+564*t,y+34*t*(1-t),count>40?2.5:5,color||(i%2?'#ffffff':'#dc854a'),'marker-ball');
  }
}
if(s.ballCircuits||s.ballCount){
  for(const [index,y] of [[0,17],[1,41]]){
    const row=s.ballCircuits?.[index];
    const color=row?.color==='white'?'#ffffff':row?.color==='orange'?'#dc854a':'#a2b4bc';
    drawMarkerRow(y,row?.count??0,color);
    text(20,y+5,'#'+(index+1),'#536c77',14);
  }
  if(!s.ballCircuits)text(320,27,'기존 '+s.ballCount+'개 · 회선별 미지정','#536c77',16);
}
text(320,558,s.terrain||'지형 미등록','#5b786b',22);
// A and D are the near feet, B and C the far feet in the forward view.
const corners=[
  ['A',front(levels[0],-1),[195,545]],
  ['B',rear(levels[0],-1),[249,478]],
  ['C',rear(levels[0],1),[476,485]],
  ['D',front(levels[0],1),[451,545]]
];
for(const [name,foot,[labelX,labelY]] of corners){
  segment(foot,[labelX,labelY-8],'#d1e0e8',1.5);
  text(labelX,labelY,name,'#263f50',23);
}

// In this projection, the near lamp is lower and to the left of the far lamp.
const lampPositions=[
  ['upperSupply',307,115,'상부등 전원측'],
  ['upperLoad',333,99,'상부등 부하측'],
  ['lowerSupply',329,457,'하부등 전원측'],
  ['lowerLoad',360,437,'하부등 부하측']
];
if(s.lampUnits){
  for(const [key,xx,y,label] of lampPositions){
    const intensity=s.lampUnits[key];
    if(!installedLamp(intensity))continue;
    x+='<g aria-label="'+label+'"><title>'+label+'</title>';
    drawLamp(xx,y,intensity);
    x+='</g>';
  }
}else if(installedLamp(s.lightIntensity)){
  text(320,134,'기존 항공장애등 · 위치 미확인','#294559',16);
}
const oneSide=s.circuitOneSide;
if(['left','right'].includes(oneSide)&&(!fourCircuits||highlighted)){
  const y=fourCircuits?(highlighted==='upper'?199:346):267;
  for(const [side,cx] of [['left',105],['right',548]]){
    const number=side===oneSide?1:2;
    const sideLabel=side==='left'?'좌측':'우측';
    x+='<g data-circuit-side="'+side+'" aria-label="'+sideLabel+' #'+number+'">';
    x+='<rect x="'+(cx-31)+'" y="'+(y-21)+'" width="62" height="42" rx="10" fill="#243d51" stroke="#ffdc86" stroke-width="2"/>';
    text(cx,y+9,'#'+number,'#fff3ce',27);
    x+='</g>';
  }
}
const arresters=Array.isArray(s.arresterCircuits)?s.arresterCircuits.filter(value=>['#1','#2'].includes(value)):[];
if(arresters.length){
  const y=fourCircuits?(highlighted==='upper'?199:highlighted==='lower'?346:267):267;
  for(const circuit of arresters){
    const number=Number(circuit.slice(1));
    const side=['left','right'].includes(oneSide)?(number===1?oneSide:oneSide==='left'?'right':'left'):(number===1?'left':'right');
    const cx=side==='left'?218:422;
    x+='<g data-kind="surge-arrester" data-circuit="'+circuit+'" data-side="'+side+'" aria-label="'+circuit+' 피뢰기">';
    path('M'+cx+' '+(y-33)+' V'+(y+10),'#e27d2f',3);
    for(const offset of [-24,-14,-4,6])circle(cx,y+offset,5,'#f5a24f');
    path('M'+cx+' '+(y-33)+' l'+(side==='left'?-24:24)+' -13','#f0c07b',2);
    x+='<rect x="'+(cx-39)+'" y="'+(y+14)+'" width="78" height="27" rx="7" fill="#fff0d8" stroke="#d96f25" stroke-width="1.5"/>';
    text(cx,y+33,circuit+' 피뢰기','#6f3618',14);
    x+='</g>';
  }
  if(!['left','right'].includes(oneSide))text(320,y+60,'피뢰기 회선 좌우 배치 미지정','#66421e',14);
}
x+='</svg>';return x;
}
function mount(el){const id='elevation-'+(++seq);return {update(s){el.innerHTML=diagram(s,id);
  if(s.towerCircuitCount===4){
    const layout=document.createElement('div');
    layout.className='pairedLineKey';
    for(const [position,title] of [['upper','상부 2회선'],['lower','하부 2회선']]){
      const row=document.createElement('div');
      if(position===activePosition(s))row.className='current';
      const label=document.createElement('strong');
      label.textContent=title;
      const value=document.createElement('span');
      value.textContent=s.pairedLines?.[position]||'선로 미지정';
      row.append(label,value);
      layout.append(row);
    }
    el.append(layout);
  }
  el.setAttribute('aria-label','정방향 철탑 개념도. '+(s.insulatorType||'애자련 미등록')+' '+(s.stringCount?s.stringCount+'련':'')+' / '+(s.terrain||'지형 미등록'));},reset(){}};}
if(typeof module!=='undefined')module.exports={diagram};else root.TowerScene={mount};
})(globalThis);
