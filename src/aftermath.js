// Static alternate building states retain the same foundations, roads and river.
class Aftermath {
 constructor(){this.ready=false;this.active=false;this.blockers=[];this.effects=[];this.clock=0;this.postRecords=[];this.routeChecked=false;}
 rememberPre(){this.preNPCs=npcManager.people.map(n=>({position:{...n.position},yaw:n.yaw,next:n.next,name:n.name}));this.preWalls=walls.slice();this.sceneBackground=scene.background.clone();this.preFog={color:scene.fog.color.clone(),near:scene.fog.near,far:scene.fog.far};this.preLights=scene.children.filter(o=>o.isLight).map(o=>({o,intensity:o.intensity}));}
 reset(){
  setEnvironment14(world,false);setPlayerDamageAppearance(false);for(const p of world?.domesticProps||[])p.preModel.visible=true;postMissions.reset();survival.reset();hazards.reset();ambientAudio.stop();$('caption').innerHTML='川沿いの街、夏の朝。<br><span style="opacity:.6">1945 · HIROSHIMA</span>';$('music-toggle').setAttribute('aria-label','BGM切替');worldState=WORLD_STATE.PRE_BLAST;playerMoveScale=1;this.active=false;this.clock=0;this.blockers=[];this.routeChecked=false;
  if(this.preNPCs&&npcManager)for(const [i,entry] of this.preNPCs.entries()){const n=npcManager.people[i];n.hiddenFromWorld=false;n.postRole=null;n.supported=false;n.mission2ManAppearanceVariant=null;n.name=entry.name||n.name;n.position={...entry.position};n.yaw=entry.yaw;n.next=entry.next;n.eventTilt=0;n.eventRoll=0;n.postBlastState=null;n.conversing=false;n.moving=false;n.detour=[];n.state='waiting';n.timer=.5;}
  if(!this.ready){npcManager?.grid.rebuild(npcManager.people);return;}
  this.postRoot.visible=false;setDistrictMaterials(false);for(const t of world.trees){t.preModel.visible=true;t.state='NORMAL';}for(const b of world.buildings){b.preBlastModel.visible=true;b.damageState='INTACT';}
  for(const entry of this.preTransforms||[]){entry.object.rotation.copy(entry.rotation);}
  npcManager.grid.rebuild(npcManager.people);scene.background.copy(this.sceneBackground);scene.fog.color.copy(this.preFog.color);scene.fog.near=this.preFog.near;scene.fog.far=this.preFog.far;for(const l of this.preLights)l.o.intensity=l.intensity;
  walls.length=0;walls.push(...this.preWalls);world.wallGrid.clear();world.indexWalls();npcManager.navigation.cache.clear();this.postRecords=[];cacheCameraObstacles();
 }
 build(){
  if(this.ready)return;if(!this.preNPCs)this.rememberPre();this.postRoot=new THREE.Group();scene.add(this.postRoot);this.preTransforms=[];
  for(const [i,record] of world.buildings.entries()){
   const b=record.data,d=record.distanceFromHypocenter,damage=b.type==='public'?'DAMAGED':b.id===POST_MISSION_DATA.childBuildingId?'HEAVILY_DAMAGED':damageFor10(d,i);
   record.postDamage=damage;const g=new THREE.Group();g.position.set(b.x,0,b.z);g.rotation.y=b.angle;this.postRoot.add(g);record.postBlastModel=g;
   if(b.type==='public')buildPublicLandmark14(world,b,true,g);else buildRuinedBuilding14(record,g,i);
   // Preserve the existing rescue landmark dimensions and cover, independently of visual debris.
   if(b.id===POST_MISSION_DATA.childBuildingId){const roof=box(b.w*.6,.16,b.d*.8,'#514d43',.1,1.9,0,g);roof.rotation.z=.34;box(.12,2.6,.12,'#514d43',-b.w*.35,1.3,0,g);}
  }
  for(const [i,t] of world.trees.entries()){
   t.postState=[POST_BLAST_TREE.DESTROYED,POST_BLAST_TREE.BURNED,POST_BLAST_TREE.BROKEN,POST_BLAST_TREE.FALLEN,POST_BLAST_TREE.BURNING][i%5];if(historicalDistance(t)>2000&&i%3===0)t.postState=POST_BLAST_TREE.BROKEN;
   const g=new THREE.Group();g.position.set(t.x,0,t.z);g.scale.setScalar(t.placementScale??1);this.postRoot.add(g);t.postModel=g;
   if(t.postState!=='DESTROYED'){
    const h=t.postState==='BROKEN'?1.1:2.8,trunk=cylinder(.15,h,'#494337',0,h/2,0,g);
    if(t.postState==='FALLEN'){trunk.rotation.z=Math.PI/2;trunk.position.set(.8,.19,0);}
    else if(t.postState==='BURNED'||t.postState==='BURNING'){const branch=box(.08,1.3,.08,'#494337',.25,1.8,0,g);branch.rotation.z=-.65;}
   }world.mergeDetails(g);
  }
  this.buildDomesticDamage();
  // Lean some poles, keep others and the bridge as orientation landmarks.
  for(const item of world.groups){if(world.data.poles.some(p=>p[0]===item.x&&p[1]===item.z)){this.preTransforms.push({object:item.group,rotation:item.group.rotation.clone()});}}
  // A bounded amount of static street debris, with no rigid-body simulation.
  const debris=new THREE.Group();this.postRoot.add(debris);
  for(let i=0;i<42;i++){const b=WORLD_DATA.buildings[i%(HISTORICAL_DATA.buildings_1945.length+HISTORICAL_DATA.landmarks_1945.length)],x=b.x+(b.w/2+.6)*(i%2?1:-1),z=b.z+.6;if(!worldAllowed(x,z))continue;const m=box(.2,.12,.8,'#696051',x,.09,z,debris);m.rotation.y=i*1.4;}
  world.mergeDetails(debris);configureRuinsGround14(world);this.ready=true;
 }
 // Static remnants reuse shared geometries/materials; gameplay colliders stay unchanged.
 buildDomesticDamage(){
  for(const [i,r] of world.domesticProps.entries()){
   const g=new THREE.Group();g.position.set(r.x,0,r.z);this.postRoot.add(g);r.postModel=g;r.damageState='DAMAGED';
   if(r.type==='garden'){
    const {w,d}=r.data;
    texturedBox(w,.035,d,surface('char','#514b40'),0,.03,0,g);
    for(let j=0;j<5;j++){const soil=texturedBox(w*(.3+.08*(j%3)),.06,.35,surface('earth','#5e5545'),(j%2-.5)*1.2,.07,-d*.35+j*d*.16,g);soil.rotation.y=(j%3-1)*.22;}
    for(let j=0;j<7;j++){const stalk=box(.12,.09,.45,'#4c4939',-w*.32+(j%4)*w*.2,.12,-d*.3+Math.floor(j/4)*1.7,g);stalk.rotation.y=j*1.3;}
    for(const side of [-1,1]){const pole=cylinder(.065,side===1?1.1:1.8,'#423b30',side*2,.6,2,g);pole.rotation.z=side*.55;}
    const rail=box(3,.04,.04,'#4d4437',0,.7,2,g);rail.rotation.z=-.24;
    const cloth=box(.45,.018,.55,'#655c4d',.65,.13,2.1,g);cloth.rotation.y=.5;
    for(let j=0;j<3;j++){const ash=box(.55,.025,.22,'#797266',j-1,.1,.6-j*.7,g);ash.rotation.y=j*.8;}
   }else if(r.type==='fence'){
    const {w,d}=r.data,long=Math.max(w,d),alongX=w>d;
    for(let j=0;j<3;j++){const q=(j-1)*long*.29,post=box(alongX?long*.22:d,.25+j*.13,alongX?d:long*.22,'#4a4236',alongX?q:0,.18,alongX?0:q,g);post.rotation.z=(j-1)*.15;}
    const cap=box(w*.65,.09,d*.65,'#3b372e',0,.12,0,g);cap.rotation.y=.08;
   }else{
    const copy=r.preModel.clone(true);copy.position.set(0,0,0);copy.scale.y=r.type==='well'?.75:.55;copy.rotation.z=r.type==='well'?0:.18;
    copy.traverse(m=>{if(m.isMesh)m.material=surface('char','#625747');});g.add(copy);
   }
   world.mergeDetails(g);
  }
 }
 fire(x,z){
  const g=new THREE.Group();g.position.set(x,.3,z);this.postRoot.add(g);
  const flameMat=new THREE.MeshBasicMaterial({color:'#be662f',transparent:true,opacity:.68,depthWrite:false});
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.65,1.8,5),flameMat);flame.userData.nonSolid=true;flame.position.y=.8;g.add(flame);
  const smoke=new THREE.Group();g.add(smoke);for(let j=0;j<4;j++){const puff=new THREE.Mesh(geometries.leaf,new THREE.MeshBasicMaterial({color:'#5f5c55',transparent:true,opacity:.24,depthWrite:false}));puff.userData.nonSolid=true;puff.position.set(j*.3,2+j*1.4,0);puff.scale.setScalar(.8+j*.3);smoke.add(puff);}this.effects.push({flame,smoke});
 }
 refreshColliders(){walls.length=0;walls.push(...(this.postWalls||this.preWalls),...this.blockers);world.wallGrid.clear();world.indexWalls();npcManager.navigation.cache.clear();}
 reachable(a,b){
  const nav=npcManager.navigation,step=2,start={x:Math.round(a.x/step)*step,z:Math.round(a.z/step)*step},goal={x:Math.round(b.x/step)*step,z:Math.round(b.z/step)*step};
  // Same grid as the initial reachable-wife placement. Validate roads before committing blockage.
  const key=p=>`${p.x},${p.z}`,queue=[start],seen=new Set([key(start)]);let head=0;
  while(head<queue.length){const p=queue[head++];if(Math.hypot(p.x-goal.x,p.z-goal.z)<2.1)return true;
   for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){const q={x:p.x+dx,z:p.z+dz},k=key(q);if(seen.has(k)||!worldAllowed(q.x,q.z)||!nav.segmentClear(p,q))continue;seen.add(k);queue.push(q);}}
  return false;
 }
 enter(){
  if(worldState===WORLD_STATE.POST_BLAST)return;this.build();this.postRoot.visible=true;this.blockers=[];
  for(const r of world.domesticProps)r.preModel.visible=false;
  for(const b of world.buildings){b.preBlastModel.visible=false;b.damageState=b.postDamage;}
  for(const t of world.trees){t.preModel.visible=false;t.state=t.postState;}
  this.postWalls=this.preWalls.filter(w=>!w.treeId&&(!w.buildingId||['INTACT','DAMAGED'].includes(world.buildings.find(b=>b.id===w.buildingId).postDamage)));
  for(const b of world.buildings)if(b.postDamage==='HEAVILY_DAMAGED')this.postWalls.push({x:b.position.x-b.data.w*.44,z:b.position.z,w:.3,d:b.data.d*.3});
  for(const t of world.trees)if(!['DESTROYED','FALLEN'].includes(t.state))this.postWalls.push({x:t.x,z:t.z,w:.28,d:.28});
  for(const [i,e] of this.preTransforms.entries())if(i%3!==1)e.object.rotation.z=.9+(i%2)*.3;
  // Select a closure away from all actors; retain it only if an alternate cross-town path exists.
  const wife=npcManager.people.find(n=>n.id===PLAYER_PROFILE.spouseId);
  for(const z of [-16,-11,17,28]){
   const block={x:0,z,w:5.5,d:.85};if(Math.hypot(pos.x,pos.z-z)<8||npcManager.people.some(n=>Math.abs(n.position.x)<6&&Math.abs(n.position.z-z)<2))continue;
   this.blockers=[block];this.refreshColliders();if(this.reachable(pos,wife.position)){this.routeChecked=true;break;}this.blockers=[];
  }
  this.refreshColliders();
  // The reusable blocker model is rebuilt only when its chosen coordinate changes.
  if(this.blockerModel){this.blockerModel.traverse(m=>{if(m.isMesh)m.geometry.dispose();});this.postRoot.remove(this.blockerModel);}const rubble=new THREE.Group();this.postRoot.add(rubble);this.blockerModel=rubble;
  for(const b of this.blockers)for(let i=0;i<11;i++){const m=box(.7,.35+(i%3)*.25,1.15,'#665e50',b.x-5+i,b.d/2,b.z,rubble);m.rotation.z=(i%3-1)*.3;m.rotation.y=i*.4;}world.mergeDetails(rubble);
  setDistrictMaterials(true);worldState=WORLD_STATE.POST_BLAST;this.active=true;setPlayerDamageAppearance(true);this.clock=0;scene.background.set('#50524f');scene.fog.color.set('#50524f');scene.fog.near=13;scene.fog.far=world.visibleDistance-5;
  for(const l of this.preLights)l.o.intensity*=.65;
  for(const n of npcManager.people){n.eventRoll=0;n.conversing=false;n.moving=false;n.detour=[];n.postBlastState=['DOWN','DISORIENTED','STATIC','MOVING_SLOWLY','SEARCHING'][n.index%5];n.postBlastDialogue=makePostDialogue(n);n.state=n.postBlastState;n.postAnchor={...n.position};n.postHeading=n.yaw;n.postTimer=0;n.postPause=0;n.postReturning=false;n.postStuck=0;}
  npcManager.grid.rebuild(npcManager.people);this.postRecords=npcManager.people.map(n=>({id:n.id,position:{...n.position},postBlastState:n.postBlastState}));postMissions.setup();hazards.configure(true);postMissions.validateLocations();hazards.addStreetFires(postMissions.routes);this.routeChecked=this.routeChecked&&hazards.safeRoute.length>0;setEnvironment14(world,true);cacheCameraObstacles();
 }

 release(){storyController.state='POST_BLAST_ORIENTATION';storyController.ended=false;missionController.render();document.body.classList.remove('event-active');playerControlEnabled=cameraManualControlEnabled=true;playerMoveScale=.42;this.clock=0;ambientAudio.startPost();$('music-toggle').setAttribute('aria-label','環境音切替');$('music-toggle').textContent=morningAudio.enabled?'♪ 環境音':'♪ OFF';$('caption').textContent='';survival.begin();postMissions.saveCheckpoint();}
 update(realDt,dt){
  ending.music(realDt);
  this.frameCount=(this.frameCount||0)+1;this.frameTime=(this.frameTime||0)+realDt;if(this.frameTime>=.5){fps=Math.round(this.frameCount/this.frameTime);this.frameCount=this.frameTime=0;}
  if(postMissions.canAskMasami&&!ending.gameplayCompleted&&Math.hypot(pos.x-postMissions.wife.position.x,pos.z-postMissions.wife.position.z)<2.5&&npcManager.navigation.segmentClear(pos,postMissions.wife.position)){ending.begin();return;}
  survival.update(realDt);if(survival.dead)return;
  this.clock+=realDt;playerMoveScale=(.42+.58*eventEase(this.clock/POST_CONFIG.SLOW_WALK_DURATION))*(survival.speedScale||1)*(postMissions.escorting?POST_PLACEMENT_CONFIG.escortSpeedScale:1);
  let remaining=Math.max(0,Math.min(realDt,.25)),n=0;
  while(remaining>1e-6){const step=Math.min(remaining,1/30),movement=updatePlayer(step);n=Math.max(n,movement.n);postNPCController.update(step);postMissions.update(step);remaining-=step;}
  dialogue.update(realDt);world.updateVisibility(pos);updateCamera(Math.min(realDt,.25),n>.08);this.updateEffects(this.clock);missionController.updateGuide(realDt);ambientAudio.updateWorld(realDt);
  if($('debug').classList.contains('visible')){if(document.activeElement!==$('debug-fire-count'))$('debug-fire-count').value=hazards.fires.length;const wife=npcManager.people.find(n=>n.id===PLAYER_PROFILE.spouseId);$('debug').textContent=`${fps} FPS  ${worldState}\nHP ${survival.hp.toFixed(1)} HEAT ${survival.heat.toFixed(1)} STAMINA ${survival.stamina.toFixed(1)}\nSTORY ${postMissions.missions.map(m=>m.state).join(' / ')}\nSMOKE ${survival.exposure.smoke.toFixed(2)} inhale ${survival.inhalation.toFixed(1)}\nFIRE ${survival.exposure.zones.join(',')||'-'}\nPLAYER ${pos.x.toFixed(1)},${pos.z.toFixed(1)}\n${EVENT_DEBUG?'MASAMI '+wife.position.x.toFixed(1)+','+wife.position.z.toFixed(1):''}\n${npcManager.people.slice(0,3).map(n=>n.id+' '+n.postBlastState).join(' / ')}`;}

 }

 updateEffects(t){hazards.animate(t);for(const [i,e] of this.effects.entries()){e.flame.scale.y=.9+.09*Math.sin(t*3+i);e.smoke.rotation.y=.03*Math.sin(t*.25+i);}}
 snapshot(){return {worldState,ready:this.ready,blockers:this.blockers,alternateRoute:this.routeChecked,buildings:world?.buildings.map(b=>({id:b.id,position:b.position,rotation:b.rotation,damageState:b.damageState,distanceFromHypocenter:b.distanceFromHypocenter})),trees:world?.trees.map(t=>({id:t.id,x:t.x,z:t.z,state:t.state})),npcStates:this.postRecords};}
}
const aftermath=new Aftermath();
// Swept static collision plus one-time endpoint separation; ordinary crowd AI never runs here.
class BlastDisplacement {
 constructor(){this.plans=[];this.byId=new Map();}
 build(){
  const targets=[{id:PLAYER_PROFILE.id,position:pos,index:-1},...npcManager.people.filter(n=>Math.hypot(n.position.x-pos.x,n.position.z-pos.z)<=POST_CONFIG.PLAYER_BLAST_NPC_RADIUS||n.id===PLAYER_PROFILE.spouseId)];
  const reserved=new Map([[PLAYER_PROFILE.id,{...pos}],...npcManager.people.map(n=>[n.id,{...n.position}])]);this.plans=[];
  for(const actor of targets){const start={...actor.position},i=actor.index+2,dx=start.x-BLAST_ORIGIN.x,dz=start.z-BLAST_ORIGIN.z,base=Math.atan2(dx,dz),distance=(actor.index<0?POST_CONFIG.PLAYER_DISTANCE:POST_CONFIG.NPC_DISTANCE)*(.7+.6*seeded09(i*17));
   reserved.delete(actor.id);const others=[...reserved.values()];let best={...start},bestTravel=0;
   for(const offset of [0,.2,-.2,.6,-.6,1.1,-1.1,1.6,-1.6]){
    const a=base+offset+(seeded09(i*11)-.5)*.35;let candidate={...start};
    for(let d=.1;d<=distance;d+=.1){const x=start.x+Math.sin(a)*d,z=start.z+Math.cos(a)*d;if(!worldAllowed(x,z)||others.some(p=>{const d=Math.hypot(p.x-x,p.z-z);return d<.72&&d<Math.min(.72,Math.hypot(p.x-start.x,p.z-start.z))-.0001;}))break;candidate={x,z};}
    const travel=Math.hypot(candidate.x-start.x,candidate.z-start.z);if(travel>bestTravel){best=candidate;bestTravel=travel;}if(travel>distance*.8)break;
   }
   reserved.set(actor.id,best);this.plans.push({id:actor.id,index:actor.index,start,end:best,distance:bestTravel,roll:(seeded09(i*29)-.5)*.7,turn:(seeded09(i*37)-.5)*.65});
  }
  this.byId=new Map(this.plans.map(p=>[p.id,p]));
 }
 apply(progress){const u=eventEase(progress);for(const plan of this.plans){const x=plan.start.x+(plan.end.x-plan.start.x)*u,z=plan.start.z+(plan.end.z-plan.start.z)*u;
   if(plan.index<0){pos.x=x;pos.z=z;player.position.set(x,.08,z);}else{const n=npcManager.people[plan.index];n.position.x=x;n.position.z=z;}}
 }
 snapshot(){return this.plans.map(p=>JSON.parse(JSON.stringify(p)));}
}
const blastDisplacement=new BlastDisplacement();
