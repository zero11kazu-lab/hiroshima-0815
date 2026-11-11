// World / Building / Environment: static geometry, colliders, visibility and quality budget.
class World {
 constructor(scene,data){this.scene=scene;this.data=data;this.groups=[];this.buildings=[];this.trees=[];this.domesticProps=[];this.wallGrid=new Map();this.visibleDistance=78;this.quality=0;this.lowSeconds=0;this.lastQualityTime=0;this.lastVisibility=0;this.build();this.indexWalls();}
 gridKey(x,z){return `${Math.floor(x/8)},${Math.floor(z/8)}`;}
 indexWalls(){for(const b of walls){for(let x=Math.floor((b.x-b.w)/8);x<=Math.floor((b.x+b.w)/8);x++)for(let z=Math.floor((b.z-b.d)/8);z<=Math.floor((b.z+b.d)/8);z++){const key=`${x},${z}`;if(!this.wallGrid.has(key))this.wallGrid.set(key,[]);this.wallGrid.get(key).push(b);}}}
 nearWalls(x,z){return this.wallGrid.get(this.gridKey(x,z))||[];}
 addGroup(group,x,z){this.groups.push({group,x,z});this.scene.add(group);return group;}
 // Merge each building's repeated wood/stone shapes by material. No external BufferGeometryUtils needed.
 mergeDetails(group){
  group.updateMatrixWorld(true);const batches=new Map();
  for(const m of [...group.children]){
   if(!m.isMesh||m.userData.keepSeparate||m.geometry.type==='PlaneGeometry')continue;
   const key=m.material.uuid;if(!batches.has(key))batches.set(key,{material:m.material,parts:[]});
   const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);batches.get(key).parts.push(g);group.remove(m);
  }
  for(const {material,parts} of batches.values()){
   const count=parts.reduce((n,g)=>n+g.attributes.position.count,0),positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2);let offset=0;
   for(const g of parts){positions.set(g.attributes.position.array,offset);normals.set(g.attributes.normal.array,offset);if(g.attributes.uv)uvs.set(g.attributes.uv.array,offset/3*2);offset+=g.attributes.position.array.length;g.dispose();}
   const merged=new THREE.BufferGeometry();merged.setAttribute('position',new THREE.BufferAttribute(positions,3));merged.setAttribute('normal',new THREE.BufferAttribute(normals,3));merged.setAttribute('uv',new THREE.BufferAttribute(uvs,2));merged.computeBoundingSphere();group.add(new THREE.Mesh(merged,material));
  }
 }
 buildBuilding(b){
  const sample=building14Sample(b.id);if(sample){buildBuilding14(this,b,sample);return;}
  if(b.type==='public'){landmarkModel(this,b);return;}
  const group=new THREE.Group();group.userData.preBlast=true;group.userData.expansion=b.id.startsWith('v11-');group.position.set(b.x,0,b.z);group.rotation.y=b.angle;
  const palette=['#d6c6a2','#e6dec0','#b4a48b','#d6ccb2'];
  const body=texturedBox(b.w,b.h,b.d,surface(b.materialVariant||'timber',palette[b.color]),0,b.h/2,0,group);body.userData.keepSeparate=true;
  const roofShape=new THREE.Shape();roofShape.moveTo(-b.w/2-.32,0);roofShape.lineTo(b.w/2+.32,0);roofShape.lineTo(0,b.roof);roofShape.closePath();
  const rg=new THREE.ExtrudeGeometry(roofShape,{depth:b.d+.6,bevelEnabled:false,steps:1});rg.translate(0,0,-b.d/2-.3);
  const roof=new THREE.Mesh(rg,surface('tile',['#717972','#7f7c70','#666e70'][b.color%3]));roof.position.y=b.h;roof.userData.keepSeparate=true;group.add(roof);
  texturedBox(b.w+.18,.24,b.d+.18,surface('stone','#9e9786'),0,.12,0,group);
  const variant=Number(b.modelType?.split('_').pop())||1;
  const veranda=texturedBox(b.w*.92,.16,.8,surface('timber','#8f7960'),0,.2,b.d/2+.3,group);
  if(variant%2===0){const lean=box(b.w+.6,.12,1.2,'#535a56',0,2.15,b.d/2+.35,group);lean.rotation.x=.14;for(const x of [-b.w/2,b.w/2])box(.11,2.1,.11,'#625340',x,1.05,b.d/2+.7,group);}
  if(b.type==='nagaya')for(const x of [-b.w*.31,b.w*.31]){texturedBox(.85,1.9,.1,surface('timber','#685c48'),x,1,b.d/2+.11,group);box(.06,b.h,.12,'#524937',x+.5,b.h/2,b.d/2+.08,group);}
  if(b.type==='warehouse'){texturedBox(b.w*.55,2.3,.12,surface('timber','#786c58'),0,1.16,b.d/2+.1,group);if(variant===2)cylinder(.24,1.8,'#7f7866',b.w*.28,b.h+1,0,group);}
  if(variant%3===0){box(b.w*.55,.55,.7,'#a39c81',0,b.h+.12,.1,group);box(b.w*.65,.13,.9,'#565e58',0,b.h+.47,.1,group);}
  for(let k=-b.w/2+.22;k<b.w/2;k+=.85)box(.055,b.h,.08,'#584e3c',k,b.h/2,b.d/2+.04,group);
  box(b.w,.1,.1,'#584e3c',0,b.h*.62,b.d/2+.07,group);
  box(.9,1.85,.09,'#4b4b3a',0,.93,b.d/2+.08,group);
  for(const side of [-1,1]){box(.9,.75,.1,'#b6b6a0',side*b.w*.28,1.5,b.d/2+.1,group);for(let j=-1;j<=1;j++)box(.035,.75,.12,'#584e3c',side*b.w*.28+j*.23,1.5,b.d/2+.12,group);}
  // Tile courses run along the ridge at points ON each sloped roof face.
  // Previously half-width horizontal bars floated above the pitch and protruded from it.
  const roofHalf=b.w/2+.32,roofLength=Math.min(b.d+.6,b.d*1.5);
  for(let r=0;r<4;r++){const t=(r+.5)/4;for(const side of [-1,1]){
   const course=box(.035,.035,roofLength,'#68706a',side*roofHalf*t,b.h+b.roof*(1-t)+.018,0,group);
   course.userData.roofCourse=true;
  }}
  box(.075,.055,roofLength,'#68706a',0,b.h+b.roof+.02,0,group);
  if(b.type==='shop'){
   const awning=box(b.w+.4,.12,1.1,'#6f7664',0,2.3,b.d/2+.4,group);awning.rotation.x=.12;awning.userData.keepSeparate=true;
   for(let i=0;i<4;i++)box(.28,.5,.035,'#6f7664',(i-1.5)*.3,1.94,b.d/2+.88,group);
   this.addSign(b.sign||'商 店',group,0,2.67,b.d/2+.12,b.w*.7);
  }
  this.mergeDetails(group);group.userData.details=group.children.filter(m=>m!==body&&m!==roof);for(const m of group.userData.details)m.userData.cameraDecoration=true;this.addGroup(group,b.x,b.z);this.buildings.push({id:b.id,position:{x:b.x,z:b.z},rotation:b.angle,data:b,preBlastModel:group,postBlastModel:null,damageState:'INTACT',distanceFromHypocenter:historicalDistance(b)});
  const c=Math.abs(Math.cos(b.angle)),s=Math.abs(Math.sin(b.angle));block(b.x,b.z,b.w*c+b.d*s,b.d*c+b.w*s);walls[walls.length-1].buildingId=b.id;
 }
 addSign(text,parent,x,y,z,width){
  const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#d2c3a0';ctx.fillRect(0,0,256,64);ctx.fillStyle='#34352c';ctx.font='32px serif';ctx.textAlign='center';ctx.fillText(text,128,43);
  const t=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(width,.55),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);parent.add(m);
 }
 tree(x,z){const g=new THREE.Group();g.userData.preTree=true;g.position.set(x,0,z);cylinder(.15,2.8,'#6c6550',0,1.4,0,g);for(const side of [-1,1]){const branch=cylinder(.075,1.4,'#6c6550',side*.25,2,0,g);branch.rotation.z=-side*.45;}const canopy=new THREE.Group();canopy.userData.cameraFoliage=true;for(let i=0;i<4;i++){const m=new THREE.Mesh(World.canopyGeometry||(World.canopyGeometry=new THREE.IcosahedronGeometry(1,1)),mat('#778565'));m.scale.set(1,1.15,.95);m.position.set(Math.sin(i*2)*.55,2.9+(i%2)*.6,Math.cos(i*2)*.5);m.userData.cameraFoliage=true;g.add(m);}this.mergeDetails(g);for(const m of g.children)m.userData.cameraFoliage=m.material===mat('#778565');this.addGroup(g,x,z);this.trees.push({id:`tree-${this.trees.length}`,x,z,preModel:g,postModel:null,state:'NORMAL'});block(x,z,.35,.35);walls[walls.length-1].treeId=this.trees[this.trees.length-1].id;}
 fence(x,z,w,d){const g=new THREE.Group();g.position.set(x,0,z);box(w,.95,d,'#8b856c',0,.48,0,g);box(w+.08,.12,d+.08,'#696d5b',0,1.01,0,g);this.registerDomestic(g,x,z,'fence',{w,d});block(x,z,w,d);}
 registerDomestic(group,x,z,type,data={}){group.userData.preBlast=true;this.addGroup(group,x,z);this.domesticProps.push({type,x,z,data,preModel:group,postModel:null});}
 garden(g){
  const group=new THREE.Group();group.position.set(g.x,0,g.z);box(g.w,.035,g.d,'#8f9272',0,.025,0,group);
  for(let i=0;i<4;i++){box(g.w-1,.05,.18,'#786e53',0,.06,-1.8+i*.85,group);for(let k=0;k<6;k++)box(.3,.22,.28,'#718063',-2.3+k*.85,.17,-1.8+i*.85,group);}
  // A gate faces the lane; the back and two short side fences leave access open.
  this.fence(g.x,g.z-g.d/2,g.w,.16);this.fence(g.x-g.w/2,g.z-1,.16,g.d-2);this.fence(g.x+g.w/2,g.z-1,.16,g.d-2);
  cylinder(.065,2.1,'#716b53',-2,1.05,2,group);cylinder(.065,2.1,'#716b53',2,1.05,2,group);box(4,.035,.035,'#867e65',0,2.05,2,group);
  for(let i=0;i<3;i++)box(.65,.8,.025,i%2?'#a3aa91':'#c4bda2',-1.1+i,1.58,2,group);
  this.mergeDetails(group);this.registerDomestic(group,g.x,g.z,'garden',g);
 }
 prop(p){const g=new THREE.Group();g.position.set(p.x,0,p.z);let w=.9,d=.75;
  if(p.type==='well'){cylinder(.62,.65,'#93917c',0,.32,0,g);cylinder(.44,.02,'#4e625e',0,.66,0,g);w=d=1.25;}
  else if(p.type==='barrel'){cylinder(.29,.65,'#887454',0,.33,0,g);for(const y of [.12,.54])cylinder(.305,.05,'#5e6256',0,y,0,g);w=d=.6;}
  else if(p.type==='bench'){box(2,.12,.55,'#7a7058',0,.5,0,g);for(const x of [-.75,.75])box(.12,.5,.45,'#605f4d',x,.25,0,g);w=2;d=.55;}
  else if(p.type==='cart'){box(1.1,.2,1.6,'#897659',0,.65,0,g);for(const x of [-.6,.6])cylinder(.3,.12,'#625b49',x,.33,0,g).rotation.z=Math.PI/2;box(.1,.1,1.8,'#75654e',.4,.7,1,g);w=1.4;d=3.2;}
  else {box(.9,.7,.75,'#82765b',0,.35,0,g);for(const x of [-.4,.4])box(.055,.7,.8,'#615c49',x,.35,0,g);}
  this.mergeDetails(g);this.registerDomestic(g,p.x,p.z,p.type);block(p.x,p.z,w,d);
 }
 build(){
  prepareTrackSpace14(this);
  districtGround(this);
  for(const b of this.data.buildings)this.buildBuilding(b);districtShadows(this);
  for(const [x,z] of this.data.trees)this.tree(x,z);
  for(const g of this.data.gardens)this.garden(g);
  for(const p of this.data.props)this.prop(p);
  // Low walls behind some houses make private yards without closing the public alleys.
  for(const b of this.data.buildings.filter((b,i)=>i%7===2&&b.z!==-55))this.fence(b.x,b.z-b.d/2-1,b.w,.18);
  for(const [x,z] of this.data.poles){const g=new THREE.Group();g.position.set(x,0,z);cylinder(.11,6.5,'#706653',0,3.25,0,g);box(2.1,.12,.12,'#665e50',0,6.1,0,g);for(const dx of [-.85,0,.85]){cylinder(.08,.18,'#c6c8b5',dx,6.25,0,g);cylinder(.1,.06,'#b5b9a5',dx,6.32,0,g);}this.mergeDetails(g);this.addGroup(g,x,z);block(x,z,.3,.3);}
  for(let i=0;i<this.data.poles.length-1;i++){const a=this.data.poles[i],b=this.data.poles[i+1];if(Math.abs(a[0]-b[0])>.1||Math.abs(a[1]-b[1])>32)continue;const points=[];for(let j=0;j<=12;j++){const t=j/12;points.push(new THREE.Vector3(a[0],6.15-Math.sin(t*Math.PI)*.5,a[1]+(b[1]-a[1])*t));}this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#565b51'})));}
  placeTrees14(this);setupEnvironment14(this);auditTrackSpace14(this);
 }
 updateVisibility(p){this.lastVisibility++;if(this.lastVisibility!==1&&this.lastVisibility%8)return;const d=this.visibleDistance**2;for(const item of this.groups){const distance=(item.x-p.x)**2+(item.z-p.z)**2;item.group.visible=!(worldState===WORLD_STATE.POST_BLAST&&((item.group.userData.preBlast&&!item.group.userData.tram)||item.group.userData.preTree))&&distance<d;for(const m of item.group.userData.details||[])m.visible=distance<(this.quality?25:item.group.userData.expansion?30:38)**2;}for(const b of this.buildings)if(b.postBlastModel){const distance=(b.position.x-p.x)**2+(b.position.z-p.z)**2;b.postBlastModel.visible=distance<d;for(const m of b.postBlastModel.userData.details||[])m.visible=distance<(this.quality?24:POST_VISUAL14.detailDistance)**2;}for(const t of this.trees)if(t.postModel)t.postModel.visible=(t.x-p.x)**2+(t.z-p.z)**2<d;
 for(const record of this.domesticProps)if(record.postModel)record.postModel.visible=(record.x-p.x)**2+(record.z-p.z)**2<d;
 if(worldState===WORLD_STATE.PRE_BLAST)$('caption').textContent=pos.x>32&&pos.z>30?'御幸橋 · 京橋川':pos.z<-25?'鷹野橋 · 市役所南部':pos.z>20?'千田町南部':'千田町 · 電車通り';
 updateEnvironment14(this,p);
 if(textureCache.has('water'))textureCache.get('water').offset.x=performance.now()*.000008;
 }
 adaptQuality(fps,t){
  const seconds=this.lastQualityTime?Math.min((t-this.lastQualityTime)/1000,1):0;this.lastQualityTime=t;
  this.lowSeconds=fps>0&&fps<27?this.lowSeconds+seconds:Math.max(0,this.lowSeconds-seconds);
  if(this.lowSeconds<5||this.quality>=2)return;
  this.quality++;this.lowSeconds=0;this.visibleDistance=this.quality===1?62:48;
  renderer.setPixelRatio(Math.min(devicePixelRatio,this.quality===1?1.15:1));resize();
  scene.fog.far=this.visibleDistance-3;scene.fog.near=22;
 }
}
