// Authored identities and shared crowd rendering. Gameplay remains in NPCManager.
// Uses the proven Kazuo rigid-joint rig without changing Kazuo's model or animation code.
const IMPORTANT_PROFILES=Object.freeze([
 {id:PLAYER_PROFILE.spouseId,key:'masami',female:true,scale:.92,width:.94,face:[.90,1,.96],hair:'bun',shirt:'#b4ab8e',pants:'#465265',skin:'#bca183',hairColor:'#494a3e'},
 {id:POST_MISSION_DATA.motherId,key:'mother',female:true,scale:.91,width:1.03,face:[1.02,.98,1.02],hair:'low-bun',shirt:'#8b8272',skin:'#c7ac8e',hairColor:'#454136'},
 {id:POST_MISSION_DATA.childId,key:'child',child:true,scale:1,width:1,face:[.94,.88,.95],hair:'short',shirt:'#a39b80',skin:'#bca183',hairColor:'#494a3e'},
 {id:POST_MISSION_DATA.maleId,key:'water-man',scale:.98,width:1.08,face:[1.06,1.02,1.03],hair:'grey',shirt:'#827767',skin:'#c7ac8e',hairColor:'#626052'},
 {id:POST_MISSION_DATA.requesterId,key:'requester',female:true,scale:.94,width:.92,face:[.93,.99,.94],hair:'tucked',shirt:'#8d957d',skin:'#bfa487',hairColor:'#3e3b32'},
 {id:POST_MISSION_DATA.evacueeId,key:'evacuee',scale:.96,width:.98,face:[.96,1.03,.98],hair:'short',shirt:'#727a61',skin:'#bca183',hairColor:'#34382f'}
]);
const importantGeometryCache=new Map(),importantTextureCache=new Map(),importantMaterialCache=new Map();
function importantProfile(id){return IMPORTANT_PROFILES.find(p=>p.id===id);}
function importantTexture(mode='pre'){
 if(importantTextureCache.has(mode))return importantTextureCache.get(mode);
 // Eight 128px tiles share one POT 512x256 atlas. Only six tiles are used.
 const w=512,h=256,data=new Uint8Array(w*h*4),source=kazuoTexture(mode==='room'?'room':mode==='weak'?'weak':mode).image.data;
 const rgb=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
 for(const [slot,p]of IMPORTANT_PROFILES.entries()){
  const palette=[...KAZUO_PALETTE];palette[0]=palette[12]=palette[13]=mode==='post'?(p.key==='masami'?'#827665':'#716958'):p.shirt;palette[1]=p.pants?(mode==='post'?'#42494b':p.pants):'#4f574c';palette[2]=mode==='weak'?'#baad96':p.skin;palette[3]=p.hairColor;palette[4]='#8b8b70';palette[11]='#c9bfa5';
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const region=Math.floor(x/32)+Math.floor(y/32)*4,base=rgb(KAZUO_PALETTE[region]||'#ffffff'),tone=rgb(palette[region]||'#ffffff'),si=((y*2)*256+x*2)*4,di=(((slot>>2)*128+y)*w+(slot%4)*128+x)*4;
   let color=base.map((b,c)=>Math.min(255,source[si+c]*tone[c]/Math.max(1,b)));if(p.female&&mode==='post'&&region===3)color=color.map(v=>v*.84);if(mode==='post'&&region===2)color=injurySkinPixel(color,(x%32)/31,(y%32)/31,storyInjuryVariant(p),slot+9);for(let c=0;c<3;c++)data[di+c]=color[c];data[di+3]=255;
  }
 }
 const t=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;importantTextureCache.set(mode,t);return t;
}
function importantMaterial(mode='pre',instanced=true){
 const key=mode+instanced;if(importantMaterialCache.has(key))return importantMaterialCache.get(key);
 const m=new THREE.MeshLambertMaterial({color:'#ffffff',map:importantTexture(mode)});
 if(instanced){m.onBeforeCompile=shader=>{shader.vertexShader='attribute vec2 storyAtlasOffset;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = (vMapUv + storyAtlasOffset) / vec2(4.0, 2.0);\n#endif');};m.customProgramCacheKey=()=> 'hiroshima-important-atlas-v1';}
 importantMaterialCache.set(key,m);return m;
}
function importantCached(key,build){if(!importantGeometryCache.has(key))importantGeometryCache.set(key,build());return importantGeometryCache.get(key);}
// Shared opaque shell follows the skull, with an ear/forehead hairline and a filled bun root.
function femaleHair14(style='low-bun',post=false,low=false){return importantCached('female-hair14-'+style+post+low,()=>{
 const sides=low?6:12,rows=low?3:5,positions=[],uv=[],index=[],rings=[[.163,.015,.015],[.14,.076,.076],[.09,.105,.100],[0,.114,.115],[-.08,.099,.102],[-.12,.067,.083]];
 const radius=y=>{for(let i=1;i<rings.length;i++)if(y>=rings[i][0]){const a=rings[i-1],b=rings[i],t=(a[0]-y)/(a[0]-b[0]);return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}return rings.at(-1).slice(1);};
 for(let row=0;row<=rows;row++)for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,back=Math.cos(a),bottom=.065-.17*Math.max(0,back)-.045*(1-Math.abs(back)),y=.163+ (bottom-.163)*row/rows,[rx,rz]=radius(y);positions.push(Math.sin(a)*(rx+.006),y+.003,back*(rz+.006));uv.push(j/sides,row/rows);}
 for(let row=0;row<rows;row++)for(let j=0;j<sides;j++){const a=row*(sides+1)+j,b=a+sides+1;index.push(a,b,a+1,a+1,b,b+1);}
 const centre=positions.length/3;positions.push(0,.166,0);uv.push(.5,0);for(let j=0;j<sides;j++)index.push(centre,j,j+1);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();kazuoUV(g,3);
 const elegant=style==='masami',tucked=style==='tucked',by=elegant?-.060:style==='low-bun'?-.035:0,bz=elegant?.122:.127;
 const root=kazuoPiece(new THREE.SphereGeometry(1,low?4:8,low?3:5),3,0,by+.015,.094,elegant?.065:.068,.067,.046);
 const bun=kazuoPiece(new THREE.SphereGeometry(1,low?6:10,low?3:6),3,post?.003:0,by-(post?.004:0),bz,elegant?.057:tucked?.063:.060,elegant?.044:.050,post?.043:.046,post?.09:0,post?.045:0);
 const result=kazuoMerge([g,root,bun]),u=result.attributes.uv; // Avoid the weak atlas's skin-coloured thinning stripe on the outer shell.
 for(let i=0;i<u.count;i++)u.setX(i,(3*64+21+((u.getX(i)*256-196)/56)*23)/256);
 return result;
 });}
