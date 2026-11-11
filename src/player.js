// Player — 移動入力とカメラ連携は試作03を継承。
function createPlayer(){
player=createKazuoModel();preparePlayerInjuries(player);scene.add(player);const rig=kazuoRig(player);legs.push(...rig.legs);arms.push(...rig.arms);
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.43,24),new THREE.MeshBasicMaterial({color:'#4b5240',transparent:true,opacity:.22,depthWrite:false}));shadow.name='kazuo-ground-shadow';shadow.rotation.x=-Math.PI/2;shadow.position.y=.07;player.add(shadow);

}

function updatePlayer(dt){
if(!playerControlEnabled||dialogue?.active){phase=0;animateKazuo(player,0,0,false,dt,!!dialogue?.active);return {x:0,y:0,n:0};}
let x=input.x,y=input.y;if(input.id===null){x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);}let n=Math.hypot(x,y);if(n>1){x/=n;y/=n;n=1;}if(n>.08){const sin=Math.sin(cameraYaw+cameraAvoidYaw),cos=Math.cos(cameraYaw+cameraAvoidYaw);
const worldX=x*cos+y*sin,worldZ=-x*sin+y*cos;
const baseSpeed=worldState===WORLD_STATE.POST_BLAST&&survival.running?PLAYER_RUN_SPEED:PLAYER_WALK_SPEED;let nx=pos.x+worldX*baseSpeed*playerMoveScale*dt,nz=pos.z+worldZ*baseSpeed*playerMoveScale*dt;if(allowed(nx,pos.z)&&postMissions.canEscortMove(nx,pos.z))pos.x=nx;if(allowed(pos.x,nz)&&postMissions.canEscortMove(pos.x,nz))pos.z=nz;let target=Math.atan2(-worldX,-worldZ);yaw+=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw))*(1-Math.exp(-14*dt));phase+=dt*9*n*(worldState===WORLD_STATE.POST_BLAST&&survival.running?1.5:1);}else phase=0;player.position.set(pos.x,.08,pos.z);player.rotation.y=yaw;animateKazuo(player,phase,n,worldState===WORLD_STATE.POST_BLAST&&survival.running,dt,false,postMissions.escorting);
if(postMissions.escorting){arms[0].rotation.x=-1.2;player.rotation.z=-.035;}else player.rotation.z=0;
return {x,y,n};
}

// Shared state materials and clothing variants; the rig, root and proportions never change.
function setPlayerDamageAppearance(post){
 if(!player)return;
 if(!player.preDamageMaterials){const entries=[];player.traverse(mesh=>{if(mesh.isMesh)entries.push({mesh,material:mesh.material,geometry:mesh.geometry});});player.preDamageMaterials=entries;}
 for(const e of player.preDamageMaterials){e.mesh.material=e.mesh.name==='kazuo-ground-shadow'?e.material:post?playerInjuryMaterial():kazuoMaterial('pre');e.mesh.geometry=post?(e.mesh.userData.playerDamageGeometry||e.geometry):e.geometry;}
 if(!post)poseKazuo(player,false);
 player.userData.damageAppearance=post?'KAZUO_LIGHT':'PRE';
}
