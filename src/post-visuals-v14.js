// Cosmetic aftermath geometry only. No damage, mission, navigation or collision policy lives here.
const POST_VISUAL14=HISTORICAL_DATA.postblast_damage.visuals;
const ruins14Cache=new Map();
function ruins14Material(){
 if(ruins14Cache.has('material'))return ruins14Cache.get('material');
 const source=building14Atlas().image.data,pixels=new Uint8Array(source.length),old=[[109,88,63],[198,183,150],[91,96,91],[128,123,109],[205,198,165],[81,94,87],[62,57,44],[155,124,76]],colors=[[86,69,53],[148,139,119],[94,91,82],[113,106,92],[133,126,111],[68,63,55],[110,115,110],[87,71,50]];
 for(let y=0;y<256;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4,t=(x>>7)+(y>>7)*4,soot=.73+.27*(.5+.5*Math.sin(x*.031+y*.043));for(let c=0;c<3;c++)pixels[i+c]=t===5?colors[t][c]*(.82+.12*Math.sin((x%128+y%128)*Math.PI/64)+.08*ruins14Random(x%128,y%128,4)):Math.min(255,source[i+c]/old[t][c]*colors[t][c]*(t===4?1:soot));pixels[i+3]=255;}
 const texture=new THREE.DataTexture(pixels,512,256,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
 const material=new THREE.MeshLambertMaterial({map:texture,vertexColors:true});ruins14Cache.set('material',material);return material;
}
function ruins14Tools(clampLow=true){
 const batches=[[],[],[]],counts={};
 const add=(g,tile,tint,batch,matrix)=>{if(matrix)g.applyMatrix4(matrix);g.computeBoundingBox();if(clampLow&&g.boundingBox.max.y<.4){const a=g.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,Math.max(-.01,Math.min(POST_VISUAL14.lowClutterTop-.01,a.getY(i))));g.computeVertexNormals();}building14UV(g,tile,tint);batches[batch].push(g);};
 const part=(kind,w,h,d,x,y,z,tile=0,batch=1,rotation=[0,0,0],tint='#ffffff',jagged=false,worldBasis=0)=>{
  if(![w,h,d,x,y,z,...rotation].every(Number.isFinite)||Math.min(w,h,d)<=0)throw Error('Invalid aftermath part');
  const g=geometries.box.clone();if(jagged){const a=g.attributes.position;for(let i=0;i<a.count;i++)if(a.getY(i)>0)a.setY(i,.25+(a.getX(i)>.0?.25:0)+(a.getZ(i)>.0?-.08:0));g.computeVertexNormals();}
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(w,h,d));
  if(worldBasis)m.premultiply(new THREE.Matrix4().makeRotationY(-worldBasis));add(g,tile,tint,batch,m);counts[kind]=(counts[kind]||0)+1;
 };
 const patch=(w,d,x,y,z,tile,batch=0,tint='#ffffff',seed=0)=>{const p=[],uv=[];for(let i=0;i<10;i++){const a=i*Math.PI/5,b=(i+1)*Math.PI/5,r=.44+.05*seeded09(seed+i),q=.44+.05*seeded09(seed+i+1);p.push(x,y,z,x+Math.cos(b)*w*q,y,z+Math.sin(b)*d*q,x+Math.cos(a)*w*r,y,z+Math.sin(a)*d*r);uv.push(.5,.5,.5+Math.cos(b)*q,.5+Math.sin(b)*q,.5+Math.cos(a)*r,.5+Math.sin(a)*r);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,tile,tint,batch);};
 const panel=(points,tile,batch=1,tint='#ffffff')=>{const g=new THREE.BufferGeometry(),p=[],uv=[];for(const i of [0,1,2,0,2,3]){p.push(...points[i]);uv.push(...[[0,0],[1,0],[1,1],[0,1]][i]);}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,tile,tint,batch);};
 const meshes=()=>batches.map((parts,i)=>{if(!parts.length)part('empty-base',.01,.01,.01,0,.005,0,5,i);return new THREE.Mesh(building14Merge(batches[i]),ruins14Material());});
 return {batches,counts,add,part,patch,panel,meshes};
}
function ruins14Random(i,j,k){let n=Math.imul(i+815,0x45d9f3b)^Math.imul(j+1,0x27d4eb2d)^Math.imul(k+37,0x85ebca6b);n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296;}
function buildRuinedBuilding14(record,group,index){
 const b=record.data,damage=record.postDamage,visual=damage==='INTACT'?'DAMAGED':damage,variant=index%3,tools=ruins14Tools(),{part,patch,panel}=tools;
 tools.batches[0].push(dryGroundGeometry14(b,index));
 // Low, broken foundation outlines and ash sit above road/ground surfaces, with no coplanar overlay.
 for(const side of [-1,1]){part('foundation',b.w*.9,.10,.16,0,.05,side*b.d*.43,3,2);part('foundation',.16,.12,b.d*.74,side*b.w*.43,.06,0,3,2);}
 const count=POST_VISUAL14.fragmentCounts[damage];
 for(let j=0;j<count;j++){
  const rand=k=>ruins14Random(index,j,k),x=(rand(1)-.5)*b.w*.70,z=(rand(2)-.5)*b.d*.70,kind=j%6;
  if(kind===0)part('burned-timber',.10,.07,.65+rand(3)*.7,x,.08,z,0,2,[.02,(rand(4)-.5)*3,.01],'#b6a38a');
  if(kind===1)part('tile-stack',.25+rand(3)*.35,.045,.28+rand(4)*.3,x,.065,z,2,2,[.04,rand(5)*3,.03]);
  if(kind===2)part('plaster-shard',.3+rand(3)*.4,.11,.25+rand(4)*.30,x,.085,z,1,2,[0,rand(5)*3,.05],'#d1c5b0',true);
  if(kind===3)part('fallen-lattice',.40,.055,.60,x,.07,z,0,2,[0,rand(5)*3,0],'#a99d89');
  if(kind===4)part(b.type==='shop'?'burned-sign':'door-remnant',.6,.065,.32,x,.08,z,0,2,[.04,rand(5)*3,0],'#8c7e65',true);
  if(kind===5)part('household-remnant',.25,.17,.28,x,.10,z,3,2,[0,rand(5)*3,0],'#aaa18d',true);
 }
 if(visual==='DESTROYED'){
  for(let j=0;j<1+variant;j++)part('charred-stump',.13,.24,.14,(j-variant/2)*b.w*.25,.12,-b.d*.35,0,1,[0,0,.05]);
 }else if(visual==='COLLAPSED'){
  part('fallen-roof',b.w*.62,.14,b.d*.43,0,.10,-b.d*.08,2,1,[.025,.12*(variant-1),.02],'#b7b0a0',true);
  part('fallen-wall',b.w*.34,.12,b.d*.3,b.w*.15,.10,b.d*.20,1,1,[0,-.2,0],'#b5aa94',true);
  for(let j=0;j<3;j++)part('charred-stump',.13,.25,.13,(j-1)*b.w*.30,.125,-b.d*.32,0,1);
 }else if(visual==='HEAVILY_DAMAGED'){
  // Existing post-blast collider is world-aligned: x=b.x-w*.44, half width .3, half depth d*.3.
  // Put the tall remnants inside that SAME footprint, even on rotated buildings.
  const left=-b.w*.44,length=b.d*.52,height=b.h*(.49+variant*.045),basis=b.angle;
  for(const side of [-1,1])part('exposed-post',.14,height,.14,left,height/2,side*length*.44,0,1,[0,0,0],'#b6a38d',false,basis);
  part('broken-wall',.13,height*.72,length*.76,left,height*.36,0,1,1,[0,0,0],'#b4a58c',true,basis);
  part('roof-remnant',.40,.11,length*.78,left,height-.05,0,2,1,[0,0,0],'#a49d8d',false,basis);
  for(let j=0;j<3;j++)part('broken-lattice',.17,.055,.18,left+.06,height*.50+j*.17,length*.25,0,1,[0,0,0],'#9d8e75',false,basis);
 }else{
  const h=b.h*.83;
  for(const side of [-1,1]){
   part('broken-wall',.15,h,b.d*.85,side*b.w*.44,h/2,0,1,1,[0,0,0],'#bcb09a',true);
   for(const end of [-1,1])part('exposed-post',.14,h,.14,side*b.w*.42,h/2,end*b.d*.40,0,1);
   part('broken-front',b.w*.21,h*.8,.14,side*b.w*.30,h*.4,b.d*.42,0,1,[0,0,0],'#c4b59a',true);
  }
  part('broken-back',b.w*.73,h*.80,.16,-b.w*.05,h*.4,-b.d*.43,1,1,[0,0,0],'#b9ac96',true);
  part('lintel',b.w*.82,.12,.14,0,h*.82,b.d*.40,0,1);
  part('window-frame',b.w*.20,.08,.10,-b.w*.23,h*.55,b.d*.40,0,1);
  const roofY=h-.04,peak=roofY+b.roof*.63,x=b.w*.46,z=b.d*.46;
  panel([[-x,roofY,z],[x*(.45+variant*.10),roofY,z],[x*(.25+variant*.10),peak,0],[-x,peak,0]],2);
  panel([[-x*.55,peak,0],[x,peak,0],[x,roofY,-z],[-x*.40,roofY,-z]],2);
  for(const side of [-1,1]){
   part('roof-rail',b.w*.84+.14,.09,.09,0,h-.04,side*b.d*.40,0,1);
   part('side-plate',.12,.10,b.d*.90,side*b.w*.42,h-.04,0,0,1);
   for(const end of [-1,1]){const length=Math.hypot(z,peak-roofY),angle=-Math.atan2(peak-roofY,-end*z);part('exposed-rafter',.08,.08,length,side*b.w*.42,(peak+roofY)/2,end*z/2,0,1,[angle,0,0]);}
  }
 }
 const meshes=tools.meshes();meshes[0].material=dryGroundMaterial14(true);meshes[0].userData.dryGround14=true;meshes.forEach((m,i)=>{m.name=b.id+'-ruin14-'+['ground','structure','fragments'][i];if(i===2)m.userData.cameraDecoration=true;group.add(m);});group.userData.details=[meshes[2]];
 group.userData.ruin14={damage,visualDamage:visual,variant,confidence:POST_VISUAL14.confidence,sourceIds:POST_VISUAL14.sourceIds,parts:tools.counts,fragments:count};
}
// Separate diffuse soil texture: no atlas bleed, specular map or periodic bright bands.
function dryGroundTexture14(){
 if(ruins14Cache.has('dry-texture'))return ruins14Cache.get('dry-texture');
 const pixels=new Uint8Array(256*256*4),mix=(a,b,t)=>a+(b-a)*t;
 const noise=(x,y,cells)=>{const u=x/256*cells,v=y/256*cells,ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy,s=fx*fx*(3-2*fx),t=fy*fy*(3-2*fy),at=(i,j)=>ruins14Random((i+cells)%cells,(j+cells)%cells,77);return mix(mix(at(ix,iy),at(ix+1,iy),s),mix(at(ix,iy+1),at(ix+1,iy+1),s),t);};
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,v=.84+.16*noise(x,y,4)+.04*noise(x,y,16)+(ruins14Random(x,y,9)-.5)*.035;for(let c=0;c<3;c++)pixels[i+c]=[78,74,66][c]*v;pixels[i+3]=255;}
 const t=new THREE.DataTexture(pixels,256,256,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;ruins14Cache.set('dry-texture',t);return t;
}
function dryGroundMaterial14(vertexColors=false){
 const key=vertexColors?'dry-patches':'dry-roads';if(!ruins14Cache.has(key)){const m=new THREE.MeshLambertMaterial({map:dryGroundTexture14(),vertexColors,color:vertexColors?'#969184':'#c8c1b5',reflectivity:0,transparent:false,depthWrite:true,polygonOffset:vertexColors,polygonOffsetFactor:-1,polygonOffsetUnits:-1});m.userData.finish='dry-ash';ruins14Cache.set(key,m);}return ruins14Cache.get(key);
}
function dryGroundGeometry14(b,seed){
 const p=[],n=[],uv=[],color=[],center=new THREE.Color('#ffffff'),edge=new THREE.Color('#ffffff'),r=Array.from({length:10},(_,i)=>.44+.04*ruins14Random(seed,i,12));
 for(let i=0;i<10;i++)for(const j of [-1,(i+1)%10,i]){const a=j<0?0:j*Math.PI/5,x=j<0?0:Math.cos(a)*b.w*r[j],z=j<0?0:Math.sin(a)*b.d*r[j],c=j<0?center:edge;p.push(x,.032,z);n.push(0,1,0);uv.push((b.x+x)/4,(b.z+z)/4);color.push(c.r,c.g,c.b);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));return g;
}
function configureRuinsGround14(world){for(const surface of world.surfaces)surface.post=dryGroundMaterial14();}
function buildWaterSource14(controller){
 const root=new THREE.Group();controller.root.add(root);controller.waterRoot=root;root.userData.facility=POST_VISUAL14.waterSource;
 const tools=ruins14Tools(),{part,patch}=tools;
 patch(2.1,1.8,.25,.029,.12,5);patch(1.5,1.25,.42,.039,.12,4,0,'#807c71');
 part('broken-plinth',.78,.27,.62,-.22,.135,-.10,3,1,[0,0,0],'#c2b8a4',true);
 for(let i=0;i<4;i++)part('equipment-rubble',.21,.11,.18,-.62+i*.32,.07,-.51,1,2,[0,i*.63,.02],'#d1c7b4',true);
 part('fallen-board',.12,.065,.75,-.59,.055,.31,0,2,[0,-.38,0]);
 const pipe=(radius,length,x,y,z,rx=0,rz=0)=>{const g=new THREE.CylinderGeometry(radius,radius,length,8,1,true),m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(1,1,1));tools.add(g,6,'#a2a6a2',1,m);};
 pipe(.095,.56,-.20,.49,-.06);pipe(.10,.40,-.04,.74,-.06,0,-Math.PI/2);
 for(const x of [-.19,.14]){const ring=new THREE.TorusGeometry(.105,.018,4,8);ring.rotateY(Math.PI/2);ring.translate(x,.74,-.06);tools.add(ring,6,'#b9b4a6',1);}
 part('valve-cross',.27,.035,.035,-.20,.64,.10,6,1);part('valve-cross',.035,.035,.23,-.20,.64,.10,6,1);
 // Jagged lip around the open horizontal pipe, not a modern tap or hydrant.
 for(let i=0;i<5;i++)part('broken-lip',.05,.024,.024,.16+(i%2)*.025,.74+Math.sin(i*1.256)*.095,-.06+Math.cos(i*1.256)*.095,6,2);
 const meshes=tools.meshes();for(const m of meshes){m.userData.cameraDecoration=true;root.add(m);}
 controller.water=new THREE.Group();controller.water.position.y=.74;root.add(controller.water);
 if(!ruins14Cache.has('water'))ruins14Cache.set('water',new THREE.MeshBasicMaterial({color:'#b1cac3',transparent:true,opacity:.62,depthWrite:false}));
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.19,.74,-.06),new THREE.Vector3(.38,.68,-.03),new THREE.Vector3(.52,.38,.02),new THREE.Vector3(.55,.06,.12)]),stream=new THREE.Mesh(new THREE.TubeGeometry(curve,10,.025,5,false).translate(0,-.74,0),ruins14Cache.get('water'));stream.userData.nonSolid=true;controller.water.add(stream);
 const puddle=new THREE.Mesh(new THREE.CircleGeometry(.52,12),ruins14Cache.get('water'));puddle.rotation.x=-Math.PI/2;puddle.scale.set(1.35,.70,1);puddle.position.set(.57,.052,.17);puddle.userData.nonSolid=true;root.add(puddle);
 root.userData.staticMeshes=meshes;root.userData.sourceType='broken_residential_supply_pipe';
}
