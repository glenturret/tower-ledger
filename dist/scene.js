/* Front-oriented illustrative elevation, not a site-specific engineering drawing. */
(function(root){
let seq=0;
function diagram(s,id='tower'){
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let x='<svg viewBox="0 0 640 570" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="철탑 정면 개념도"><defs><linearGradient id="'+id+'-sky" x2="0" y2="1"><stop stop-color="#edf5f8"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient id="'+id+'-steel"><stop stop-color="#486777"/><stop offset=".5" stop-color="#9eb6bf"/><stop offset="1" stop-color="#405e6b"/></linearGradient><linearGradient id="'+id+'-glass"><stop stop-color="#e5f3ed"/><stop offset=".45" stop-color="#72a99a"/><stop offset="1" stop-color="#366a61"/></linearGradient></defs><rect width="640" height="570" rx="20" fill="url(#'+id+'-sky)"/>';
const path=(d,c,w=2,fill='none')=>{x+='<path d="'+d+'" stroke="'+c+'" stroke-width="'+w+'" fill="'+fill+'" stroke-linecap="round" stroke-linejoin="round"/>';};
const text=(xx,y,t,c='#536c77',size=20)=>{x+='<text x="'+xx+'" y="'+y+'" text-anchor="middle" fill="'+c+'" font-size="'+size+'" font-family="system-ui,sans-serif">'+esc(t)+'</text>';};
const circle=(xx,y,r,c,cls='')=>{x+='<circle '+(cls?'class="'+cls+'"':'')+' cx="'+xx+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';};
if(s.terrain==='산악지'){path('M0 490 L65 380 L125 446 L190 351 L290 490Z','none',0,'#dce9e2');path('M410 490 L480 375 L550 433 L596 368 L640 440 V540 H0 V500Z','none',0,'#c4dbcc');for(const xx of [45,92,540,590]){path('M'+xx+' 481 v30','#728d7e',3);path('M'+(xx-17)+' 485 L'+xx+' 446 L'+(xx+17)+' 485Z','none',0,'#83aa91');}}
else if(s.terrain==='논'){path('M0 480 H640 V570 H0Z','none',0,'#dce6c9');for(let y=495;y<565;y+=19)path('M0 '+y+' H640','#aec29b',2);for(let xx=-100;xx<800;xx+=110)path('M320 470 L'+xx+' 570','#f7f5db',5);}
else if(s.terrain==='도심지'){for(const [xx,y,w] of [[25,410,65],[105,441,40],[485,420,55],[556,390,65]]){x+='<rect x="'+xx+'" y="'+y+'" width="'+w+'" height="'+(515-y)+'" rx="3" fill="#d1dee2"/>';for(let yy=y+14;yy<500;yy+=18)for(let a=xx+10;a<xx+w-6;a+=16)x+='<rect x="'+a+'" y="'+yy+'" width="6" height="8" fill="#9ab2bd"/>';}path('M0 524 H640','#b3c5cb',24);path('M0 524 H640','#f9fbf9',2);}
else path('M0 515 Q320 495 640 515 V570 H0Z','none',0,'#e4ece6');
x+='<ellipse cx="320" cy="529" rx="117" ry="13" fill="#365160" opacity=".09"/>';
// A restrained offset rear frame gives depth without obstructing the front elevation.
path('M236 518 L296 155 L310 112 H330 L344 155 L404 518','#b7c9cf',4);
const levels=[[512,92],[433,72],[352,51],[274,34],[201,23],[145,15]];
for(let i=0;i<levels.length-1;i++){const [y,w]=levels[i],[yy,ww]=levels[i+1];path('M'+(320-w)+' '+y+' L'+(320+ww)+' '+yy+' M'+(320+w)+' '+y+' L'+(320-ww)+' '+yy,'#8ba5ae',2);path('M'+(320-w)+' '+y+' H'+(320+w),'#6f8d99',2.6);}
path('M228 512 L305 145 L312 111 H328 L335 145 L412 512','url(#'+id+'-steel)',6);path('M228 512 H412','#627f8d',4);
for(const [y,w] of [[208,122],[288,137],[370,151]]){path('M'+(320-w)+' '+y+' L320 '+(y-23)+' L'+(320+w)+' '+y+' Z','url(#'+id+'-steel)',4,'#dce7e9');path('M'+(320-w)+' '+y+' H'+(320+w),'#527381',4);}
path('M280 163 L268 93 L305 145 M360 163 L372 93 L335 145','#7897a4',4);
for(const xx of [228,412]){x+='<rect x="'+(xx-13)+'" y="510" width="26" height="15" rx="2" fill="#93a5a8"/>';}
const g=s.groundWires;const slots=g?(g.count===1?[[320,g.single,'중앙']]:[[268,g.left,'좌'],[372,g.right,'우']]):[];
for(const [xx,type,pos] of slots){const c=type==='OPGW'?'#387d9e':'#8d7862';path('M'+(xx-26)+' 62 L'+xx+' 93 L'+(xx+12)+' 119',c,3);circle(xx,93,5,c);text(xx<320?164:xx>320?476:320,81,pos+' '+type,c,22);}
if(!g)text(320,62,'가공지선 미등록','#8ca0a8',20);
const count=s.stringCount||0;
if(s.insulatorType&&count){for(const [y,w] of [[208,122],[288,137],[370,151]])for(const side of [-1,1]){const xx=320+side*w;for(let n=0;n<count;n++){const offset=count===2?(n?7:-7):0;const horizontal=s.insulatorType==='내장';const cx=xx+(horizontal?side*24:offset),cy=y+(horizontal?offset:25);x+='<g data-kind="insulator-string" transform="translate('+cx+' '+cy+') rotate('+(horizontal?90:0)+')">';path('M0 -24 V24','#58777c',2.5);for(let j=-18;j<=18;j+=6)x+='<ellipse cx="0" cy="'+j+'" rx="8" ry="2.7" fill="url(#'+id+'-glass)" stroke="#4f8579" stroke-width=".8"/>';x+='</g>';}
const ex=xx+(s.insulatorType==='내장'?side*49:0),ey=y+(s.insulatorType==='현수'?51:0);circle(ex,ey,4,'#45616d');path('M'+ex+' '+ey+' l'+side*25+' 8','#93a7af',2);}}
if(s.lampUnits){for(const [key,xx,y] of [['upperSupply',307,108],['upperLoad',333,108],['lowerSupply',307,195],['lowerLoad',333,195]]){const v=s.lampUnits[key];if(['고광도','중광도','저광도'].includes(v)){circle(xx,y,v==='고광도'?13:v==='중광도'?10:8,'#fce4bd');circle(xx,y,5,'#d86e56','signal');}}}else if(s.lightIntensity){circle(320,107,s.lightIntensity==='고광도'?17:12,'#fce4bd');circle(320,107,6,s.lightIntensity==='고광도'?'#eab64f':'#d86e56','signal');}
// Quantity strip intentionally does not assert actual marker-ball installation positions.
if(s.ballCount){path('M38 31 Q320 48 602 31','#a2b4bc',1.5);for(let i=0;i<s.ballCount;i++){const t=(i+.5)/s.ballCount;circle(38+564*t,31+34*t*(1-t),s.ballCount>40?2.5:5,i%2?'#e6c78c':'#dc854a','marker-ball');}}
text(320,558,s.terrain||'지형 미등록','#5b786b',22);
x+='</svg>';return x;
}
function mount(el){const id='elevation-'+(++seq);return {update(s){el.innerHTML=diagram(s,id);el.setAttribute('aria-label','정방향 철탑 개념도. '+(s.insulatorType||'애자련 미등록')+' '+(s.stringCount?s.stringCount+'련':'')+' / '+(s.terrain||'지형 미등록'));},reset(){}};}
if(typeof module!=='undefined')module.exports={diagram};else root.TowerScene={mount};
})(globalThis);
