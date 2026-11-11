const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright'),execFileSync=require('node:child_process').execFileSync,assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const results=[];
for(const baseline of [true,false]){const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
if(baseline)await p.route('**/?road-baseline=1',route=>route.fulfill({contentType:'text/html',body:execFileSync('git',['show','cb6f9ca58861fc343635a05402b6bb1a1f780866:dist/index.html'],{encoding:'utf8'})}));
await p.goto(`http://127.0.0.1:8089/${baseline?'?road-baseline=1':'?debug=1'}`);await p.click('#start');await p.waitForFunction(()=>!!gameClock);
const phases=[];
for(const post of [false,true]){
const state=await p.evaluate(post=>{started=false;postMissions.masamiSeed=123;if(post){on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();}
const nav=[];for(let x=-38;x<60;x+=7)for(let z=-60;z<48;z+=7)nav.push(worldAllowed(x,z));
const signatures={walls:JSON.stringify(walls),nav,near:camera.near,far:camera.far,hp:survival.hp,heat:survival.heat,stamina:survival.stamina,playerY:player.position.y,fires:JSON.stringify(hazards.fires),smokes:JSON.stringify(hazards.smokes),layout:JSON.stringify(postMissions.locationPlan)};
let maxCalls=0;const meshes=world.surfaces.slice(1);for(const s of meshes){if(s.mesh.position.y!==.015||s.mesh.material.transparent||!s.mesh.material.depthTest||!s.mesh.material.depthWrite||s.mesh.material.polygonOffset)throw Error('Road depth/height changed');}
for(const [x,z]of [[0,0],[-26,-22],[26,31]])for(const distance of [5,16,45])for(const angle of [0,.8,1.6]){camera.position.set(x+Math.sin(angle)*distance,3+distance*.35,z+Math.cos(angle)*distance);camera.lookAt(x,.015,z);renderer.render(scene,camera);maxCalls=Math.max(maxCalls,renderer.info.render.calls);}
camera.position.set(8,7,10);camera.lookAt(0,.015,0);renderer.render(scene,camera);
return {signatures,roadMeshes:meshes.length,groundY:world.surfaces[0].mesh.position.y,maxCalls,sweeps:27};},post);
phases.push(state);await p.screenshot({path:`/tmp/roads-${baseline?'before':'after'}-${post?'post':'pre'}.png`});}
assert.deepEqual(errors,[]);results.push(phases);await context.close();}
for(let i=0;i<2;i++){assert.deepEqual(results[0][i].signatures,results[1][i].signatures);assert.equal(results[0][i].roadMeshes,results[1][i].roadMeshes);assert.equal(results[1][i].groundY,-.015);assert(results[1][i].maxCalls<=results[0][i].maxCalls);}
console.log('PASS: pre/post sweeps at three locations, distances and angles; unchanged navigation/walls/hazards/layout/vitals/camera/player height; no extra draws',JSON.stringify(results.map(phases=>phases.map(({signatures,...r})=>r))));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
