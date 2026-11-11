const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8082/');await p.locator('#start').tap();await p.waitForTimeout(1000);
 assert.equal(await p.locator('#error').textContent(),'');assert((await p.evaluate(()=>__game.getState())).started);
 assert.equal(await p.locator('#debug').isVisible(),false);await p.locator('#debug-toggle').tap();assert(await p.locator('#debug').isVisible());await p.locator('#debug-toggle').tap();
 const summary=await p.evaluate(()=>({npcCount:npcManager.people.length,buildings:WORLD_DATA.buildings.length,types:[...new Set(npcManager.people.map(n=>n.type))],calls:renderer.info.render.calls,npcDrawCalls:npcManager.visuals.batches.length,triangles:renderer.info.render.triangles,obstacles:cameraObstacles.length,nearby:cameraCandidates.length}));
 assert.equal(summary.npcCount,24);assert(summary.buildings>=40);assert.equal(summary.types.length,5);assert(summary.npcDrawCalls<=5);
 // Four simulated minutes, including stalls, passing, stops, bridge routes and far updates.
 const simulation=await p.evaluate(()=>{
  started=false;reset();const distance=new Map(npcManager.people.map(n=>[n.id,0])),pauses=new Set(),restarts=new Set(),lastStates=new Map(),before=npcManager.people.map(n=>({...n.position}));
  let staticOverlaps=0,personOverlaps=0,playerOverlaps=0,minPair=Infinity,minPlayer=Infinity;const failures=[];
  for(let frame=0;frame<7200;frame++){
   npcManager.update(1/30,pos);
   for(let i=0;i<npcManager.people.length;i++){
    const n=npcManager.people[i],d=Math.hypot(n.position.x-before[i].x,n.position.z-before[i].z);distance.set(n.id,distance.get(n.id)+d);before[i]={...n.position};
    if(['waiting','standing','yielding'].includes(n.state))pauses.add(n.id);
    if(lastStates.get(n.id)!=='walking'&&n.state==='walking'&&pauses.has(n.id))restarts.add(n.id);lastStates.set(n.id,n.state);
   }
   if(frame%5)continue;
   for(let i=0;i<npcManager.people.length;i++){
    const n=npcManager.people[i];if(!worldAllowed(n.position.x,n.position.z)){staticOverlaps++;if(failures.length<4)failures.push({frame,id:n.id,position:{...n.position}});}
    const playerDistance=Math.hypot(n.position.x-pos.x,n.position.z-pos.z);minPlayer=Math.min(minPlayer,playerDistance);if(playerDistance<.6)playerOverlaps++;
    for(let j=i+1;j<npcManager.people.length;j++){const o=npcManager.people[j],pair=Math.hypot(n.position.x-o.position.x,n.position.z-o.position.z);minPair=Math.min(minPair,pair);if(pair<.58)personOverlaps++;}
   }
  }
  const result={staticOverlaps,personOverlaps,playerOverlaps,minPair,minPlayer,walked:Object.fromEntries(distance),pauses:pauses.size,restarts:restarts.size,stats:{...npcManager.stats},failures};
  // Stationary player collides with nearby NPCs; no shove or teleport involved.
  const n=npcManager.people[0];result.playerBlocked=!allowed(n.position.x,n.position.z);result.playerCanMoveAway=allowed(0,10);
  started=true;last=0;return result;
 });
 console.log('SIMULATION',JSON.stringify(simulation));
 assert.equal(simulation.staticOverlaps,0);assert.equal(simulation.personOverlaps,0);assert.equal(simulation.playerOverlaps,0);assert(simulation.playerBlocked);assert(simulation.playerCanMoveAway);assert(simulation.pauses>=20);assert(simulation.restarts>=20);assert(Object.values(simulation.walked).filter(d=>d>5).length>=20);
 // Follow a complete tour using the actual player controller, camera and NPC update paths.
 const tour=await p.evaluate(()=>{
  started=false;reset();const route=[[0,31],[26,31],[26,0],[0,0],[0,-25],[0,-40],[0,-25],[0,10]],visited=[];
  let index=0,overlaps=0,penetrations=0,maxTurn=0,oldYaw=cameraYaw,staticOverlaps=0;
  for(let frame=0;frame<7800;frame++){
   const target=route[index%route.length],dx=target[0]-pos.x,dz=target[1]-pos.z,d=Math.hypot(dx,dz);
   if(d<.35){visited.push(index++);if(index===route.length)break;}
   const c=Math.cos(cameraYaw+cameraAvoidYaw),s=Math.sin(cameraYaw+cameraAvoidYaw);
   input.id=999;input.x=(dx*c-dz*s)/Math.max(d,.1);input.y=(dx*s+dz*c)/Math.max(d,.1);
   const {n}=updatePlayer(1/30);npcManager.update(1/30,pos);updateCamera(1/30,n>.08);
   maxTurn=Math.max(maxTurn,Math.abs(angleDelta(cameraYaw,oldYaw)));oldYaw=cameraYaw;
   if(frame%6===0){
    if(!worldAllowed(pos.x,pos.z))staticOverlaps++;
    for(const n of npcManager.people)if(Math.hypot(n.position.x-pos.x,n.position.z-pos.z)<.6)overlaps++;
    if(cameraCandidates.some(o=>!o.faded&&o.bounds.containsPoint(camera.position)))penetrations++;
   }
  }
  const result={visited:visited.length,overlaps,penetrations,staticOverlaps,maxTurn,position:{...pos}};
  // RESET must remain clear even if a citizen happened to walk into the original spawn.
  const citizen=npcManager.people[0];citizen.position.x=0;citizen.position.z=10;reset();
  result.resetClear=npcManager.people.every(n=>Math.hypot(n.position.x-pos.x,n.position.z-pos.z)>=.62);
  started=true;return result;
 });
 console.log('TOUR',JSON.stringify(tour));assert.equal(tour.visited,8);assert.equal(tour.overlaps,0);assert.equal(tour.penetrations,0);assert.equal(tour.staticOverlaps,0);assert(tour.resetClear);assert(tour.maxTurn<=1.4/30+1e-8);
 // Touch movement/release/cancel/blur and simultaneous second finger.
 await p.reload();await p.locator('#start').tap();await p.waitForTimeout(300);
 const cdp=await context.newCDPSession(p),r=await p.locator('#stick').boundingBox(),cx=r.x+r.width/2,cy=r.y+r.height/2;
 const touch=async(type,x=cx,y=cy)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}]});
 await touch('touchStart');await touch('touchMove',cx+25,cy-30);await p.waitForTimeout(900);let state=await p.evaluate(()=>__game.getState());assert(state.x>.3);assert(state.z<9.7);assert(state.cameraYaw<-.03);
 await touch('touchEnd');await p.waitForTimeout(100);let stopped=await p.evaluate(()=>__game.getState());await p.waitForTimeout(400);state=await p.evaluate(()=>__game.getState());assert.equal(state.x,stopped.x);assert.equal(state.z,stopped.z);
 await p.locator('#reset').tap();state=await p.evaluate(()=>__game.getState());assert.equal(state.x,0);assert.equal(state.z,10);
 await touch('touchStart',cx+35,cy);await p.waitForTimeout(200);await touch('touchCancel');assert.equal((await p.evaluate(()=>__game.getState())).input.id,null);
 await touch('touchStart',cx,cy-35);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await p.evaluate(()=>__game.getState())).input.id,null);await touch('touchEnd');
 // Player contact from each direction is blocked outside the NPC radius.
 const contact=await p.evaluate(()=>{
  started=false;const n=npcManager.people[0],out=[];
  for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
   let x=n.position.x+Math.cos(a)*1.1,z=n.position.z+Math.sin(a)*1.1;
   for(let j=0;j<30;j++){const nx=x-Math.cos(a)*.08,nz=z-Math.sin(a)*.08;if(allowed(nx,nz)){x=nx;z=nz;}}
   out.push(Math.hypot(x-n.position.x,z-n.position.z));
  }
  reset();started=true;return out;
 });assert(contact.every(d=>d>=.62));
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);await p.locator('#stick').dispatchEvent('pointerdown',{pointerId:8,clientX:70,clientY:750});await p.locator('#stick').dispatchEvent('pointerup',{pointerId:8});assert.equal((await p.evaluate(()=>__game.getState())).input.id,null);await p.setViewportSize({width:844,height:390});await p.waitForTimeout(150);
 // Automatic quality downshift can reduce load without removing NPC state or changing controls.
 const quality=await p.evaluate(()=>{started=false;world.lowSeconds=5.1;world.adaptQuality(20,performance.now());const r={quality:world.quality,distance:world.visibleDistance,pixelRatio:renderer.getPixelRatio(),npcCount:npcManager.people.length};started=true;return r;});assert(quality.quality>=1);assert.equal(quality.npcCount,24);assert(quality.pixelRatio<=1.15);
 await p.screenshot({path:'/workspace/sites/hiroshima/prototype04-tested.png'});assert.deepEqual(errors,[]);console.log('PASS',JSON.stringify({summary,contact,touch:'move/release/cancel/blur/portrait PASS',quality,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
