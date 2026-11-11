// Prototype staging values, not historical propagation estimates. All times are seconds.
const EVENT0815_CONFIG={FLASH_DURATION:.08,WHITEOUT_DURATION:.55,FLASH_TO_SOUND_DELAY:1.2,
 BLAST_SHAKE_DURATION:2.5,BLAST_SHAKE_STRENGTH:.32,BLAST_FOV_CHANGE:19,
 TINNITUS_DURATION:4.5,HUD_FADE_DURATION:1,BLACK_FADE_DELAY:3.1,BLACK_FADE_DURATION:1.7,
 END_HOLD:1,blastIntensity:1,EVENT_TIME_SCALE:.25,INITIAL_BLAST_DURATION:.25};
const EVENT_DEBUG=new URLSearchParams(location.search).get('debug')==='1';
let playerControlEnabled=true,cameraManualControlEnabled=true;
const eventClamp=v=>Math.max(0,Math.min(1,v));
const eventEase=v=>{v=eventClamp(v);return v*v*(3-2*v);};

// One bounded procedural impact, limited before the destination. No downloaded sound assets.
class EventAudio {
 constructor(){this.nodes=[];this.played=false;this.peak=0;}
 interrupt(){
  const a=morningAudio;clearTimeout(a.pauseTimer);a.ended=true;
  if(!a.ctx)return;const t=a.ctx.currentTime;
  for(const channel of Object.values(a.channels)){channel.gain.cancelScheduledValues(t);channel.gain.setValueAtTime(0,t);}
  try{a.source?.stop();}catch(_){}a.source=null;a.renderButton();
 }
 play(intensity,rate=1){
  if(this.played)return;this.played=true;const a=morningAudio,ctx=a.ctx;
  if(!ctx||!a.enabled||ctx.state!=='running')return;
  const gain=ctx.createGain(),limit=ctx.createDynamicsCompressor();gain.gain.value=.62*Math.min(1.2,intensity);
  limit.threshold.value=-15;limit.knee.value=9;limit.ratio.value=8;limit.attack.value=.003;limit.release.value=.2;
  gain.connect(limit);limit.connect(a.master);this.nodes.push(gain,limit);
  const length=3,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),out=buffer.getChannelData(0);
  let seed=815,low=0;for(let i=0;i<out.length;i++){const t=i/ctx.sampleRate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1;low+=.035*(noise-low);
   const attack=Math.min(1,t/.008),envelope=Math.exp(-t*2.1);out[i]=attack*envelope*(.37*Math.sin(2*Math.PI*(52*t-4*t*t))+.68*low+.055*noise);this.peak=Math.max(this.peak,Math.abs(out[i]));}
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;source.buffer=buffer;source.playbackRate.value=rate;source.connect(filter);filter.connect(gain);source.start();this.nodes.push(source,filter);
  // Quiet, soft-edged ringing, not a sharp high-volume tone.
  const ring=ctx.createOscillator(),envelope=ctx.createGain();ring.type='sine';ring.frequency.value=1850;
  const now=ctx.currentTime,d=EVENT0815_CONFIG.TINNITUS_DURATION/rate;
  envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(.008,now+.35/rate);envelope.gain.exponentialRampToValueAtTime(.0001,now+d);ring.connect(envelope);envelope.connect(gain);ring.start(now);ring.stop(now+d+.05);this.nodes.push(ring,envelope);
 }
 resume(){if(morningAudio.enabled)morningAudio.ctx?.resume().catch(()=>{});}
 stop(){for(const node of this.nodes){try{node.stop?.();}catch(_){}try{node.disconnect();}catch(_){}}this.nodes=[];}
 reset(){this.stop();this.played=false;this.peak=0;}
}
class Event0815 {
 constructor(){this.audio=new EventAudio();this.active=false;this.phase='NORMAL';this.elapsed=0;this.saved=null;this.trace=[];}
 reset(){this.audio.reset();this.active=false;this.phase='NORMAL';this.elapsed=0;this.saved=null;this.trace=[];this.blastPositions=[];this.postBlastState=null;this.switched=false;this.postMusicStarted=false;this.rate=1;playerControlEnabled=cameraManualControlEnabled=true;
  document.body.classList.remove('event-active');for(const id of ['event-white','event-afterimage','event-black'])$(id).style.opacity=0;
  for(const el of this.hudElements||[])el.style.opacity='';if(renderer)renderer.domElement.style.filter='';
  if(npcManager)for(const n of npcManager.people){n.eventTilt=0;npcManager.visuals.write(n,n.wasVisible!==false);}npcManager?.visuals.flush();
 }
 capture(){return JSON.parse(JSON.stringify({version:1,time:gameClock.seconds,
  player:{...PLAYER_PROFILE,position:player.position.toArray(),rotation:player.rotation.toArray(),yaw},
  camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov,yaw:cameraYaw,pitch:cameraPitch,distance:cameraDistance},
  masami:npcManager.people.find(n=>n.id==='masami_nishimoto')?.snapshot(),
  npcs:npcManager.people.map(n=>({...n.snapshot(),yaw:n.yaw,phase:n.phase,timer:n.timer,conversing:n.conversing})),
  missions:missionController.snapshot(),story:storyController.snapshot(),inquiries:storyController.inquiries,
  dialogue:dialogue.active?{npcId:dialogue.active.id,nodeId:dialogue.node.id,page:dialogue.index}:null}));}
 begin(){
  if(this.active)return false;
  // Capture before closing dialogue, clearing pointers, or touching actor poses.
  aftermath.rememberPre();this.saved=this.capture();blastDisplacement.build();this.blastPositions=blastDisplacement.snapshot();worldState=WORLD_STATE.EVENT_0815;this.switched=false;this.active=true;this.elapsed=0;this.rate=EVENT_DEBUG?([.25,.5,1].includes(Number($('event-speed').value))?Number($('event-speed').value):1):1;
  const light=new THREE.Vector3(BLAST_ORIGIN.x,GEO1945.hypocenter.heightMetres/GEO1945.coordinateSystem.geographicCompression,BLAST_ORIGIN.z).project(camera);const lx=Math.max(0,Math.min(100,(light.x+1)*50)),ly=Math.max(0,Math.min(100,(1-light.y)*50));$('event-afterimage').style.background=`radial-gradient(ellipse at ${lx}% ${ly}%,#fff 0%,#ffffffe0 14%,#ffffff00 65%)`;this.lightDirection={x:BLAST_ORIGIN.x-pos.x,y:40,z:BLAST_ORIGIN.z-pos.z};this.intensity=EVENT0815_CONFIG.blastIntensity;this.trace=[{phase:'FLASH',at:0}];this.phase='FLASH';
  storyController.endEventCount++;gameClock.stopped=true;playerControlEnabled=cameraManualControlEnabled=false;stop();if(dialogue.active)dialogue.close();$('talk').hidden=true;
  this.cameraPosition=camera.position.clone();this.cameraQuaternion=camera.quaternion.clone();this.playerRotation=player.rotation.clone();this.baseFov=camera.fov;
  this.hudElements=[...document.querySelectorAll('.hud > :not(#debug),#conversation,#target-marker')];document.body.classList.add('event-active');ambientAudio.stop();this.audio.interrupt();this.apply();return true;
 }
 update(dt){
  if(!this.active)return;
  let remaining=Math.max(0,dt)*this.rate;const slowEnd=EVENT0815_CONFIG.FLASH_TO_SOUND_DELAY+EVENT0815_CONFIG.INITIAL_BLAST_DURATION;
  if(this.elapsed<slowEnd){const portion=Math.min(remaining,(slowEnd-this.elapsed)/EVENT0815_CONFIG.EVENT_TIME_SCALE);this.elapsed+=portion*EVENT0815_CONFIG.EVENT_TIME_SCALE;remaining-=portion;}
  this.elapsed+=remaining;this.frameDelta=dt;this.apply();this.frameDelta=0;
 }
 apply(){
  const c=EVENT0815_CONFIG,t=this.elapsed,b=t-c.FLASH_TO_SOUND_DELAY;
  if(t>=1.25&&!this.postMusicStarted){this.postMusicStarted=true;ending.audio('post');}if(this.postMusicStarted)ending.music(this.frameDelta||0);
  const blackAt=c.FLASH_TO_SOUND_DELAY+c.BLACK_FADE_DELAY,blackEnd=blackAt+c.BLACK_FADE_DURATION;
  let phase=t<c.FLASH_DURATION?'FLASH':t<c.FLASH_DURATION+c.WHITEOUT_DURATION?'WHITEOUT':b<0?'SOUND_DELAY':b<1?'BLAST':t<blackAt?'DISORIENTED':t<blackEnd?'FADE_TO_BLACK':t<blackEnd+POST_CONFIG.BLACK_HOLD?'BLACK_HOLD':t<blackEnd+POST_CONFIG.BLACK_HOLD+POST_CONFIG.RECOVERY_DURATION?'RECOVERING':t<blackEnd+POST_CONFIG.BLACK_HOLD+POST_CONFIG.RECOVERY_DURATION+POST_CONFIG.STAND_DURATION?'STANDING':'POST_BLAST';
  if(phase!==this.phase){this.phase=phase;this.trace.push({phase,at:t});}
  const white=t<c.FLASH_DURATION?eventClamp(t/c.FLASH_DURATION):t<c.FLASH_DURATION+c.WHITEOUT_DURATION?1:1-eventEase((t-c.FLASH_DURATION-c.WHITEOUT_DURATION)/.75);
  $('event-white').style.opacity=white;
  $('event-afterimage').style.opacity=t<c.FLASH_DURATION?eventClamp(t/c.FLASH_DURATION)*.8:t<c.FLASH_DURATION+c.WHITEOUT_DURATION?0:.44*Math.exp(-Math.max(0,b)*.75);
  $('event-black').style.opacity=eventEase((t-blackAt)/c.BLACK_FADE_DURATION);
  if(b>=0){
   this.audio.play(this.intensity,this.rate);if(!this.switched)blastDisplacement.apply(b/1.15);
   const envelope=Math.pow(1-eventClamp(b/c.BLAST_SHAKE_DURATION),1.6),kick=Math.sin(Math.PI*eventClamp(b/.24))*this.intensity;
   const right=new THREE.Vector3(1,0,0).applyQuaternion(this.cameraQuaternion),back=new THREE.Vector3(0,0,1).applyQuaternion(this.cameraQuaternion);
   camera.position.copy(this.cameraPosition).add(new THREE.Vector3(pos.x-this.saved.player.position[0],0,pos.z-this.saved.player.position[2])).addScaledVector(back,.48*kick).addScaledVector(right,.36*kick);
   const strength=c.BLAST_SHAKE_STRENGTH*this.intensity*envelope;
   camera.position.x+=Math.sin(b*38)*strength;camera.position.y+=Math.sin(b*47)*strength*.55;
   camera.quaternion.copy(this.cameraQuaternion);camera.rotateZ(.27*kick+Math.sin(b*31)*strength*.16);camera.rotateX(-.1*kick+Math.sin(b*43)*strength*.12);
   camera.fov=Math.min(120,this.baseFov+c.BLAST_FOV_CHANGE*this.intensity*Math.exp(-b*3));camera.updateProjectionMatrix();
   const fall=eventEase(b/1.1);player.rotation.x=this.playerRotation.x+fall*1.12;player.rotation.z=this.playerRotation.z+fall*.24;
   legs.forEach((l,i)=>l.rotation.x=(i?-.65:.45)*fall);arms.forEach(a=>a.rotation.x=-.85*fall);
   if(!this.switched)for(const n of npcManager.people){const plan=blastDisplacement.byId.get(n.id);n.moving=false;n.eventTilt=fall*(.8+(n.index%3)*.12);if(plan){n.eventRoll=fall*plan.roll;n.yaw=this.saved.npcs[n.index].yaw+fall*plan.turn;}npcManager.visuals.write(n,n.wasVisible!==false);}npcManager.visuals.flush();
   for(const el of this.hudElements)el.style.opacity=1-eventEase((b-.45)/c.HUD_FADE_DURATION);
   renderer.domElement.style.filter=`saturate(${1-.7*eventEase(b/.6)}) contrast(${1+Math.sin(b*13)*.05*envelope})`;
  }
  if(t>=blackEnd){
   this.audio.stop();
   if(!this.switched){this.switched=true;aftermath.enter();this.postBlastState={time:gameClock.seconds,player:{...pos},masami:{...npcManager.people.find(n=>n.id===PLAYER_PROFILE.spouseId).position},positions:blastDisplacement.snapshot(),met:this.saved.story.met};
    updateCamera(1,false);this.recoveryCamera=camera.position.clone();this.recoveryQuaternion=camera.quaternion.clone();
    this.lowCamera=this.recoveryCamera.clone();this.lowCamera.y=.7;
   }
   const recoveryStart=blackEnd+POST_CONFIG.BLACK_HOLD,reveal=eventEase((t-recoveryStart)/POST_CONFIG.RECOVERY_DURATION),stand=eventEase((t-recoveryStart-POST_CONFIG.RECOVERY_DURATION)/POST_CONFIG.STAND_DURATION);
   $('event-black').style.opacity=1-reveal;$('event-afterimage').style.opacity=0;
   camera.position.lerpVectors(this.lowCamera,this.recoveryCamera,stand);camera.lookAt(pos.x,.65+.5*stand,pos.z);camera.rotateZ(.17*(1-stand));camera.fov=57;camera.updateProjectionMatrix();
   renderer.domElement.style.filter=`blur(${(1-reveal)*2.5}px) saturate(.55) contrast(.94)`;
   player.rotation.x=1.12*(1-stand);player.rotation.z=.24*(1-stand);legs.forEach(l=>l.rotation.x*=1-stand);arms.forEach(a=>a.rotation.x*=1-stand);
   aftermath.updateEffects(t);
   if(phase==='POST_BLAST'){this.active=false;stop();player.rotation.set(0,yaw,0);aftermath.release();renderer.domElement.style.filter='';for(const el of this.hudElements)el.style.opacity='';}
  }
  if(EVENT_DEBUG&&$('debug').classList.contains('visible'))$('debug').textContent=`${phase}  +${t.toFixed(2)}s  ${this.rate}×\nSOUND ${this.audio.played?'YES':'NO'}  saved ${!!this.saved}`;
 }
 get postStartTime(){const c=EVENT0815_CONFIG;return c.FLASH_TO_SOUND_DELAY+c.BLACK_FADE_DELAY+c.BLACK_FADE_DURATION+POST_CONFIG.BLACK_HOLD+POST_CONFIG.RECOVERY_DURATION+POST_CONFIG.STAND_DURATION;}
 snapshot(){return {active:this.active,phase:this.phase,elapsed:this.elapsed,trace:this.trace.map(v=>({...v})),soundPlayed:this.audio.played,audioPeak:this.audio.peak,saved:this.saved,blastPositions:this.blastPositions,postBlastState:this.postBlastState,worldState,playerControlEnabled,cameraManualControlEnabled};}
}
const event0815=new Event0815();
