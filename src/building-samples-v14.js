// V1.4 vernacular buildings: deterministic variants, original footprints and gameplay data retained.
const BUILDING14=HISTORICAL_DATA.building_samples_v14;
const building14Cache=new Map();
function building14Sample(id){
 const authored=BUILDING14.samples.find(s=>s.id===id);if(authored)return authored;
 if(building14Cache.has(id))return building14Cache.get(id);
 const b=WORLD_DATA.buildings.find(b=>b.id===id);if(!b||!BUILDING14.rollout.types.includes(b.type)||b.confidence!=='gameplay_adjusted')return null;
 const hash=Array.from(id).reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0),variant=hash%4;
 const sample={id,kind:b.type,variant,roof:b.type==='home'&&variant%2===0?'hip':'gable',households:b.type==='nagaya'?(b.w>=5.8?3:2):1,confidence:'gameplay_adjusted',sourceIds:['S03','S05'],signFictional:true,signType:b.sign?.includes('米')?'rice':'blank'};
 building14Cache.set(id,sample);return sample;
}
function building14Atlas(){
 if(building14Cache.has('atlas'))return building14Cache.get('atlas');
 const width=512,height=256,pixels=new Uint8Array(width*height*4),colors=[[109,88,63],[198,183,150],[91,96,91],[128,123,109],[205,198,165],[81,94,87],[62,57,44],[155,124,76]];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const tile=(x>>7)+(y>>7)*4,u=x%128,v=y%128,noise=((Math.imul(u+13,15731)^Math.imul(v+41,789221))>>>0)%101/100;
  let shade=.91+noise*.15;
  if(tile===0){shade+=(Math.sin(u*.65+Math.sin(v*.08)*1.1)*.045);if(u%21<2)shade*=.61;if(v%47===0)shade*=.85;}
  if(tile===1)shade+=Math.sin(u*.07+v*.11)*.015;
  if(tile===2){const row=Math.floor(v/11),a=(u+(row%2)*4)%8,b=v%11;if(a<1||b>8)shade*=.54;else if(a===3)shade*=1.17;}
  if(tile===3&&(v%31<2||((u+(Math.floor(v/31)%2)*19)%37<2)))shade*=.64;
  if(tile===4){if(v%7===0)shade*=.95;shade+=Math.sin(u*.19)*.018;}
  if(tile===5){if(u%6===0)shade*=.88;}
  if(tile===6)shade*=.62;
  if(tile===7)shade+=Math.sin(v*.45+u*.014)*.05;
  const i=(y*width+x)*4;for(let c=0;c<3;c++)pixels[i+c]=Math.min(255,colors[tile][c]*shade);pixels[i+3]=255;
 }
 // Fixed small Mincho-inspired sign; no browser font download and no real shop claim.
 const mask=BUILDING14.atlas.signInk128x64Hex;
 for(let y=0;y<64;y++)for(let x=0;x<128;x++){const byte=parseInt(mask.slice((y*16+(x>>3))*2,(y*16+(x>>3))*2+2),16);if(byte&(1<<(7-x%8))){const i=((128+32+(63-y))*width+384+x)*4;pixels[i]=43;pixels[i+1]=39;pixels[i+2]=29;}}
 const t=new THREE.DataTexture(pixels,width,height,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;building14Cache.set('atlas',t);return t;
}
function building14Material(){if(!building14Cache.has('material'))building14Cache.set('material',new THREE.MeshLambertMaterial({map:building14Atlas(),vertexColors:true,color:'#ffffff'}));return building14Cache.get('material');}
function building14UV(g,tile,tint='#ffffff',sign=false){
 const uv=g.attributes.uv,tx=tile%4,ty=tile>>2;for(let i=0;i<uv.count;i++)uv.setXY(i,(tx*128+3+uv.getX(i)*122)/512,(ty*128+(sign?32:3)+uv.getY(i)*(sign?64:122))/256);
 const color=new THREE.Color(tint),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=color.r;a[i+1]=color.g;a[i+2]=color.b;}g.setAttribute('color',new THREE.Float32BufferAttribute(a,3));return g;
}
function building14Merge(parts){
 const p=[],n=[],uv=[],c=[];for(const raw of parts){const g=raw.index?raw.toNonIndexed():raw;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);uv.push(...g.attributes.uv.array);c.push(...g.attributes.color.array);g.dispose();if(g!==raw)raw.dispose();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function building14Roof(b,hip){
 const x=b.w/2+.24,z=b.d/2+.24,y=b.h-.025,top=b.h+b.roof,faces=[];
 if(hip){const r=b.w*.24;faces.push([[-x,y,z],[x,y,z],[r,top,0],[-r,top,0]],[[-x,y,-z],[-r,top,0],[r,top,0],[x,y,-z]],[[-x,y,-z],[-x,y,z],[-r,top,0]],[[x,y,z],[x,y,-z],[r,top,0]]);}
 else faces.push([[-x,y,z],[x,y,z],[x,top,0],[-x,top,0]],[[-x,y,-z],[-x,top,0],[x,top,0],[x,y,-z]]);
 const a=[],uv=[];for(const face of faces){const ids=face.length===4?[0,1,2,0,2,3]:[0,1,2],q=face.length===4?[[0,0],[1,0],[1,1],[0,1]]:[[0,0],[1,0],[.5,1]];for(const i of ids){a.push(...face[i]);uv.push(...q[i]);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return building14UV(g,2);
}
function buildBuilding14(world,b,sample){
 const variant=sample.variant||0,frameTint=['#ffffff','#d0c4af','#a6b0a2','#c0ac92'][variant],wallTile=sample.kind==='home'&&variant!==3?1:0;
 const group=new THREE.Group(),coarse=[],detail=[],front=b.d/2;group.position.set(b.x,0,b.z);group.rotation.y=b.angle;group.userData.preBlast=true;group.userData.expansion=b.id.startsWith('v11-');group.userData.buildingSample=sample.kind;group.userData.architecture={kind:sample.kind,variant,confidence:sample.confidence,signFictional:true};
 const geometryKey='geometry:'+JSON.stringify([b.w,b.h,b.d,b.roof,sample.kind,sample.roof,variant,sample.households||3,sample.signType||'rice']);
 if(building14Cache.has(geometryKey)){attachBuilding14(world,b,group,building14Cache.get(geometryKey));return;}
 const box=(w,h,d,x,y,z,tile=0,tint='#ffffff',fine=false,rx=0,ry=0,rz=0)=>{if(Math.min(w,h,d)<=0||![w,h,d,x,y,z].every(Number.isFinite))throw Error('Invalid sample building member');const g=geometries.box.clone(),m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(w,h,d));g.applyMatrix4(m);building14UV(g,tile,new THREE.Color(tint).multiply(new THREE.Color(tile===0||tile===1?frameTint:'#ffffff')));(fine?detail:coarse).push(g);};
 const foundation=.24,doorTop=2.14,openings=[];
 const window=(x,width,y=1.06,height=.91,shutter=false)=>{openings.push({x0:x-width/2,x1:x+width/2,y0:y,y1:y+height});box(width+.04,height+.04,.035,x,y+height/2,front-.21,6);box(width,height,.018,x,y+height/2,front-.16,4);for(const side of [-1,1]){box(.055,height+.12,.09,x+side*(width/2+.005),y+height/2,front-.07);box(width+.12,.055,.09,x,y+(side+1)*height/2,front-.064);}for(let i=1;i<(variant%2?4:5);i++)box(.022,height,.034,x-width/2+width*i/(variant%2?4:5),y+height/2,front-.115,0,'#eee3c6',true);box(width,.025,.04,x,y+height*.5,front-.11,0,'#eee3c6',true);if(shutter)box(width*.38,height,.07,x+width*.29,y+height/2,front-.045,0,'#8a7961');};
 const door=(x,width,paper=false)=>{openings.push({x0:x-width/2,x1:x+width/2,y0:foundation,y1:doorTop});box(width,doorTop-foundation,.045,x,(doorTop+foundation)/2,front-.16,0,'#a28f73');for(const side of [-1,1])box(.055,doorTop-foundation+.08,.10,x+side*width/2,(doorTop+foundation)/2,front-.06);box(width+.1,.08,.12,x,doorTop,front-.06);box(width+.1,.09,.25,x,foundation+.045,front-.13,3);box(.035,doorTop-foundation,.06,x,1.17,front-.11,0,'#716048');for(const side of [-1,1])box(.035,.1,.025,x+side*.065,1.10,front-.12,6,'#ffffff',true);if(paper){box(width*.82,.64,.018,x,1.65,front-.125,4);for(let i=1;i<4;i++)box(.022,.64,.025,x-width*.41+width*.82*i/4,1.65,front-.106,0,'#ffffff',true);}};
 if(sample.kind==='nagaya'){
  const count=sample.households||3,bay=b.w/count;for(let i=0;i<count;i++){const left=-b.w/2+i*bay;door(left+bay*.27,Math.min(.70,bay*.39),i%2===1);window(left+bay*.73,bay*.37,1.10,.83,(i+variant)%3===2);if(i)box(.12,b.h-.24,.13,left,(b.h+.24)/2,front-.065,0,'#75604b');box(bay*.46,.23,.04,left+bay*.5,b.h-.52,front-.08,6,'#ffffff');for(let j=1;j<4;j++)box(.025,.23,.05,left+bay*.5-bay*.23+bay*.46*j/4,b.h-.52,front-.06,0,'#ffffff',true);}
 }else if(sample.kind==='shop'){
  door(-b.w*.29,1.05,true);window(b.w*.18,b.w*.45,.93,1.17,false);box(b.w*.48,.12,.42,b.w*.18,.91,front-.232,0,'#a18b68');
  for(let i=0;i<(variant===2?2:3);i++){const x=b.w*.18+(i-1)*.53;box(.43,.28,.33,x,1.10,front-.23,0,'#a89674',true);box(.31,.07,.27,x,1.27,front-.24,4,'#c6ba97',true);}
  box(b.w-.14,.105,.65,0,2.27,front-.10,2,'#a7aaa1',false,.10);for(const x of [-b.w/2+.14,b.w/2-.14]){box(.10,1.98,.10,x,1.23,front-.10);box(.10,.12,.37,x,2.17,front-.09);}
  for(let i=0;i<(variant===3?0:4);i++)box(.31,.42,.024,-.03+(i-1.5)*.32,1.99,front+.025,5,'#adb5a8');
  if(variant!==1){box(b.w*.69,.48,.11,0,Math.min(2.59,b.h-.21),front-.01,0,'#69583f');if(!sample.signType||sample.signType==='rice'){const sign=new THREE.PlaneGeometry(b.w*.65,.39);sign.translate(0,Math.min(2.59,b.h-.21),front+.052);coarse.push(building14UV(sign,7,'#ffffff',true));}}
 }else{const flip=variant%2?-1:1;door(-b.w*.27*flip,1.0,variant!==2);window(b.w*.23*flip,b.w*.34,1.08,1.00,variant!==1);}
 // Closed shell, but front openings are genuinely recessed rather than painted on a large box.
 box(b.w,.24,b.d,0,.12,0,3,'#b5ad96');box(b.w-.10,b.h-.24,.10,0,(b.h+.24)/2,-b.d/2+.05, wallTile);
 for(const side of [-1,1])box(.10,b.h-.24,b.d-.10,side*(b.w/2-.05),(b.h+.24)/2,0,wallTile);
 let rectangles=[{x0:-b.w/2+.05,x1:b.w/2-.05,y0:foundation,y1:b.h}];
 for(const cut of openings){const next=[];for(const p of rectangles){const x0=Math.max(p.x0,cut.x0),x1=Math.min(p.x1,cut.x1),y0=Math.max(p.y0,cut.y0),y1=Math.min(p.y1,cut.y1);if(x0>=x1||y0>=y1){next.push(p);continue;}if(p.x0<x0)next.push({...p,x1:x0});if(x1<p.x1)next.push({...p,x0:x1});if(p.y0<y0)next.push({x0,x1,y0:p.y0,y1:y0});if(y1<p.y1)next.push({x0,x1,y0:y1,y1:p.y1});}rectangles=next;}
 for(const p of rectangles)box(p.x1-p.x0,p.y1-p.y0,.10,(p.x0+p.x1)/2,(p.y0+p.y1)/2,front-.08,wallTile,sample.kind==='nagaya'?'#b9a88c':'#ffffff');
 for(const x of [-b.w/2+.08,b.w/2-.08])box(.13,b.h-.24,.14,x,(b.h+.24)/2,front-.055,0,'#71604a');
 box(b.w,.12,.14,0,.31,front-.07,0,'#71604a');box(b.w,.12,.16,0,b.h-.07,front-.07,0,'#71604a');
 const roofStart=coarse.length;coarse.push(building14Roof(b,sample.roof==='hip'));
 if(sample.roof==='gable')for(const side of [-1,1]){const g=new THREE.BufferGeometry(),x=side*(b.w/2-.04),p=side>0?[[x,b.h,-b.d/2],[x,b.h+b.roof,0],[x,b.h,b.d/2]]:[[x,b.h,b.d/2],[x,b.h+b.roof,0],[x,b.h,-b.d/2]];g.setAttribute('position',new THREE.Float32BufferAttribute(p.flat(),3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,.5,1,1,0],2));g.computeVertexNormals();coarse.push(building14UV(g,0,'#928069'));}
 for(const side of [-1,1])box(b.w+.48,.10,.12,0,b.h-.04,side*(b.d/2+.20),0,'#6c5942');
 box(sample.roof==='hip'?b.w*.48:b.w+.48,.055,.10,0,b.h+b.roof+.018,0,2,'#b4b7ac');
 for(const x of [-b.w*.36,0,b.w*.36])box(.075,.13,.24,x,b.h-.13,front-.09,0,'#79634c',true);
 const roofParts=coarse.splice(roofStart),geometry=[building14Merge(coarse),building14Merge(roofParts),building14Merge(detail)];
 building14Cache.set(geometryKey,geometry);attachBuilding14(world,b,group,geometry);
}

function attachBuilding14(world,b,group,geometry){
 const [shell,roof,decor]=geometry.map(g=>new THREE.Mesh(g,building14Material()));
 shell.name=b.id+'-v14-shell';roof.name=b.id+'-v14-roof';decor.name=b.id+'-v14-details';decor.userData.cameraDecoration=true;
 group.add(shell,roof,decor);group.userData.details=[decor];world.addGroup(group,b.x,b.z);
 world.buildings.push({id:b.id,position:{x:b.x,z:b.z},rotation:b.angle,data:b,preBlastModel:group,postBlastModel:null,damageState:'INTACT',distanceFromHypocenter:historicalDistance(b)});
 const c=Math.abs(Math.cos(b.angle)),s=Math.abs(Math.sin(b.angle));block(b.x,b.z,b.w*c+b.d*s,b.d*c+b.w*s);walls[walls.length-1].buildingId=b.id;
}
