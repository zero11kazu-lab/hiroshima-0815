// NPC: serializable gameplay data remains independent of its instanced visual model.
class NPC {
 constructor(data,index){
  Object.assign(this,JSON.parse(JSON.stringify(data)));this.index=index;this.position={x:0,z:0};this.state=this.type==='shopkeeper'?'standing':'walking';this.next=0;this.timer=this.type==='shopkeeper'?2+index%5:0;this.yaw=0;this.phase=index;this.moving=false;this.updateDebt=0;this.visualDebt=0;this.blocked=0;this.stuck=false;this.stuckSeconds=0;this.progressTimer=0;this.progressStart={x:0,z:0};this.progressDistance=Infinity;this.neighborCount=0;this.actualSpeed=0;this.recoveries=0;this.detour=[];this.recoveryHold=0;this.recoveryPending=false;this.recoveryCooldown=0;this.conversing=false;this.waitKind='rest';this.scheduleIndex=-1;this.destination=null;this.currentAction=this.roleAction||'朝の散歩';this.schedule=this.schedule||[];this.dialogue=this.dialogue||['おはようございます。'];
  this.height=this.type==='child'?.69:this.type==='student'?.9:this.type==='woman'?.94:1;
  const lengths=this.route.map((p,i)=>Math.hypot(p.x-this.route[(i+1)%this.route.length].x,p.z-this.route[(i+1)%this.route.length].z));
  let at=(this.startFraction%1)*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){if(at<=lengths[i]){const a=this.route[i],b=this.route[(i+1)%lengths.length],t=lengths[i]?at/lengths[i]:0;this.position.x=a.x+(b.x-a.x)*t;this.position.z=a.z+(b.z-a.z)*t;this.next=(i+1)%lengths.length;this.yaw=Math.atan2(a.x-b.x,a.z-b.z);break;}at-=lengths[i];}
  this.progressStart={...this.position};
 }
 snapshot(){return {id:this.id,name:this.name,type:this.type,dialogue:JSON.parse(JSON.stringify(this.dialogue)),important:!!this.important,relationship:this.relationship,missionFlags:this.missionFlags,position:{...this.position},route:this.route.map(p=>({...p})),schedule:this.schedule.map(s=>({...s})),state:this.state,hiddenFromWorld:!!this.hiddenFromWorld,damageAppearance:this.damageAppearance||null,postRole:this.postRole||null,postBlastState:this.postBlastState||null,postBlastDialogue:this.postBlastDialogue||null,next:this.next,destination:this.destination?{...this.destination}:null,currentAction:this.currentAction,speed:this.speed,actualSpeed:this.actualSpeed,stuck:this.stuck,stuckSeconds:this.stuckSeconds,recoveries:this.recoveries,waypoint:this.detour[0]||this.route[this.next],neighbors:this.neighborCount};}
}

