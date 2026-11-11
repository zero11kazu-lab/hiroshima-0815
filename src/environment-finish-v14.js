// Bounded, cosmetic street details. No new colliders, actors, audio contexts or event handlers.
const ENVIRONMENT14=HISTORICAL_DATA.environment_finish_v14;
const environment14Cache=new Map();
function streetPropGeometry14(category,post=false){
 const key=category+post;if(environment14Cache.has(key))return environment14Cache.get(key);
 const tools=ruins14Tools(false),{part}=tools;
 const primitive=(g,tile=0)=>tools.add(g,tile,'#ffffff',1);
 if(post){
  for(let i=0;i<4;i++)part('broken-board',.10,.045,.18+(i%2)*.08,(i-1.5)*.12,.035+(i%2)*.025,0,0,1,[0,(i-1.5)*.12,.03],'#9e8a6b');
  if(['bucket','washbasin','basket'].includes(category)){const g=new THREE.CylinderGeometry(.11,.09,.12,7,1,true);g.rotateZ(.65);g.translate(.04,.10,0);primitive(g,category==='bucket'?6:0);}
  else part('charred-remnant',category==='display'?.55:.36,.08,.16,0,.06,-.035,0,1,[0,.12,0],'#aa9477',true);
 }else if(category==='crate'){
  part('wood-crate',.47,.30,.19,0,.15,0);for(const x of [-.20,.20])part('crate-batten',.03,.33,.21,x,.165,0,0,1,[0,0,0],'#c2ae8d');
 }else if(category==='bucket'){
  const g=new THREE.CylinderGeometry(.105,.085,.24,8,1,true);g.translate(0,.12,0);primitive(g,6);
  const base=new THREE.CircleGeometry(.084,8);base.rotateX(-Math.PI/2);base.translate(0,.012,0);primitive(base,6);
  const handle=new THREE.TorusGeometry(.10,.009,3,8,Math.PI);handle.translate(0,.24,0);primitive(handle,6);
 }else if(category==='washbasin'){
  const g=new THREE.CylinderGeometry(.14,.12,.14,10,1,true);g.scale(1.10,1,.66);g.translate(0,.07,0);primitive(g);
  const rim=new THREE.TorusGeometry(.14,.012,3,10);rim.rotateX(Math.PI/2);rim.scale(1.10,1,.66);rim.translate(0,.14,0);primitive(rim);
  part('basin-bottom',.23,.025,.13,0,.02,0);
 }else if(category==='basket'){
  const g=new THREE.CylinderGeometry(.17,.13,.20,8,1,true);g.scale(1,1,.58);g.translate(0,.10,0);primitive(g);
  for(const x of [-.12,0,.12])part('bamboo-weave',.012,.20,.19,x,.10,0,0,1,[0,0,0],'#e4cea2');
 }else{
  const w=category==='display'?.70:.36,h=category==='display'?.48:.40,d=category==='display'?.23:.22;
  part('seat-or-counter',w,.045,d,0,h,0);for(const x of [-w*.38,w*.38])for(const z of [-d*.31,d*.31])part('wood-leg',.04,h,.04,x,h/2,z);
  if(category==='display')for(const x of [-.19,.19]){part('wood-tray',.27,.055,.17,x,h+.045,0);part('unmarked-goods',.16,.045,.11,x,h+.09,0,4,1,[0,0,0],'#cdc2a0');}
 }
 const geometry=building14Merge(tools.batches.flat());geometry.computeBoundingBox();environment14Cache.set(key,geometry);return geometry;
}
function setupEnvironment14(world){
 const cfg=ENVIRONMENT14;world.finishProps=[];world.finishReport={checked:0,placed:0,E:0,W:0,categories:{},rejected:0};
 world.scene.background.set(cfg.pre.sky);world.scene.fog.color.set(cfg.pre.sky);
 for(const light of world.scene.children.filter(o=>o.isLight)){
  if(light.isHemisphereLight){light.color.set(cfg.pre.hemisphere);light.groundColor.set(cfg.pre.groundLight);}
  if(light.isDirectionalLight)light.color.set(cfg.pre.sun);
 }
 const context=tree14Context(world),buildings=world.buildings.filter(b=>['home','shop','nagaya'].includes(b.data.type));
 const blocked=(bounds,b)=>{
  const p={x:(bounds.min.x+bounds.max.x)/2,z:(bounds.min.z+bounds.max.z)/2},r=Math.hypot(bounds.max.x-p.x,bounds.max.z-p.z);
  if(world.data.roads.some(road=>tree14RectDistance(p,road)<r+.12)||GEO1945.bridges.some(bridge=>tree14RectDistance(p,bridge)<r+.2))return true;
  if(context.missions.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<1.8+r))return true;
  for(const path of context.paths)for(let i=1;i<path.length;i++)if(tree14SegmentDistance(p,path[i-1],path[i])<.8+r)return true;
  if(world.trees.some(t=>Math.hypot(t.x-p.x,t.z-p.z)<.55+r))return true;
  return context.solids.some(w=>w.buildingId!==b.id&&tree14RectDistance(p,{...w,w:w.w*2,d:w.d*2})<r+.08);
 };
 for(let index=0;index<cfg.maximumCount;index++){
  const category=cfg.categories[index%cfg.categories.length],side=index<cfg.eastTarget?'E':'W',pool=buildings.filter(b=>placementSide(b.data)===side&&!world.finishProps.some(p=>p.buildingId===b.id)&&(category!=='display'||b.data.type==='shop'));
  let selected=null;
  for(const b of pool){for(const sign of [1,-1]){
   world.finishReport.checked++;const pre=new THREE.Mesh(streetPropGeometry14(category),building14Material()),g=new THREE.Group();g.position.set(b.data.x,0,b.data.z);g.rotation.y=b.rotation;pre.position.set(sign*(b.data.w/2-.55),0,b.data.d/2+.14);g.add(pre);g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(pre),collider=walls.find(w=>w.buildingId===b.id);
   // Keep all new upright details inside the OLD blocked footprint, but visibly outside the facade.
   if(!collider||bounds.min.x<collider.x-collider.w+.01||bounds.max.x>collider.x+collider.w-.01||bounds.min.z<collider.z-collider.d+.01||bounds.max.z>collider.z+collider.d-.01||blocked(bounds,b)){world.finishReport.rejected++;continue;}
   pre.userData.nonSolid=true;g.userData.fictional=true;g.userData.confidence=cfg.confidence;world.scene.add(g);
   const post=new THREE.Group();post.position.copy(g.position);post.rotation.copy(g.rotation);const remnant=new THREE.Mesh(streetPropGeometry14(category,true),ruins14Material());remnant.position.copy(pre.position);remnant.position.z-=.08;remnant.userData.nonSolid=true;post.add(remnant);post.visible=false;world.scene.add(post);
   selected={buildingId:b.id,category,side,x:bounds.getCenter(new THREE.Vector3()).x,z:bounds.getCenter(new THREE.Vector3()).z,pre:g,post};break;
  }if(selected)break;}
  if(selected){world.finishProps.push(selected);world.finishReport.placed++;world.finishReport[side]++;world.finishReport.categories[category]=(world.finishReport.categories[category]||0)+1;}
 }
}
function setEnvironment14(world,post){
 if(!world)return;
 for(const p of world.finishProps||[]){p.pre.visible=!post;p.post.visible=post;}
 if(world.scene?.fog){world.scene.background.set(post?ENVIRONMENT14.post.sky:ENVIRONMENT14.pre.sky);world.scene.fog.color.set(post?ENVIRONMENT14.post.sky:ENVIRONMENT14.pre.sky);}
}
function updateEnvironment14(world,p){
 const distance=(world.quality?20:ENVIRONMENT14.detailDistance)**2,post=worldState===WORLD_STATE.POST_BLAST;
 for(const record of world.finishProps||[]){const near=(p.x-record.x)**2+(p.z-record.z)**2<distance;record.pre.visible=near&&!post;record.post.visible=near&&post;}
}
