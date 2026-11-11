class Survival {
 constructor(){this.reset();}
 reset(){this.hp=100;this.heat=0;this.stamina=100;this.speedScale=1;this.inhalation=0;this.active=false;this.running=false;this.exhausted=false;this.runPointer=null;this.dead=false;this.deathElapsed=0;this.age=0;this.sampleDebt=0;this.uiDebt=0;this.exposure={heat:0,smoke:0,contact:0,rubble:0,zones:[]};this.postClue=null;this.inquiryHistory=[];this.checkpoint=null;this.debugExposure=null;
  if($('survival-hud')){$('survival-hud').hidden=true;$('run').hidden=true;$('survival-over').hidden=true;$('survival-over').style.opacity=0;$('survival-fx').style.opacity=0;}this.releaseRun();}
 releaseRun(){this.runTouch=null;this.runPointer=null;this.runHeld=false;this.running=false;if($('run'))$('run').setAttribute('aria-pressed','false');}
 begin(){this.active=true;this.age=0;this.hp=100;this.heat=0;this.stamina=100;this.speedScale=1;this.inhalation=0;this.dead=false;this.debugExposure=null;
  this.checkpoint={position:{...pos},yaw,cameraYaw,npcs:npcManager.people.map(n=>({id:n.id,position:{...n.position},yaw:n.yaw,postBlastState:n.postBlastState})),storyPhase:storyController.state};
  $('survival-hud').hidden=false;$('run').hidden=false;this.render();}
 update(dt){if(!this.active)return;
  if(this.dead){this.deathElapsed+=dt;$('survival-over').style.opacity=eventEase(this.deathElapsed/SURVIVAL_CONFIG.GAME_OVER_FADE);$('survival-over-content').style.opacity=this.deathElapsed>=SURVIVAL_CONFIG.GAME_OVER_FADE?1:0;$('survival-retry').disabled=this.deathElapsed<SURVIVAL_CONFIG.GAME_OVER_FADE;return;}
  this.age+=dt;this.sampleDebt+=dt;this.uiDebt+=dt;
  if(this.sampleDebt>=SURVIVAL_CONFIG.ZONE_UPDATE_INTERVAL||this.exposure.smoke>0){this.sampleDebt=0;this.exposure=this.debugExposure&&this.debugExposure.until>this.age?this.debugExposure.value:hazards.sample(pos.x,pos.z);}
  const c=SURVIVAL_CONFIG,s=this.exposure;
  if(s.heat>this.heat)this.heat+=Math.min(s.heat-this.heat,(s.heat-this.heat)/c.HEAT_RESPONSE*dt+dt*1.2);else this.heat=Math.max(s.heat,this.heat-c.COOL_RATE*dt);
  this.heat=Math.max(0,Math.min(100,this.heat));this.inhalation=Math.max(0,Math.min(100,this.inhalation+(s.smoke>.1?s.smoke*5:-3.5)*dt));
  const moving=input.id!==null?Math.hypot(input.x,input.y)>.15:keys.size>0;
  if(this.stamina<=.1)this.exhausted=true;if(this.stamina>=c.EXHAUSTION_RECOVERY)this.exhausted=false;
  this.running=this.runHeld&&moving&&!this.exhausted&&!dialogue?.active&&!postMissions.escorting;
  if(this.running)this.stamina=Math.max(0,this.stamina-c.RUN_DRAIN*(1+this.heat*.012)*dt);else this.stamina=Math.min(100,this.stamina+c.STAMINA_RECOVERY*(moving?.65:1)*Math.max(.08,1-this.heat*.011)*dt);
  if(this.stamina<=.1){this.exhausted=true;this.running=false;}
  const heatSlow=this.heat>=80?.62:this.heat>=60?.82:1,smokeSlow=1-s.smoke*.22,rubbleSlow=1-s.rubble*.2;
  this.speedScale=heatSlow*smokeSlow*rubbleSlow*(1);
  const smokeDamage=s.smoke*(c.FIRE_DAMAGE_PER_SECOND+c.FIRE_CONTACT_BASE_DAMAGE)*c.SMOKE_DAMAGE_RATIO;
  if(this.age>c.WAKE_GRACE){const heatDamage=this.heat>=c.EXTREME_HEAT?c.HEAT_DAMAGE_PER_SECOND:this.heat>=c.HOT_HEAT?c.HOT_HP_DRAIN:this.heat>=c.HEAT_DAMAGE_START?c.WARM_HP_DRAIN:0;const damage=heatDamage+(s.contact>0?s.contact*c.FIRE_DAMAGE_PER_SECOND+c.FIRE_CONTACT_BASE_DAMAGE:0)+s.rubble*c.RUBBLE_DAMAGE_PER_SECOND;this.hp=Math.max(0,this.hp-damage*dt);}
  this.hp=Math.max(0,this.hp-smokeDamage*dt);
  if(this.hp<=0){this.fail();return;}
  if(this.uiDebt>=.1){this.uiDebt=0;this.render();}
 }
 render(){for(const [id,value] of [['hp',this.hp],['heat',this.heat],['stamina',this.stamina]]){$(id+'-value').textContent=Math.ceil(value);$(id+'-bar').style.width=value+'%';$(id+'-meter').setAttribute('aria-valuenow',String(Math.round(value)));}
  $('heat-meter').dataset.level=this.heat>=80?'extreme':this.heat>=50?'high':'normal';$('run').classList.toggle('exhausted',this.exhausted);$('run').setAttribute('aria-pressed',String(!!this.runHeld));$('run').textContent=postMissions.escorting?'支援中 · 走れません':this.exhausted?'歩く · 休息中':'走る · 押す間';
  const haze=Math.max(this.exposure.smoke*.32,Math.max(0,this.heat-60)/100);$('survival-fx').style.opacity=haze;$('survival-fx').style.transform=this.heat>=80?`translateX(${Math.sin(this.age*5)*.8}px)`:'none';
  $('survival-fx').style.background=this.exposure.smoke>.35?'radial-gradient(ellipse, #9c999022, #726f69e0)':'radial-gradient(ellipse, transparent 45%, #b76b38bb)';
  // Mild edge effects only; no high-frequency screen shake or extra render pass.
  ambientAudio.setBreath?.(Math.max(this.exposure.smoke,this.heat>60?(this.heat-60)/50:0));
 }
 fail(){if(this.dead)return;this.dead=true;this.deathElapsed=0;ambientAudio.setBreath?.(0);this.releaseRun();stop();playerControlEnabled=cameraManualControlEnabled=false;if(dialogue.active)dialogue.close();$('talk').hidden=true;$('survival-over').style.opacity=0;$('survival-retry').disabled=true;$('survival-over').hidden=false;$('survival-over-content').style.opacity=0;}
 restart(){if(!this.checkpoint)return;const c=this.checkpoint;if(dialogue.active)dialogue.close();pos.x=c.position.x;pos.z=c.position.z;yaw=c.yaw;cameraYaw=c.cameraYaw;storyController.state=c.storyPhase;player.position.set(pos.x,.08,pos.z);player.rotation.set(0,yaw,0);stop();this.releaseRun();
  for(const item of c.npcs){const n=npcManager.people.find(n=>n.id===item.id);n.position={...item.position};n.yaw=item.yaw;n.postBlastState=item.postBlastState;n.hiddenFromWorld=!!item.hiddenFromWorld;n.conversing=false;n.postAnchor={...item.position};n.postProgressStart={...item.position};n.postStuck=0;}
  npcManager.grid.rebuild(npcManager.people);this.hp=100;this.heat=0;this.stamina=100;this.speedScale=1;this.inhalation=0;this.age=0;this.dead=false;this.deathElapsed=0;this.exhausted=false;this.debugExposure=null;this.exposure={heat:0,smoke:0,contact:0,rubble:0,zones:[]};this.sampleDebt=1;this.postClue=null;this.inquiryHistory=[];
  postMissions.restoreCheckpoint();$('survival-over').hidden=true;$('survival-over').style.opacity=0;$('survival-fx').style.opacity=0;playerControlEnabled=cameraManualControlEnabled=true;aftermath.clock=POST_CONFIG.SLOW_WALK_DURATION;playerMoveScale=1;started=true;last=0;updateCamera(1,false);missionController.render();ambientAudio.startPost();this.render();}
 test(kind){if(!EVENT_DEBUG||worldState!==WORLD_STATE.POST_BLAST)return;if(kind==='over'){this.hp=0;this.fail();return;}if(kind==='heat50'||kind==='heat90'){this.heat=kind==='heat50'?50:90;this.debugExposure={until:this.age+10,value:{heat:this.heat,smoke:0,contact:0,rubble:0,zones:['debug-heat']}};}else if(kind==='fire'){this.debugExposure={until:this.age+8,value:{heat:100,smoke:.2,contact:1,rubble:0,zones:['debug-fire']}};}else if(kind==='smoke'){this.debugExposure={until:this.age+16,value:{heat:20,smoke:1,contact:0,rubble:0,zones:['debug-smoke']}};this.inhalation=60;}this.sampleDebt=1;this.render();}
 ask(n){const info=postMasamiInformation(n);const old=this.postClue;if(info.stage>=(old?.stage||0)&&info.summary)this.postClue={text:info.summary,stage:info.stage};this.inquiryHistory.push({id:n.id,stage:info.stage,level:info.level});missionController.render();return {id:'post-inquiry-'+n.id,pages:['一雄「妻のマサミを見ませんでしたか。」',...info.pages],choices:[{label:'話の続きへ',action:'return-dialogue'}]};}
 snapshot(){return {hp:this.hp,heat:this.heat,stamina:this.stamina,inhalation:this.inhalation,running:this.running,exhausted:this.exhausted,speedScale:this.speedScale||1,dead:this.dead,age:this.age,exposure:{...this.exposure},postClue:this.postClue,checkpoint:!!this.checkpoint};}
}
const survival=new Survival();