// Existing appearance classification and shadow slots feed the shared human renderer.
class NPCVisuals {
 constructor(scene,people){
  this.people=people;this.capacity=people.length;this.parts=17;this.root=new THREE.Object3D();this.local=new THREE.Object3D();this.matrix=new THREE.Matrix4();this.color=new THREE.Color();
  this.boxes=new THREE.InstancedMesh(geometries.box,mat('#ffffff'),this.capacity*this.parts);
  this.heads=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),mat('#ffffff'),this.capacity);
  this.hats=new THREE.InstancedMesh(geometries.cylinder,mat('#ffffff'),this.capacity);
  this.skirts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.28,.38,.58,6),mat('#ffffff'),this.capacity);
  this.shadows=new THREE.InstancedMesh(new THREE.CircleGeometry(.34,12),new THREE.MeshBasicMaterial({color:'#535940',transparent:true,opacity:.16,depthWrite:false}),this.capacity);
  this.batches=[this.boxes,this.heads,this.hats,this.skirts,this.shadows];
  for(const mesh of this.batches){mesh.frustumCulled=false;mesh.userData.dynamic=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);}
  const shirts=['#727a61','#8b8272','#646e65','#a39b80','#827767','#8d957d'];
  for(const n of people){
   const shirt=n.type==='student'?'#535d56':n.type==='shopkeeper'?'#a39e85':shirts[n.index%shirts.length];
   for(let part=0;part<this.parts;part++){let color=shirt;if([1,2,3].includes(part))color='#4f574c';if([6,7].includes(part))color='#b9a083';if([8,9].includes(part))color='#4d483d';if(part===10)color=n.type==='shopkeeper'?'#c7bfa5':'#494a3e';if(part===11||part===12)color='#373b34';if(part===13)color='#c1a488';if(part===14||part===15)color='#d1c8b0';if(part===16)color=n.type==='student'?'#8f876a':'#4e4c3f';this.boxes.setColorAt(n.index*this.parts+part,this.color.set(color));}
   this.heads.setColorAt(n.index,this.color.set(['#bca183','#c7ac8e','#bfa487'][n.index%3]));
   this.hats.setColorAt(n.index,this.color.set(n.type==='student'?'#454c44':'#8b8b70'));this.skirts.setColorAt(n.index,this.color.set(shirt));
  }
  this.important=new ImportantPeopleVisuals(scene,people);
  if(this.important.entries.size===people.length)for(const m of [this.boxes,this.heads,this.hats,this.skirts])m.count=0;
 }
 // Cache original instance colors; damage never mutates shared material colors.
 appearance(n){
  if(n.roomAppearance){n.damageAppearance='PRE';return;}
  const post=worldState===WORLD_STATE.POST_BLAST,fallen=['DOWN','DEAD','CHILD_DEAD'].includes(n.postBlastState);
  const child=n.type==='child'||n.postRole==='child';
  const roll=hash10(n.index+816);
  const missionMan=n.id===POST_MISSION_DATA.maleId&&n.postRole==='male';
  if(post&&missionMan&&!n.mission2ManAppearanceVariant)n.mission2ManAppearanceVariant=roll<.30?'BURN_FULL':roll<.60?'BURN_PARTIAL':'CLOTH_HALF';
  const variant=!post?'PRE':n.id===PLAYER_PROFILE.spouseId?'MASAMI_LIGHT':n.postRole==='evacuee'?'CLOTH_HALF':child?'CLOTHED':missionMan?n.mission2ManAppearanceVariant:fallen?(roll<.375?'CHARRED':roll<.75?'BURN_UPPER':'BURN_FULL'):(roll<.30?'BURN_FULL':roll<.60?'BURN_PARTIAL':'CLOTH_HALF');
  if(n.damageAppearance===variant)return;
  if(!n.preAppearance){n.preAppearance={boxes:[],head:new THREE.Color(),hat:new THREE.Color(),skirt:new THREE.Color()};for(let k=0;k<this.parts;k++){const c=new THREE.Color();this.boxes.getColorAt(n.index*this.parts+k,c);n.preAppearance.boxes.push(c);}this.heads.getColorAt(n.index,n.preAppearance.head);this.hats.getColorAt(n.index,n.preAppearance.hat);this.skirts.getColorAt(n.index,n.preAppearance.skirt);}
  n.damageAppearance=variant;
  const light=['MASAMI_LIGHT','CLOTH_HALF'].includes(variant),charred=variant==='CHARRED',clothed=variant==='CLOTHED';
  const skin=charred?'#302e2b':light?'#a78b73':variant==='BURN_PARTIAL'?'#ad8973':'#a95146',burn=charred?'#45403a':light?'#89594c':variant==='BURN_PARTIAL'?'#a95146':'#763e38',cloth=light?'#716958':clothed?'#655b50':'#51473e';
  for(let k=0;k<this.parts;k++){
   let c=n.preAppearance.boxes[k];
   if(post){const lower=[1,2,3,8,9].includes(k);c=[11,12].includes(k)?'#37312c':k===10?'#38332d':k===14?cloth:k===15?burn:k===16?'#48403a':clothed?(lower?cloth:k===6||k===7||k===13?skin:cloth):lower&&variant!=='BURN_FULL'&&!charred?cloth:skin;if(k===5&&light)c=cloth;}
   this.boxes.setColorAt(n.index*this.parts+k,this.color.set(c));
  }
  this.heads.setColorAt(n.index,post?this.color.set(skin):n.preAppearance.head);
  this.hats.setColorAt(n.index,post?this.color.set('#403b34'):n.preAppearance.hat);
  this.skirts.setColorAt(n.index,post?this.color.set(cloth):n.preAppearance.skirt);
  for(const m of [this.boxes,this.heads,this.hats,this.skirts])m.instanceColor.needsUpdate=true;
 }
 part(mesh,index,x,y,z,sx,sy,sz,rx=0){
  this.local.position.set(x,y,z);this.local.rotation.set(rx,0,0);this.local.scale.set(sx,sy,sz);this.local.updateMatrix();this.matrix.multiplyMatrices(this.root.matrix,this.local.matrix);mesh.setMatrixAt(index,this.matrix);
 }
 write(n,visible){
  this.appearance(n);const damaged=n.damageAppearance!=='PRE',light=['MASAMI_LIGHT','CLOTH_HALF'].includes(n.damageAppearance),bare=damaged&&n.damageAppearance!=='CLOTHED';
  const human=this.important?.has(n.id);
  if(human){this.important.write(n,visible);this.root.position.set(n.position.x,.08,n.position.z);this.root.rotation.set(0,n.yaw,0);this.root.scale.setScalar(visible&&!n.hiddenFromWorld?n.height:0);this.root.updateMatrix();this.part(this.shadows,n.index,0,-.01,0,1,1,1,-Math.PI/2);return;}
  const i=n.index,scale=visible&&!n.hiddenFromWorld&&!human?n.height:0;this.root.position.set(n.position.x,.08,n.position.z);this.root.rotation.set(n.eventTilt||0,n.yaw,n.eventRoll||0);this.root.scale.setScalar(scale);this.root.updateMatrix();
  const swing=n.moving?Math.sin(n.phase)*(damaged?.19:.4):0,legY=.6-Math.cos(swing)*.25,legZ=-Math.sin(swing)*.25;
  let k=i*this.parts;
  this.part(this.boxes,k++,0,1.06,0,.52,.7,.31); // jacket
  this.part(this.boxes,k++,0,.67,0,.49,.25,.32);
  this.part(this.boxes,k++,-.15,legY,legZ,.19,.48,.21,swing);
  this.part(this.boxes,k++,.15,legY,-legZ,.19,.48,.21,-swing);
  this.part(this.boxes,k++,-.34,1.13,-legZ,.16,.46,.19,-swing);
  this.part(this.boxes,k++,.34,1.13,legZ,.16,.46,.19,n.supported?-.8:swing);
  this.part(this.boxes,k++,-.34,.84,-legZ,.13,.14,.14);
  this.part(this.boxes,k++,.34,.84,legZ,.13,.14,.14);
  this.part(this.boxes,k++,-.15,.1,-.04+legZ,.21,.12,.32);
  this.part(this.boxes,k++,.15,.1,-.04-legZ,.21,.12,.32);
  this.part(this.boxes,k++,0,n.type==='shopkeeper'&&!damaged?.85:1.81,n.type==='shopkeeper'&&!damaged?-.175:0,n.type==='shopkeeper'&&!damaged?.4:.37,n.type==='shopkeeper'&&!damaged?.55:.13,.31);
  const close=visible&&Math.hypot(n.position.x-pos.x,n.position.z-pos.z)<18?1:0;
  this.part(this.boxes,k++,-.075,1.68,-.205,.035*close,.035*close,.025*close);this.part(this.boxes,k++,.075,1.68,-.205,.035*close,.035*close,.025*close);this.part(this.boxes,k++,0,1.62,-.225,.065*close,.08*close,.055*close);
  if(damaged){
   // Reuse collar and belt slots as a torn cloth remnant, burn and soot patches.
   this.part(this.boxes,k++,light?.14:-.16,light?1.08:1.20,-.164,light?.24:bare?.12:.16,light?.62:.18,.025);
   this.part(this.boxes,k++,-.13,1.23,-.166,.14,.16,.026);
   this.part(this.boxes,k++,0,.94,-.166,.22,.10,.025);
  }else{for(const side of [-1,1])this.part(this.boxes,k++,side*.085,1.37,-.18,.11,.12,.035);this.part(this.boxes,k++,0,.85,-.17,.48,.08,.035);}
  this.part(this.heads,i,0,1.63,0,.21,.26,.2);
  const cap=!damaged&&['man','student','shopkeeper'].includes(n.type)?1:0;
  this.part(this.hats,i,0,1.86,0,.24*cap,.12*cap,.24*cap);
  const skirt=n.type==='woman'&&(!damaged||!['BURN_FULL','CHARRED'].includes(n.damageAppearance))?1:0;this.part(this.skirts,i,0,.66,0,skirt,skirt,skirt);
  if(human){this.root.rotation.set(0,n.yaw,0);this.root.scale.setScalar(visible&&!n.hiddenFromWorld?n.height:0);this.root.updateMatrix();this.important.write(n,visible);}
  this.part(this.shadows,i,0,-.01,0,1,1,1,-Math.PI/2);
 }
 flush(){for(const m of this.batches)if(m.count)m.instanceMatrix.needsUpdate=true;this.important?.flush();}
}

