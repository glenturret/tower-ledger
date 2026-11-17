(function(root){
'use strict';
function parse(text){
  text=String(text||'').normalize('NFKC');
  const upper=text.toUpperCase();
  const labeledType=upper.match(/(?:형\s*태|형\s*식|TYPE)\s*[:：=]?\s*([A-Z]{1,3}\s*-?\s*\d{0,2}[A-Z]?)(?![A-Z0-9])/);
  const types=[...upper.matchAll(/\b([A-Z]{1,3}\s*-?\s*\d{1,2}[A-Z]?)\b/g)].map(m=>m[1].replace(/\s/g,''));
  const uniqueTypes=[...new Set(types)];
  const towerType=labeledType?labeledType[1].replace(/\s/g,''):uniqueTypes.length===1?uniqueTypes[0]:undefined;
  const labeledHeight=text.match(/(?:높\s*이|HEIGHT)\s*[:：=]?\s*(\d{1,3}(?:[.,]\d{1,2})?)/i);
  const heights=[...text.matchAll(/\b(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:m\b|미터)/gi)].map(m=>Number(m[1].replace(',','.')));
  const uniqueHeights=[...new Set(heights)];
  const height=labeledHeight?Number(labeledHeight[1].replace(',','.')):uniqueHeights.length===1?uniqueHeights[0]:undefined;
  const number=text.match(/(?:NO\.?|번\s*호)\s*[:：]?\s*(\d{1,3})\b/i)||text.match(/\b(\d{1,3})\s*호/);
  return {towerType,towerHeight:height>0&&height<=999?height:undefined,towerNumber:number?Number(number[1]):undefined};
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
async function recognize(photo,onProgress=()=>{}){
  await load();
  let worker;
  try{
    const base=new URL('ocr/',document.baseURI).href;
    worker=await root.Tesseract.createWorker(['kor','eng'],1,{
      workerPath:base+'worker.min.js',corePath:base+'tesseract-core-lstm.wasm.js',langPath:base,
      logger:message=>onProgress(message.status==='recognizing text'?'사진 읽는 중 · '+Math.round(message.progress*100)+'%':'사진 인식 준비 중…'),
      errorHandler:()=>{}
    });
    await worker.setParameters({tessedit_pageseg_mode:'6'});
    const result=await worker.recognize(photo);
    return {...parse(result.data.text),text:result.data.text};
  }finally{if(worker)await worker.terminate();}
}
const api={parse,recognize};
if(typeof module!=='undefined')module.exports=api;else root.PlateOCR=api;
})(globalThis);
