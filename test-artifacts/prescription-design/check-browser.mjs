import {spawn} from 'node:child_process';
import {writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=resolve('test-artifacts/prescription-design');
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
 await send('Emulation.setDeviceMetricsOverride',{width:950,height:1250,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:pathToFileURL(join(dir,'index.html')).href});
 await new Promise(r=>setTimeout(r,600));
 const desktop=await send('Page.captureScreenshot',{captureBeyondViewport:true});
 await writeFile(join(dir,'desktop.png'),Buffer.from(desktop.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:1400,deviceScaleFactor:1,mobile:true});
 await send('Page.navigate',{url:pathToFileURL(join(dir,'index.html')).href});
 await new Promise(r=>setTimeout(r,1200));
 const mobile=await send('Page.captureScreenshot',{captureBeyondViewport:true});
 await writeFile(join(dir,'mobile.png'),Buffer.from(mobile.data,'base64'));
 const dimensions=await send('Runtime.evaluate',{expression:'JSON.stringify({viewport:innerWidth,document:document.documentElement.scrollWidth})',returnByValue:true});
 console.log('Mobile layout:',dimensions.result.value);
 await send('Page.navigate',{url:pathToFileURL(join(dir,'pdf-smoke.html')).href});
 let result;
 for(let i=0;i<100;i++){const value=await send('Runtime.evaluate',{expression:'document.body?.textContent',returnByValue:true});try{result=JSON.parse(value.result.value);break;}catch{await new Promise(r=>setTimeout(r,100));}}
 if(!Array.isArray(result))throw Error(JSON.stringify(result||'PDF verification did not complete'));
 for(const [i,row] of result.entries()){await writeFile(join(dir,i?'long.pdf':'standard.pdf'),Buffer.from(row.pdf,'base64'));delete row.pdf;}
 if(result[0].pages!==1||result[1].pages<2||result.some(r=>!r.hasLogo||!r.hasMedicine||!r.hasFooter))throw Error(JSON.stringify(result));
 console.log('PDF verification:',JSON.stringify(result));
} finally {ws?.close();chrome.kill();}
