let viewportResizeTimer14=null,viewportSettleTimer14=null,contextResume14=false;
function resize(){
 if(!renderer||!camera)return false;const w=$('game').clientWidth,h=$('game').clientHeight;
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<2||h<2)return false;
 const ratio=Math.min(Number.isFinite(devicePixelRatio)?devicePixelRatio:1,world?.quality>=2?1:world?.quality===1?1.15:1.4,Math.sqrt(3000000/(w*h))),size=renderer.getSize(cameraViewportSize),changed=size.x!==w||size.y!==h;
 if(changed){stop();last=performance.now();}if(renderer.getPixelRatio&&renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
 if(changed)renderer.setSize(w,h,false);if(camera.aspect!==w/h){camera.aspect=w/h;camera.updateProjectionMatrix();}return true;
}
function scheduleViewportResize14(){clearTimeout(viewportResizeTimer14);clearTimeout(viewportSettleTimer14);viewportResizeTimer14=setTimeout(()=>{resize();viewportResizeTimer14=null;},40);viewportSettleTimer14=setTimeout(()=>{resize();viewportSettleTimer14=null;},280);}
function loseContext14(e){e.preventDefault();contextResume14=started;stop();started=false;}
function restoreContext14(){resize();last=performance.now();started=contextResume14;contextResume14=false;}

function stop(clearCamera=true){if(clearCamera)survival.releaseRun();if(clearCamera)look.id=null;input.x=input.y=0;input.id=null;keys.clear();$('knob').style.transform='translate(0px,0px)';}
let currentPlayerStart14=null;
function reset({newPlay=true}={}){ending.reset();ending.stopAudio();aftermath.reset();event0815.reset();if(dialogue?.active)dialogue.close();if(storyController)storyController.reset();if(gameClock)gameClock.reset();if(missionController)missionController.reset();if(dialogue)dialogue.resolver.reset();look.manualUntil=0;stop();pos.x=(currentPlayerStart14?.position||GEO1945.playerStart).x;pos.z=(currentPlayerStart14?.position||GEO1945.playerStart).z;yaw=0;cameraYaw=0;cameraAvoidYaw=0;cameraPitch=Math.atan2(2.35,5.6);cameraDistance=normalCameraDistance;if(newPlay&&npcManager){randomizePreMasami();currentPlayerStart14=drawPlayerStart14();pos.x=currentPlayerStart14.position.x;pos.z=currentPlayerStart14.position.z;ending.newPlay();}if(player){if(npcManager)npcManager.protectSpawn(pos);player.position.set(pos.x,.08,pos.z);player.rotation.set(0,0,0);camera.fov=57;updateCamera(0,false);}}
function worldAllowed(x,z){
 const b=WORLD_DATA.bounds;
 if(x<b.minX||x>b.maxX||z<b.minZ||z>b.maxZ)return false;
 if(!geographicWalkable(x,z))return false;
 return !world.nearWalls(x,z).some(b=>Math.abs(x-b.x)<b.w&&Math.abs(z-b.z)<b.d)&&!(worldState===WORLD_STATE.POST_BLAST&&hazards.active&&hazards.blocked(x,z));
}
function allowed(x,z){return worldAllowed(x,z)&&(!npcManager||npcManager.canPlayerMove(x,z));}
function tick(t){
 requestAnimationFrame(tick);const realDt=last?Math.min((t-last)/1000,.25):0,dt=Math.min(realDt,.04);last=t;
 if(!started||document.hidden)return;
 navigationHUD.update();
 if(ending.active){ending.update(realDt);renderer.render(scene,camera);return;}
 if(event0815.active){event0815.update(realDt);renderer.render(scene,camera);return;}
 if(worldState===WORLD_STATE.POST_BLAST){aftermath.update(realDt,dt);renderer.render(scene,camera);return;}
 ambientAudio.updatePre(gameClock.seconds,realDt);ambientAudio.updateWorld(realDt);gameClock.update(realDt,!!dialogue.active);if(event0815.active){renderer.render(scene,camera);return;}
 const {x,y,n}=updatePlayer(dt);
 npcManager.update(dt,pos,gameClock.seconds);dialogue.update(dt);world.updateVisibility(pos);updateCamera(dt,n>.08);missionController.updateGuide(dt);renderer.render(scene,camera);
 frames++;
 if(t-fpsTime>500){
  fps=Math.round(frames*1000/(t-fpsTime));frames=0;fpsTime=t;world.adaptQuality(fps,t);
  if($('debug').classList.contains('visible'))$('debug').textContent=`${fps} FPS  NPC ${npcManager.visibleCount}/${npcManager.people.length}  ${gameClock.format(true)}\nPOS ${pos.x.toFixed(1)},${pos.z.toFixed(1)}  WP / STATE / SPEED / STUCK / NEAR\n${npcManager.debugText()}`;
 }
}

function playerStartCandidates14(){return preMasamiCandidates().filter(s=>worldAllowed(s.position.x,s.position.z)&&Math.hypot(s.position.x-missionController.person(PLAYER_PROFILE.spouseId).position.x,s.position.z-missionController.person(PLAYER_PROFILE.spouseId).position.z)>4);}
function drawPlayerStart14(rng=Math.random){const candidates=playerStartCandidates14(),side=rng()<.5?'E':'W',pool=candidates.filter(s=>placementSide(s.position)===side);if(!pool.length)throw Error('No reachable morning start on '+side);let last;try{last=localStorage.getItem('hiroshima.lastPlayerStart14');}catch(_){}const fresh=pool.filter(s=>s.id!==last),choices=fresh.length?fresh:pool,selected=choices[Math.floor(rng()*choices.length)];try{localStorage.setItem('hiroshima.lastPlayerStart14',selected.id);}catch(_){}return{id:selected.id,side,position:{...selected.position}};}
