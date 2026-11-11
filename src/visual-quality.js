// Bounded 256px procedural textures. Offline, no extra downloads; shared across every building.
const surfaceCache=new Map(),textureCache=new Map();
function surfaceTexture(kind){
 if(textureCache.has(kind))return textureCache.get(kind);
 const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');let seed=815;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 g.fillStyle={timber:'#a69b81',plaster:'#d5ceae',earth:'#b3a084',tile:'#92958d',stone:'#b7afa1',dirt:'#b7aa8b',gravel:'#bbb5a4',char:'#625a50',water:'#7da8a4'}[kind]||'#a9a095';g.fillRect(0,0,256,256);
 for(let i=0;i<6500;i++){const v=rnd()>.5?255:15;g.fillStyle=`rgba(${v},${v},${v},${.025+rnd()*.075})`;const x=rnd()*256,y=rnd()*256;g.fillRect(x,y,kind==='timber'?1:1+rnd()*3,kind==='timber'?10+rnd()*30:1+rnd()*3);}
 if(kind==='timber'){for(let x=0;x<256;x+=32){g.fillStyle='rgba(25,20,14,.42)';g.fillRect(x,0,2,256);g.fillStyle='rgba(240,220,185,.18)';g.fillRect(x+2,0,1,256);}}
 if(kind==='tile'){for(let y=0;y<256;y+=32)for(let x=0;x<256;x+=24){const off=(y/32%2)*12;g.fillStyle='rgba(30,34,35,.36)';g.fillRect(x+off,y,2,32);g.fillRect(x+off,y+28,24,4);g.fillStyle='rgba(240,240,225,.22)';g.fillRect(x+off+5,y+3,3,24);}}
 if(kind==='stone'){for(let y=0;y<256;y+=42){g.fillStyle='rgba(40,35,28,.28)';g.fillRect(0,y,256,3);for(let x=(y/42%2)*32;x<256;x+=64)g.fillRect(x,y,2,42);}}
 if(kind==='water'){g.strokeStyle='rgba(220,239,219,.26)';g.lineWidth=1;for(let i=0;i<50;i++){const y=rnd()*256;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(80,y-5,170,y+5,256,y);g.stroke();}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;textureCache.set(kind,t);return t;
}
function surface(kind,color='#ffffff',pbr=false){const key=kind+color+pbr;if(surfaceCache.has(key))return surfaceCache.get(key);const options={map:surfaceTexture(kind),color};const m=pbr?new THREE.MeshStandardMaterial({...options,roughness:kind==='water'?.32:.9,metalness:kind==='water'?.12:0}):new THREE.MeshLambertMaterial(options);surfaceCache.set(key,m);return m;}
function texturedBox(w,h,d,material,x,y,z,parent=scene){const m=new THREE.Mesh(geometries.box,material);m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m;}
function texturedPlane(w,d,material,x,z,repeat=4){const g=new THREE.PlaneGeometry(w,d);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/repeat,uv.getY(i)*d/repeat);const m=new THREE.Mesh(g,material);m.rotation.x=-Math.PI/2;m.position.set(x,.04,z);scene.add(m);return m;}
// Subtract already-drawn road rectangles so intersections have exactly one surface.
// Keep original road bounds, UV origin, material, height and collider data unchanged.
function roadSurfaceGeometry(road,covered,repeat=3){
 let pieces=[{minX:road.x-road.w/2,maxX:road.x+road.w/2,minZ:road.z-road.d/2,maxZ:road.z+road.d/2}];
 for(const other of covered){
  const next=[];
  for(const p of pieces){
   const x0=Math.max(p.minX,other.x-other.w/2),x1=Math.min(p.maxX,other.x+other.w/2),z0=Math.max(p.minZ,other.z-other.d/2),z1=Math.min(p.maxZ,other.z+other.d/2);
   if(x0>=x1||z0>=z1){next.push(p);continue;}
   if(p.minX<x0)next.push({...p,maxX:x0});
   if(x1<p.maxX)next.push({...p,minX:x1});
   if(p.minZ<z0)next.push({minX:x0,maxX:x1,minZ:p.minZ,maxZ:z0});
   if(z1<p.maxZ)next.push({minX:x0,maxX:x1,minZ:z1,maxZ:p.maxZ});
  }pieces=next;
 }
 if(!pieces.length)return null;
 // Give the east landing enough vertices for a continuous, shallow eight-unit grade.
 if(road.tram&&road.w>road.d){const edge=GEO1945.bridges.find(b=>b.id==='miyuki').x+GEO1945.bridges.find(b=>b.id==='miyuki').w/2;for(const x of [edge,edge+8])pieces=pieces.flatMap(p=>x>p.minX&&x<p.maxX?[{...p,maxX:x},{...p,minX:x}]:[p]);}
 const positions=[],uvs=[];
 for(const p of pieces)for(const [x,z]of [[p.minX,p.maxZ],[p.maxX,p.maxZ],[p.minX,p.minZ],[p.maxX,p.maxZ],[p.maxX,p.minZ],[p.minX,p.minZ]]){
  positions.push(x-road.x,road.z-z,road.tram?eastApproachLift14(x,z):0);uvs.push((x-road.x+road.w/2)/repeat,(road.z+road.d/2-z)/repeat);
 }
 // Close the raised landing's roadside faces down to the existing soil: no floating plane.
 if(road.tram&&road.w>road.d){const bridge=GEO1945.bridges.find(b=>b.id==='miyuki'),edge=bridge.x+bridge.w/2;
  for(const p of pieces){const a=Math.max(p.minX,edge),b=Math.min(p.maxX,edge+8);if(b<=a)continue;
   for(const side of [-1,1]){const z=bridge.z+side*bridge.d/2;if(Math.abs((side<0?p.minZ:p.maxZ)-z)>.001)continue;const points=[[a,z,-.03],[b,z,-.03],[b,z,eastApproachLift14(b,z)],[a,z,eastApproachLift14(a,z)]];if(side<0)points.reverse();for(const i of [0,1,2,0,2,3]){const [x,z,y]=points[i];positions.push(x-road.x,road.z-z,y);uvs.push((x-road.x+road.w/2)/repeat,(road.z+road.d/2-z)/repeat);}}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();return geometry;
}
function districtGround(world){
 world.surfaces=[];const ground=texturedPlane(145,145,surface('dirt','#c0b99c'),0,-7,5);ground.position.y=-.015;world.surfaces.push({mesh:ground,pre:ground.material,post:surface('char','#78756c')});
 // Non-overlapping edge tiles retain the original ground and its UVs exactly.
 for(const tile of FIELD_EXPANSION.groundTiles){const mesh=texturedPlane(tile.w,tile.d,ground.material,tile.x,tile.z,5);mesh.position.y=ground.position.y;world.surfaces.push({mesh,pre:mesh.material,post:surface('char','#78756c')});}
 addSouthTrackBackdrop14(world,ground.material);
 const coveredRoads=[];
 for(const r of world.data.roads){const geometry=roadSurfaceGeometry(r,r.tram&&r.w>r.d?[...coveredRoads,...GEO1945.bridges.filter(b=>b.tram)]:coveredRoads);coveredRoads.push(r);if(!geometry)continue;const m=new THREE.Mesh(geometry,surface(r.tram?'gravel':'dirt',r.tram?'#d0c7ad':'#c3b79d'));m.rotation.x=-Math.PI/2;m.position.set(r.x,.015,r.z);scene.add(m);world.surfaces.push({mesh:m,pre:m.material,post:surface('char','#8b8476')});}
 for(const r of GEO1945.rivers){const shape=new THREE.Shape();r.polygon.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const geom=new THREE.ShapeGeometry(shape);const uv=geom.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/9,uv.getY(i)/9);const m=new THREE.Mesh(geom,surface('water','#91b5b0',true));m.rotation.x=-Math.PI/2;m.position.y=.025;m.userData.nonSolid=true;scene.add(m);
 // Sloped stone banks follow the staged bank line, not the old fictional cross-town river.
 for(const side of (r.bankSegments||(r.id==='motoyasu'?[[1,2],[2,3],[3,4]]:[[0,7],[7,6],[6,5]])))for(const [a,b] of [side]){const p=r.polygon[a],q=r.polygon[b],len=Math.hypot(q[0]-p[0],q[1]-p[1]),bank=texturedBox(.55,.5,len,surface('stone','#8b8877'),(p[0]+q[0])/2,.02,(p[1]+q[1])/2);bank.rotation.y=Math.atan2(q[0]-p[0],q[1]-p[1]);bank.userData.nonSolid=true;}}
 for(const b of GEO1945.bridges){const g=new THREE.Group();g.position.set(b.x,0,b.z);bridgePavement14(world,b,g);for(const z of [-b.d/2,b.d/2]){texturedBox(b.w,.13,.16,surface('stone','#c6c1ae'),0,1.1,z,g);for(let x=-b.w/2+.5;x<b.w/2;x+=2){texturedBox(.21,1.05,.24,surface('stone','#a49f8e'),x,.55,z,g);box(1.4,.08,.08,'#777a6d',x+.8,.65,z,g);}block(b.x,b.z+z,b.w,.2);}for(const x of [-5,5])texturedBox(1.2,1.3,b.d*.8,surface('stone','#777f77'),x,-.45,0,g);world.mergeDetails(g);addRailDetail14(world,g,b);world.addGroup(g,b.x,b.z);}
 // Ground rails are solid low-poly ribbons. Keep suspended contact wires separate.
 buildTramTrack14(world);
 // Reuse the paired rail paths for overhead contact lines, including the east curve.
 const wires=[],railPaths=world.tramTrack14.userData.trackPaths;for(let i=0;i<railPaths.length;i+=2){const a=railPaths[i].points,b=railPaths[i+1].points;for(let j=1;j<a.length;j++)for(const k of [j-1,j])wires.push(new THREE.Vector3((a[k][0]+b[k][0])/2,5.6,(a[k][1]+b[k][1])/2));}
 const contactWire=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wires),new THREE.LineBasicMaterial({color:'#565b56'}));contactWire.userData.nonSolid=true;contactWire.name='tram-contact-wires';scene.add(contactWire);
 buildTram14(world);
 for(const [name,x,z] of [['千田町',-4.1,28],['鷹野橋',-4.1,-32]]){const g=new THREE.Group();g.position.set(x,0,z);cylinder(.035,2,'#665e4d',0,1,0,g);world.addSign(name,g,0,1.8,.05,.9);addRailDetail14(world,g);world.addGroup(g,x,z);}
}
function landmarkModel(world,b){return buildPublicLandmark14(world,b);}
function setTramDamage(post){setTramState14(post);}
function setDistrictMaterials(post){setTramDamage(post);if(world.preShadows)world.preShadows.visible=!post;for(const s of world.surfaces||[])s.mesh.material=post?s.post:s.pre;}

function districtShadows(world){const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#343c34',transparent:true,opacity:.13,depthWrite:false}),world.buildings.length),o=new THREE.Object3D();for(const [i,b] of world.buildings.entries()){o.position.set(b.position.x-1,.045,b.position.z+1.5);o.rotation.set(-Math.PI/2,0,0);o.scale.set(b.data.w+1.8,b.data.d+2.6,1);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);}mesh.userData.nonSolid=true;mesh.frustumCulled=false;scene.add(mesh);world.preShadows=mesh;}