class NPCManager {
 constructor(scene,data,isOpen){
  this.isOpen=isOpen;this.navigation=new Navigation(isOpen);this.people=data.map((d,i)=>new NPC(d,i));this.grid=new SpatialGrid(2);this.grid.rebuild(this.people);this.visibleCount=0;this.clock=0;this.lastScheduleSecond=-1;this.planBudget=1;this.playerPosition={...GEO1945.playerStart};
  this.visuals=new NPCVisuals(scene,this.people);this.stats={logicSteps:0,farSteps:0,replans:0,recoveries:0};this.prepareLanes();this.validateRoutes();this.passages=new PassageController(this);
  for(const n of this.people){if(!this.clear(n,n.position.x,n.position.z,this.playerPosition))this.findSpawn(n);this.visuals.write(n,true);}this.visuals.flush();
 }
 prepareLanes(){
  for(const n of this.people){if(n.type==='shopkeeper'||n.important||n.stayLocal)continue;
   const original=n.route,lane=.14+(n.index%3)*.12;
   const offset=original.map((p,i)=>{const a=original[(i+original.length-1)%original.length],b=original[(i+1)%original.length],l1=Math.hypot(p.x-a.x,p.z-a.z)||1,l2=Math.hypot(b.x-p.x,b.z-p.z)||1;
    return {x:p.x-((p.z-a.z)/l1+(b.z-p.z)/l2)*lane,z:p.z+((p.x-a.x)/l1+(b.x-p.x)/l2)*lane};});
   if(offset.every((p,i)=>this.navigation.segmentClear(p,offset[(i+1)%offset.length])))n.route=offset;
  }
 }
 validateRoutes(){for(const n of this.people)for(let i=0;i<n.route.length;i++)if(!this.navigation.segmentClear(n.route[i],n.route[(i+1)%n.route.length]))throw Error('NPC route blocked: '+n.routeId);}
 clear(n,x,z,p=this.playerPosition){
  if((n.important||n.stayLocal)&&Math.hypot(x-n.homePosition.x,z-n.homePosition.z)>n.homeRadius)return false;
  if(!this.isOpen(x,z)||(x-p.x)**2+(z-p.z)**2<.62**2)return false;
  for(const o of this.grid.query(x,z,.63)){if(o!==n&&(x-o.position.x)**2+(z-o.position.z)**2<.61**2)return false;}return true;
 }
 findSpawn(n){
  for(let j=0;j<80;j++){const i=j%n.route.length,a=n.route[i],b=n.route[(i+1)%n.route.length],t=(Math.floor(j/n.route.length)%20)/20,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
   if(this.clear(n,x,z,GEO1945.playerStart)){n.position.x=x;n.position.z=z;n.next=(i+1)%n.route.length;this.grid.move(n);this.resetProgress(n);return;}
  }throw Error('NPC spawn occupied: '+n.id);
 }
 protectSpawn(p){this.grid.rebuild(this.people);for(const n of this.grid.query(p.x,p.z,.7)){this.findSpawn(n);this.visuals.write(n,true);}this.visuals.flush();}
 canPlayerMove(x,z){return !this.grid.query(x,z,.63).some(n=>(x-n.position.x)**2+(z-n.position.z)**2<.62**2);}
 resetProgress(n){n.progressTimer=0;n.progressStart={...n.position};n.progressDistance=Infinity;n.stuck=false;n.stuckSeconds=0;}
 monitorProgress(n,dt,target){
  n.progressTimer+=dt;
  if(n.progressTimer<2.6)return;
  const displacement=Math.hypot(n.position.x-n.progressStart.x,n.position.z-n.progressStart.z),distance=Math.hypot(target.x-n.position.x,target.z-n.position.z);
  if(displacement<.28||(Number.isFinite(n.progressDistance)&&n.progressDistance-distance<.06&&displacement<.65)){
   n.stuck=true;n.stuckSeconds+=n.progressTimer;n.recoveryPending=true;
  }else{n.stuck=false;n.stuckSeconds=0;}
  n.progressTimer=0;n.progressStart={...n.position};n.progressDistance=distance;
 }
 scheduleAt(seconds){
  if(Math.floor(seconds)===this.lastScheduleSecond)return;this.lastScheduleSecond=Math.floor(seconds);
  for(const n of this.people){if(n.conversing)continue;let i=-1;for(let j=0;j<n.schedule.length;j++)if(seconds>=n.schedule[j].at)i=j;
   if(i<0||i===n.scheduleIndex)continue;n.scheduleIndex=i;const event=n.schedule[i];n.currentAction=event.action;
   n.destination={...n.route[event.waypoint%n.route.length]};n.next=event.waypoint%n.route.length;n.timer=0;n.detour=[];n.schedulePending=true;n.recoveryPending=true;n.recoveryCooldown=0;
  }
 }
 plan(n){
  if(this.planBudget<=0||n.recoveryCooldown>0||n.conversing)return;this.planBudget--;
  n.recoveryPending=false;n.recoveryCooldown=1.4+(n.index%3)*.2;this.stats.replans++;
  const target=n.destination||n.route[n.next],free=(x,z)=>this.clear(n,x,z);
  let path=this.navigation.findPath(n.position,target,free,1200);
  if(path&&path.length>1){n.detour=path;n.detourPurpose=n.schedulePending?'schedule':'rejoin';n.schedulePending=false;n.state='rerouting';return;}
  // No route through a local queue: walk to a vacant bay, wait, then rejoin further along.
  n.recoveries++;this.stats.recoveries++;
  const dx=target.x-n.position.x,dz=target.z-n.position.z,l=Math.hypot(dx,dz)||1,heading=Math.atan2(dz,dx),radius=1.4+Math.min(n.recoveries%4,3)*.65;
  for(const angle of [Math.PI/2,-Math.PI/2,Math.PI,Math.PI*3/4,-Math.PI*3/4,Math.PI/4,-Math.PI/4,0]){
   const goal={x:n.position.x+Math.cos(heading+angle)*radius,z:n.position.z+Math.sin(heading+angle)*radius};
   if(!free(goal.x,goal.z))continue;
   path=this.navigation.findPath(n.position,goal,free,350);
   if(path&&path.length>1){n.detour=path;n.detourPurpose='yield';n.state='recovering';n.recoveryHold=1.1+(n.index%3)*.4;return;}
  }
  // Retry another route waypoint, rather than requesting the same occupied corner forever.
  if(n.recoveries%2===0&&!n.schedulePending){n.next=(n.next+1)%n.route.length;n.destination=null;}
  n.timer=.25+(n.index%4)*.13;n.waitKind='yield';n.state='yielding';n.recoveryPending=true;
 }
 moveTo(n,x,z,dt){
  const dx=x-n.position.x,dz=z-n.position.z,d=Math.hypot(dx,dz);if(d<1e-6)return;
  n.yaw+=angleDelta(Math.atan2(-dx,-dz),n.yaw)*(1-Math.exp(-9*dt));n.position.x=x;n.position.z=z;this.grid.move(n);n.moving=true;n.actualSpeed=d/dt;n.phase+=d*9;
 }
 step(n,dt,p){
  this.stats.logicSteps++;n.moving=false;n.actualSpeed=0;n.recoveryCooldown=Math.max(0,n.recoveryCooldown-dt);
  if(n.conversing){n.state='talking';n.yaw+=angleDelta(Math.atan2(n.position.x-p.x,n.position.z-p.z),n.yaw)*(1-Math.exp(-7*dt));this.resetProgress(n);return;}
  const passage=this.passages.target(n);
  if(passage){n.timer=0;n.recoveryPending=false;this.resetProgress(n);}
  let target=passage?.target||n.detour[0]||n.destination||n.route[n.next];
  if(n.timer>0){n.timer-=dt;if(n.waitKind==='rest'){this.resetProgress(n);return;}this.monitorProgress(n,dt,target);return;}
  const dx=target.x-n.position.x,dz=target.z-n.position.z,distance=Math.hypot(dx,dz);
  if(distance<.16){
   if(passage){n.state=passage.waiting?'passage-wait':'walking';return;}
   if(n.detour.length){n.detour.shift();if(n.detour.length)return;
    if(n.detourPurpose==='yield'){n.timer=n.recoveryHold;n.waitKind='rest';n.state='yielding';n.next=(n.next+(n.recoveries>1?1:0))%n.route.length;return;}
   }
   n.destination=null;n.next=(n.next+1)%n.route.length;n.state=n.type==='shopkeeper'?'standing':'waiting';n.timer=n.pause*(.8+(n.index%3)*.1);n.waitKind='rest';this.resetProgress(n);return;
  }
  if(!passage)this.monitorProgress(n,dt,target);
  const neighbors=this.grid.query(n.position.x,n.position.z,1.65).filter(o=>o!==n);n.neighborCount=neighbors.length;
  const vx=dx/distance,vz=dz/distance;let sx=0,sz=0,front=0;
  for(const o of neighbors){let ox=n.position.x-o.position.x,oz=n.position.z-o.position.z,d=Math.hypot(ox,oz);if(d<.001){ox=n.index<o.index?-1:1;oz=.2;d=1;}
   if(d<1.15){const f=(1.15-d)/1.15;sx+=ox/d*f;sz+=oz/d*f;}
   if((-ox*vx-oz*vz)>.2&&d<1.3)front++;
  }
  if(passage?.locked){sx=0;sz=0;}
  const separation=Math.hypot(sx,sz);if(separation>1){sx/=separation;sz/=separation;}
  const speed=n.speed*Math.max(.5,1-front*.12),travel=Math.min(speed*dt,distance);
  let mx=vx+sx*.85,mz=vz+sz*.85,ml=Math.hypot(mx,mz)||1;mx=mx/ml*travel;mz=mz/ml*travel;
  let x=n.position.x+mx,z=n.position.z+mz;
  if(!this.clear(n,x,z,p)){
   if(passage?.locked){n.state='passage-wait';return;}
   let found=false;
   // Traffic keeps right; stable priority prevents two people repeatedly choosing the same gap.
   const mustYield=neighbors.some(o=>o.conversing||(o.index<n.index&&Math.hypot(o.position.x-n.position.x,o.position.z-n.position.z)<.95));
   const angles=mustYield?[Math.PI/2,-Math.PI/2,Math.PI*3/4,-Math.PI*3/4,Math.PI]:[Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2];
   for(const a of angles){const c=Math.cos(a),s=Math.sin(a),cx=n.position.x+(vx*c-vz*s)*travel*.78,cz=n.position.z+(vx*s+vz*c)*travel*.78;
    if(this.clear(n,cx,cz,p)){x=cx;z=cz;found=true;break;}
   }
   if(!found){n.state='yielding';n.blocked+=dt;return;}
  }
  n.blocked=0;n.state=passage?.waiting?'passage-wait':n.detour.length?'recovering':'walking';this.moveTo(n,x,z,dt);
 }
 update(dt,p,seconds=GAME_CONFIG.START_TIME){
  this.playerPosition=p;this.clock+=dt;this.visibleCount=0;this.planBudget=1;this.scheduleAt(seconds);
  const view=world?world.visibleDistance-4:60;
  for(const n of this.people){
   const distance=Math.hypot(n.position.x-p.x,n.position.z-p.z),near=distance<26;n.updateDebt+=dt;n.visualDebt+=dt;
   const interval=near?1/30:(world&&world.quality>0?.35:.2);
   if(n.updateDebt>=interval){let debt=n.updateDebt;n.updateDebt=0;if(!near)this.stats.farSteps++;while(debt>1e-6){const step=Math.min(debt,.05);this.step(n,step,p);debt-=step;}}
   const visible=distance<view;if(visible)this.visibleCount++;
   if((visible&&(near||n.visualDebt>.1))||n.wasVisible!==visible){this.visuals.write(n,visible);n.visualDebt=0;n.wasVisible=visible;}
  }
  // Fair rotating planner queue, capped at one A* request per update.
  const offset=Math.floor(this.clock*30)%Math.max(1,this.people.length);
  for(let i=0;i<this.people.length&&this.planBudget>0;i++){const n=this.people[(i+offset)%this.people.length];if(n.recoveryPending)this.plan(n);}
  this.visuals.flush();
 }
 nearest(p,r=2.25){let best=null,distance=r;for(const n of this.grid.query(p.x,p.z,r)){const d=Math.hypot(n.position.x-p.x,n.position.z-p.z);if(d<distance&&this.navigation.segmentClear(p,n.position)){best=n;distance=d;}}return best;}
 snapshots(){return this.people.map(n=>n.snapshot());}
 debugText(){const list=[...this.people].sort((a,b)=>Number(b.stuck)-Number(a.stuck)||Math.hypot(a.position.x-pos.x,a.position.z-pos.z)-Math.hypot(b.position.x-pos.x,b.position.z-pos.z));
  return list.slice(0,5).map(n=>`${n.id} ${n.state} v:${n.actualSpeed.toFixed(2)}/${n.speed.toFixed(2)} stuck:${n.stuck?'YES':'-'} wp:${n.next} near:${n.neighborCount}`).join('\n');}
}
