const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8085/?debug=1');await page.click('#start');await page.waitForFunction(()=>window.__game.getState().audio.playing);await page.evaluate(()=>{started=false;gameClock.seconds=29699;storyController.onTime(29699)});
assert.equal(await page.locator('#event-debug').isVisible(),false);assert.equal(await page.evaluate(()=>event0815.active),false);
const before=await page.locator('body').innerText();assert(!/警告|危険|カウントダウン|試作08 終了/.test(before));
// Existing clock boundary, single-fire guard, snapshot before conversation shutdown.
await page.evaluate(()=>{gameClock.seconds=29700;storyController.onTime(29700);on0815Event();});
let e=await page.evaluate(()=>__game.getEvent());assert.equal(e.phase,'FLASH');assert.equal(e.saved.time,29700);assert.equal(e.saved.npcs.length,25);assert.equal(e.saved.masami.id,'masami_nishimoto');assert.equal(e.playerControlEnabled,false);assert.equal(e.cameraManualControlEnabled,false);assert.equal(await page.evaluate(()=>storyController.endEventCount),1);assert.equal(await page.evaluate(()=>!!morningAudio.source),false);assert(!e.soundPlayed);
const cam=await page.evaluate(()=>camera.position.toArray());
await page.evaluate(()=>event0815.update(.1));assert.equal(await page.locator('#event-white').evaluate(e=>+e.style.opacity),1);assert.deepEqual(await page.evaluate(()=>camera.position.toArray()),cam);await page.screenshot({path:'prototype08-white.png'});
await page.evaluate(()=>event0815.update(.9));assert.equal(await page.evaluate(()=>event0815.audio.played),false);
await page.evaluate(()=>event0815.update(.3));e=await page.evaluate(()=>__game.getEvent());assert(e.soundPlayed);assert(e.audioPeak<.8&&e.audioPeak>0);assert.notDeepEqual(await page.evaluate(()=>camera.position.toArray()),cam);assert(await page.evaluate(()=>player.rotation.x)>0);await page.screenshot({path:'prototype08-blast.png'});
await page.evaluate(()=>event0815.update(1));const hud=await page.locator('#stick').evaluate(e=>+e.style.opacity);assert(hud>0&&hud<1);
const npos=await page.evaluate(()=>npcManager.people.map(n=>({...n.position})));await page.evaluate(()=>event0815.update(3.7));assert.deepEqual(await page.evaluate(()=>npcManager.people.map(n=>({...n.position}))),npos);assert.equal(await page.locator('#event-black').evaluate(e=>+e.style.opacity),1);assert.equal(await page.locator('#prototype-end').isVisible(),false);
await page.evaluate(()=>event0815.update(1));assert.equal(await page.locator('#prototype-end').isVisible(),true);assert.equal(await page.evaluate(()=>event0815.phase),'ENDED');await page.screenshot({path:'prototype08-ended.png'});
// Reset/replay, met-wife preservation, delta-time equivalence and slow mode.
await page.click('#restart');await page.evaluate(()=>{started=false;storyController.markMet();on0815Event();});assert.equal(await page.evaluate(()=>event0815.saved.story.met),true);
const results=[];for(const step of [1/60,1/30]){results.push(await page.evaluate(step=>{reset();started=false;on0815Event();for(let t=0;t<8;t+=step)event0815.update(step);return {phase:event0815.phase,t:event0815.elapsed,trace:event0815.trace};},step));}assert(results.every(r=>r.phase==='ENDED'));assert(Math.abs(results[0].t-results[1].t)<.05);
await page.evaluate(()=>{reset();started=false;$('event-speed').value='0.25';on0815Event();event0815.update(2);});assert.equal(await page.evaluate(()=>event0815.elapsed),.5);assert.equal(await page.evaluate(()=>event0815.audio.played),false);
await page.evaluate(()=>{reset();started=true;last=0;});await page.click('#debug-toggle');assert(await page.locator('#test-0815').isVisible());await page.click('#test-0815');assert(await page.evaluate(()=>event0815.active));
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,audioPeak:e.audioPeak,hudAt2_3:hud,deltaTime:results,errors}));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
