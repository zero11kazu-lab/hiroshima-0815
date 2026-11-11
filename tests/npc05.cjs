const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:844,height:390}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8083/');await p.locator('#start').click();await p.waitForTimeout(300);console.log('START',await p.locator('#error').textContent());assert((await p.evaluate(()=>__game.getState())).started);
const results=await p.evaluate(()=>{
 started=false;
 function run(manager,seconds,playerPosition,options={}){
  let collisions=0,staticOverlaps=0,minPair=99,maxStalled=0;const start=manager.people.map(n=>({...n.position})),distance=manager.people.map(()=>0),crossed=new Set(),last=manager.people.map(n=>({...n.position}));
  for(let f=0;f<seconds*30;f++){
   manager.update(1/30,playerPosition,options.schedules?GAME_CONFIG.START_TIME+Math.min(f/3,1790):GAME_CONFIG.START_TIME);
   for(let i=0;i<manager.people.length;i++){const n=manager.people[i];distance[i]+=Math.hypot(n.position.x-last[i].x,n.position.z-last[i].z);last[i]={...n.position};if(options.cross&&Math.sign(start[i].z)!==Math.sign(n.position.z)&&Math.abs(n.position.z)>4.3)crossed.add(n.id);maxStalled=Math.max(maxStalled,n.stuckSeconds);}
   if(f%15)continue;
   for(let i=0;i<manager.people.length;i++){const n=manager.people[i];if(!manager.isOpen(n.position.x,n.position.z))staticOverlaps++;
    for(let j=i+1;j<manager.people.length;j++){const o=manager.people[j],d=Math.hypot(n.position.x-o.position.x,n.position.z-o.position.z);minPair=Math.min(minPair,d);if(d<.605)collisions++;}
   }
  }
  return {passages:manager.passages.items.map(p=>({id:p.id,x:p.x,z:p.z,half:p.half,direction:p.direction,active:[...p.active],queue:[...p.queue.keys()]})),count:manager.people.length,seconds,collisions,staticOverlaps,minPair,maxStalled,distance,escaped:manager.people.filter((n,i)=>Math.hypot(n.position.x-start[i].x,n.position.z-start[i].z)>4).length,crossed:crossed.size,stats:manager.stats,spatialChecks:manager.grid.checks,expanded:manager.navigation.expanded,final:manager.people.map(n=>({id:n.id,state:n.state,stuck:n.stuckSeconds,pos:n.position,next:n.next,path:n.detour.length,recoveries:n.recoveries,travel:n.passageTravel?{id:n.passageTravel.passage.id,direction:n.passageTravel.direction,crossing:n.passageTravel.crossing}:null,bay:n.gateBay}))};
 }
 const natural=run(npcManager,480,{x:0,z:10},{schedules:true});
 function data(count,route){return Array.from({length:count},(_,i)=>({id:'test-'+i,name:'test',type:'man',routeId:'test',route:route(i),startFraction:(i+.2)/count,speed:.8*(.85+(i%7)*.05),pause:.6,schedule:[],dialogue:['hello']}));}
 const dense=new NPCManager(scene,data(24,i=>[{x:(i%4-1.5)*.8,z:-14},{x:(i%4-1.5)*.8,z:20}]),worldAllowed);
 dense.people.forEach((n,i)=>{n.position.x=(i%4-1.5)*.72;n.position.z=2+Math.floor(i/4)*.72;n.next=i%2?0:1;n.timer=0;n.detour=[];n.recoveryPending=false;dense.resetProgress(n);});dense.grid.rebuild(dense.people);
 const cluster=run(dense,150,{x:45,z:45});
 const narrowOpen=(x,z)=>Math.abs(z)<10&&(Math.abs(z)>=4?Math.abs(x)<2.8:Math.abs(x)<.28);
 const narrowData=data(8,i=>i<4?[{x:0,z:-8},{x:0,z:-4.5},{x:0,z:4.5},{x:0,z:8},{x:0,z:4.5},{x:0,z:-4.5}]:[{x:0,z:8},{x:0,z:4.5},{x:0,z:-4.5},{x:0,z:-8},{x:0,z:-4.5},{x:0,z:4.5}]);
 const corridor=new NPCManager(scene,narrowData,narrowOpen);
 corridor.people.forEach((n,i)=>{n.position.x=(i%4-1.5)*.8;n.position.z=i<4?-6:6;n.next=1;n.timer=0;n.detour=[];n.recoveryPending=false;corridor.resetProgress(n);});corridor.grid.rebuild(corridor.people);
 const narrow=run(corridor,240,{x:45,z:45},{cross:true});
 return {natural,cluster,narrow};
});console.log(JSON.stringify(results));for(const [name,r] of Object.entries(results)){assert.equal(r.collisions,0,name+' overlaps');assert.equal(r.staticOverlaps,0,name+' walls');assert(r.distance.every(d=>d>4),name+' someone never moved');}assert(results.cluster.escaped>=20,'cluster failed to drain');assert(results.narrow.crossed===8,'narrow did not pass every person');assert.deepEqual(errors,[]);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
