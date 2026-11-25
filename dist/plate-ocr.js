(function(root){
'use strict';
function compactPair(text){
  const normalized=String(text||'').normalize('NFKC').toUpperCase().replace(/[\u2010-\u2015\u2212]/g,'-');
  const pairs=[...normalized.matchAll(/(?:^|[^A-Z0-9])([A-Z]{1,3}\s*\d{1,2}[A-Z]?)\s*[-:/]\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:M\b|미터|RN\b)/g)]
    .map(m=>({towerType:m[1].replace(/\s/g,''),towerHeight:Number(m[2].replace(',','.'))}))
    .filter(pair=>pair.towerHeight>0&&pair.towerHeight<=999);
  const unique=new Map(pairs.map(pair=>[pair.towerType+':'+pair.towerHeight,pair]));
  return unique.size===1?[...unique.values()][0]:undefined;
}
function parse(text){
  text=String(text||'').normalize('NFKC');
  const upper=text.toUpperCase();
  const labeledType=upper.match(/(?:형\s*태|형\s*식|TYPE)\s*[:：=]?\s*([A-Z]{1,3}\s*-?\s*\d{0,2}[A-Z]?)(?![A-Z0-9])/);
  const types=[...upper.matchAll(/\b([A-Z]{1,3}\s*-?\s*\d{1,2}[A-Z]?)\b/g)].map(m=>m[1].replace(/\s/g,''));
  const uniqueTypes=[...new Set(types)];
  const pair=compactPair(text);
  const towerType=labeledType?labeledType[1].replace(/\s/g,''):pair?.towerType||(uniqueTypes.length===1?uniqueTypes[0]:undefined);
  const labeledHeight=text.match(/(?:높\s*이|HEIGHT)\s*[:：=]?\s*(\d{1,3}(?:[.,]\d{1,2})?)/i);
  const heights=[...text.matchAll(/\b(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:m\b|미터)/gi)].map(m=>Number(m[1].replace(',','.')));
  const uniqueHeights=[...new Set(heights)];
  const height=labeledHeight?Number(labeledHeight[1].replace(',','.')):pair?.towerHeight||(uniqueHeights.length===1?uniqueHeights[0]:undefined);
  const number=text.match(/(?:NO\.?|번\s*호)\s*[:：]?\s*(\d{1,3})\b/i)||text.match(/\b(\d{1,3})\s*호/);
  return {towerType,towerHeight:height>0&&height<=999?height:undefined,towerNumber:number?Number(number[1]):undefined};
}
function compactConfidence(data){
  const pair=compactPair(data.text),parsed=parse(data.text);
  if(!pair||pair.towerType!==parsed.towerType||pair.towerHeight!==parsed.towerHeight)return 0;
  let confidence=0;
  for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[]){
    const words=line.words||[];
    for(let start=0;start<words.length;start++)for(let size=1;size<=5&&start+size<=words.length;size++){
      const group=words.slice(start,start+size),found=compactPair(group.map(word=>word.text).join(' '));
      if(found?.towerType===pair.towerType&&found?.towerHeight===pair.towerHeight)confidence=Math.max(confidence,Math.min(...group.map(word=>Number(word.confidence)||0)));
    }
  }
  return confidence;
}
function analyze(data){
  const parsed=parse(data.text),pair=compactPair(data.text),focused=compactConfidence(data);
  const usePair=pair?.towerType===parsed.towerType&&pair?.towerHeight===parsed.towerHeight&&!!pair;
  return {...parsed,text:data.text,confidence:data.confidence,compactConfidence:focused,effectiveConfidence:pair?(usePair?focused:0):data.confidence};
}
const score=result=>result.effectiveConfidence??Math.max(result.confidence||0,result.compactConfidence||0);
function selectResult(results){
  const rank=result=>(result.towerType?100:0)+(result.towerHeight?100:0)+score(result);
  const best=results.reduce((a,b)=>rank(b)>rank(a)?b:a);
  const reliable=results.filter(result=>result.towerType&&result.towerHeight&&score(result)>=65);
  const pairs=new Set(reliable.map(result=>result.towerType+':'+result.towerHeight));
  const numbers=new Set(results.filter(result=>score(result)>=65&&result.towerNumber).map(result=>result.towerNumber));
  const ambiguous=pairs.size>1||numbers.size>1;
  return {...best,towerNumber:numbers.size===1?[...numbers][0]:best.towerNumber,ambiguous,
    effectiveConfidence:ambiguous?0:score(best),
    text:results.map((result,index)=>(result.method||'인식 '+(index+1))+'\n'+result.text).join('\n\n')};
}
async function prepareImages(photo){
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=photo;});
  const scale=Math.min(3,2352/Math.max(image.width,image.height)),width=Math.max(1,Math.round(image.width*scale)),height=Math.max(1,Math.round(image.height*scale));
  const contrast=document.createElement('canvas');contrast.width=width+48;contrast.height=height+48;
  const ctx=contrast.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,24,24,width,height);
  const frame=ctx.getImageData(24,24,width,height),pixels=frame.data,hist=new Uint32Array(256);
  let total=0;
  for(let i=0;i<pixels.length;i+=4){const gray=Math.round(pixels[i]*.299+pixels[i+1]*.587+pixels[i+2]*.114);hist[gray]++;total+=gray;}
  const count=width*height,invert=total/count<128;
  let low=0,high=255,sum=0;
  while(low<255&&(sum+=hist[low])<count*.01)low++;
  sum=0;while(high>low&&(sum+=hist[high])<count*.01)high--;
  const normalized=new Uint32Array(256);
  for(let i=0;i<pixels.length;i+=4){let value=Math.round(pixels[i]*.299+pixels[i+1]*.587+pixels[i+2]*.114);value=Math.round(Math.max(0,Math.min(255,(value-low)*255/Math.max(1,high-low))));if(invert)value=255-value;pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;normalized[value]++;}
  ctx.fillStyle='white';ctx.fillRect(0,0,contrast.width,contrast.height);ctx.putImageData(frame,24,24);
  // Otsu threshold separates faded letters from the plate background.
  let weighted=0;for(let i=0;i<256;i++)weighted+=i*normalized[i];
  let weight=0,mean=0,best=-1,threshold=128;
  for(let i=0;i<255;i++){weight+=normalized[i];if(!weight)continue;const remaining=count-weight;if(!remaining)break;mean+=i*normalized[i];const difference=mean/weight-(weighted-mean)/remaining;const variance=weight*remaining*difference*difference;if(variance>best){best=variance;threshold=i;}}
  const binary=document.createElement('canvas');binary.width=contrast.width;binary.height=contrast.height;
  const binaryContext=binary.getContext('2d');binaryContext.fillStyle='white';binaryContext.fillRect(0,0,binary.width,binary.height);
  for(let i=0;i<pixels.length;i+=4)pixels[i]=pixels[i+1]=pixels[i+2]=pixels[i]<=threshold?0:255;
  binaryContext.putImageData(frame,24,24);
  return {contrast,binary,release(){contrast.width=contrast.height=binary.width=binary.height=1;}};
}
let scriptPromise;
function load(){
  if(root.Tesseract)return Promise.resolve();
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=new URL('ocr/tesseract.min.js',document.baseURI).href;
    script.onload=resolve;script.onerror=()=>{script.remove();scriptPromise=undefined;reject(Error('인식 도구를 불러오지 못했습니다. 다시 시도해주세요.'));};document.head.append(script);
  });
  return scriptPromise;
}
async function recognize(photo,onProgress=()=>{},{precision=false}={}){
  let worker,prepared,phase='engine';
  try{
    await load();
    const base=new URL('ocr/',document.baseURI).href;
    worker=await root.Tesseract.createWorker(['kor','eng'],1,{
      workerPath:base+'worker.min.js',corePath:base+'tesseract-core-lstm.wasm.js',langPath:base,
      logger:message=>onProgress(message.status==='recognizing text'?'사진 읽는 중 · '+Math.round(message.progress*100)+'%':'사진 인식 준비 중…'),
      errorHandler:()=>{}
    });
    phase='image';
    await worker.setParameters({tessedit_pageseg_mode:'6'});
    const first={...analyze((await worker.recognize(photo,{}, {text:true,blocks:true})).data),method:'원본 사진'};
    if(!precision&&first.towerType&&first.towerHeight&&score(first)>=65)return selectResult([first]);
    onProgress('B2-30m 같은 번호찰 표기를 중심으로 다시 읽는 중…');
    await worker.reinitialize('eng',1);
    await worker.setParameters({tessedit_pageseg_mode:'11',tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-:/ '});
    const second={...analyze((await worker.recognize(photo,{}, {text:true,blocks:true})).data),method:'영문·숫자 중심'};
    const results=[first,second];
    if(!precision&&second.towerType&&second.towerHeight&&score(second)>=65)return selectResult(results);
    onProgress('작은 글자를 확대하고 명암을 보정하는 중…');
    prepared=await prepareImages(photo);
    await worker.setParameters({tessedit_pageseg_mode:'6'});
    results.push({...analyze((await worker.recognize(prepared.contrast,{}, {text:true,blocks:true})).data),method:'확대·명암 보정'});
    onProgress('글자와 배경을 분리해 한 번 더 확인하는 중…');
    await worker.setParameters({tessedit_pageseg_mode:'11'});
    results.push({...analyze((await worker.recognize(prepared.binary,{}, {text:true,blocks:true})).data),method:'배경 분리 보정'});
    return selectResult(results);
  }catch(cause){
    const error=new Error(phase==='engine'?'사진 인식 도구를 시작하지 못했습니다.':'사진에서 글자를 추출하지 못했습니다.');
    error.code=phase==='engine'?'OCR_ENGINE':'OCR_IMAGE';throw error;
  }finally{if(prepared)prepared.release();if(worker)await worker.terminate().catch(()=>{});}
}
const api={parse,compactPair,compactConfidence,selectResult,prepareImages,recognize};
if(typeof module!=='undefined')module.exports=api;else root.PlateOCR=api;
})(globalThis);
