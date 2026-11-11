const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8084/');await p.locator('#start').tap();await p.waitForTimeout(300);assert((await p.evaluate(()=>__game.getState())).started);
const clock=await p.evaluate(()=>{started=false;gameClock.reset();gameClock.update(1);const one=gameClock.seconds;gameClock.update(29);const half=gameClock.format();gameClock.update(1000);const limit=gameClock.seconds;gameClock.update(100);const held=gameClock.seconds;const banner=!$('time-limit').hidden;GAME_CONFIG.PAUSE_TIME_DURING_DIALOGUE=true;gameClock.reset();gameClock.update(2,true);const paused=gameClock.seconds;GAME_CONFIG.PAUSE_TIME_DURING_DIALOGUE=false;gameClock.update(2,true);const during=gameClock.seconds;gameClock.reset();started=true;return {one,half,limit,held,banner,paused,during};});assert.equal(clock.one,27910);assert.equal(clock.half,'07:50');assert.equal(clock.limit,29690);assert.equal(clock.held,29690);assert(clock.banner);assert.equal(clock.paused,27900);assert.equal(clock.during,27920);
// Position the player beside a real shopkeeper and let the real proximity selector find him.
await p.evaluate(()=>{stop();const n=npcManager.people[3];pos.x=n.position.x;pos.z=n.position.z+1.3;player.position.set(pos.x,.08,pos.z);dialogue.update(1);});assert(await p.locator('#talk').isVisible());const before=await p.evaluate(()=>({position:{...pos},time:gameClock.seconds,target:dialogue.target.id}));await p.locator('#talk').tap();assert(await p.locator('#conversation').isVisible());assert((await p.locator('#npc-name').textContent()).length>0);const first=await p.locator('#dialogue-text').textContent();assert(first.includes('おはよう'));assert.equal((await p.evaluate(()=>__game.getState())).input.id,null);
// Held keyboard and stick cannot move the player while dialogue owns the UI.
await p.keyboard.down('w');await p.locator('#stick').dispatchEvent('pointerdown',{pointerId:8,clientX:90,clientY:250});await p.waitForTimeout(700);await p.keyboard.up('w');const during=await p.evaluate(()=>({position:{...pos},time:gameClock.seconds,npc:dialogue.active.state,input:{...input}}));assert.equal(during.position.x,before.position.x);assert.equal(during.position.z,before.position.z);assert(during.time>before.time);assert.equal(during.npc,'talking');assert.equal(during.input.id,null);
await p.locator('#dialogue-next').tap();assert.notEqual(await p.locator('#dialogue-text').textContent(),first);await p.locator('#dialogue-next').tap();assert.equal(await p.locator('#conversation').isVisible(),false);
await p.evaluate(()=>{pos.x=0;pos.z=40;dialogue.update(1);});assert.equal(await p.locator('#talk').isVisible(),false);
await p.locator('#reset').tap();assert((await p.evaluate(()=>__game.getState())).time<27905);
// True touch move, release and cancellation.
const cdp=await ctx.newCDPSession(p),r=await p.locator('#stick').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
await touch('touchStart',[{x,y}]);await touch('touchMove',[{x:x+25,y:y-30}]);await p.waitForTimeout(800);const moved=await p.evaluate(()=>__game.getState());assert(moved.x>.25);assert(moved.z<9.7);assert(moved.cameraYaw<-.02);await touch('touchEnd',[]);await p.waitForTimeout(100);const stopped=await p.evaluate(()=>__game.getState());await p.waitForTimeout(300);const after=await p.evaluate(()=>__game.getState());assert.equal(stopped.x,after.x);assert.equal(stopped.z,after.z);
await touch('touchStart',[{x,y:y-30}]);await touch('touchCancel',[]);assert.equal((await p.evaluate(()=>__game.getState())).input.id,null);
// Right-half orbit: a camera finger cannot become a movement finger.
await p.locator('#reset').tap();await touch('touchStart',[{x:650,y:180}]);await touch('touchMove',[{x:740,y:180}]);await touch('touchEnd',[]);const orbit=await p.evaluate(()=>__game.getState());assert(Math.abs(orbit.cameraYaw)>.15);assert.equal(orbit.x,0);assert.equal(orbit.z,10);await p.waitForTimeout(450);assert.equal((await p.evaluate(()=>__game.getState())).cameraYaw,orbit.cameraYaw);
// Manual hold then damped recenter, using the actual camera controller.
const recenter=await p.evaluate(()=>{started=false;const before=cameraYaw;yaw=0;look.manualUntil=performance.now()/1000+10;updateCamera(.1,true);const held=cameraYaw;look.manualUntil=0;for(let i=0;i<100;i++)updateCamera(1/30,true);const back=cameraYaw;started=true;return {before,held,back};});assert.equal(recenter.before,recenter.held);assert(Math.abs(recenter.back)<Math.abs(recenter.before)*.1);
// Multi-touch: UI tap cancels a held stick before opening the dialogue.
await p.evaluate(()=>{const n=npcManager.people[3];pos.x=n.position.x;pos.z=n.position.z+1.2;dialogue.update(1);});const t=await p.locator('#talk').boundingBox();await touch('touchStart',[{id:1,x,y}]);await touch('touchStart',[{id:1,x,y},{id:2,x:t.x+t.width/2,y:t.y+t.height/2}]);await touch('touchEnd',[]);await p.locator('#talk').tap();assert((await p.evaluate(()=>__game.getState())).dialogueNPC);assert.equal((await p.evaluate(()=>__game.getState())).input.id,null);await p.locator('#dialogue-close').tap();
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);await p.evaluate(()=>dialogue.update(1));await p.locator('#talk').tap();assert(await p.locator('#conversation').isVisible());const box=await p.locator('#conversation').boundingBox();assert(box.x>=0&&box.x+box.width<=391);await p.screenshot({path:'/workspace/sites/hiroshima/prototype06-controls-portrait.png'});await p.locator('#dialogue-close').tap();await p.setViewportSize({width:844,height:390});await p.locator('#debug-toggle').tap();await p.waitForTimeout(600);assert((await p.locator('#debug').textContent()).includes('stuck:'));await p.locator('#debug-toggle').tap();await p.screenshot({path:'/workspace/sites/hiroshima/prototype06-controls-tested.png'});
const schedules=await p.evaluate(()=>{started=false;const n=npcManager.people[0],actions=[];for(const time of [27900,28200,28800,29400]){npcManager.scheduleAt(time);actions.push({action:n.currentAction,destination:n.destination,index:n.scheduleIndex});}return actions;});assert.deepEqual(schedules.map(s=>s.index),[0,1,2,3]);assert(new Set(schedules.map(s=>s.action)).size===4);
 const tour=await p.evaluate(()=>{
  started=false;reset();const route=[[0,31],[26,31],[26,0],[0,0],[0,-25],[0,-40],[0,-25],[0,10]],visited=[];
  let index=0,overlaps=0,penetrations=0,maxTurn=0,oldYaw=cameraYaw,staticOverlaps=0;
  for(let frame=0;frame<7800;frame++){
   const target=route[index%route.length],dx=target[0]-pos.x,dz=target[1]-pos.z,d=Math.hypot(dx,dz);
   if(d<.35){visited.push(index++);if(index===route.length)break;}
   const c=Math.cos(cameraYaw+cameraAvoidYaw),s=Math.sin(cameraYaw+cameraAvoidYaw);
   input.id=999;input.x=(dx*c-dz*s)/Math.max(d,.1);input.y=(dx*s+dz*c)/Math.max(d,.1);
   const {n}=updatePlayer(1/30);gameClock.update(1/30);npcManager.update(1/30,pos,gameClock.seconds);updateCamera(1/30,n>.08);
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

assert.deepEqual(errors,[]);console.log(JSON.stringify({clock,dialogue:'open/next/close/pause/separation PASS',touch:'movement/release/cancel/multitouch PASS',camera:'orbit/hold/recenter PASS',schedules,errors}));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
