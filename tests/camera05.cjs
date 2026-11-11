const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8083/');await page.locator('#start').tap();await page.waitForTimeout(300);
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
  for(let x=-50;x<=50;x+=3)for(let z=-61;z<=47;z+=3){
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
 assert.equal(geometry.penetrations,0,'camera penetrated geometry');assert.equal(geometry.occluded,0,'player fully hidden');assert.equal(geometry.clipped,0,'figure clipped');assert(geometry.recovery.near<geometry.recovery.first);assert(geometry.recovery.first<geometry.recovery.normal);assert(Math.abs(geometry.recovery.recovered-geometry.recovery.normal)<.01);
 assert.deepEqual(errors,[]);console.log('Camera regression PASS');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
