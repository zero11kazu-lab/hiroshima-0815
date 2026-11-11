const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8091/?debug=1');await p.locator('#start').tap();await p.waitForFunction(()=>camera&&started);await p.evaluate(()=>started=false);
 const before=await p.evaluate(()=>JSON.stringify(missionController.snapshot()));
 await p.locator('#objective-toggle').tap();assert.equal(await p.locator('#objective-toggle').getAttribute('aria-expanded'),'false');
 assert.equal(await p.evaluate(()=>JSON.stringify(missionController.snapshot())),before);
 assert.equal(await p.locator('#objective-content').isVisible(),false);
 await p.evaluate(()=>missionController.accept(missionController.current.giverNpcId));await p.waitForTimeout(30);
 assert.equal(await p.locator('#objective-toggle').getAttribute('aria-expanded'),'false');
 await p.locator('#objective-toggle').tap();assert.equal(await p.locator('#objective-content').isVisible(),true);assert.equal(await p.evaluate(()=>missionController.state),'active');
 const headings=[];
 for(const [name,x,z,angle] of [['n',0,-1,0],['e',1,0,-Math.PI/2],['s',0,1,-Math.PI],['w',-1,0,Math.PI/2]]){
  const a=await p.evaluate(({x,z})=>{started=true;camera.position.set(0,5,0);camera.lookAt(x,5,z);navigationHUD.update();started=false;return navigationHUD.lastAngle;},{x,z});
  assert(Math.abs(Math.atan2(Math.sin(a-angle),Math.cos(a-angle)))<.001);
  const rect=await p.locator('.compass-'+name).boundingBox(),c=await p.locator('#compass').boundingBox();assert(Math.abs(rect.x+rect.width/2-(c.x+c.width/2))<2);assert(rect.y<c.y+10);headings.push({name,angle:a});
 }
 // Simultaneous stick + toggle: UI finger must neither move the camera nor cancel the stick.
 await p.evaluate(()=>{started=true;pos.x=50;pos.z=38;player.position.set(50,.08,38);look.manualUntil=performance.now()/1000+60;});
 const cdp=await ctx.newCDPSession(p),s=await p.locator('#stick').boundingBox(),button=await p.locator('#objective-toggle').boundingBox();
 const finger={id:1,x:s.x+s.width/2,y:s.y+s.height/2-35},tap={id:2,x:button.x+button.width/2,y:button.y+button.height/2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});
 const inputBefore=await p.evaluate(()=>{started=false;return {...input};});assert(inputBefore.id!==null);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger,tap]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[tap]});
 assert.deepEqual(await p.evaluate(()=>({...input})),inputBefore);assert.equal(await p.evaluate(()=>look.id),null);assert.equal(await p.evaluate(()=>!!dialogue.active),false);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.evaluate(()=>input.id),null);
 // Collapse persists through the existing pre/post switch and mission updates.
 await p.evaluate(()=>{navigationHUD.collapsed=true;navigationHUD.peekUntil=0;navigationHUD.renderObjective();on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();missionController.render();});await p.waitForTimeout(30);
 assert.equal(await p.locator('#objective-toggle').getAttribute('aria-expanded'),'false');
 await p.locator('#objective-toggle').tap();
 await p.evaluate(()=>{started=true;navigationHUD.update();started=false;$('talk').hidden=false;$('talk').textContent='話す · 村田 清吉';});
 const overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y);
 const layouts=[];
 for(const [w,h] of [[844,390],[667,320],[568,320],[390,844],[320,568]]){
  await p.setViewportSize({width:w,height:h});const boxes={};for(const id of ['compass','objective','objective-toggle','stick','talk','run','survival-hud'])boxes[id]=await p.locator('#'+id).boundingBox();
  for(const [id,r] of Object.entries(boxes))assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=w&&r.y+r.height<=h,`${w}: ${id} on screen`);
  for(const id of ['objective','stick','talk','run','survival-hud'])assert(!overlap(boxes.compass,boxes[id]),`${w}: compass overlaps ${id}`);
  assert(boxes['objective-toggle'].height>=44);assert(!overlap(boxes.objective,boxes.stick),`${w}: objective overlaps stick`);
  layouts.push({w,h,compass:boxes.compass,objective:boxes.objective});
 }
 await p.setViewportSize({width:844,height:390});await p.screenshot({path:'/tmp/navigation-hud.png'});
 // Optional important-update peek closes again without changing the stored preference.
 await p.evaluate(()=>{NAVIGATION_HUD_CONFIG.REVEAL_ON_IMPORTANT_UPDATE=true;NAVIGATION_HUD_CONFIG.IMPORTANT_UPDATE_SECONDS=.05;navigationHUD.collapsed=true;navigationHUD.renderObjective();$('objective-text').textContent='UI検証用の更新';});await p.waitForTimeout(20);
 assert.equal(await p.locator('#objective-toggle').getAttribute('aria-expanded'),'true');await p.waitForTimeout(70);await p.evaluate(()=>navigationHUD.update());assert.equal(await p.locator('#objective-toggle').getAttribute('aria-expanded'),'false');
 await p.evaluate(()=>{dialogue.active=postMissions.mother;started=true;navigationHUD.update();started=false;});assert(!await p.locator('#compass').isVisible());
 assert.deepEqual(errors,[]);console.log(JSON.stringify({PASS:true,headings,layouts,touchIsolation:true,missionPersistence:true,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
