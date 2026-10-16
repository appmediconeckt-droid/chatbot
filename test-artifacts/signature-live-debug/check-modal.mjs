import {spawn} from 'node:child_process';
import {writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=resolve('test-artifacts/signature-live-debug');
const profile=await mkdtemp(join(tmpdir(),'humaeli-rx-'));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9227',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let ws;
try {
 let targets;
 for(let i=0;i<100;i++){try{targets=await (await fetch('http://127.0.0.1:9227/json/list')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}
 if(!targets)throw Error('Browser did not start');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});ws.send(JSON.stringify({id:call,method,params}));});
 await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1100,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5173/test-artifacts/signature-live-debug/modal.html'});
 const evaluate=async expression=>{const response=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(response.exceptionDetails)throw Error(response.exceptionDetails.text);return response.result.value;};
 let status;
 for(let i=0;i<100;i++){
  status=await evaluate("(()=>{const img=document.querySelector('img[alt=\"Doctor signature\"]');if(!img)return null;const rect=img.getBoundingClientRect();return{loaded:img.complete&&img.naturalWidth>0,width:rect.width,height:rect.height,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight};})()");
  if(status?.loaded)break;
  await new Promise(r=>setTimeout(r,200));
 }
 if(!status?.loaded||status.height<1)throw Error('Actual saved signature not visible: '+JSON.stringify(status));
 await evaluate("document.querySelector('img[alt=\"Doctor signature\"]').scrollIntoView({block:'center'})");
 await new Promise(r=>setTimeout(r,150));
 const screenshot=await send('Page.captureScreenshot');
 await writeFile(join(dir,'actual-receptionist-modal.png'),Buffer.from(screenshot.data,'base64'));
 console.log('Actual saved signature rendered in the running receptionist modal:',JSON.stringify(status));
} finally {ws?.close();chrome.kill();}
