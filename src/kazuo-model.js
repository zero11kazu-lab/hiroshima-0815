// Original V1.3 low-poly adult. The root, collision radius and movement code are unchanged.
// Geometry and four small state atlases are shared; poses use named rigid joints (no skinning).
const KAZUO_PALETTE=['#727a61','#4a5148','#c1a687','#393a31','#535c4c','#4b4539','#e0d7c0','#30332b','#454237','#866e60','#555744','#c7c2a9','#727a61','#727a61'];
const kazuoTextureCache=new Map(),kazuoMaterialCache=new Map(),kazuoRigs=new WeakMap();let kazuoGeometry=null;
function kazuoTexture(mode='pre'){
 if(kazuoTextureCache.has(mode))return kazuoTextureCache.get(mode);
 const size=256,rgba=new Uint8Array(size*size*4),post=mode==='post',weak=mode==='weak',room=mode==='room';
 const colors=KAZUO_PALETTE.map(c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const region=Math.floor(x/64)+Math.floor(y/64)*4,u=(x%64)/63,v=(y%64)/63,base=colors[region]||[255,255,255],n=((Math.imul(x+23,15731)^Math.imul(y+71,789221))>>>0)%101/100;
  let shade=.965+n*.07-([0,1,12,13].includes(region)&&y%4===0?.018:0),rgb=base.map(c=>c*shade);
  if((post||room||weak)&&[0,1,4,5,12,13].includes(region)){
   const soot=post?.20:.07;rgb=rgb.map(c=>c*(1-soot*(.35+.65*n)));
   if(post&&region===0){const cut=Math.abs(u-(.35+.07*Math.sin(v*39)))<.032&&v>.30&&v<.65;
    if(cut)rgb=[146,119,91];if((u-.73)**2+(v-.40)**2<.025)rgb=[82+n*15,72+n*12,56+n*12];}
  }
  if(post&&region===13&&(u-.62)**2+(v-.40)**2<.006)rgb=[118+n*18,102+n*15,81+n*12];
  if(post&&region===2&&(u-.72)**2+(v-.61)**2<.033)rgb=[166+n*16,120+n*12,98+n*10];
  if(weak&&region===2)rgb=rgb.map((c,i)=>c*.6+[184,174,152][i]*.4);
  if(weak&&region===3&&(u<.27||u>.78))rgb=[153,141,120];
  if(region===0&&(x%64===5||x%64===58))rgb=rgb.map(c=>c*.86);
  const i=(y*size+x)*4;rgba[i]=rgb[0];rgba[i+1]=rgb[1];rgba[i+2]=rgb[2];rgba[i+3]=255;
 }
 const texture=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;kazuoTextureCache.set(mode,texture);return texture;
}
function kazuoMaterial(mode='pre'){
 if(!kazuoMaterialCache.has(mode))kazuoMaterialCache.set(mode,new THREE.MeshLambertMaterial({map:kazuoTexture(mode),color:'#ffffff'}));return kazuoMaterialCache.get(mode);
}
function kazuoUV(geometry,region){const uv=geometry.getAttribute('uv'),cx=region%4,cy=Math.floor(region/4);for(let i=0;i<uv.count;i++)uv.setXY(i,(cx*64+4+Math.max(0,Math.min(1,uv.getX(i)))*56)/256,(cy*64+4+Math.max(0,Math.min(1,uv.getY(i)))*56)/256);return geometry;}
function kazuoLoft(rings,sides,region){
 const vertices=[],uv=[],indices=[],ascending=rings.at(-1)[0]>rings[0][0];
 for(let i=0;i<rings.length;i++){const [y,rx,rz,cx=0,cz=0]=rings[i];for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;vertices.push(cx+Math.sin(a)*rx,y,cz+Math.cos(a)*rz);uv.push(j/sides,i/(rings.length-1));}}
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(...(ascending?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
 for(const [ring,reverse]of [[0,ascending],[rings.length-1,!ascending]]){const r=rings[ring],center=vertices.length/3;vertices.push(r[3]||0,r[0],r[4]||0);uv.push(.5,ring?1:0);for(let j=0;j<sides;j++){const a=ring*(sides+1)+j;indices.push(...(reverse?[center,a+1,a]:[center,a,a+1]));}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return kazuoUV(g,region);
}
function kazuoPiece(g,region,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,rz=0){
 const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(sx,sy,sz));return kazuoUV(g,region).applyMatrix4(m);
}
function kazuoMerge(parts){const p=[],n=[],uv=[],ix=[];let offset=0;for(const g of parts){p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);uv.push(...g.attributes.uv.array);const count=g.attributes.position.count;if(g.index)for(const i of g.index.array)ix.push(i+offset);else for(let i=0;i<count;i++)ix.push(i+offset);offset+=count;g.dispose();}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeBoundingBox();return g;}
function kazuoGeometries(){
 if(kazuoGeometry)return kazuoGeometry;
 const ell=(r,x,y,z,sx,sy,sz,w=10,h=6)=>kazuoPiece(new THREE.SphereGeometry(1,w,h),r,x,y,z,sx,sy,sz);
 const chest=[kazuoLoft([[.89,.19,.115],[1.0,.205,.125],[1.17,.245,.145],[1.35,.26,.14],[1.45,.26,.12],[1.49,.19,.095]],12,0),kazuoLoft([[1.47,.061,.061],[1.54,.060,.060],[1.60,.059,.059]],10,2)];
 for(const side of [-1,1]){chest.push(kazuoPiece(new THREE.BoxGeometry(.055,.075,.014),11,side*.057,1.435,-.115,1,1,1,0,side*.24));chest.push(kazuoPiece(new THREE.BoxGeometry(.115,.12,.012),12,side*.14,1.27,-.144));}
 for(const y of [1.35,1.21,1.07])chest.push(kazuoPiece(new THREE.CylinderGeometry(.012,.012,.012,6),10,0,y,-.153,1,1,1,Math.PI/2));
 const head=[kazuoLoft([[-.135,.055,.065,0,-.01],[-.11,.075,.08,0,-.004],[-.06,.097,.095],[0,.105,.10],[.055,.102,.091],[.105,.095,.087],[.135,.072,.062],[.145,.027,.025]],14,2)];
 head.push(kazuoLoft([[.085,.098,.09],[.122,.086,.078],[.146,.04,.035]],14,3));
 for(const side of [-1,1]){head.push(ell(2,side*.107,-.006,0,.022,.039,.025,8,5));head.push(ell(6,side*.032,.025,-.095,.017,.006,.005,8,4));head.push(ell(7,side*.032,.025,-.100,.006,.005,.003,6,4));head.push(kazuoPiece(new THREE.BoxGeometry(.038,.007,.007),8,side*.032,.046,-.091,1,1,1,0,side*.08));}
 head.push(ell(2,0,-.005,-.112,.018,.029,.023,6,4));head.push(kazuoPiece(new THREE.BoxGeometry(.053,.009,.007),9,0,-.068,-.094));
 const brimShape=new THREE.Shape();brimShape.moveTo(-.10,.02);brimShape.lineTo(-.12,-.075);brimShape.quadraticCurveTo(0,-.19,.12,-.075);brimShape.lineTo(.10,.02);brimShape.closePath();
 const brim=kazuoPiece(new THREE.ExtrudeGeometry(brimShape,{depth:.012,bevelEnabled:false,curveSegments:5}),4,0,0,0,1,1,1,Math.PI/2);
 kazuoGeometry={
  chest:kazuoMerge(chest).translate(0,-1.15,0),hips:kazuoLoft([[.84,.18,.115],[.94,.20,.13],[1.01,.20,.12]],12,1).translate(0,-.92,0),head:kazuoMerge(head),cap:kazuoLoft([[-.01,.108,.103],[.035,.108,.103],[.065,.095,.09],[.070,.09,.085]],14,4),brim,
  thigh:kazuoLoft([[.015,.105,.105],[-.11,.108,.109],[-.25,.095,.095],[-.38,.08,.083],[-.46,.077,.079]],10,1),
  calf:kazuoMerge([ell(1,0,0,0,.077,.080,.079,8,5),kazuoLoft([[.025,.077,.079],[-.09,.083,.086],[-.23,.071,.075],[-.35,.055,.06],[-.43,.054,.057]],10,1)]),
  foot:kazuoLoft([[-.08,.085,.12,0,-.06],[-.065,.10,.15,0,-.065],[-.015,.10,.15,0,-.065],[.055,.08,.10,0,-.005],[.09,.06,.06]],10,5),
  upperArm:kazuoLoft([[.05,.045,.05],[0,.09,.092],[-.11,.085,.088],[-.23,.070,.073],[-.33,.066,.069]],10,13),
  forearm:kazuoMerge([ell(13,0,0,0,.066,.069,.069,8,5),kazuoLoft([[.02,.066,.069],[-.075,.067,.068],[-.19,.055,.057],[-.29,.042,.046]],8,13)]),
  hand:kazuoMerge([ell(2,0,-.045,0,.046,.085,.033),ell(2,.045,-.025,-.005,.023,.046,.022,8,5)])
 };return kazuoGeometry;
}
function createKazuoModel(){
 const root=new THREE.Group();root.name='kazuo';root.userData.modelVersion='1.3';const g=kazuoGeometries(),material=kazuoMaterial();
 const mesh=(key,name,parent=root,x=0,y=0,z=0)=>{const m=new THREE.Mesh(g[key],material);m.name=name;m.position.set(x,y,z);parent.add(m);return m;};
 const skeleton=new THREE.Group();skeleton.name='kazuo-skeleton';root.add(skeleton);
 const spine=new THREE.Group();spine.name='kazuo-spine';spine.position.y=.96;skeleton.add(spine);
 mesh('chest','kazuo-chest',spine,0,.19);mesh('hips','kazuo-hips',skeleton,0,.92);mesh('head','kazuo-head',spine,0,.755);mesh('cap','kazuo-cap',spine,0,.88);mesh('brim','kazuo-brim',spine,0,.875,-.01);
 for(const [i,side]of [-1,1].entries()){
  const leg=new THREE.Group();leg.name='kazuo-leg-'+i;leg.position.set(side*.145,.96,0);skeleton.add(leg);mesh('thigh','kazuo-thigh-'+i,leg);
  const knee=new THREE.Group();knee.name='kazuo-knee-'+i;knee.position.y=-.44;leg.add(knee);mesh('calf','kazuo-calf-'+i,knee);
  const ankle=new THREE.Group();ankle.name='kazuo-ankle-'+i;ankle.position.y=-.42;knee.add(ankle);mesh('foot','kazuo-foot-'+i,ankle);
  const arm=new THREE.Group();arm.name='kazuo-arm-'+i;arm.position.set(side*.255,.47,0);spine.add(arm);mesh('upperArm','kazuo-sleeve-'+i,arm);
  const elbow=new THREE.Group();elbow.name='kazuo-elbow-'+i;elbow.position.y=-.31;arm.add(elbow);mesh('forearm','kazuo-forearm-'+i,elbow);
  const wrist=new THREE.Group();wrist.name='kazuo-wrist-'+i;wrist.position.y=-.29;elbow.add(wrist);mesh('hand','kazuo-hand-'+i,wrist).scale.x=side;
 }
 return root;
}
function kazuoRig(model){if(!kazuoRigs.has(model)){const pair=key=>[0,1].map(i=>model.getObjectByName('kazuo-'+key+'-'+i));kazuoRigs.set(model,{skeleton:model.getObjectByName('kazuo-skeleton'),spine:model.getObjectByName('kazuo-spine'),legs:pair('leg'),knees:pair('knee'),ankles:pair('ankle'),arms:pair('arm'),elbows:pair('elbow'),head:model.getObjectByName('kazuo-head'),chest:model.getObjectByName('kazuo-chest')});}return kazuoRigs.get(model);}
function poseKazuo(model,seated=false){const r=kazuoRig(model);for(let i=0;i<2;i++){r.legs[i].rotation.x=seated?1.1:0;r.knees[i].rotation.x=seated?-2.5:0;r.ankles[i].rotation.x=seated?1.4:0;r.arms[i].rotation.x=seated?.25:0;r.elbows[i].rotation.x=seated?1:.12;}r.skeleton.position.y=0;r.spine.rotation.set(0,0,0);r.head.rotation.set(0,0,0);r.chest.scale.z=1;}
function animateKazuo(model,cycle,amount,running,dt,talking=false,supported=false){
 const r=kazuoRig(model);model.userData.idleTime=(model.userData.idleTime||0)+dt;const time=model.userData.idleTime;
 for(let i=0;i<2;i++){const wave=Math.sin(cycle+i*Math.PI),walk=amount>.08;r.legs[i].rotation.x=walk?wave*(running?.58:.45):0;r.knees[i].rotation.x=walk?-Math.max(0,-wave)*(running?1.0:.65):0;r.ankles[i].rotation.x=walk?-r.knees[i].rotation.x*.16:0;r.arms[i].rotation.x=walk?-wave*(running?.48:.35):talking?-.06:0;r.elbows[i].rotation.x=running?.70:talking?.30:.15+Math.max(0,wave)*.10;}
 if(supported){r.arms[0].rotation.x=-1.2;r.elbows[0].rotation.x=.5;}
 const stride=amount>.08?Math.abs(Math.sin(cycle))*(running?.58:.45):0;
 r.skeleton.position.y=-Math.max(0,.94*(1-Math.cos(stride))-.085*Math.sin(stride));
 r.spine.rotation.x=amount>.08?(running?-.055:-.015):0;r.chest.scale.z=1+Math.sin(time*1.8)*.006;r.head.rotation.y=talking?Math.sin(time*.6)*.035:0;r.head.rotation.x=talking?-.025:0;
}
function kazuoRoomAppearance(model,weak){const texture=kazuoTexture(weak?'weak':'room');model.traverse(m=>{if(m.isMesh&&m.name.startsWith('kazuo-')){m.material.map=texture;m.material.needsUpdate=true;}});}
