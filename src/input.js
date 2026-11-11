// Input / UI — 仮想スティックのイベント処理を維持。
const stick=$('stick');function move(e){const r=stick.getBoundingClientRect(),radius=Math.max(1,r.width/2-24),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,n=Math.hypot(dx,dy),s=n>radius?radius/n:1;input.x=dx*s/radius;input.y=dy*s/radius;$('knob').style.transform=`translate(${dx*s}px,${dy*s}px)`;}
stick.addEventListener('pointerdown',e=>{e.preventDefault();if(!started||!playerControlEnabled||dialogue?.active||input.id!==null)return;input.id=e.pointerId;try{stick.setPointerCapture(e.pointerId);}catch(_){}move(e);},{passive:false});window.addEventListener('pointermove',e=>{if(e.pointerId===input.id){e.preventDefault();move(e);}},{passive:false});for(let event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,e=>{if(e.pointerId===input.id)stop(false);});window.addEventListener('blur',stop);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{stop();last=0;});document.addEventListener('touchmove',e=>{if(!e.target.closest('#title-modal-body'))e.preventDefault();},{passive:false});document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});document.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(!playerControlEnabled||dialogue?.active)return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));$('reset').onclick=()=>{if(!event0815.active){reset();morningAudio.startFromGesture();}};$('start').onclick=()=>{if(worldState===WORLD_STATE.PRE_BLAST)morningAudio.startFromGesture();else morningAudio.ctx?.resume().catch(()=>{});try{if(!renderer)init();else if(titleScreen.needsNewPlay)reset();titleScreen.needsNewPlay=false;started=true;last=0;stop();$('intro').classList.add('hidden');}catch(e){$('error').textContent='3Dを起動できませんでした。Safariでページを開き直してください。\n'+e.message;}};

$('debug-toggle').onclick=()=>{const visible=$('debug').classList.toggle('visible');$('debug-toggle').setAttribute('aria-pressed',String(visible));$('event-debug').hidden=!visible||!EVENT_DEBUG;};

// UI owns its pointers. A second UI finger also clears a held stick before opening a dialogue.
for(const element of document.querySelectorAll('button,#conversation'))for(const event of ['pointerdown','pointermove','pointerup'])element.addEventListener(event,e=>{e.stopPropagation();if(event==='pointerdown'&&element.id!=='start'&&element.id!=='run'&&element.id!=='objective-toggle')stop();});
$('talk').onclick=()=>dialogue.open();$('dialogue-next').onclick=()=>dialogue.next();$('dialogue-close').onclick=()=>dialogue.close();$('dialogue-accept').onclick=()=>dialogue.choose($('dialogue-accept').dataset.action);$('dialogue-decline').onclick=()=>dialogue.choose($('dialogue-decline').dataset.action);
const viewport=$('game');
viewport.addEventListener('pointerdown',e=>{
 if(!started||!cameraManualControlEnabled||dialogue?.active||e.clientX<innerWidth*.5||look.id!==null)return;
 e.preventDefault();look.id=e.pointerId;look.x=e.clientX;look.manualUntil=performance.now()/1000+2.5;try{viewport.setPointerCapture(e.pointerId);}catch(_){}
},{passive:false});
window.addEventListener('pointermove',e=>{if(!cameraManualControlEnabled||e.pointerId!==look.id)return;e.preventDefault();const dx=THREE.MathUtils.clamp(e.clientX-look.x,-60,60);look.x=e.clientX;cameraYaw-=dx*.006;look.manualUntil=performance.now()/1000+2.5;},{passive:false});
for(const event of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(event,e=>{if(e.pointerId===look.id){look.id=null;look.manualUntil=performance.now()/1000+2.5;}});

$('dialogue-ask').onclick=()=>dialogue.askMasami();$('music-toggle').onclick=()=>{if(!event0815.active){if(worldState===WORLD_STATE.POST_BLAST)ambientAudio.togglePost();else morningAudio.toggle();}};$('restart').onclick=()=>{reset();started=true;last=0;morningAudio.startFromGesture();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)morningAudio.pauseForPage();else if(!event0815.active&&worldState===WORLD_STATE.PRE_BLAST)morningAudio.resumeForPage();else event0815.audio.resume();});
$('test-0815').onclick=()=>{if(EVENT_DEBUG&&started){if(worldState!==WORLD_STATE.PRE_BLAST)reset();gameClock.seconds=29700;gameClock.render();morningAudio.resumeForPage();on0815Event();}};

