const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8081/');await page.locator('#start').tap();await page.waitForTimeout(300);
 // Freeze real-time updates so reproducible geometry tests can advance at a mobile frame rate.
 await page.evaluate(()=>{started=false;});
 const geometry=await page.evaluate(()=>{
  const results=[];
  const scenarios=[['house behind player',10,11.2,0],['house beside alley',6.4,8,Math.PI/2],['between houses',15,8,Math.PI/2],['tree behind',6.7,16,0],['under canopy',6.7,17.1,0],['bridge',2.8,-33,Math.PI/2],['open street',0,10,0]];
  function inspect(label){
   const penetrations=cameraObstacles.filter(o=>!o.faded&&o.bounds.containsPoint(camera.position)).length;
   const ray=new THREE.Raycaster();let hidden=0;
   for(const h of [.7,1.15,1.7]){
    const target=new THREE.Vector3(pos.x,h,pos.z),d=target.clone().sub(camera.position);ray.set(camera.position,d.clone().normalize());ray.far=d.length()-.2;
    if(ray.intersectObjects(cameraObstacles.filter(o=>!o.faded).map(o=>o.mesh),false).length)hidden++;
   }
   const ndc=new THREE.Vector3(pos.x,1.15,pos.z).project(camera);
   return {label,distance:cameraDistance,penetrations,hidden,centered:Math.abs(ndc.x)<.01&&Math.abs(ndc.y)<.01,faded:cameraObstacles.filter(o=>o.faded).length};
  }
  for(const [label,x,z,heading] of scenarios){pos.x=x;pos.z=z;player.position.set(x,.08,z);cameraYaw=heading;cameraDistance=normalCameraDistance;updateCamera(1/60,false);camera.updateMatrixWorld();results.push(inspect(label));}
  // Sweep through accessible map points and every heading, testing collision after each orbit step.
  let sweep=0,penetrations=0,occluded=0,minDistance=Infinity,clipped=0;const failures=[];
  for(let x=-25;x<=25;x+=1.5)for(let z=-39;z<=30;z+=1.5){
   if(!allowed(x,z))continue;
   pos.x=x;pos.z=z;player.position.set(x,.08,z);
   for(let i=0;i<12;i++){
    cameraYaw=i*Math.PI/6;cameraDistance=normalCameraDistance;updateCamera(1/30,false);camera.updateMatrixWorld();const r=inspect('sweep');sweep++;minDistance=Math.min(minDistance,cameraDistance);for(const h of [.2,1.95]){const n=new THREE.Vector3(x,h,z).project(camera);if(Math.abs(n.y)>1){clipped++;if(failures.length<8)failures.push({x,z,yaw:cameraYaw,pitch:cameraPitch,distance:cameraDistance,h});}}penetrations+=r.penetrations;if(r.hidden===3){occluded++;if(failures.length<5)failures.push({x,z,heading:cameraYaw,...r});}
   }
  }
  // Distance must recover smoothly, without changing orbit when stopped.
  pos.x=10;pos.z=11.2;cameraYaw=Math.PI;cameraDistance=normalCameraDistance;updateCamera(1/60,false);const near=cameraDistance;
  pos.x=0;pos.z=10;updateCamera(1/60,false);const first=cameraDistance;
  for(let i=0;i<240;i++)updateCamera(1/60,false);const recovered=cameraDistance;
  reset();started=true;
  return {results,sweep,penetrations,occluded,minDistance,clipped,failures,recovery:{near,first,recovered,normal:normalCameraDistance}};
 });
 console.log(JSON.stringify(geometry,null,2));
 assert.equal(geometry.penetrations,0,'camera penetrated geometry');assert.equal(geometry.occluded,0,'player fully hidden');assert(geometry.recovery.near<geometry.recovery.first);assert(geometry.recovery.first<geometry.recovery.normal);assert(Math.abs(geometry.recovery.recovered-geometry.recovery.normal)<.01);
 const cdp=await context.newCDPSession(page);const rect=await page.locator('#stick').boundingBox();const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
 const touch=async(type,x=cx,y=cy)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}]});
 await touch('touchStart');await touch('touchMove',cx+25,cy-30);await page.waitForTimeout(900);const turn=await page.evaluate(()=>__game.getState());assert(turn.x>.4);assert(turn.z<9.6);assert(turn.cameraYaw<-.05);assert(Math.abs(turn.cameraYaw-turn.yaw)>.02,'rotation should lag');
 await touch('touchEnd');await page.waitForTimeout(150);const stopped=await page.evaluate(()=>__game.getState());await page.waitForTimeout(500);const after=await page.evaluate(()=>__game.getState());assert.equal(stopped.x,after.x);assert.equal(stopped.z,after.z);assert.equal(stopped.cameraYaw,after.cameraYaw);
 // A forward input uses the new camera heading, rather than world north.
 await page.evaluate(()=>{started=false;reset();cameraYaw=-Math.PI/2;yaw=cameraYaw;updateCamera(0,false);started=true;});
 await touch('touchStart',cx,cy-30);await page.waitForTimeout(650);await touch('touchEnd');const forward=await page.evaluate(()=>__game.getState());assert(forward.x>.5);assert(Math.abs(forward.z-10)<.1);
 await page.locator('#reset').tap();await touch('touchStart',cx+35,cy);await page.waitForTimeout(300);await touch('touchCancel');assert.equal((await page.evaluate(()=>__game.getState())).input.id,null);
 // Continuous right steering and quick reversals cannot create invalid coordinates or angular snaps.
 const continuous=await page.evaluate(()=>{
  started=false;reset();const changes=[];let oldCameraYaw=cameraYaw;
  for(let i=0;i<420;i++){
   const x=i<300?1:-1,y=0,dt=1/30;const sin=Math.sin(cameraYaw),cos=Math.cos(cameraYaw),wx=x*cos+y*sin,wz=-x*sin+y*cos;
   if(allowed(pos.x+wx*2.9*dt,pos.z))pos.x+=wx*2.9*dt;if(allowed(pos.x,pos.z+wz*2.9*dt))pos.z+=wz*2.9*dt;
   yaw+=angleDelta(Math.atan2(-wx,-wz),yaw)*(1-Math.exp(-14*dt));updateCamera(dt,true);changes.push(Math.abs(angleDelta(cameraYaw,oldCameraYaw)));oldCameraYaw=cameraYaw;
  }
  const result={maxStep:Math.max(...changes),finite:camera.position.toArray().every(Number.isFinite),distance:cameraDistance};reset();started=true;return result;
 });assert(continuous.maxStep<=1.4/30+1e-8);assert(continuous.finite);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);
 await page.screenshot({path:'/workspace/sites/hiroshima/camera-updated.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({touch:'PASS',release:'PASS',cameraRelativeForward:'PASS',cancel:'PASS',continuous,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
