// The characters and this story are fictional. The sequence uses elapsed seconds, not nested timers.
const ENDING_STATES=['MASAMI_REUNION','ESCAPE_SEQUENCE','FADE_AFTER_ESCAPE','THIRTY_DAYS_LATER','RADIATION_EXPLANATION','TATAMI_ROOM','MASAMI_FINAL_DIALOGUE','MASAMI_DEATH','KAZUO_GRIEF','FINAL_BLACKOUT','MEMORIAL','THE_END'];
// Branch and conversation are independent draws, made only at a new game boundary.
const ENDING_CONFIG=Object.freeze({masamiDeathProbability:.5});
const ENDING_DIALOGUES=HISTORICAL_DATA.couple_dialogue.endings;
const FINAL_DIALOGUE=ENDING_DIALOGUES.A[0].lines; // A-1 preserves the original conversation verbatim.
function drawEndingPlan(rng=Math.random){
 const branch=rng()<ENDING_CONFIG.masamiDeathProbability?'A':'B';
 const dialogueIndex=Math.floor(rng()*ENDING_DIALOGUES[branch].length);
 return Object.freeze({branch,dialogueIndex,patternId:ENDING_DIALOGUES[branch][dialogueIndex].id});
}
const ENDING_DURATIONS=[6,8,3,3,25,5,FINAL_DIALOGUE.reduce((sum,line)=>sum+line.seconds,0),12,6,3,9.5,9];
const MEMORIAL_MESSAGE='「こがぁな、わしみたいな小さいもんが、どんなあやまちをしたいうて、こがぁに辛い思いをせにゃぁいけんのんかのぉ……」';
const RADIATION_TEXT=[
 '原爆は爆風と熱線だけでなく、放射線も放った。',
 '強い被曝後、数日のうちに疲労、吐き気、食欲低下や下痢が現れることがある。',
 'いったん落ち着いて見えても、数週間のうちに発熱、口内炎、脱毛や出血が現れることがある。',
 '骨髄が損傷すると血球が減り、出血や感染により数週間から１、２か月以内に命を落とす場合もあった。',
 '架空の人物マサミは、被曝後に重度の急性放射線症を発症し、次第に衰弱した。'
];
class EndingSequence {
 constructor(){this.active=false;this.state='GAMEPLAY_POST_BLAST';this.time=0;this.index=0;this.gameplayCompleted=false;this.durations=[...ENDING_DURATIONS];this.plan=null;this.audioNodes=[];this.musicMode='';this.musicClock=0;}
 reset(){$('ending-return-title').hidden=true;$('ending-return-title').disabled=true;this.stopAudio();this.active=false;this.state='GAMEPLAY_POST_BLAST';this.gameplayCompleted=false;this.deceasedId=null;this.index=0;this.time=0;if(this.room)this.room.visible=false;const e=$('ending-overlay');if(e){e.hidden=true;e.classList.remove('is-memorial');}$('ending-memorial').hidden=true;document.body.classList.remove('ending-active');}
 // The historical timeline IDs remain stable; the patient/caregiver are explicit roles.
 get patientId(){return this.plan?.branch==='B'?'kazuo':'masami';}
 get patientName(){return this.patientId==='kazuo'?'一雄':'マサミ';}
 get caregiverName(){return this.patientId==='kazuo'?'マサミ':'一雄';}
 get dialogueLines(){return ENDING_DIALOGUES[this.plan?.branch||'A'][this.plan?.dialogueIndex||0].lines;}
 get radiationText(){return [...RADIATION_TEXT.slice(0,4),`架空の人物${this.patientName}は、被曝後に重度の急性放射線症を発症し、次第に衰弱した。`,`${this.caregiverName}も被曝している。この場で看取ることは、その後の健康や生存を保証するものではない。`];}
 newPlay(){this.plan=drawEndingPlan();this.applyPlan();}
 applyPlan(){this.durations=[...ENDING_DURATIONS];this.durations[4]=this.radiationText.length*5;this.durations[6]=this.dialogueLines.reduce((sum,line)=>sum+line.seconds,0);this.deceasedId=null;this.roomCastPlan=null;}
 // Debug-only forcing is never connected to normal UI, health or mission choices.
 testPlan(branch,index=0){if(!EVENT_DEBUG||!ENDING_DIALOGUES[branch]?.[index])return;this.plan=Object.freeze({branch,dialogueIndex:index,patternId:ENDING_DIALOGUES[branch][index].id});this.applyPlan();}
 begin(){if(this.active||this.gameplayCompleted)return;if(!this.plan)this.newPlay();this.active=true;this.gameplayCompleted=true;this.index=0;this.time=0;this.state=ENDING_STATES[0];this.escapeStart={x:pos.x,z:pos.z};this.wifeStart={...postMissions.wife.position};stop();playerControlEnabled=cameraManualControlEnabled=false;if(dialogue.active)dialogue.close();$('talk').hidden=true;document.body.classList.add('event-active','ending-active');$('ending-overlay').hidden=false;ambientAudio.stop();this.audio('ending');}
 // The music is original, synthesized, and connected to the existing limiter. Only one track is active.
 audio(mode){if(mode==='ending'&&this.musicMode==='post'&&this.audioGain&&morningAudio.ctx?.state==='running'){const c=morningAudio.ctx,g=this.audioGain,nodes=this.audioNodes.slice(),t=c.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0,t+.6);for(const n of nodes)try{n.stop?.(t+.65);}catch(_){}this.audioNodes=[];this.audioGain=null;setTimeout(()=>{for(const n of nodes)try{n.disconnect();}catch(_){}},800);}else this.stopAudio();this.musicMode=mode;this.musicClock=0;this.nextNote=0;this.noteIndex=0;this.ensureAudio();}
 ensureAudio(){const c=morningAudio.ctx;if(this.audioGain||!this.musicMode||!c||c.state!=='running'||!morningAudio.enabled)return;const gain=c.createGain(),now=c.currentTime;gain.gain.setValueAtTime(.0001,now);const start=now+(this.musicMode==='ending'?.65:0);gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(this.musicMode==='post'?.36:this.state==='MEMORIAL'?.018:.24,start+1.2);gain.connect(morningAudio.master);this.audioGain=gain;this.audioNodes.push(gain);
  if(this.musicMode==='post')for(const [i,f] of [110,164.81,174.61].entries()){const o=c.createOscillator(),g=c.createGain();o.type=i===0?'sine':'triangle';o.frequency.value=f;g.gain.value=i===0?.13:.085;o.connect(g);g.connect(gain);o.start();this.audioNodes.push(o,g);}}
 note(f,d=2,volume=.2){const c=morningAudio.ctx;if(!this.audioGain||!c||c.state!=='running')return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.audioGain);o.start(t);o.stop(t+d+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
 stopAudio(){for(const n of this.audioNodes){try{n.stop?.();}catch(_){}try{n.disconnect();}catch(_){}}this.audioNodes=[];this.audioGain=null;this.musicMode='';}
 music(dt){if(!this.musicMode)return;this.ensureAudio();if(!this.audioGain)return;this.musicClock+=dt;
  if(this.musicClock>=this.nextNote){if(this.musicMode==='post'){
   // Sparse, unresolved original phrase, with audible midrange for phone speakers.
   const phrase=[329.63,311.13,392,349.23,277.18,311.13,369.99,293.66],durations=[3.4,4.4,3,5,3.6,4.2,3.2,5.2],i=Math.floor(this.noteIndex||0)%phrase.length;
   this.note(phrase[i],durations[i],.25);this.noteIndex=i+1;this.nextNote=this.musicClock+[3.1,4.5,2.8,5][i%4];
  }else if(this.state!=='MEMORIAL'&&(this.state!=='THE_END'||this.time<5)){const notes=[220,261.63,329.63,293.66,261.63,196,220,246.94];this.note(notes[Math.floor(this.nextNote/1.5)%notes.length],2.3,.23);this.nextNote+=1.5;}}
  if(this.musicMode==='ending'&&this.state==='THE_END'&&this.time>4)this.audioGain.gain.setTargetAtTime(0,morningAudio.ctx.currentTime,1.5);
 }
 endingTexture(kind){this.roomTextures=this.roomTextures||{};if(this.roomTextures[kind])return this.roomTextures[kind];const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=kind==='tatami'?'#a39a70':kind==='cloth'?'#ccc4ae':'#c8bea7';g.fillRect(0,0,256,256);for(let i=0;i<256;i++){g.strokeStyle=i%3?'#00000009':'#ffffff18';g.beginPath();g.moveTo(0,i);g.lineTo(256,i);g.stroke();}for(let i=0;i<256;i+=4){g.fillStyle='#655d4310';g.fillRect(i,0,1,256);}const map=new THREE.CanvasTexture(c);this.roomTextures[kind]=map;return map;}
 buildRoom(){if(this.room)return;this.room=new THREE.Group();this.room.position.set(0,-100,0);scene.add(this.room);box(8,.2,7,'#a89b77',0,0,0,this.room);for(let x=-3;x<=3;x+=1.5)box(.04,.01,7,'#5f6351',x,.11,0,this.room);box(8,4,.12,'#a69c87',0,2,-3.5,this.room);for(let x=-3;x<=3;x+=1.5){box(1.35,2.8,.06,'#d5cdb5',x,1.7,-3.41,this.room);for(let y=.6;y<3;y+=.7)box(1.35,.035,.08,'#736b5b',x,y,-3.35,this.room);}box(2.1,.24,3,'#d5cdbb',.8,.24,0,this.room);box(1.4,.18,1.4,'#b5aa95',.8,.43,.4,this.room);this.buildRoomCharacters();for(const mesh of this.room.children){if(!mesh.isMesh)continue;const material=mesh.material.clone();material.map=this.endingTexture(mesh.scale.y<.3?'cloth':mesh.scale.y>2?'paper':'tatami');mesh.material=material;}this.room.children[0].material.map=this.endingTexture('tatami');}
 // Reuse the playable character hierarchy and the NPC renderer's exact part layout.
 // This is a visual-only copy: no NPC, AI, mission or input is registered here.
 buildRoomCharacters(){
  this.roomKazuo=new THREE.Group();this.room.add(this.roomKazuo);
  this.kazuoModel=player.clone(true);this.kazuoModel.position.set(0,0,0);this.kazuoModel.rotation.set(0,0,0);this.roomKazuo.add(this.kazuoModel);
  if(player.preDamageMaterials){let index=0;this.kazuoModel.traverse(m=>{if(m.isMesh){const original=player.preDamageMaterials[index++];m.material=original.material;m.geometry=original.geometry||m.geometry;delete m.userData.playerDamageGeometry;}});}
  this.kazuoModel.userData.damageAppearance='PRE';
  for(const child of [...this.kazuoModel.children])if(child.geometry?.type==='CircleGeometry')this.kazuoModel.remove(child);
  this.kazuoLegs=kazuoRig(this.kazuoModel).legs;
  this.kazuoArms=kazuoRig(this.kazuoModel).arms;
  poseKazuo(this.kazuoModel,false);
  this.kazuoChest=this.kazuoModel.getObjectByName('kazuo-chest');
  this.roomMasami=new THREE.Group();this.room.add(this.roomMasami);
  const model=npcManager.visuals.important.createRoomModel(PLAYER_PROFILE.spouseId);
  this.roomMasami.add(model);this.masamiModel=model;this.masamiRig=kazuoRig(model);
  this.masamiChest=this.masamiRig.chest;this.masamiHead=this.masamiRig.head;
  // Room-only material copies: illness never changes field characters or shared materials.
  this.roomRest=[];
  for(const model of [this.kazuoModel,this.masamiModel])model.traverse(mesh=>{if(!mesh.isMesh)return;mesh.material=mesh.material.clone();this.roomRest.push({mesh,position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone(),color:mesh.material.color.clone(),visible:mesh.visible});});
  const hair=box(.26,.02,.05,'#524e47',1.25,.4,-.8,this.room);hair.rotation.y=.5;this.pillowHair=hair;
 }
 configureRoomCast(){
  if(this.roomCastPlan===this.plan)return;this.roomCastPlan=this.plan;
  for(const e of this.roomRest){e.mesh.position.copy(e.position);e.mesh.rotation.copy(e.rotation);e.mesh.scale.copy(e.scale);e.mesh.material.color.copy(e.color);e.mesh.visible=e.visible;}
  poseKazuo(this.kazuoModel,false);poseKazuo(this.masamiModel,false);
  const kazuoDying=this.patientId==='kazuo';
  this.patientRoot=kazuoDying?this.roomKazuo:this.roomMasami;this.patientModel=kazuoDying?this.kazuoModel:this.masamiModel;
  this.caregiverRoot=kazuoDying?this.roomMasami:this.roomKazuo;this.caregiverModel=kazuoDying?this.masamiModel:this.kazuoModel;
  this.patientChest=kazuoDying?this.kazuoChest:this.masamiChest;this.chestDepth=this.patientChest.scale.z;
  this.patientRoot.position.set(.8,kazuoDying?.56:.59,1.1);this.patientRoot.rotation.set(-Math.PI/2,0,0);
  this.patientModel.position.set(0,0,0);this.patientModel.rotation.set(0,Math.PI,0);
  this.caregiverRoot.position.set(-.85,.17,-.1);this.caregiverRoot.rotation.set(0,-Math.PI/2,0);
  this.caregiverModel.position.set(0,-.35,0);this.caregiverModel.rotation.set(0,0,0);
  this.caregiverArms=kazuoDying?this.masamiRig.arms:this.kazuoArms;
  if(kazuoDying){
   poseKazuo(this.masamiModel,true);this.masamiSeatY=importantSeatY(this.masamiModel);this.masamiModel.position.y=this.masamiSeatY;
   // The patient's cap is placed aside visually, while his face and clothes remain his own.
   this.kazuoModel.getObjectByName('kazuo-cap').visible=false;this.kazuoModel.getObjectByName('kazuo-brim').visible=false;
  }else{
   poseKazuo(this.kazuoModel,true);this.kazuoModel.position.y=-.67;
   // Reduced hair density is supplied by Masami's weak atlas, without replacing her identity.
  }
  for(const arm of this.caregiverArms)arm.rotation.x=.25;
  const pale=new THREE.Color('#b6aaa0');
  kazuoRoomAppearance(this.kazuoModel,kazuoDying);importantRoomAppearance(this.masamiModel,!kazuoDying);
  const patientHead=kazuoDying?this.kazuoModel.getObjectByName('kazuo-head'):this.masamiHead;
  patientHead.material.color.lerp(pale,.42);this.patientChest.material.color.multiplyScalar(.88);
  this.pillowHair.visible=!kazuoDying;
 }
 roomPerformance(s,t,title){
  this.configureRoomCast();
  const dying=s==='MASAMI_DEATH',still=['KAZUO_GRIEF','FINAL_BLACKOUT'].includes(s),strength=still?0:dying?Math.max(0,1-t/3):1;
  this.deceasedId=still||dying&&t>=3?this.patientId:null;
  this.patientChest.scale.z=this.chestDepth*(1+Math.sin(t*(dying?2:2.7))*.04*strength);
  this.patientRoot.position.y=this.patientId==='kazuo'?.56:.59;
  if(s==='TATAMI_ROOM'&&t>1&&t<3){this.patientRoot.position.y+=.008*Math.sin(t*14);title.textContent=`${this.patientName}「……こほっ、こほっ。」`;}
  if(this.patientId==='masami')kazuoRig(this.kazuoModel).spine.rotation.x=0;else this.masamiRig.spine.rotation.x=0;
  this.caregiverModel.rotation.x=0;const caregiverY=this.patientId==='masami'?-.67:this.masamiSeatY;this.caregiverModel.position.y=caregiverY;
  for(const arm of this.caregiverArms)arm.rotation.x=.25;
  if(s==='MASAMI_FINAL_DIALOGUE'){
   let remaining=t;for(const line of this.dialogueLines){title.textContent=line.text;if(remaining<line.seconds)break;remaining-=line.seconds;}
  }
  if(dying)title.textContent=t<3?'':t<5?`${this.caregiverName}「……${this.patientName}？」`:t<7?`${this.caregiverName}「${this.patientName}……」`:t<9?`${this.caregiverName}「${this.patientName}！！」`:`${this.patientName}は、${this.caregiverName}に見守られながら静かに息を引き取った。`;
  if(still){
   const grief=s==='KAZUO_GRIEF'?t:6,lean=eventEase(Math.min(grief/2,1));
   if(this.patientId==='masami'){
    // Bow at the waist; keep kneeling legs and feet on the tatami.
    kazuoRig(this.kazuoModel).spine.rotation.x=-.65*lean+(s==='KAZUO_GRIEF'?Math.sin(t*7)*.025*lean:0);
    for(const arm of this.caregiverArms)arm.rotation.x=.25+.4*lean;
   }else{
    this.masamiRig.spine.rotation.x=-.65*lean+(s==='KAZUO_GRIEF'?Math.sin(t*7)*.025*lean:0);
    for(const arm of this.caregiverArms)arm.rotation.x=.25+.4*lean;
   }
   if(s==='KAZUO_GRIEF')title.textContent=`${this.caregiverName}「${this.patientName}……ううっ……」`;
  }
 }

 jump(state){if(!EVENT_DEBUG)return;this.begin();const i=ENDING_STATES.indexOf(state);if(i<0)return;this.index=i;this.state=state;this.time=0;if(this.room)this.room.visible=i>=5&&i<10;this.render();}
 update(dt){if(!this.active)return;this.music(dt);const before=this.state;this.time+=dt;while(this.time>=this.durations[this.index]&&this.index<ENDING_STATES.length-1){this.time-=this.durations[this.index++];this.state=ENDING_STATES[this.index];}if(before!==this.state){if(this.state==='MEMORIAL'&&this.audioGain){const now=morningAudio.ctx.currentTime;this.audioGain.gain.cancelScheduledValues(now);this.audioGain.gain.setTargetAtTime(.018,now,.9);}if(this.state==='TATAMI_ROOM'){this.note(165,.3,.1);this.note(140,.4,.06);}if(this.state==='KAZUO_GRIEF'){this.note(155,1.1,.18);this.note(185,1.7,.09);}}this.render();}
 render(){const e=$('ending-overlay'),title=$('ending-text'),t=this.time,s=this.state;const back=$('ending-return-title');back.hidden=s!=='THE_END';back.disabled=s!=='THE_END'||t<3.7||titleScreen.returning;back.style.opacity=s==='THE_END'?eventEase((t-3.7)/1.2):0;e.style.background='transparent';title.textContent='';title.style.fontSize='';title.style.fontFamily='';title.style.opacity='1';title.style.fontWeight='';title.style.textShadow='';e.classList.toggle('is-memorial',s==='MEMORIAL');$('ending-memorial').hidden=s!=='MEMORIAL';
  if(s==='MASAMI_REUNION'){title.textContent=t<2?'一雄「マサミ！」':t<4?'マサミ「一雄……。」':'一雄「ここを出よう。」';camera.position.lerp(new THREE.Vector3(pos.x+2,2.8,pos.z+4),.02);camera.lookAt(postMissions.wife.position.x,1,postMissions.wife.position.z);}
  else if(s==='ESCAPE_SEQUENCE'){const w=postMissions.wife,d=Math.min(t*.3,2.4);player.position.set(this.escapeStart.x,.08,this.escapeStart.z-d);w.position.x=this.wifeStart.x;w.position.z=this.wifeStart.z-d;player.rotation.y=Math.PI;animateKazuo(player,t*5,1,false,0);w.yaw=Math.PI;w.phase=t*5;w.moving=true;npcManager.visuals.write(w,true);npcManager.visuals.flush();camera.position.set(this.escapeStart.x,3.5,this.escapeStart.z+6+t*.14);camera.lookAt(this.escapeStart.x,1,this.escapeStart.z-d);hazards.animate(t);}
  else if(s==='FADE_AFTER_ESCAPE')e.style.background=`rgba(0,0,0,${eventEase(t/3)})`;
  else if(s==='THIRTY_DAYS_LATER'){e.style.background='#000';title.textContent='30日後';}
  else if(s==='RADIATION_EXPLANATION'){e.style.background='#000';title.textContent=this.radiationText[Math.min(this.radiationText.length-1,Math.floor(t/5))];}
  else if(['TATAMI_ROOM','MASAMI_FINAL_DIALOGUE','MASAMI_DEATH','KAZUO_GRIEF','FINAL_BLACKOUT'].includes(s)){this.buildRoom();this.room.visible=true;const roomTime=s==='TATAMI_ROOM'?t:s==='MASAMI_FINAL_DIALOGUE'?5+Math.min(t/8,5):10;camera.position.set(5-roomTime*.06,-96.3,6-roomTime*.06);camera.lookAt(0,-99.1,0);this.roomPerformance(s,t,title);if(s==='FINAL_BLACKOUT')e.style.background=`rgba(0,0,0,${eventEase(t/3)})`;}
  else if(s==='MEMORIAL'){
   e.style.background='#000';if(this.room)this.room.visible=false;
   const background=eventEase(t/.9)*(1-eventEase((t-8.8)/.7));
   $('ending-memorial').style.opacity=String(background);
   title.style.opacity=String(eventEase((t-.7)/1)*(1-eventEase((t-7.2)/1)));
   for(const text of (this.patientId==='masami'?MEMORIAL_MESSAGE:'「ただ、一緒に暮らしていたかっただけなのに……。どうして、こんな別れをせんといけんの……」').split(/(?=こがぁに)/)){const line=document.createElement('span');line.className='memorial-line';line.textContent=text;title.appendChild(line);}
  }
  else if(s==='THE_END'){e.style.background='#000';title.style.fontSize='min(38vw, 65dvh)';title.style.fontFamily='YuMincho, Hiragino Mincho ProN, serif';title.style.fontWeight='900';title.style.opacity=eventEase((t-.7)/1.2);title.style.textShadow='1px 1px 2px #e8deca, -1px 0 1px #e8deca';title.textContent=t<.7?'':'【完】';}
 }
}
const ending=new EndingSequence();