$('test-pre').onclick=()=>{if(EVENT_DEBUG){reset();started=true;last=0;morningAudio.startFromGesture();}};
$('test-post').onclick=()=>{if(EVENT_DEBUG){reset();started=true;gameClock.seconds=29700;gameClock.render();on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();last=0;}};

const runButton=$('run');runButton.addEventListener('pointerdown',e=>{e.preventDefault();if(!playerControlEnabled||worldState!==WORLD_STATE.POST_BLAST||survival.dead||dialogue.active)return;survival.runPointer=e.pointerId;survival.runHeld=true;try{runButton.setPointerCapture(e.pointerId);}catch(_){}runButton.setAttribute('aria-pressed','true');},{passive:false});
for(const name of ['pointerup','pointercancel','lostpointercapture'])runButton.addEventListener(name,e=>{e.stopPropagation();if(e.pointerId===survival.runPointer)survival.releaseRun();});
$('survival-retry').onclick=()=>{morningAudio.ctx?.resume().catch(()=>{});survival.restart();};
for(const button of document.querySelectorAll('[data-survival-test]'))button.onclick=()=>{if(EVENT_DEBUG)survival.test(button.dataset.survivalTest);};

runButton.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();if(!playerControlEnabled||worldState!==WORLD_STATE.POST_BLAST||survival.dead||dialogue.active)return;survival.runTouch=e.changedTouches[0].identifier;survival.runHeld=true;},{passive:false});
for(const name of ['touchend','touchcancel'])runButton.addEventListener(name,e=>{e.preventDefault();e.stopPropagation();if([...e.changedTouches].some(t=>t.identifier===survival.runTouch))survival.releaseRun();},{passive:false});

$('test-post-story').onclick=()=>{if(EVENT_DEBUG)$('test-post').click();};

$('test-find').onclick=()=>{if(!EVENT_DEBUG)return;$('test-post').click();postMissions.mission1Completed=postMissions.mission2Completed=postMissions.mission3Completed=true;postMissions.repositionMasami();};
$('test-reunion').onclick=()=>{if(!EVENT_DEBUG)return;if(!postMissions.canAskMasami)$('test-find').click();ending.begin();};
$('test-ending').onclick=()=>{if(!EVENT_DEBUG)return;if(!postMissions.canAskMasami)$('test-find').click();ending.jump($('ending-scene').value);};

$('test-m1').onclick=()=>{if(EVENT_DEBUG)$('test-post').click();};
$('test-m2').onclick=()=>{if(!EVENT_DEBUG)return;$('test-post').click();postMissions.mission1Completed=true;postMissions.missions[0].state=POST_MISSION_STATES.M1_COMPLETED;postMissions.childState='CHILD_DEAD';postMissions.phase=POST_MISSION_STATES.M1_COMPLETED;postMissions.syncActors();postMissions.render();postMissions.saveCheckpoint();};
for(const [id,key,min,max] of [['debug-fire','FIRE_DAMAGE_PER_SECOND',1,100],['debug-smoke','SMOKE_DAMAGE_RATIO',0,1],['debug-heat','HEAT_RESPONSE',.1,5]])$(id).addEventListener('change',()=>{if(!EVENT_DEBUG)return;const value=Number($(id).value);if(Number.isFinite(value))SURVIVAL_CONFIG[key]=Math.max(min,Math.min(max,value));$(id).value=SURVIVAL_CONFIG[key];});

$('debug-fire-count').addEventListener('change',()=>{if(!EVENT_DEBUG||!hazards.active)return;if(!hazards.debugFireBackup){hazards.debugFireBackup=hazards.fires.slice();hazards.debugSmokeBackup=hazards.smokes.slice();}const count=Math.max(0,Math.min(hazards.debugFireBackup.length,Number($('debug-fire-count').value)||0));hazards.fires=hazards.debugFireBackup.slice(0,count);const ids=new Set(hazards.fires.map(f=>'smoke-'+f.id));hazards.smokes=hazards.debugSmokeBackup.filter(s=>!hazards.debugFireBackup.some(f=>'smoke-'+f.id===s.id)||ids.has(s.id));hazards.index();hazards.buildVisuals();});
