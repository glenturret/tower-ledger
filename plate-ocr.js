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
let scriptPromise;
function load(){
  if(root.Tesseract)return Promise.resolve();
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=new URL('ocr/tesseract.min.js',document.baseURI).href;
    script.onload=resolve;script.onerror=()=>{script.remove();scriptPromise=undefined;reject(Error('인식 도구를 불러오지 못했습니다. 다시 시도해주세요.'));};document.head.append(script);
  });
  return scriptPromise;
}
async function recognize(photo,onProgress=()=>{}){
  let worker,phase='engine';
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
    const first=analyze((await worker.recognize(photo,{}, {text:true,blocks:true})).data);
    if(first.towerType&&first.towerHeight&&score(first)>=65)return first;
    onProgress('B2-30m 같은 번호찰 표기를 중심으로 다시 읽는 중…');
    await worker.reinitialize('eng',1);
    await worker.setParameters({tessedit_pageseg_mode:'11',tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-:/ '});
    const second=analyze((await worker.recognize(photo,{}, {text:true,blocks:true})).data);
    const rank=result=>(result.towerType?100:0)+(result.towerHeight?100:0)+score(result);
    return rank(second)>rank(first)?{...second,towerNumber:second.towerNumber??first.towerNumber}:first;
  }catch(cause){
    const error=new Error(phase==='engine'?'사진 인식 도구를 시작하지 못했습니다.':'사진에서 글자를 추출하지 못했습니다.');
    error.code=phase==='engine'?'OCR_ENGINE':'OCR_IMAGE';throw error;
  }finally{if(worker)await worker.terminate().catch(()=>{});}
}
const api={parse,compactPair,compactConfidence,recognize};
if(typeof module!=='undefined')module.exports=api;else root.PlateOCR=api;
})(globalThis);
