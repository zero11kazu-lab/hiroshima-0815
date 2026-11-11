// Runs the real Three.js scene, camera and game code without a browser/WebGL renderer.
const assert=require('node:assert/strict'),{run}=require('./helpers/game-math.cjs');
const result=run(`(()=>{init();started=false;const results={layouts:[],sweep:{cases:0,maxBodyError:0,penetrations:0},movement:[],reset:[],missions:[],ending:[],errors:[]};
function check(label){camera.updateMatrixWorld(true);const target=player.getWorldPosition(new THREE.Vector3());target.y+=1.07;const ndc=target.project(camera),size=renderer.getSize(new THREE.Vector2()),penetrations=cameraCandidates.filter(o=>!o.faded&&o.solids.some(b=>b.containsPoint(camera.position))).length;
 if(!Number.isFinite(ndc.x)||Math.abs(ndc.x)>1e-8||Math.abs(ndc.y)>1e-8)throw Error('Uncentered '+label+' '+ndc.toArray());
 if(size.x!==$('game').clientWidth||size.y!==$('game').clientHeight)throw Error('Stale viewport '+label);
 results.sweep.cases++;results.sweep.maxBodyError=Math.max(results.sweep.maxBodyError,Math.abs(ndc.x));results.sweep.penetrations+=penetrations;
 return {label,ndc:ndc.toArray(),width:size.x,height:size.y,distance:cameraDistance,avoid:cameraAvoidYaw,pitch:cameraPitch,position:camera.position.toArray(),quaternion:camera.quaternion.toArray()};}
// Event is deliberately early: the container dimensions change AFTER resize().
for(const [w,h]of[[844,390],[390,844],[568,320],[320,568],[844,390]]){
 resize();$('game').clientWidth=w;$('game').clientHeight=h;const angle=cameraYaw;
 updateCamera(1/60,false);const s=check('delayed layout');s.pixelX=(s.ndc[0]+1)*w/2;s.expectedPixelX=w/2;if(cameraYaw!==angle)throw Error('Resize reset orbit');results.layouts.push(s);
}
const original={...pos};player.position.x+=1.5;updateCamera(1/60,false);results.actorTransform=check('displayed actor differs from logical position');player.position.set(pos.x,.08,pos.z);
let closest={distance:Infinity};
for(const post of [false,true]){
 if(post){pos.x=GEO1945.playerStart.x;pos.z=GEO1945.playerStart.z;player.position.set(pos.x,.08,pos.z);on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();}
 for(const [w,h]of[[390,844],[844,390]]){
  $('game').clientWidth=w;$('game').clientHeight=h;
  for(let x=-40;x<=106;x+=4)for(let z=-76;z<=78;z+=4){if(!worldAllowed(x,z))continue;pos.x=x;pos.z=z;player.position.set(x,.08,z);player.rotation.set(0,0,0);
   for(let a=0;a<12;a++){cameraYaw=a*Math.PI/6;updateCamera(1/30,false);const s=check((post?'post':'pre')+' sweep');if(!post&&s.distance<closest.distance)closest={...s,x,z,cameraYaw};}
  }
 }
 // Real movement updates retain existing walking/running speeds and input handling.
 for(const running of [false,true]){pos.x=0;pos.z=35;player.position.set(0,.08,35);yaw=cameraYaw=cameraAvoidYaw=0;look.manualUntil=performance.now()/1000+100;input.id=98;input.x=0;input.y=-1;survival.running=post&&running;playerMoveScale=1;const z=pos.z;
  for(let f=0;f<30;f++){const move=updatePlayer(1/30);updateCamera(1/30,move.n>.08);check('moving');}
  stop();for(let f=0;f<30;f++){updateCamera(1/30,false);check('stopped');}results.movement.push({post,running:post&&running,distance:z-pos.z});
 }
 // A continuously held manual orbit must not accumulate screen-space offset.
 for(let f=0;f<720;f++){cameraYaw+=.11;look.id=77;updateCamera(1/60,true);check('continuous orbit');}look.id=null;
}
reset();started=false;pos.x=closest.x;pos.z=closest.z;player.position.set(pos.x,.08,pos.z);// Restore the actually observed retracted pose, including its avoidance angle.
cameraYaw=closest.cameraYaw;cameraAvoidYaw=closest.avoid;cameraPitch=closest.pitch;cameraDistance=closest.distance;camera.position.fromArray(closest.position);camera.quaternion.fromArray(closest.quaternion);const near=cameraDistance;
pos.x=0;pos.z=35;player.position.set(0,.08,35);cameraYaw=0;updateCamera(1/60,false);const first=cameraDistance;
for(let f=0;f<360;f++){updateCamera(1/60,false);check('recovery');}results.recovery={near,first,final:cameraDistance,normal:normalCameraDistance,avoid:cameraAvoidYaw};
for(let i=0;i<3;i++){reset();updateCamera(1/60,false);results.reset.push(check('RESET'));}
// Existing mission methods, checkpoints and ending modes remain compatible with camera updates.
on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();
postMissions.choose('post-accept-child');const child=postMissions.nodeFor(postMissions.child);for(let i=0;i<child.pages.length;i++)postMissions.page(child,i);postMissions.finish(child,true);postMissions.finish(postMissions.nodeFor(postMissions.mother),true);updateCamera(1/60,false);results.missions.push({stage:'M1',completed:postMissions.mission1Completed,...check('after M1')});
postMissions.choose('post-accept-water');postMissions.choose('post-collect-water');postMissions.finish(postMissions.nodeFor(postMissions.male),true);updateCamera(1/60,false);results.missions.push({stage:'M2',completed:postMissions.mission2Completed,...check('after M2')});
const selected=ending.plan;survival.fail();survival.restart();started=false;updateCamera(1/60,false);results.checkpoint={samePlan:ending.plan===selected,...check('checkpoint')};
// Exercise the M3 completion hook at an authored refuge, without claiming an escort/UI test.
postMissions.missions[2].state=POST_MISSION_STATES.M3_ARRIVED;pos.x=postMissions.shelter.position.x;pos.z=postMissions.shelter.position.z;player.position.set(pos.x,.08,pos.z);postMissions.finish(postMissions.cloneNode(RESCUE_SCENES.arrived),true);updateCamera(1/60,false);results.missions.push({stage:'M3',completed:postMissions.mission3Completed,...check('after M3')});
for(const branch of ['A','B']){ending.reset();ending.testPlan(branch,0);ending.begin();const states=[];for(let i=0;i<ENDING_STATES.length;i++){ending.render();states.push(ending.state);ending.time=0;if(i<ENDING_STATES.length-1)ending.update(ending.durations[i]+.001);}ending.time=5;ending.render();results.ending.push({branch,text:$('ending-text').textContent,states,patient:ending.deceasedId});}
return results;})()`);
assert.equal(result.sweep.penetrations,0,'camera entered an unfaded obstacle');assert(result.sweep.cases>50000);assert(result.sweep.maxBodyError<1e-8);
assert(result.layouts.every(r=>Math.abs(r.pixelX-r.expectedPixelX)<.001));assert(result.movement.every(r=>Math.abs(r.distance-(r.running?5.51:2.9))<.02));assert(result.recovery.near<result.recovery.first&&result.recovery.first<result.recovery.normal);assert(Math.abs(result.recovery.final-result.recovery.normal)<.01&&Math.abs(result.recovery.avoid)<.01);assert(result.missions.every(r=>r.completed));assert(result.checkpoint.samePlan);assert(result.ending.every(r=>r.text==='【完】'&&r.states.length===12));assert.equal(result.ending[0].patient,'masami');assert.equal(result.ending[1].patient,'kazuo');console.log(JSON.stringify({PASS:true,testType:'Node math/state only; DOM and renderer are stubs',...result}));
