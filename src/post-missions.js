class PostMissionController {
 constructor(){this.root=null;this.reset();}
 reset(){this.missions=POST_MISSION_DATA.missions.map(m=>({...m}));this.mission1Completed=false;this.mission2Completed=false;this.mission3Completed=false;this.escorting=false;this.escortTrail=[];this.escortBlocked=0;this.planner=null;this.finalPlanner=null;this.masamiRepositioned=false;this.masamiSearch=null;this.locationPlan=null;this.masamiSeed=(Math.random()*0x100000000)>>>0;this.repositionCount=0;this.waterCollected=false;this.childState='CHILD_TRAPPED';this.maleState='MALE_WAITING';this.phase='POST_ORIENTATION';this.clock=0;this.trace=[];this.dialogueCounters={};this.checkpointState=null;this.rescuing=false;this.routes={};if(this.root)this.root.visible=false;}
 get canAskMasami(){return this.mission3Completed&&this.phase===POST_MISSION_STATES.FIND_MASAMI&&this.masamiRepositioned;}
 canAskNPC(n){return this.canAskMasami&&!n.isProp&&!n.hiddenFromWorld&&!['DEAD','CHILD_DEAD','DOWN','MISSING'].includes(n.postBlastState);}
 get mother(){return missionController.person(POST_MISSION_DATA.motherId);}
 get child(){return missionController.person(POST_MISSION_DATA.childId);}
 get male(){return missionController.person(POST_MISSION_DATA.maleId);}
 get requester(){return missionController.person(POST_MISSION_DATA.requesterId);}
 get evacuee(){return missionController.person(POST_MISSION_DATA.evacueeId);}
 get wife(){return missionController.person(PLAYER_PROFILE.spouseId);}
 setup(){
  for(const [n,role,name,p] of [[this.mother,'mother','佐々木 千代',POST_MISSION_DATA.motherPosition],[this.child,'child','佐々木 実',POST_MISSION_DATA.childPosition],[this.male,'male','中村 俊夫',POST_MISSION_DATA.malePosition]]){n.name=name;n.postRole=role;n.position={...p};n.postAnchor={...p};n.hiddenFromWorld=false;n.postBlastState=role==='child'?'CHILD_TRAPPED':'STATIC';n.moving=false;}
  this.wife.hiddenFromWorld=true;this.wife.moving=false;this.wife.postBlastState='MISSING';this.hydrant={id:'broken-hydrant',name:'破損した住宅給水管',position:{...POST_MISSION_DATA.hydrantPosition},isProp:true};
  this.requester.name='杉山 文子';this.evacuee.name='高田 昇';
  for(const [n,role]of [[this.requester,'rescue-giver'],[this.evacuee,'evacuee']]){n.postRole=role;n.hiddenFromWorld=false;n.moving=false;n.supported=false;n.postBlastState=role==='evacuee'?'DOWN':'STATIC';}
  this.shelter={id:'rescue-shelter',name:'火と煙の薄い空地',position:{x:0,z:70},height:1,isProp:true,kind:'shelter'};
  this.buildProps();this.syncActors();npcManager.grid.rebuild(npcManager.people);
 }
 buildProps(){
  if(!this.root){this.root=new THREE.Group();scene.add(this.root);const child=POST_MISSION_DATA.childPosition,g=new THREE.Group();g.position.set(child.x,0,child.z);this.root.add(g);this.childRubble=g;
   // Grounded, irregular timber/plaster debris covers the waist and legs, leaving the chest/head north of it.
   const t=ruins14Tools(false);for(const [name,w,h,d,x,y,z,rot,tile]of [
    ['broken-beam',1.25,.18,.22,0,.25,.52,.08,0],['fallen-rafter',.15,.19,.95,-.34,.12,.03,.18,0],['fallen-rafter',.16,.22,.88,.35,.14,.08,-.17,0],['plaster-fragment',.55,.27,.45,-.24,.15,.28,.10,1],['roof-fragment',.58,.21,.55,.22,.12,-.08,-.13,2]])t.part(name,w,h,d,x,y,z,tile,0,[0,rot,0],'#a79a80',true);
   const debris=new THREE.Mesh(building14Merge(t.batches.flat()),ruins14Material());debris.name='child-grounded-debris14';debris.userData.nonSolid=true;g.add(debris);
   // HazardField supplies textured smoke; a floating faceted leaf mesh is not smoke.
   buildWaterSource14(this);
  }if(!this.shelterRoot){this.shelterRoot=new THREE.Group();this.root.add(this.shelterRoot);texturedBox(1.7,.06,1.1,surface('timber','#625b47'),0,.04,0,this.shelterRoot);box(.6,.16,.65,'#77715e',.6,.15,.2,this.shelterRoot);world.mergeDetails(this.shelterRoot);}
  this.shelterRoot.position.set(this.shelter.position.x,0,this.shelter.position.z);this.shelterRoot.visible=false;this.root.visible=true;this.waterRoot.position.set(this.hydrant.position.x,0,this.hydrant.position.z);
 }
 // No arbitrary-coordinate fallback and no hazard removal: reject invalid authored pairs.
 validateLocations(){
  if(this.locationPlan)return;
  this.planner=new PostPlacementPlanner(this);const selected=this.planner.select(this.masamiSeed);this.locationPlan=selected.plan;this.routes=selected.routes;
  for(const [n,p]of [[this.mother,selected.plan.mother],[this.child,selected.plan.child],[this.male,selected.plan.man],[this.requester,selected.plan.requester],[this.evacuee,selected.plan.evacuee]]){n.position={...p};n.postAnchor={...p};}
  this.hydrant.position={...selected.plan.water};this.shelter.position={...selected.plan.shelter};
  this.childRubble.position.set(selected.plan.child.x,0,selected.plan.child.z);this.waterRoot.position.set(selected.plan.water.x,0,selected.plan.water.z);this.shelterRoot.position.set(selected.plan.shelter.x,0,selected.plan.shelter.z);
  this.syncActors();npcManager.grid.rebuild(npcManager.people);
  if(EVENT_DEBUG)console.info('Version 1.2 authored layout',this.locationPlan.mission1Set,this.locationPlan.mission2Set,this.locationPlan.mission3Set);
 }

 syncActors(){
  this.child.yaw=childUnitYaw14(this.child.position);if(this.childRubble)this.childRubble.rotation.y=this.child.yaw;
  if(!this.mother)return;this.mother.postBlastState='STATIC';this.child.postBlastState=this.childState;this.male.postBlastState=this.maleState==='MALE_DEAD'?'DEAD':'STATIC';this.wife.hiddenFromWorld=!(this.mission3Completed&&this.masamiRepositioned);
  this.requester.postBlastState='STATIC';this.evacuee.postBlastState=this.escorting?'ASSISTED':this.mission3Completed||this.missions[2].state===POST_MISSION_STATES.M3_ARRIVED?'STATIC':'DOWN';this.evacuee.supported=this.escorting;
  if(this.shelterRoot)this.shelterRoot.visible=this.mission2Completed;
  for(const n of [this.mother,this.child,this.male,this.requester,this.evacuee,this.wife]){if(['DEAD','CHILD_DEAD'].includes(n.postBlastState))n.conversing=false;n.moving=false;n.eventTilt=n.postRole==='evacuee'?(this.escorting?.12:this.evacuee.postBlastState==='DOWN'?1.1:.55):n.postBlastState==='DEAD'?1.12:n.postRole==='child'?.18:n.postRole==='male'?.6:.1;npcManager.visuals.write(n,!n.hiddenFromWorld&&Math.hypot(n.position.x-pos.x,n.position.z-pos.z)<(n===this.wife?14:world.visibleDistance));}npcManager.visuals.flush();
 }
 setState(index,state){this.missions[index].state=state;this.trace.push({state,at:this.clock});this.render();}
 render(){if(worldState===WORLD_STATE.POST_BLAST)missionController.render();}
 objective(){
  const s=POST_MISSION_STATES,a=this.missions[0].state,b=this.missions[1].state;
  if(this.canAskMasami)return {text:'マサミを探す',hint:survival.postClue?.text||'通れる道を確かめ、街の人に尋ねる'};
  if(a===s.M1_INACTIVE)return {text:'周囲を確かめ、人の声を探す',hint:`${masamiBearing(pos,this.mother.position)}の方で、人の声を探す`};
  if(a===s.M1_ACTIVE||a===s.M1_CHILD_FOUND)return {text:'母親の子どもを探す',hint:this.directionHint(this.mother.position,this.child.position)+'。傾いた梁の残る瓦礫を確かめる'};
  if(a===s.M1_RETURN)return {text:'母親のもとへ戻る',hint:'子どものことを母親に伝える'};
  if(b===s.M2_INACTIVE)return {text:'水を求める人を探す',hint:`母親のいた場所から${masamiBearing(this.mother.position,this.male.position)}の方で、人の声を探す`};
  if(b===s.M2_ACTIVE)return {text:'水を探す',hint:this.directionHint(this.male.position,this.hydrant.position)+'。破損した住宅給水管の水音を探す'};
  if(!this.mission2Completed)return {text:'男性のもとへ水を届ける',hint:'水を求めていた男性のもとへ戻る'};
  const c=this.missions[2].state;
  if(c===s.M3_INACTIVE)return {text:'助けを求める人を探す',hint:this.directionHint(pos,this.requester.position)};
  if(c===s.M3_ACTIVE)return {text:'生きる道 — 動けない人を探す',hint:this.directionHint(this.requester.position,this.evacuee.position)};
  if(c===s.M3_ESCORT)return {text:'生きる道 — 支えて避難する',hint:this.directionHint(pos,this.shelter.position)+'。走らず、歩幅を合わせる'};
  return {text:'避難した人の様子を確かめる',hint:'今、火と煙の少ない空地で話す'};
 }
 directionHint(from,to){return `${masamiBearing(from,to)}の方へ`+(placementSide(from)!==placementSide(to)?'。御幸橋を渡る道を確かめる':'。通れる路地を確かめる');}
 markerTarget(){const s=POST_MISSION_STATES,a=this.missions[0].state,b=this.missions[1].state,c=this.missions[2].state;if(this.canAskMasami)return null;if([s.M1_INACTIVE,s.M1_RETURN].includes(a))return this.mother;if(this.mission1Completed&&!this.mission2Completed&&[s.M2_INACTIVE,s.M2_RETURN,s.M2_WATER_COLLECTED].includes(b))return this.male;if(this.mission2Completed&&!this.mission3Completed)return c===s.M3_INACTIVE?this.requester:c===s.M3_ACTIVE?this.evacuee:this.shelter;return null;}

 propTarget(p){if(this.missions[2].state===POST_MISSION_STATES.M3_ARRIVED&&Math.hypot(p.x-this.shelter.position.x,p.z-this.shelter.position.z)<3.1)return this.shelter;return this.missions[1].state===POST_MISSION_STATES.M2_ACTIVE&&Math.hypot(p.x-this.hydrant.position.x,p.z-this.hydrant.position.z)<3.1?this.hydrant:null;}
 actionLabel(n){if(n.kind==='shelter')return '様子を確かめる';if(n.postRole==='evacuee'&&this.missions[2].state===POST_MISSION_STATES.M3_ACTIVE)return '支える';if(n.isProp)return '水を汲む';if(n.postRole==='child')return this.childState==='CHILD_TRAPPED'&&[POST_MISSION_STATES.M1_ACTIVE,POST_MISSION_STATES.M1_CHILD_FOUND].includes(this.missions[0].state)?'助ける':'確認する';if(n.postBlastState==='DEAD'||n.postBlastState==='DOWN')return '確認する';return '話す';}
 cloneNode(node){
  const copy={...node,pages:[...node.pages],choices:node.choices?.map(c=>({...c}))||[]};
  if(!this.locationPlan)return copy;
  if(copy.id==='post-rescue-offer')copy.pages.splice(1,0,`「ここから${masamiBearing(this.requester.position,this.evacuee.position)}の方です。崩れた家のそばで、動けずにいます。」`);
  if(copy.id==='post-rescue-accepted')copy.pages[1]=placementSide(this.requester.position)!==placementSide(this.evacuee.position)?'「御幸橋を渡った向こう側です。どうか、あの人をお願いします。」':'「この先の路地です。火のない道から……どうか、お願いします。」';
  if(copy.id==='post-rescue-supporting')copy.pages.push(`一雄「${masamiBearing(this.evacuee.position,this.shelter.position)}の方に、煙の薄い空地がある。${placementSide(this.evacuee.position)!==placementSide(this.shelter.position)?'御幸橋を渡ろう。':'そこまで行こう。'}」`);
  const child=masamiBearing(this.mother.position,this.child.position),water=masamiBearing(this.male.position,this.hydrant.position),man=masamiBearing(this.mother.position,this.male.position);
  const replacements={
   'post-mother-offer':[`${child}の方で、子どもを見失ったんです。傾いた梁の残る瓦礫の辺りです。`,'お願いです。あの辺りを、探してもらえませんか。'],
   'post-child-accepted':['一雄「分かりました。通れる道から探してきます。」',`「${this.directionHint(this.mother.position,this.child.position)}。傾いた梁を、目印にしてください。」`],
   'post-mother-waiting':[`${child}の方に、傾いた梁の瓦礫があります。`,'……どうか、あの子を。'],
   'post-mother-waiting-2':['あの辺りに、梁が傾いて残っているんです。',`${child}の方です。火のない方から……。`],
   'post-mother-report':['一雄「瓦礫の下で、見つけました。」',...copy.pages.slice(1)],
   'post-mother-after':['母親は、子どものいた方を見つめている。',`${man}の方で、水を求めている人がいるようだ。`],
   'post-male-offer':['「水……水を……。」',`${water}の方の道から、破損した住宅給水管の水音がする。`],
   'post-water-accepted':['一雄「水を探してくる。ここで待っていてくれ。」',this.directionHint(this.male.position,this.hydrant.position)+'。水音を確かめよう。'],
   'post-male-waiting-3':['男性の呼吸が、わずかに聞こえる。',`${water}の道の水音を確かめよう。`]
  };
  if(replacements[copy.id])copy.pages=replacements[copy.id];return copy;
 }
 variant(key){const pool=POST_ROLE_VARIANTS[key],index=this.dialogueCounters[key]||0;this.dialogueCounters[key]=index+1;return this.cloneNode(pool[index%pool.length]);}
 nodeFor(n){const s=POST_MISSION_STATES,a=this.missions[0].state,b=this.missions[1].state;
  if(n.kind==='shelter')return this.cloneNode(this.missions[2].state===s.M3_ARRIVED?RESCUE_SCENES.arrived:RESCUE_SCENES.after);
  if(n.postRole==='rescue-giver')return this.cloneNode(!this.mission2Completed?RESCUE_SCENES.early:this.missions[2].state===s.M3_INACTIVE?RESCUE_SCENES.offer:this.mission3Completed?RESCUE_SCENES.after:RESCUE_SCENES.waiting);
  if(n.postRole==='evacuee')return this.cloneNode(this.missions[2].state===s.M3_ACTIVE?RESCUE_SCENES.patient:this.escorting?RESCUE_SCENES.moving:this.missions[2].state===s.M3_ARRIVED?RESCUE_SCENES.arrived:this.mission3Completed?RESCUE_SCENES.after:RESCUE_SCENES.patientEarly);
  if(n.isProp)return this.cloneNode(POST_SCENES.hydrant);
  if(n.postRole==='mother'){if(a===s.M1_INACTIVE)return this.cloneNode(POST_SCENES.motherOffer);if(a===s.M1_RETURN)return this.cloneNode(POST_SCENES.motherReport);return this.variant(this.mission1Completed?'motherAfter':'motherWaiting');}
  if(n.postRole==='child'){if(a===s.M1_ACTIVE||a===s.M1_CHILD_FOUND){if(this.childState==='CHILD_TRAPPED'){this.setState(0,s.M1_CHILD_FOUND);return this.cloneNode(POST_SCENES.rescue);}return this.cloneNode(POST_SCENES.childCheck);}return this.cloneNode({id:'post-child-inactive',pages:['瓦礫の下に、小さな人影がある。','近くにいる人の話を確かめよう。']});}
  if(n.postRole==='male'){if(!this.mission1Completed)return this.variant('maleEarly');if(b===s.M2_INACTIVE)return this.cloneNode(POST_SCENES.maleOffer);if(this.maleState==='MALE_DEAD')return this.cloneNode(this.waterCollected&&!this.mission2Completed?POST_SCENES.maleConfirm:this.mission2Completed?POST_SCENES.maleAfter:POST_SCENES.maleDeadEarly);return this.variant('maleWaiting');}
  if(n.postBlastState==='DOWN'||n.postBlastState==='DEAD')return this.cloneNode(n.postBlastState==='DOWN'?POST_SCENES.down:{id:'post-still',pages:['呼びかけに、応答はなかった。']});return null;
 }
 choose(action){const s=POST_MISSION_STATES;
  if(action==='post-accept-rescue'&&this.mission2Completed&&this.missions[2].state===s.M3_INACTIVE){this.phase=s.M3_ACTIVE;this.setState(2,s.M3_ACTIVE);this.saveCheckpoint();return this.cloneNode(RESCUE_SCENES.accepted);}
  if(action==='post-support-patient'&&this.missions[2].state===s.M3_ACTIVE){const route=(this.planner?.catalog||new PostRouteCatalog()).route(this.evacuee.position,pos);if(!route.length)return this.cloneNode({id:'post-rescue-approach',pages:['一雄「もう少し近づく。そこを動かんでくれ。」']});this.escorting=true;this.escortTrail=route.slice(1);this.evacuee.supported=true;this.phase=s.M3_ESCORT;this.setState(2,s.M3_ESCORT);survival.releaseRun();this.syncActors();this.saveCheckpoint();return this.cloneNode(RESCUE_SCENES.supporting);}
  if(action==='post-accept-child'&&this.missions[0].state===s.M1_INACTIVE){this.phase=s.M1_ACTIVE;this.setState(0,s.M1_ACTIVE);this.saveCheckpoint();return this.cloneNode(POST_SCENES.childAccepted);}
  if(action==='post-accept-water'&&this.mission1Completed&&this.missions[1].state===s.M2_INACTIVE){this.phase=s.M2_ACTIVE;this.setState(1,s.M2_ACTIVE);this.maleState='MALE_WAITING';this.saveCheckpoint();return this.cloneNode(POST_SCENES.waterAccepted);}
  if(action==='post-collect-water'&&this.missions[1].state===s.M2_ACTIVE){this.waterCollected=true;this.maleState='MALE_DEAD';this.setState(1,s.M2_WATER_COLLECTED);this.syncActors();return this.cloneNode(POST_SCENES.collected);}return null;
 }
 page(node,index){if(node.id==='post-rescue'){this.rescuing=index>=2&&index<=3;if(index>=4&&this.childState!=='CHILD_DEAD'){this.childState='CHILD_DEAD';this.syncActors();}}}
 finish(node,readAll){const s=POST_MISSION_STATES;this.rescuing=false;
  if(node?.id==='post-rescue-arrived'&&readAll&&this.mission2Completed&&this.missions[2].state===s.M3_ARRIVED&&!this.mission3Completed){this.mission3Completed=true;this.setState(2,s.M3_COMPLETED);this.repositionMasami();this.saveCheckpoint();}
  if(this.childState==='CHILD_DEAD'&&[s.M1_ACTIVE,s.M1_CHILD_FOUND].includes(this.missions[0].state))this.setState(0,s.M1_RETURN);
  if(node?.id==='post-mother-report'&&readAll&&!this.mission1Completed){this.mission1Completed=true;this.phase=s.M1_COMPLETED;this.setState(0,s.M1_COMPLETED);this.saveCheckpoint();}
  if(this.waterCollected&&this.missions[1].state===s.M2_WATER_COLLECTED)this.setState(1,s.M2_RETURN);
  if(node?.id==='post-male-confirm'&&readAll&&this.mission1Completed&&this.waterCollected&&!this.mission2Completed){this.mission2Completed=true;this.phase=s.M2_COMPLETED;this.setState(1,s.M2_COMPLETED);this.syncActors();this.render();this.saveCheckpoint();}
 }
 // Runs once after the post-blast hazards and mission actor positions are settled.
 prepareMasamiSearch(){
  if(!this.mission3Completed)return false;if(this.masamiSearch)return true;
  this.finalPlanner=new PostPlacementPlanner(this,true);const used=this.locationPlan.siteIds.map(id=>this.finalPlanner.sites.get(id));
  const pool=this.finalPlanner.masamiCandidates(pos,used),rng=placementRandom(this.masamiSeed^0x4d415341),last=this.finalPlanner.history('hiroshima.lastMasamiSpawnId'),preferred=this.locationPlan.placementPolicy?.masamiSide,c=placementDraw(preferred?pool.filter(q=>q.side===preferred):pool,preferred?{E:preferred==='E'?1:0,W:preferred==='W'?1:0}:{E:.5,W:.5},rng,last)||placementDraw(pool,{E:.5,W:.5},rng,last);
  if(!c)throw Error('No reachable final-search site after mission 3');if(preferred&&c.side!==preferred)this.locationPlan.placementPolicy.fallbacks.push({mission:'masami',requested:preferred,actual:c.side,reason:'Preferred bank unavailable from actual completion position'});
  this.masamiSearch={id:c.id,position:{...c.position},side:c.side,region:c.side==='E'?'京橋川東岸側':'京橋川西岸側',coverType:c.coverType,routeLength:c.routeLength};
  this.wife.position={...c.position};this.wife.postAnchor={...c.position};this.wife.hiddenFromWorld=true;this.wife.postBlastState='MISSING';this.wife.moving=false;
  this.finalPlanner.remember('hiroshima.lastMasamiSpawnId',c.id);return true;
 }

 repositionMasami(){if(!this.mission1Completed||!this.mission2Completed||!this.mission3Completed||this.masamiRepositioned)return false;
  if(!this.masamiSearch&&!this.prepareMasamiSearch())return false;
  const p=this.masamiSearch.position;
  // M3 is complete; select and reveal far away once, then keep this identity and position fixed.
  if(Math.hypot(p.x-pos.x,p.z-pos.z)<MASAMI_SEARCH_RULES.minimumDistance)return false;
  const route=hazards.findRoute(pos,p);if(!route.length)return false;
  hazards.addFinalArea(pos,p);this.masamiRoute=hazards.addFinalCover(pos,p);
  if(!this.masamiRoute.length)throw Error('Masami search route blocked');
  this.wife.hiddenFromWorld=false;this.wife.postBlastState='SEARCHING';this.masamiRepositioned=true;this.repositionCount++;this.phase=POST_MISSION_STATES.FIND_MASAMI;storyController.state=MAIN_OBJECTIVES.POST_BLAST_FIND_MASAMI;
  this.trace.push({state:this.phase,at:this.clock});npcManager.grid.rebuild(npcManager.people);this.syncActors();this.planner=null;this.finalPlanner=null;survival.postClue=null;this.render();return true;
 }

 canEscortMove(x,z){if(!this.escorting)return true;const p=this.evacuee.position,next=Math.hypot(x-p.x,z-p.z),now=Math.hypot(pos.x-p.x,pos.z-p.z);return next<=POST_PLACEMENT_CONFIG.escortLeash||next<=now+.00001;}
 updateEscort(dt){
  const n=this.evacuee,trail=this.escortTrail,last=trail.at(-1)||n.position;
  if(Math.hypot(last.x-pos.x,last.z-pos.z)>.10)trail.push({x:pos.x,z:pos.z});
  while(trail.length&&Math.hypot(trail[0].x-n.position.x,trail[0].z-n.position.z)<.07)trail.shift();
  n.moving=false;const q=trail[0];
  if(q){const dx=q.x-n.position.x,dz=q.z-n.position.z,d=Math.hypot(dx,dz),allowance=trail.length>1?d:Math.max(0,d-POST_PLACEMENT_CONFIG.escortGap),step=Math.min(allowance,PLAYER_WALK_SPEED*POST_PLACEMENT_CONFIG.escortSpeedScale*1.12*dt),x=n.position.x+(d?dx/d:0)*step,z=n.position.z+(d?dz/d:0)*step;
   const free=(x,z)=>worldAllowed(x,z)&&(Math.hypot(x-pos.x,z-pos.z)>=.74||Math.hypot(x-pos.x,z-pos.z)>Math.hypot(n.position.x-pos.x,n.position.z-pos.z)+.0001)&&!npcManager.grid.query(x,z,.65).some(o=>o!==n&&!o.hiddenFromWorld&&Math.hypot(o.position.x-x,o.position.z-z)<.61);
   if(step>.00001&&free(x,z)&&npcManager.navigation.segmentClear(n.position,{x,z})){n.position.x=x;n.position.z=z;n.yaw=Math.atan2(-dx,-dz);n.phase+=dt*3;n.moving=true;this.escortBlocked=0;npcManager.grid.move(n);}
   else if(step>.00001){this.escortBlocked+=dt;if(this.escortBlocked>1){const anchors=[0,.7,-.7,1.4,-1.4].map(a=>({x:pos.x+Math.sin(yaw+a)*.95,z:pos.z+Math.cos(yaw+a)*.95}));for(const goal of anchors){if(!free(goal.x,goal.z))continue;const path=npcManager.navigation.findPath(n.position,goal,free,700);if(path?.length){// Navigation paths begin at a reachable grid point, not at the actor. Keep it when recovering around corners.
this.escortTrail=path;break;}}this.escortBlocked=0;}}
  }
  n.eventTilt=.12;n.eventRoll=0;n.supported=true;npcManager.visuals.write(n,true);npcManager.visuals.flush();
  const target=this.shelter.position,smoke=hazards.sample(target.x,target.z);
  if(Math.hypot(pos.x-target.x,pos.z-target.z)<2&&Math.hypot(n.position.x-target.x,n.position.z-target.z)<2.5&&smoke.heat<48&&smoke.smoke<=.01){
   this.escorting=false;n.supported=false;n.moving=false;n.postAnchor={...n.position};this.phase=POST_MISSION_STATES.M3_ARRIVED;this.setState(2,POST_MISSION_STATES.M3_ARRIVED);stop();player.rotation.z=0;this.syncActors();this.saveCheckpoint();
  }
 }

 update(dt){this.clock+=dt;if(this.missions[1].state===POST_MISSION_STATES.M2_ACTIVE&&this.maleState==='MALE_WAITING'&&Math.hypot(pos.x-this.male.position.x,pos.z-this.male.position.z)>12){this.maleState='MALE_DEAD';this.syncActors();}
  if(this.rescuing&&dialogue.active?.postRole==='child'){arms.forEach(a=>a.rotation.x=-1.15);player.rotation.x=.18;}else if(player.rotation.x&&playerControlEnabled)player.rotation.x=0;
  if(this.escorting)this.updateEscort(dt);
  if(this.water)this.water.scale.y=1+.06*Math.sin(this.clock*5);
 }
 serial(){return {locationPlan:this.locationPlan?JSON.parse(JSON.stringify(this.locationPlan)):null,masamiSeed:this.masamiSeed,masamiSearch:this.masamiSearch?{...this.masamiSearch,position:{...this.masamiSearch.position}}:null,missions:this.missions.map(m=>({...m})),mission1Completed:this.mission1Completed,mission2Completed:this.mission2Completed,mission3Completed:this.mission3Completed,escorting:this.escorting,escortTrail:this.escortTrail.map(p=>({...p})),waterCollected:this.waterCollected,childState:this.childState,maleState:this.maleState,masamiRepositioned:this.masamiRepositioned,repositionCount:this.repositionCount,phase:this.phase,trace:this.trace.map(t=>({...t}))};}
 saveCheckpoint(){if(!survival.active)return;this.checkpointState=this.serial();survival.checkpoint={position:{...pos},yaw,cameraYaw,npcs:npcManager.people.map(n=>({id:n.id,position:{...n.position},yaw:n.yaw,postBlastState:n.postBlastState,hiddenFromWorld:!!n.hiddenFromWorld})),storyPhase:storyController.state};}
 restoreCheckpoint(){if(!this.checkpointState)return;Object.assign(this,JSON.parse(JSON.stringify(this.checkpointState)));this.rescuing=false;this.escortBlocked=0;this.syncActors();npcManager.grid.rebuild(npcManager.people);}
 snapshot(){return {...this.serial(),routes:Object.fromEntries(Object.entries(this.routes).map(([k,v])=>[k,v.length])),masamiPosition:this.masamiRepositioned?{...this.wife.position}:null};}
}
const postMissions=new PostMissionController();

function childUnitYaw14(p){let selected=0,best=-1;for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){let score=0;for(const [x,z]of [[0,1.25],[.4,1.05],[-.4,1.05],[0,1.7],[.7,.5],[-.7,.5],[.65,-.2],[-.65,-.2]])if(worldAllowed(p.x+x*Math.cos(angle)+z*Math.sin(angle),p.z-x*Math.sin(angle)+z*Math.cos(angle)))score++;if(score>best){best=score;selected=angle;}}return selected;}
