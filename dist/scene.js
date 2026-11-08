/* Front-oriented illustrative elevation, not a site-specific engineering drawing. */
(function(root){
let seq=0;
function diagram(s,id='tower'){
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const installedLamp=intensity=>['고광도','중광도','저광도'].includes(intensity);
let x='<svg viewBox="0 0 640 570" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="철탑 입체 개념도"><defs><linearGradient id="'+id+'-sky" x1="0" y1="0" x2="0" y2="100%"><stop stop-color="#3d5971"/><stop offset="1" stop-color="#8096a7"/></linearGradient><linearGradient id="'+id+'-steel"><stop stop-color="#486777"/><stop offset=".5" stop-color="#9eb6bf"/><stop offset="1" stop-color="#405e6b"/></linearGradient><linearGradient id="'+id+'-glass"><stop stop-color="#e5f3ed"/><stop offset=".45" stop-color="#72a99a"/><stop offset="1" stop-color="#366a61"/></linearGradient></defs><rect width="640" height="570" rx="20" fill="url(#'+id+'-sky)"/>';
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
x+='<ellipse cx="320" cy="529" rx="117" ry="13" fill="#365160" opacity=".09"/>';
// The front attachment points stay fixed so left and right remain easy to compare.
const levels=[[512,92],[433,72],[352,51],[274,34],[201,23],[145,15],[111,8]];
const front=([y,w],side)=>[320+side*w,y];
const rear=([y,w],side)=>[320+side*w*.76+13+w*.28,y-5-w*.20];
const point=([px,py])=>px.toFixed(1)+' '+py.toFixed(1);
const segment=(from,to,color,width)=>path('M'+point(from)+' L'+point(to),color,width);
const face=(vertices,color)=>path('M'+vertices.map(point).join(' L')+' Z','none',0,color);
for(const side of [-1,1]){
  const [footX,footY]=rear(levels[0],side);
  face([[footX-13,footY+2],[footX+5,footY-4],[footX+18,footY+1],[footX,footY+8]],'#a9babd');
  face([[footX-13,footY+2],[footX,footY+8],[footX,footY+16],[footX-13,footY+11]],'#81969b');
}
for(let i=0;i<levels.length-1;i++){
  const lower=levels[i],upper=levels[i+1];
  face([front(lower,1),rear(lower,1),rear(upper,1),front(upper,1)],'#d5e2e6');
  for(const side of [-1,1]){
    segment(rear(lower,side),rear(upper,side),'#8ca4ae',3);
    segment(rear(lower,side),rear(upper,-side),'#b5c8ce',1.6);
    segment(front(lower,side),rear(lower,side),'#78939e',2.5);
    segment(front(lower,side),rear(upper,side),'#7f9ba5',2);
  }
  segment(rear(lower,-1),rear(lower,1),'#9eb4bc',1.8);
  for(const side of [-1,1]){
    segment(front(lower,side),front(upper,-side),'#6d8d9a',2.2);
    segment(front(lower,side),front(upper,side),'url(#'+id+'-steel)',6);
  }
  segment(front(lower,-1),front(lower,1),'#627f8d',2.6);
}
segment(front(levels.at(-1),-1),front(levels.at(-1),1),'#526f7e',5);
for(const [y,w] of [[208,122],[288,137],[370,151]]){
  const left=[320-w,y],right=[320+w,y],peak=[320,y-23];
  const backLeft=[left[0]+18,y-12],backRight=[right[0]+18,y-12],backPeak=[338,y-35];
  face([left,backLeft,backPeak,peak],'#e4edf0');
  face([peak,backPeak,backRight,right],'#c6d8df');
  segment(backLeft,backRight,'#8ca6b2',2.5);
  path('M'+point(left)+' L'+point(peak)+' L'+point(right)+' Z','#627f8e',3.2,'#dce7e9');
  for(const offset of [-.55,0,.55]){
    const base=[320+w*offset,y];
    segment(base,[320+w*(offset+.23),y-23*(1-Math.abs(offset+.23))],'#829fab',2);
  }
  segment(left,right,'#4c6e7e',4);
  for(const tip of [left,right])circle(tip[0],tip[1],3,'#3e5d6d');
}
path('M280 163 L268 93 L305 145 M360 163 L372 93 L335 145','#7897a4',4);
for(const xx of [228,412]){x+='<rect x="'+(xx-13)+'" y="510" width="26" height="15" rx="2" fill="#93a5a8"/>';}
const g=s.groundWires;const slots=g?(g.count===1?[[320,g.single,'중앙']]:[[268,g.left,'좌'],[372,g.right,'우']]):[];
for(const [xx,type,pos] of slots){const c=type==='OPGW'?'#387d9e':'#8d7862';path('M'+(xx-26)+' 62 L'+xx+' 93 L'+(xx+12)+' 119',c,3);circle(xx,93,5,c);text(xx<320?164:xx>320?476:320,81,pos+' '+type,c,22);}
if(!g)text(320,62,'가공지선 미등록','#8ca0a8',20);
const count=s.stringCount||0;
if(s.insulatorType&&count){for(const [y,w] of [[208,122],[288,137],[370,151]])for(const side of [-1,1]){const xx=320+side*w;for(let n=0;n<count;n++){const offset=count===2?(n?7:-7):0;const horizontal=s.insulatorType==='내장';const cx=xx+(horizontal?side*24:offset),cy=y+(horizontal?offset:25);x+='<g data-kind="insulator-string" transform="translate('+cx+' '+cy+') rotate('+(horizontal?90:0)+')">';path('M0 -24 V24','#58777c',2.5);for(let j=-18;j<=18;j+=6)x+='<ellipse cx="0" cy="'+j+'" rx="8" ry="2.7" fill="url(#'+id+'-glass)" stroke="#4f8579" stroke-width=".8"/>';x+='</g>';}
const ex=xx+(s.insulatorType==='내장'?side*49:0),ey=y+(s.insulatorType==='현수'?51:0);circle(ex,ey,4,'#45616d');path('M'+ex+' '+ey+' l'+side*25+' 8','#93a7af',2);}}
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
x+='</svg>';return x;
}
function mount(el){const id='elevation-'+(++seq);return {update(s){el.innerHTML=diagram(s,id);el.setAttribute('aria-label','정방향 철탑 개념도. '+(s.insulatorType||'애자련 미등록')+' '+(s.stringCount?s.stringCount+'련':'')+' / '+(s.terrain||'지형 미등록'));},reset(){}};}
if(typeof module!=='undefined')module.exports={diagram};else root.TowerScene={mount};
})(globalThis);
