import assert from 'node:assert/strict';
const tabs=await(await fetch('http://127.0.0.1:9342/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let seq=0;const pending=new Map();
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
ws.addEventListener('message',async e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Fetch.requestPaused'){await call('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify({success:true,displayType:'doctor',doctor:{name:'Dr. Meera Shah'},current:{token:'AM-123'},nextTokens:['AM-124','AM-125'],waitingCount:12,completedCount:5,totalPatients:18,estimatedWaitMinutes:15})).toString('base64')});}});
const evaluate=async expression=>(await call('Runtime.evaluate',{expression,returnByValue:true})).result.value;
await call('Page.enable');await call('Fetch.enable',{patterns:[{urlPattern:'*api/*'}]});
for(const [width,height] of [[320,640],[390,844],[844,390],[1440,900]]){
 await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
 await call('Page.navigate',{url:'http://localhost:5006/display/clinic/mobile-fixture'});
 for(let i=0;i<60;i++){if(await evaluate("document.querySelector('.token-value')?.textContent==='AM-123'"))break;await new Promise(r=>setTimeout(r,100));}
 assert.equal(await evaluate("document.querySelector('.token-value')?.textContent"),'AM-123');
 const layout=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('button')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),cards:document.querySelectorAll('.doctor').length})`);
 assert.ok(layout.scroll<=width,JSON.stringify(layout));assert.equal(layout.cards,1);
 if(width<=600)assert.ok(layout.buttons.every(b=>b.height>=44));
 console.log(JSON.stringify({viewport:[width,height],...layout}));
}
await call('Browser.close');
