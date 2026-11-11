// Actual scene geometry and camera math. DOM/WebGLRenderer are stubs; no Safari claims.
const assert=require('node:assert/strict'),{run}=require('./helpers/game-math.cjs');
const result=run(`(()=>{
let seed=24107;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};init();started=false;
const check=(v,m)=>{if(!v)throw Error(m)},basePitch=Math.atan2(2.35,5.6),cases=[];
const initial={walls:JSON.stringify(walls),people:npcManager.people.length,geometries:[]};scene.traverse(m=>{if(m.isMesh)initial.geometries.push({mesh:m,geometry:m.geometry});});
// Isolated batch: two separated boxes must leave a passage, yet both boxes still block.
const batch=new THREE.BufferGeometry(),parts=[new THREE.BoxGeometry(8,2,.2).toNonIndexed(),new THREE.BoxGeometry(8,2,.2).toNonIndexed()];parts[0].translate(0,1,-3);parts[1].translate(0,1,3);
const buf=new Float32Array(parts.reduce((n,g)=>n+g.attributes.position.array.length,0));let at=0;for(const g of parts){buf.set(g.attributes.position.array,at);at+=g.attributes.position.array.length;}batch.setAttribute('position',new THREE.BufferAttribute(buf,3));
const partition=cameraPartBounds(batch);check(partition.length===2,'disconnected batch not split');check(cameraPartBounds(batch)===partition,'geometry cache not reused');
const saved=cameraCandidates;cameraCandidates=[{mesh:new THREE.Mesh(batch,mat('#777777')),solids:partition.map(b=>b.clone().expandByScalar(cameraRadius)),faded:false}];
check(cameraLimit(new THREE.Vector3(0,1,0),new THREE.Vector3(1,0,0),6,false)===6,'empty passage blocked');
check(cameraLimit(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),6,false)<3,'wall avoidance disabled');
check(cameraLimit(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),2.8,false)<2.8,'endpoint inside wall missed');cameraCandidates=saved;parts.forEach(g=>g.dispose());batch.dispose();
let frames=0,maxCenterError=0,maxStep=0,maxHeightStep=0,maxPitch=0;
for(const post of [false,true]){
 if(post){on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();}
 for(const dir of [-1,1])for(const speed of [2.9,5.51])for(const z of [35.65,36.5,38,39.5,40.35])for(const orbit of [-.25,0,.25]){
  cameraYaw=-dir*Math.PI/2+orbit;cameraAvoidYaw=0;cameraPitch=basePitch;cameraDistance=normalCameraDistance;camera.fov=57;
  let x=dir>0?32:68,previous=null;const count=Math.ceil(36/speed*60),record={post,dir,speed,z,orbit,frames:count+1,maxPitchStep:0,maxHeightStep:0};
  for(let f=0;f<=count;f++){
   // Continuous resize while crossing, including repeated portrait/landscape changes.
   const landscape=Math.floor(f/60)%2===1;$('game').clientWidth=landscape?844:390;$('game').clientHeight=landscape?390:844;
   const t=f/count;x=dir>0?32+36*t:68-36*t;pos.x=x;pos.z=z;player.position.set(x,.08,z);
   const snapshot=JSON.stringify({pos,yaw,hp:survival.hp,plan:postMissions.locationPlan,ending:ending.plan});
   look.manualUntil=performance.now()/1000+10;updateCamera(1/60,false);
   check(snapshot===JSON.stringify({pos,yaw,hp:survival.hp,plan:postMissions.locationPlan,ending:ending.plan}),'camera mutated gameplay');
   const aim=new THREE.Vector3(x,1.15,z).project(camera);maxCenterError=Math.max(maxCenterError,Math.abs(aim.x),Math.abs(aim.y));
   check(Math.abs(cameraPitch-basePitch)<1e-9,'bridge pitch jump');check(Math.abs(cameraDistance-normalCameraDistance)<1e-9,'false bridge obstruction');check(Math.abs(cameraAvoidYaw)<1e-9,'unrequested orbit');check(camera.fov===57,'bridge FOV changed');
   check(camera.position.toArray().every(Number.isFinite)&&camera.aspect===$('game').clientWidth/$('game').clientHeight,'invalid resize/camera');
   if(previous){record.maxPitchStep=Math.max(record.maxPitchStep,Math.abs(cameraPitch-previous.pitch));record.maxHeightStep=Math.max(record.maxHeightStep,Math.abs(camera.position.y-previous.height));}
   previous={pitch:cameraPitch,height:camera.position.y};maxPitch=Math.max(maxPitch,cameraPitch);frames++;
  }
  maxStep=Math.max(maxStep,record.maxPitchStep);maxHeightStep=Math.max(maxHeightStep,record.maxHeightStep);cases.push(record);
 }
 // Stop, reverse and accelerate repeatedly at both thresholds with actual movement controls.
 for(const edge of [36,64])for(const sign of [-1,1]){
  pos.x=edge-sign*.7;pos.z=38;player.position.set(pos.x,.08,pos.z);cameraYaw=yaw=-sign*Math.PI/2;cameraAvoidYaw=0;cameraPitch=basePitch;cameraDistance=normalCameraDistance;
  for(let f=0;f<300;f++){look.manualUntil=performance.now()/1000+10;input.id=91;input.x=0;input.y=f%100<30?0:(f%100<65?-1:1);survival.running=post&&f%2===0;const move=updatePlayer(1/60);updateCamera(1/60,move.n>.08);check(Math.abs(cameraPitch-basePitch)<1e-9,'stop/reverse bridge jump');}stop();
 }
}
// Orbit beside actual buildings must still retract; bridge fix cannot disable collision globally.
reset();cacheCameraObstacles();let buildingHits=0;
for(const b of world.buildings.slice(0,30)){
 const meshes=new Set();b.preBlastModel.traverse(m=>{if(m.isMesh)meshes.add(m);});
 const saved=cameraCandidates;cameraCandidates=cameraObstacles.filter(o=>meshes.has(o.mesh));
 const origin=new THREE.Vector3(b.data.x-b.data.w/2-1,1.15,b.data.z),direction=new THREE.Vector3(1,0,0);
 if(cameraLimit(origin,direction,b.data.w+2,false)<b.data.w+2)buildingHits++;cameraCandidates=saved;
}
check(buildingHits>0,'building collision no longer active');check(npcManager.people.length===initial.people,'NPC count changed');
check(JSON.stringify(walls)===initial.walls,'movement collision changed');for(const entry of initial.geometries)check(entry.mesh.geometry===entry.geometry,'original render geometry changed');

return {PASS:true,testType:'Actual Three.js geometry/camera math; DOM and WebGLRenderer stubbed',seed:24107,cases:cases.length,frames,maxPitchRadians:maxPitch,maxPitchStepRadians:maxStep,maxHeightStep,maxCenterError,portraitLandscapeChanges:true,stopReverseTrials:8,buildingCollisionCases:buildingHits,unchangedRenderGeometry:true,unchangedMovementColliders:true,NPCs:initial.people};
})()`);
assert(result.cases===120&&result.frames>50000);assert(result.maxPitchStepRadians===0&&result.maxHeightStep===0&&result.maxCenterError<1e-8);console.log(JSON.stringify(result));