function importantHair(p,post=false){if(p.female)return importantCached('female-cap14-'+p.key+post,()=>femaleHair14(p.key==='masami'?'masami':p.hair,post).clone().translate(0,-.095,0));return importantCached('hair-'+p.hair,()=>kazuoPiece(new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI*.57),3,0,0,0,.108,.085,.101));}
function createImportantModel(profile,room=false){
 const model=createKazuoModel();model.name='story-person-'+profile.key;model.userData.storyProfile=profile.key;const r=kazuoRig(model);
 const chest=model.getObjectByName('kazuo-chest'),hips=model.getObjectByName('kazuo-hips'),head=r.head,cap=model.getObjectByName('kazuo-cap'),brim=model.getObjectByName('kazuo-brim');
 if(!profile.crowd)head.geometry=importantCached('face-'+profile.key,()=>{const g=head.geometry.clone(),a=g.attributes.position,jaw={masami:.88,mother:1.07,child:.83,'water-man':1.08,requester:.90,evacuee:.98}[profile.key],nose=profile.female?.93:profile.child?.82:profile.key==='water-man'?1.04:1;
  for(let i=0;i<a.count;i++){const y=a.getY(i),t=Math.max(0,Math.min(1,(-y-.035)/.10));a.setX(i,a.getX(i)*(1+(jaw-1)*t));if(a.getZ(i)<-.10)a.setZ(i,a.getZ(i)*nose);}g.scale(...profile.face);g.computeVertexNormals();return g;});
 if(profile.female){
  chest.geometry=importantCached('female-chest',()=>kazuoMerge([
   kazuoLoft([[.89,.175,.11],[1.02,.17,.12],[1.17,.205,.14],[1.32,.225,.14],[1.43,.215,.115],[1.47,.16,.09]],12,0),
   kazuoLoft([[1.45,.059,.06],[1.53,.057,.058],[1.60,.055,.056]],10,2),
   kazuoPiece(new THREE.BoxGeometry(.045,.075,.014),11,-.048,1.42,-.115),kazuoPiece(new THREE.BoxGeometry(.045,.075,.014),11,.048,1.42,-.115)
  ]).translate(0,-1.15,0));
  hips.geometry=importantCached('female-hips',()=>kazuoLoft([[.84,.195,.12],[.94,.21,.13],[1.01,.18,.12]],12,1).translate(0,-.92,0));
  r.arms.forEach((a,i)=>a.position.x=(i?1:-1)*.225);
 }
 cap.geometry=importantHair(profile);cap.position.y=.85;cap.name='kazuo-cap';brim.visible=false;if(profile.female){head.add(cap);cap.position.set(0,.095,0);cap.userData.postGeometry=importantHair(profile,true);cap.userData.severeGeometry=cap.userData.postGeometry;}
 if(profile.child){
  // Separate child proportions, about 5.3 heads: shorter limbs/torso with a relatively larger head.
  r.spine.position.y=.599;r.chest.position.y=.20;r.chest.scale.set(.68,.72,.68);hips.position.y=.60;hips.scale.set(.68,.70,.68);
  r.head.position.y=.585;cap.position.y=.655;cap.scale.set(.90,.88,.92);
  for(let i=0;i<2;i++){
   r.legs[i].position.set(i?.10:-.10,.599,0);model.getObjectByName('kazuo-thigh-'+i).scale.set(.70,.60,.70);r.knees[i].position.y=-.264;model.getObjectByName('kazuo-calf-'+i).scale.set(.70,.62,.70);r.ankles[i].position.y=-.2604;model.getObjectByName('kazuo-foot-'+i).scale.set(.72,.68,.75);
   r.arms[i].position.set(i?.17:-.17,.44,0);model.getObjectByName('kazuo-sleeve-'+i).scale.set(.68,.65,.68);r.elbows[i].position.y=-.2015;model.getObjectByName('kazuo-forearm-'+i).scale.set(.68,.65,.68);model.getObjectByName('kazuo-wrist-'+i).position.y=-.1885;model.getObjectByName('kazuo-hand-'+i).scale.multiplyScalar(.72);
  }
 }
 if(profile.key==='masami')applyMasamiClothes(model);else if(!profile.crowd)applyStoryInjuries(model,profile);
 model.scale.set(profile.scale*profile.width,profile.scale,profile.scale);
 model.traverse(m=>{
  if(!m.isMesh)return;m.userData.dynamic=true;
  // Instanced matrices cannot have a negative determinant. Mirror once in shared geometry instead.
  if(m.scale.x<0){const original=m.geometry;m.geometry=importantCached('mirrored-hand',()=>{const g=original.clone().scale(-1,1,1),ix=g.index.array;for(let i=0;i<ix.length;i+=3){const a=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=a;}return g;});m.scale.x=-m.scale.x;}
  m.material=importantMaterial('pre',!room);
  if(room){const original=m.geometry,slot=IMPORTANT_PROFILES.indexOf(profile);m.geometry=importantCached('room-'+profile.key+'-'+m.name,()=>{const g=original.clone(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+slot%4)/4,(uv.getY(i)+(slot>>2))/2);return g;});}
 });
 poseKazuo(model,false);return model;
}
function importantRoomAppearance(model,weak){model.traverse(m=>{if(m.isMesh){m.material.map=importantTexture(weak?'weak':'room');m.material.needsUpdate=true;}});}
function importantFootMin(model,relative=false){model.updateWorldMatrix(true,true);const space=relative&&model.parent?new THREE.Matrix4().copy(model.parent.matrixWorld).invert():null;let min=Infinity;for(const i of [0,1]){const m=model.getObjectByName('kazuo-foot-'+i);m.geometry.computeBoundingBox();const box=m.geometry.boundingBox.clone().applyMatrix4(space?new THREE.Matrix4().multiplyMatrices(space,m.matrixWorld):m.matrixWorld);min=Math.min(min,box.min.y);}return min;}
function importantSeatY(model,rootY=.17,floor=.11){const y=model.position.y;model.position.y=0;const min=importantFootMin(model,true);model.position.y=y;return floor-rootY-min;}
function poseImportant(model,n,profile,elapsed){
 const r=kazuoRig(model),post=worldState===WORLD_STATE.POST_BLAST,dead=['DEAD','CHILD_DEAD'].includes(n.postBlastState);
 animateKazuo(model,n.phase,n.moving?1:0,false,elapsed,!!n.conversing);r.skeleton.position.y*=profile.child?.64:1;
 if(worldState===WORLD_STATE.EVENT_0815){r.skeleton.rotation.set(n.eventTilt||0,0,n.eventRoll||0);return;}
 r.skeleton.rotation.set(0,0,0);
 if(profile.key==='child'){model.getObjectByName('kazuo-hips').visible=!post;for(const name of ['thigh','calf','foot'])for(let i=0;i<2;i++)model.getObjectByName('kazuo-'+name+'-'+i).visible=!post;}
 if(!post)return;
 if(n.postRole==='child'){poseKazuo(model,false);r.skeleton.rotation.x=Math.PI/2;r.spine.rotation.x=-.04;r.head.rotation.x=dead?.12:0;for(let i=0;i<2;i++){r.arms[i].rotation.x=.12;r.arms[i].rotation.z=i?-.18:.18;r.elbows[i].rotation.x=.24;}return;}
 if(['male','evacuee'].includes(n.postRole)&&!n.supported){
  poseKazuo(model,true);r.spine.rotation.x=dead?-.60:n.postRole==='child'?-.14:n.postRole==='evacuee'?-.32:-.18;r.head.rotation.x=dead?.42:.12;
  r.arms[0].rotation.x=.38;r.arms[1].rotation.x=.18;r.elbows[0].rotation.x=n.postRole==='male'&&!dead?1.3:.65;r.elbows[1].rotation.x=.8;
  r.chest.scale.z=1+(dead?0:Math.sin((n.postTimer||0)*2)*.008);
 }else if(n.supported){
  for(let i=0;i<2;i++){const wave=Math.sin(n.phase+i*Math.PI);r.legs[i].rotation.x=.35+wave*.18;r.knees[i].rotation.x=-.70-Math.max(0,-wave)*.22;r.ankles[i].rotation.x=.35;}
  r.spine.rotation.x=-.16;r.arms[0].rotation.x=1.5;r.elbows[0].rotation.x=.6;r.arms[1].rotation.x=-.12;r.elbows[1].rotation.x=.45;r.head.rotation.x=.1;
 }else{r.spine.rotation.x=profile.key==='masami'?-.09:-.06;r.head.rotation.x=.05;if(profile.female){r.elbows[0].rotation.x=.65;r.arms[0].rotation.x=.12;}}
}
function importantPoseNodes(model){const r=kazuoRig(model);return [r.skeleton,r.spine,r.head,...r.legs,...r.knees,...r.ankles,...r.arms,...r.elbows];}
function importantPoseSnapshot(model){return {rotations:importantPoseNodes(model).map(o=>o.rotation.x),skeletonY:kazuoRig(model).skeleton.position.y};}
function importantBlendPose(model,from,t){const nodes=importantPoseNodes(model);nodes.forEach((o,i)=>o.rotation.x=THREE.MathUtils.lerp(from.rotations[i],o.rotation.x,t));const s=kazuoRig(model).skeleton;s.position.y=THREE.MathUtils.lerp(from.skeletonY,s.position.y,t);}
function importantLowGeometry(profile,seated=false){if(profile.key==='child'&&seated)return importantCached('trapped-child-low14',()=>{const g=importantLowGeometry(profile,false).clone().rotateX(Math.PI/2);g.computeBoundingBox();return g.translate(0,-g.boundingBox.min.y,0);});return importantCached('low-'+(profile.child?'child':profile.female?'female':'man')+seated,()=>{
 const child=!!profile.child,parts=[kazuoLoft([[seated?(child?.22:.4):child?.59:.88,child?.12:.18,.10],[seated?(child?.65:.98):child?.92:1.4,child?.16:profile.female?.21:.25,.13]],8,0),kazuoPiece(new THREE.SphereGeometry(1,8,5),2,0,seated?(child?.85:1.26):child?1.18:1.71,0,child?.09:.103,child?.123:.14,child?.09:.10)];
 for(const side of [-1,1]){parts.push(kazuoPiece(new THREE.CylinderGeometry(.07,.06,seated?.26:child?.53:.86,6),1,side*(child?.1:.145),seated?.18:child?.32:.46,0));parts.push(kazuoPiece(new THREE.CylinderGeometry(.06,.045,child?.37:.60,6),0,side*(child?.18:.28),seated?(child?.47:.78):child?.84:1.14,0));}
 if(profile.female)parts.push(femaleHair14('low-bun',false,true).clone().translate(0,seated?1.26:1.71,0));
 return kazuoMerge(parts);
 });}
