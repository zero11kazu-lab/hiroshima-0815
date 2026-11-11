// Reusable new-game, dialogue and both-ending regression. No deployment or game mutation outside this browser.
const{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.GAME_TEST_URL||'http://127.0.0.1:8091/?debug=1');await p.locator('#start').tap();await p.waitForFunction(()=>started&&gameClock);await p.evaluate(()=>started=false);
const random=await p.evaluate(()=>{const counts={A:0,B:0},patterns={},rngs=[];for(let i=0;i<1000;i++){const plan=drawEndingPlan();counts[plan.branch]++;patterns[plan.patternId]=(patterns[plan.patternId]||0)+1;}for(const x of [0,.499999,.5,.999999]){let i=0;const a=[x,.99999];rngs.push(drawEndingPlan(()=>a[i++]));}return {counts,patterns,rngs,p:ENDING_CONFIG.masamiDeathProbability};});assert.equal(random.p,.5);assert(random.counts.A>400&&random.counts.A<600);assert.equal(Object.keys(random.patterns).length,10);assert.deepEqual(random.rngs.map(x=>x.branch),['A','A','B','B']);
const resets=await p.evaluate(()=>{const plays=[];for(let i=0;i<24;i++){reset();const plan=ending.plan,site=storyLayout.selectedId,n=missionController.person(PLAYER_PROFILE.spouseId),at={...n.position};for(let j=0;j<100;j++)npcManager.update(.04,pos,gameClock.seconds);if(ending.plan!==plan||Math.hypot(n.position.x-at.x,n.position.z-at.z)>.01)throw Error('In-play redraw/movement');plays.push({site,side:n.position.x>50?'east':'west',ending:plan.patternId,position:at});}return plays;});assert(resets.every((p,i)=>!i||p.site!==resets[i-1].site));assert(new Set(resets.map(p=>p.site)).size>=8);assert.equal(new Set(resets.map(p=>p.side)).size,2);
const sites=await p.evaluate(()=>preMasamiCandidates().map(s=>({id:s.id,length:s.length,side:s.side,position:s.position,open:worldAllowed(s.position.x,s.position.z),segments:s.path.every((q,i)=>!i||npcManager.navigation.segmentClear(s.path[i-1],q))})));assert.equal(sites.length,20);assert(sites.every(s=>s.open&&s.segments&&s.length>=55&&s.length<=240));
const visits=[];await p.evaluate(()=>{reset();const w=missionController.person(PLAYER_PROFILE.spouseId);pos.x=w.position.x+.7;pos.z=w.position.z;player.position.set(pos.x,.08,pos.z);});
for(let i=0;i<24;i++){
 await p.evaluate(()=>{dialogue.elapsed=1;dialogue.update(0);dialogue.target=missionController.person(PLAYER_PROFILE.spouseId);});await p.locator('#talk').tap();
 const node=await p.evaluate(()=>({id:dialogue.node.id,pages:[...dialogue.node.pages],text:$('dialogue-text').textContent,count:dialogue.node.pages.length}));assert(node.pages.length>=4&&node.pages.length<=10);assert.equal(node.text,node.pages[0]);if(i<9)assert.equal(node.id,`masami-pre-${String(i+1).padStart(2,'0')}`);else assert.notEqual(node.id,visits.at(-1).id);
 for(let j=0;j<node.count;j++)await p.locator('#dialogue-next').tap();assert(await p.locator('#conversation').isHidden());visits.push(node);
}
const interrupt=await p.evaluate(()=>{const w=missionController.person(PLAYER_PROFILE.spouseId);dialogue.target=w;dialogue.open();gameClock.seconds=29699;const before=gameClock.seconds;gameClock.update(.2,true);return {before,after:gameClock.seconds,active:event0815.active,conversation:!!dialogue.active};});assert.equal(interrupt.after,29700);assert(interrupt.active&&!interrupt.conversation);
const checkpoint=await p.evaluate(()=>{event0815.elapsed=event0815.postStartTime;event0815.apply();const plan=ending.plan,pre=storyLayout.selectedId,post=postMissions.locationPlan;survival.fail();survival.restart();started=false;return {same:ending.plan===plan,pre:storyLayout.selectedId===pre,post:JSON.stringify(postMissions.locationPlan)===JSON.stringify(post)};});assert(checkpoint.same&&checkpoint.pre&&checkpoint.post);
const resetTaps=[];for(let i=0;i<4;i++){await p.evaluate(()=>{window.beforeResetPlan=ending.plan;window.beforeResetSite=storyLayout.selectedId;});await p.locator('#reset').tap();resetTaps.push(await p.evaluate(()=>({drawn:ending.plan!==window.beforeResetPlan,siteChanged:storyLayout.selectedId!==window.beforeResetSite})));}assert(resetTaps.every(x=>x.drawn&&x.siteChanged));
const floating=await p.evaluate(()=>{const out=[];for(let i=0;i<6;i++){reset();on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();const plan=postMissions.locationPlan;postMissions.choose('post-accept-child');const rescue=postMissions.nodeFor(postMissions.child);for(let page=0;page<rescue.pages.length;page++){postMissions.page(rescue,page);if(postMissions.childSmoke)throw Error('Faceted hovering smoke still generated');const q=postMissions.childRubble.position;if(q.x!==plan.child.x||q.z!==plan.child.z)throw Error('Rubble moved away from child');}postMissions.finish(rescue,true);if(postMissions.childState!=='CHILD_DEAD'||postMissions.missions[0].state!==POST_MISSION_STATES.M1_RETURN)throw Error('Rescue progress broken');out.push({set:plan.mission1Set,props:postMissions.root.children.length});}return out;});assert(new Set(floating.map(x=>x.set)).size>1);
const variants=[];
for(const branch of ['A','B'])for(let pattern=0;pattern<5;pattern++){
 const out=await p.evaluate(({branch,pattern})=>{ending.reset();ending.testPlan(branch,pattern);ending.begin();const patient=branch==='A'?'masami':'kazuo',name=branch==='A'?'マサミ':'一雄',caregiver=branch==='A'?'一雄':'マサミ';const plan=ending.plan,trace=[];
 for(let i=0;i<ENDING_STATES.length;i++){
  ending.render();trace.push(ending.state);if(ending.state==='RADIATION_EXPLANATION'&&(!ending.radiationText.at(-2).includes(name)||!ending.radiationText.at(-1).includes(caregiver)))throw Error('Wrong illness narration');
  if(ending.state==='MASAMI_FINAL_DIALOGUE'){
   let time=0;for(const line of ending.dialogueLines){ending.time=time+.1;ending.render();if($('ending-text').textContent!==line.text)throw Error('Wrong dialogue timing');time+=line.seconds;}
   if(ending.patientId!==patient||ending.patientRoot.rotation.x!==-Math.PI/2||ending.caregiverRoot.rotation.x!==0)throw Error('Cast reversed');
   scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(ending.patientModel);if(bounds.min.y<-99.9||bounds.max.y>-98.8)throw Error('Patient floating or buried '+JSON.stringify(bounds));
  }
  if(ending.state==='MASAMI_DEATH'){
   for(const t of [0,2.9,3,5,7,9.2]){ending.time=t;ending.render();if(t>=3&&ending.deceasedId!==patient)throw Error('Wrong death');}
   if(!$('ending-text').textContent.includes(`${name}は、${caregiver}に見守られながら`))throw Error('Wrong death caption');
   const chest=ending.patientChest.scale.z;ending.time=11;ending.render();if(chest!==ending.patientChest.scale.z)throw Error('Breathing after death');
  }
  if(ending.state==='KAZUO_GRIEF'&&!$('ending-text').textContent.startsWith(caregiver))throw Error('Wrong survivor');
  if(ending.state==='MEMORIAL'){ending.time=3;ending.render();if(branch==='A'&&$('ending-text').textContent!==MEMORIAL_MESSAGE)throw Error('Original monologue changed');if(branch==='B'&&$('ending-text').textContent===MEMORIAL_MESSAGE)throw Error('Dead speaker monologue');}
  if(ending.plan!==plan)throw Error('Mid-ending redraw');
  if(i<ENDING_STATES.length-1){ending.time=0;ending.update(ending.durations[i]+.001);}
 }
 ending.time=5;ending.render();if($('ending-text').textContent!=='【完】'||$('ending-return-title').disabled)throw Error('No final/title button');
 return {branch,pattern:ending.plan.patternId,patient:ending.deceasedId,trace,text:$('ending-text').textContent};},{branch,pattern});variants.push(out);
 if(pattern===0){await p.evaluate(()=>{ending.jump('MASAMI_FINAL_DIALOGUE');ending.time=4;ending.render();renderer.render(scene,camera);});await p.screenshot({path:`/tmp/ending-${branch}-room.png`});await p.evaluate(()=>{ending.jump('MASAMI_DEATH');ending.time=10;ending.render();renderer.render(scene,camera);});await p.screenshot({path:`/tmp/ending-${branch}-death.png`});}
}
assert.deepEqual(errors,[]);console.log(JSON.stringify({PASS:true,random,resets,sites,visits:visits.map(n=>n.id),interrupt,checkpoint,resetTaps,floating,variants,errors}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
