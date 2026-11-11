// Additive-field regression: real controller movement, old-data protection and bounded effects.
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await page.goto(process.env.GAME_TEST_URL||'http://127.0.0.1:8097/?debug=1');await page.click('#start');await page.waitForFunction(()=>started);await page.evaluate(()=>started=false);
  const result=await page.evaluate(()=>{
   const require=(v,message)=>{if(!v)throw Error(message);},base=HISTORICAL_DATA;
   require(JSON.stringify(WORLD_DATA.buildings.slice(0,37))===JSON.stringify([...base.buildings_1945,...base.landmarks_1945]),'Existing buildings changed');
   require(JSON.stringify(WORLD_DATA.roads.slice(0,8))===JSON.stringify(base.roads_1945),'Existing roads changed');
   require(JSON.stringify(GEO1945.rivers.slice(0,2))===JSON.stringify(base.world_1945.rivers),'Existing river vertices changed');
   require(npcManager.people[24].id==='masami_nishimoto'&&npcManager.people.length===29,'Existing character indices changed');
   const ids=a=>new Set(a.map(x=>x.id)).size===a.length;
   require(ids(WORLD_DATA.buildings)&&ids(WORLD_DATA.roads)&&ids(npcManager.people),'Duplicate data');
   for(const b of FIELD_EXPANSION.buildings){const o=FIELD_EXPANSION.baseBounds;require(b.x-b.w/2>o.maxX||b.z-b.d/2>o.maxZ||b.z+b.d/2<o.minZ,'New building intersects old district');}
   for(const [i,a]of FIELD_EXPANSION.buildings.entries())for(const b of FIELD_EXPANSION.buildings.slice(i+1))require(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.z-b.z)>=(a.d+b.d)/2,'New houses overlap');
   for(const r of FIELD_EXPANSION.riverPatches){const [x0,z0]=r.polygon[0],[x1]=r.polygon[1],z=r.id.endsWith('north')?-78.9:80.9;require(!geographicWalkable((x0+x1)/2,z),'River edge permits unbridged crossing');}
   require(!worldAllowed(1.2,-55)&&worldAllowed(4,-55),'Tram collision mismatch');
   for(const b of world.buildings){const roof=b.preBlastModel.children.find(m=>m.geometry?.type==='ExtrudeGeometry');if(roof){roof.geometry.computeBoundingBox();require(roof.geometry.boundingBox.max.z-roof.geometry.boundingBox.min.z<=b.data.d*1.5,'Roof outlier');}}
   function walk(target,post=false){const route=hazards.findRoute(pos,target);require(route.length,'No walking route to '+JSON.stringify(target));let i=0,f=0,maxHeat=0;while(i<route.length&&f++<16000){const q=route[i],dx=q.x-pos.x,dz=q.z-pos.z,d=Math.hypot(dx,dz);if(d<.32||(!allowed(q.x,q.z)&&d<2&&i<route.length-1&&npcManager.navigation.segmentClear(pos,route[i+1]))){i++;continue;}let ux=dx/d,uz=dz/d;for(const a of [0,.6,-.6,1.1,-1.1,1.6,-1.6]){const x=ux*Math.cos(a)-uz*Math.sin(a),z=ux*Math.sin(a)+uz*Math.cos(a);if(allowed(pos.x+x*.35,pos.z+z*.35)){ux=x;uz=z;break;}}const a=cameraYaw+cameraAvoidYaw;input.id=92;input.x=ux*Math.cos(a)-uz*Math.sin(a);input.y=ux*Math.sin(a)+uz*Math.cos(a);updatePlayer(1/30);if(post){survival.update(1/30);postNPCController.update(1/30);}else npcManager.update(1/30,pos,gameClock.seconds);maxHeat=Math.max(maxHeat,survival.heat);}
    stop();require(Math.hypot(pos.x-target.x,pos.z-target.z)<.8,'Controller stuck '+JSON.stringify({target,pos,i,f}));require(!survival.dead,'Died on designated bypass');return {target,routePoints:route.length,seconds:f/30,hp:survival.hp,maxHeat};}
   const trips=[];for(const target of [{x:0,z:-77},{x:0,z:35},{x:0,z:78},{x:0,z:35},{x:86,z:45},{x:86,z:-59},{x:86,z:74},{x:0,z:35}])trips.push(walk(target));
   // Trigger the unchanged 08:15 event while the player is in the added southern block.
   trips.push(walk({x:0,z:78}));on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();
   require(worldState===WORLD_STATE.POST_BLAST,'Blast transition failed');aftermath.update(30,30);started=false;
   for(const b of world.buildings.filter(b=>b.id.startsWith('v11-')))require(b.postBlastModel&&b.postDamage,'No extension damage variant');
   require(npcManager.people.slice(25).every(n=>n.postBlastState&&n.postBlastDialogue),'Missing extension survivor state/dialogue');
   require(FIELD_EXPANSION.fires.every(f=>hazards.fires.some(q=>q.id===f.id)),'Missing extension fire');
   const postTrips=[];for(const target of [{x:0,z:54},{x:86,z:45},{x:86,z:74},{x:0,z:54},{x:0,z:-77},{x:0,z:54}])postTrips.push(walk(target,true));
   // Flame/smoke use the existing damage calculation, never decorative-only hazards.
   const f=hazards.fires.find(f=>f.id==='v11-fire-9');pos.x=f.center.x+f.radius*.8;pos.z=f.center.z;survival.hp=100;survival.heat=0;survival.age=10;survival.update(1);require(survival.hp<100,'New flame has no damage');
   const damage=100-survival.hp;require(SURVIVAL_CONFIG.SMOKE_DAMAGE_RATIO===.6667,'Smoke ratio changed');
   let smokePoint=null;for(let x=90;x<110&&!smokePoint;x+=.5)for(let z=42;z<62;z+=.5){const s=hazards.sample(x,z);if(worldAllowed(x,z)&&s.contact===0&&s.heat<50&&s.smoke>.15){smokePoint={x,z,s};break;}}
   require(smokePoint,'No added smoke-only danger');Object.assign(pos,smokePoint);survival.hp=100;survival.heat=0;survival.age=10;survival.sampleDebt=1;survival.update(1);const smokeDamage=100-survival.hp;
   require(Math.abs(smokeDamage-smokePoint.s.smoke*36*.6667)<.001,'Smoke damage ratio mismatch');Object.assign(pos,{x:86,z:45});const hp=survival.hp;survival.sampleDebt=1;survival.update(.1);require(hazards.sample(pos.x,pos.z).smoke===0&&survival.hp===hp,'Smoke damage persists outside smoke');
   hazards.animate(1);require(hazards.fires.length*5<=400&&hazards.smokes.length*3<=320,'Effects capacity exceeded');
   reset();started=false;require(worldState===WORLD_STATE.PRE_BLAST&&survival.hp===100,'Reset failed');
   for(const b of world.buildings.filter(b=>b.id.startsWith('v11-')))require(b.preBlastModel.visible,'Reset did not restore extension');
   return {PASS:true,trips,postTrips,damage,smokeDamage,buildings:world.buildings.length,npcs:npcManager.people.length};
  });
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
