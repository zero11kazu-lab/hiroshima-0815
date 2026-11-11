const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],runs=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(let run=0;run<12;run++){
  await page.goto(process.env.GAME_TEST_URL||'http://127.0.0.1:8086/?debug=1');await page.click('#start');await page.waitForFunction(()=>!!gameClock);
  const result=await page.evaluate(forcedIndex=>{
   started=false;on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();
   const search=postMissions.masamiSearch,initial={...postMissions.wife.position};
   if(!postMissions.wife.hiddenFromWorld||postMissions.wife.postBlastState!=='MISSING')throw Error('Search NPC revealed early');
   const audit=MASAMI_SEARCH_CANDIDATES.map(c=>{const r=hazards.findRoute(postMissions.male.position,c.position),sample=hazards.sample(c.position.x,c.position.z);return {id:c.id,walkable:worldAllowed(c.position.x,c.position.z),route:r.length,heat:sample.heat,smoke:sample.smoke};});
   // Mission 2 ends beside the male NPC, rather than at the initial blast location.
   pos.x=postMissions.male.position.x;pos.z=postMissions.male.position.z+1;
   postMissions.mission1Completed=true;postMissions.waterCollected=true;postMissions.maleState='MALE_DEAD';postMissions.finish({id:'post-male-confirm'},true);
   if(!postMissions.masamiRepositioned)throw Error('Mission progression did not reveal Masami');
   if(JSON.stringify(initial)!==JSON.stringify(postMissions.wife.position))throw Error('NPC teleported at reveal');
   const distance=Math.hypot(pos.x-initial.x,pos.z-initial.z),route=hazards.findRoute(pos,initial);
   if(!route.length||!hazards.finalCover.children.length||!hazards.fires.some(f=>f.finalArea))throw Error('Missing route or final cover/hazards');
   if(npcManager.navigation.segmentClear(pos,initial))throw Error('Unobstructed approach');
   const bearings=[[0,-1,'北'],[1,-1,'北東'],[1,0,'東'],[1,1,'南東'],[0,1,'南'],[-1,1,'南西'],[-1,0,'西'],[-1,-1,'北西']];
   for(const [x,z,name]of bearings)if(masamiBearing({x:0,z:0},{x,z})!==name)throw Error('Compass mismatch');
   const lines=npcManager.people.filter(n=>n.id!==PLAYER_PROFILE.spouseId).map(n=>{
    const info=postMasamiInformation(n),expected=masamiBearing(n.position,initial);
    if(!info.pages.join('').includes(expected))throw Error('Contradictory testimony');
    if(JSON.stringify(info)!==JSON.stringify(postMasamiInformation(n)))throw Error('Unstable testimony');
    return info.pages.join('');
   });
   // Retry restores the same seed and target, without rerolling or adding final fires again.
   const saved=JSON.stringify(postMissions.masamiSearch),seed=postMissions.masamiSeed,fireCount=hazards.fires.length;
   postMissions.restoreCheckpoint();postMissions.repositionMasami();
   if(saved!==JSON.stringify(postMissions.masamiSearch)||seed!==postMissions.masamiSeed||fireCount!==hazards.fires.length||postMissions.repositionCount!==1)throw Error('Retry changed search');
   if(!postMissions.markerTarget()&&$('objective-guide').hidden===false)throw Error('Search direction marker leaked');
   pos.x=initial.x;pos.z=initial.z+1;aftermath.update(.016,.016);
   const states=[];if(!ending.active)throw Error('Reunion did not trigger');
   for(let i=0;i<ENDING_STATES.length;i++){ending.render();states.push(ending.state);ending.update(ending.durations[ending.index]+.001);}
   return {id:search.id,position:initial,distance,routeLength:search.routeLength,route:route.length,cover:hazards.finalCover.children.length,audit,lines,states};
  },null);
  assert(result.distance>=45);assert(result.routeLength>=95&&result.routeLength<=145);
  assert(result.audit.some(c=>c.id===result.id&&c.walkable&&c.route>0&&c.heat<=22&&c.smoke<=.08),'Selected candidate quality audit failed');
  assert.equal(result.states.at(-1),'THE_END');if(runs.length)assert.notEqual(result.id,runs.at(-1).id,'Consecutive location repeated');
  runs.push(result);console.log(`Run ${run+1}: ${result.id}; distance ${result.distance.toFixed(1)}; route ${result.routeLength.toFixed(1)}; cover ${result.cover}; ending OK`);
 }
 assert(new Set(runs.map(r=>r.id)).size>=3);assert(new Set(runs.map(r=>r.lines[0])).size>1);assert.deepEqual(errors,[]);

 console.log('PASS: 12 restarts, all 12 candidates evaluated; selected site validated each time; stable checkpoints, consistent eight-way testimony, reunion through THE_END; unique sites:',new Set(runs.map(r=>r.id)).size);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