class ImportantPeopleVisuals {
 constructor(scene,people){
  this.scene=scene;this.entries=new Map();this.batches=[];this.identity=new THREE.Matrix4();this.zero=new THREE.Matrix4().makeScale(0,0,0);this.viewProjection=new THREE.Matrix4();this.frustum=new THREE.Frustum();this.sphere=new THREE.Sphere();
  const grouped=new Map(),add=(entry,part,low=false,variant=null,geometry=part.geometry)=>{if(!grouped.has(geometry))grouped.set(geometry,[]);grouped.get(geometry).push({entry,part,low,variant});};
  this.profiles=[...IMPORTANT_PROFILES,...people.filter(n=>!importantProfile(n.id)).map(crowdProfile)];
  for(const profile of this.profiles){const npc=people.find(n=>n.id===profile.id);if(!npc)continue;const model=profile.crowd?createCrowdModel(profile):createImportantModel(profile),entry={profile,npc,model,parts:[],slots:[],low:null,lastPose:null,lastVisible:false};this.entries.set(profile.id,entry);
   model.traverse(m=>{if(m.isMesh&&m.visible){entry.parts.push(m);add(entry,m,false,m.userData.postGeometry?'pre':null);if(m.userData.postGeometry)add(entry,m,false,profile.key==='masami'?'post':'light',m.userData.postGeometry);if(m.userData.severeGeometry)add(entry,m,false,'severe',m.userData.severeGeometry);if(m.userData.clothedGeometry)add(entry,m,false,'covered',m.userData.clothedGeometry);}});
   for(const pose of (profile.crowd?['standing','seated','down']:['standing','seated']))for(const style of (!profile.child&&profile.key!=='masami'?['pre','light','severe']:['pre'])){const low=new THREE.Mesh(profile.crowd?crowdLowGeometry(profile,pose,style):profile.key!=='masami'?injuryLowGeometry(profile,pose,style):importantLowGeometry(profile,pose==='seated'),profile.crowd?crowdMaterial():importantMaterial());low.userData.lowPose=pose;low.userData.lowStyle=style;low.scale.copy(model.scale);if(!entry.low)entry.low=[];entry.low.push(low);add(entry,low,pose,profile.key==='masami'?null:style);}
  }
  for(const [geometry,slots]of grouped){const g=geometry.clone(),offsets=new Float32Array(slots.length*2);for(const [i,slot]of slots.entries()){const p=slot.entry.profile.crowd?slot.entry.profile.archetype:IMPORTANT_PROFILES.indexOf(slot.entry.profile);offsets[i*2]=slot.entry.profile.crowd?p:p%4;offsets[i*2+1]=slot.entry.profile.crowd?0:p>>2;}g.setAttribute('storyAtlasOffset',new THREE.InstancedBufferAttribute(offsets,2));
   const mesh=new THREE.InstancedMesh(g,slots[0].entry.profile.crowd?crowdMaterial():importantMaterial(),slots.length);mesh.name='important-batch-'+this.batches.length;mesh.frustumCulled=false;mesh.userData.dynamic=true;mesh.userData.nonSolid=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);const batch={mesh,dirty:true,items:[]};this.batches.push(batch);mesh.count=0;
   slots.forEach((slot,i)=>{const p=slot.entry.profile.crowd?slot.entry.profile.archetype:IMPORTANT_PROFILES.indexOf(slot.entry.profile),item={...slot,batch,index:i,active:false,matrix:new THREE.Matrix4(),offset:slot.entry.profile.crowd?[p,0]:[p%4,p>>2]};slot.entry.slots.push(item);batch.items.push(item);});
  }
 }
 has(id){return this.entries.has(id);}
 createRoomModel(id){return createImportantModel(importantProfile(id),true);}
 write(n,visible){
  const e=this.entries.get(n.id);if(!e)return;const distance=Math.hypot(n.position.x-pos.x,n.position.z-pos.z),post=worldState===WORLD_STATE.POST_BLAST;
  const show=visible&&!n.hiddenFromWorld&&!(post&&n.id===PLAYER_PROFILE.spouseId&&distance>=14);
  if(!show&&!e.lastVisible)return;e.lastVisible=show;
  const crowd=!!e.profile.crowd,detailed=distance<(crowd?18:22),mode=post?'post':'pre',variant=!post?'pre':e.profile.key==='masami'?'post':injuryStyle(n.damageAppearance),lowPose=crowd?crowdLowPose(n):post&&['male','child','evacuee'].includes(n.postRole)&&!n.supported?'seated':'standing';
  if(show){
   // Stop pose work outside the view, but keep root matrices current so rotating back does not pop.
   camera.updateMatrixWorld();this.viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.viewProjection);this.sphere.center.set(n.position.x,1,n.position.z);this.sphere.radius=2;
   const inView=this.frustum.intersectsSphere(this.sphere),poseKey=[worldState,n.postBlastState,!!n.supported,!!n.conversing].join('|');
   e.model.position.set(0,0,0);e.model.rotation.set(0,0,0);
   const now=post?(aftermath?.clock||0):(npcManager?.clock||0),dt=e.lastClock===undefined?0:Math.max(0,Math.min(.1,now-e.lastClock));e.lastClock=now;
   if((detailed&&inView)||poseKey!==e.lastPose){
    if(e.lastPose&&!e.lastPose.startsWith(worldState+'|'))e.transition=null;
    if(poseKey!==e.lastPose&&e.lastPose?.startsWith(worldState+'|'))e.transition={time:0,from:importantPoseSnapshot(e.model)};
    (crowd?poseCrowd:poseImportant)(e.model,n,e.profile,dt);e.lastPose=poseKey;
    if(e.transition){e.transition.time+=dt;const a=Math.min(1,e.transition.time/.45);importantBlendPose(e.model,e.transition.from,a*a*(3-2*a));if(a>=1)e.transition=null;}
   }
   const localMin=storyGroundMin(e.model,crowd&&crowdProne(n)||post&&n.postRole==='child');e.model.position.set(n.position.x,(post&&n.postRole==='child'?.025:.10)-localMin,n.position.z);e.model.rotation.y=n.yaw;
   e.model.updateMatrixWorld(true);for(const low of e.low){if(crowd&&(low.userData.lowPose!==lowPose||low.userData.lowStyle!==(variant==='covered'?'pre':variant)))continue;if(!low.geometry.boundingBox)low.geometry.computeBoundingBox();low.position.set(n.position.x,crowd?.10-low.geometry.boundingBox.min.y*low.scale.y:post&&n.postRole==='child'?.025:.08,n.position.z);low.rotation.y=n.yaw;low.updateMatrixWorld(true);}
  }
  for(const s of e.slots){s.active=show&&(s.low?!detailed&&s.low===lowPose:detailed)&&s.part.visible&&(!s.variant||s.variant===variant||s.low&&s.variant==='pre'&&variant==='covered');s.batch.mesh.material=crowd?crowdMaterial():importantMaterial(mode);if(crowd){s.offset[0]=e.profile.archetype;s.offset[1]=Math.max(0,CROWD_DAMAGE.indexOf(n.damageAppearance||'PRE'));}if(s.active)s.matrix.copy(s.part.matrixWorld);s.batch.dirty=true;}
 }
 flush(){for(const b of this.batches)if(b.dirty){let at=0;const attr=b.mesh.geometry.attributes.storyAtlasOffset;for(const item of b.items)if(item.active){b.mesh.setMatrixAt(at,item.matrix);attr.setXY(at,...item.offset);at++;}b.mesh.count=at;b.mesh.instanceMatrix.needsUpdate=true;attr.needsUpdate=true;b.dirty=false;}}
}
