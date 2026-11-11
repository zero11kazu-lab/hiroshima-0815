// A static 12m spatial index supplies local fire/smoke queries. No all-zone scan each frame.
class HazardField {
 constructor(){this.active=false;this.fires=[];this.smokes=[];this.cells=new Map();this.queryCount=0;this.safeRoute=[];this.debris=[];this.root=null;}
 reset(){this.active=false;if(this.root)this.root.visible=false;if(this.finalCover)this.finalCover.visible=false;if(this.fireLight)this.fireLight.intensity=0;this.safeRoute=[];}
 indexZone(zone,kind,reach){for(let x=Math.floor((zone.center.x-reach)/12);x<=Math.floor((zone.center.x+reach)/12);x++)for(let z=Math.floor((zone.center.z-reach)/12);z<=Math.floor((zone.center.z+reach)/12);z++){const k=`${x},${z}`;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push({zone,kind});}}
 index(){this.cells.clear();for(const f of this.fires)this.indexZone(f,'fire',f.radius+9);for(const s of this.smokes)this.indexZone(s,'smoke',s.radius);for(const d of this.debris)this.indexZone(d,'debris',d.radius);}
 nearby(x,z){return this.cells.get(`${Math.floor(x/12)},${Math.floor(z/12)}`)||[];}
 blocked(x,z){if(!this.active)return false;return this.nearby(x,z).some(({zone,kind})=>kind==='fire'&&Math.hypot(x-zone.center.x,z-zone.center.z)<zone.coreRadius);}
 sample(x,z){let sum=0,smoke=0,contact=0,rubble=0;const ids=[];this.queryCount++;
  for(const {zone:f,kind} of this.nearby(x,z)){const d=Math.hypot(x-f.center.x,z-f.center.z);
   if(kind==='fire'){const fall=Math.max(0,1-d/(f.radius+9));sum+=f.heat*f.intensity*fall*fall;if(d<f.radius)contact=Math.max(contact,1-d/Math.max(.5,f.radius));if(d<f.radius+5)ids.push(f.id);}
   else if(kind==='smoke')smoke+=f.density*Math.max(0,1-d/f.radius);
   else if(d<f.radius)rubble=Math.max(rubble,1-d/f.radius);
  }
  return {heat:Math.min(100,110*(1-Math.exp(-sum/80))),smoke:Math.min(1,smoke),contact,rubble,zones:ids};
 }
 configure(preserveHazards=false){
  this.debugFireBackup=null;this.debugSmokeBackup=null;this.active=true;this.fires=FIRE_ZONE_TEMPLATES.map(t=>({...t,center:{...t.center},duration:-1,coreRadius:t.radius*(t.road ? .78 : .52)}));
  // Keep the newly conscious player and stationary citizens out of lethal flame cores.
  for(const f of this.fires){for(const p of [pos,...npcManager.people.map(n=>n.position)]){const d=Math.hypot(p.x-f.center.x,p.z-f.center.z);if(d<f.coreRadius+.8)f.coreRadius=Math.max(0,d-.8);}}
  for(const t of world.trees)if(t.state===POST_BLAST_TREE.BURNING)this.fires.push({id:'fire-'+t.id,center:{x:t.x,z:t.z},radius:1.2,coreRadius:.4,level:'SMALL',intensity:.6,heat:45,smoke:.35,duration:-1});
  // Localized fire beside the damaged tram; retain the existing street bypass.
  if(world.tram)this.fires.push({id:'fire-damaged-tram',center:{x:world.tram.position.x+.9,z:world.tram.position.z-.8},radius:.9,coreRadius:.25,level:'SMALL',intensity:.7,heat:50,smoke:.2,duration:-1});
  this.smokes=[...this.fires.map((f,i)=>({id:'smoke-'+f.id,center:{x:f.center.x+3,z:f.center.z-2},radius:f.radius+3,density:f.smoke,level:f.smoke>.8?'HEAVY':'MEDIUM'})),...SMOKE_ZONE_TEMPLATES.map(s=>({...s,center:{...s.center}}))];
  this.debris=[{id:'sharp-wood-west',center:{x:-14,z:-1},radius:1.5},{id:'sharp-wood-east',center:{x:14,z:14},radius:1.5}];this.index();
  const wife=npcManager.people.find(n=>n.id===PLAYER_PROFILE.spouseId);this.safeRoute=this.findRoute(pos,wife.position);
  // A deterministic fallback may reduce a minor fire, never the two major infernos.
  for(let i=this.fires.length-1;!preserveHazards&&!this.safeRoute.length&&i>=0;i--){const f=this.fires[i];if(f.level==='INFERNO')continue;this.fires.splice(i,1);this.smokes=this.smokes.filter(s=>s.id!=='smoke-'+f.id);this.index();this.safeRoute=this.findRoute(pos,wife.position);}
  this.buildVisuals();
 }
 // Add fire only where every already-validated mission route stays safe.
 addStreetFires(routes){
  const reserved=Object.values(routes).flat();if(!reserved.length)return;
  const sites=world.buildings.map((b,i)=>({x:b.position.x+(i%2?1:-1)*(b.data.w*.5+1.5),z:b.position.z+(i%3-1)*2}));let added=0;
  for(const p of sites){if(added>=18)break;if(waterAt(p.x,p.z))continue;if(Math.hypot(p.x-pos.x,p.z-pos.z)<9||this.fires.some(f=>Math.hypot(p.x-f.center.x,p.z-f.center.z)<3))continue;
   const f={id:'street-extra-'+added,center:p,radius:3.1+(added%3)*.3,coreRadius:1.5,level:added%4===0?'INFERNO':'LARGE',intensity:1,heat:105,smoke:.8,duration:-1};
   const smoke={id:'smoke-'+f.id,center:{x:p.x+2,z:p.z-1},radius:4.5,density:.8,level:'HEAVY'};
   if(reserved.some(q=>Math.hypot(q.x-smoke.center.x,q.z-smoke.center.z)<smoke.radius+1||Math.hypot(q.x-p.x,q.z-p.z)<f.radius+5))continue;
   this.fires.push(f);this.smokes.push(smoke);this.index();if(reserved.some(q=>{const s=this.sample(q.x,q.z);return s.heat>=48||s.smoke>=.12;})){this.fires.pop();this.smokes.pop();this.index();continue;}added++;
  }this.buildVisuals();
 }
 // The last area is hazardous, but each added fire must leave a low-smoke route.
 addFinalArea(start,target){
  const candidates=[[10,0],[12,3],[-10,0],[-12,-3],[0,10],[0,-10]];
  for(const [dx,dz] of candidates){if(this.fires.filter(f=>f.finalArea).length>=5)break;const f={id:'final-fire-'+this.fires.length,center:{x:target.x+dx,z:target.z+dz},radius:3.4,coreRadius:1.8,level:'LARGE',intensity:1.1,heat:110,smoke:.7,finalArea:true};
   if(Math.hypot(f.center.x-start.x,f.center.z-start.z)<9||waterAt(f.center.x,f.center.z)||f.center.x<WORLD_DATA.bounds.minX||f.center.x>WORLD_DATA.bounds.maxX||f.center.z<WORLD_DATA.bounds.minZ||f.center.z>WORLD_DATA.bounds.maxZ)continue;const smoke={id:'smoke-'+f.id,center:{x:f.center.x+2,z:f.center.z-1},radius:5,density:.7,level:'HEAVY'};this.fires.push(f);this.smokes.push(smoke);this.index();
   if(this.sample(target.x,target.z).heat>22||this.sample(target.x,target.z).smoke>.08||!this.findRoute(start,target).length){this.fires.pop();this.smokes.pop();this.index();}
  }this.buildVisuals();return this.findRoute(start,target);
 }
 addFinalCover(start,target){
  if(this.finalCover){scene.remove(this.finalCover);this.finalCover=null;}this.finalCover=new THREE.Group();scene.add(this.finalCover);
  const dx=start.x-target.x,dz=start.z-target.z,n=Math.hypot(dx,dz)||1,ux=dx/n,uz=dz/n;
  for(const [distance,side] of [[6,0],[8,4],[8,-4]]){const x=target.x+ux*distance-uz*side,z=target.z+uz*distance+ux*side;
   if(!worldAllowed(x,z)||Math.hypot(x-start.x,z-start.z)<3)continue;const wall={x,z,w:1.15,d:1.15};walls.push(wall);world.wallGrid.clear();world.indexWalls();npcManager.navigation.cache.clear();
   if(!this.findRoute(start,target).length){walls.pop();world.wallGrid.clear();world.indexWalls();npcManager.navigation.cache.clear();continue;}
   const g=new THREE.Group();g.position.set(x,0,z);this.finalCover.add(g);box(2.3,2.4,.22,'#4f4942',0,1.2,0,g);for(const side of [-1,1]){const post=box(.18,2.7,.18,'#36332d',side,1.35,0,g);post.rotation.z=side*.1;}const roof=box(2.5,.15,1,'#45413b',0,2.25,.1,g);roof.rotation.z=.18;world.mergeDetails(g);
  }cacheCameraObstacles();return this.findRoute(start,target);
 }
 findRoute(a,b,maxHeat=48){
  const step=2,key=p=>`${p.x},${p.z}`,nav=npcManager.navigation;
  const safe=p=>{if(!worldAllowed(p.x,p.z))return false;const s=this.sample(p.x,p.z);return s.heat<maxHeat&&s.smoke<.12;};
  let start=null;for(let r=0;r<=4&&!start;r++)for(let dx=-r;dx<=r&&!start;dx++)for(let dz=-r;dz<=r;dz++){const p={x:Math.round(a.x/step)*step+dx*step,z:Math.round(a.z/step)*step+dz*step};if(safe(p)&&nav.segmentClear(a,p)){start=p;break;}}
  if(!start)return [];const queue=[start],seen=new Map([[key(start),null]]);let head=0,goal=null;
  while(head<queue.length){const p=queue[head++];if(Math.hypot(p.x-b.x,p.z-b.z)<2.8&&nav.segmentClear(p,b)){goal=p;break;}
   for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){const q={x:p.x+dx,z:p.z+dz};if(seen.has(key(q))||!safe(q)||!nav.segmentClear(p,q))continue;let clear=true;for(let t=.25;t<1;t+=.25)if(!safe({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t})){clear=false;break;}if(!clear)continue;seen.set(key(q),p);queue.push(q);}}
  if(!goal)return [];const path=[{...b}];for(let p=goal;p;p=seen.get(key(p)))path.push({x:p.x,z:p.z});path.push({...a});return path.reverse();
 }
 buildVisuals(){
  if(!this.root){this.root=new THREE.Group();scene.add(this.root);const nonSolid={nonSolid:true};
   const canvas=document.createElement('canvas');canvas.width=96;canvas.height=192;const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,192,0,0);gradient.addColorStop(0,'#ff5b0b');gradient.addColorStop(.4,'#ffbe4a');gradient.addColorStop(.75,'#fff0ad');gradient.addColorStop(1,'#fff6d000');ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(18,192);ctx.bezierCurveTo(-6,140,28,128,27,93);ctx.bezierCurveTo(48,113,39,45,57,3);ctx.bezierCurveTo(49,62,87,100,73,127);ctx.bezierCurveTo(89,110,101,165,76,192);ctx.closePath();ctx.fill();
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const flameMaterial=color=>new THREE.MeshBasicMaterial({map:texture,color,fog:false,transparent:true,opacity:.92,alphaTest:.04,depthWrite:false,side:THREE.DoubleSide});
   this.flameA=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),flameMaterial('#ffd3a1'),400);
   this.flameB=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),flameMaterial('#fff4cc'),400);
   const sc=document.createElement('canvas');sc.width=sc.height=128;const sg=sc.getContext('2d'),gr=sg.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'#999993d9');gr.addColorStop(.4,'#86857db0');gr.addColorStop(1,'#77756b00');sg.fillStyle=gr;sg.fillRect(0,0,128,128);const st=new THREE.CanvasTexture(sc);this.smokeMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:st,color:'#64655f',transparent:true,opacity:.62,alphaTest:.015,depthWrite:false}),320);
   this.burnMarks=new THREE.InstancedMesh(new THREE.CircleGeometry(1,12),new THREE.MeshBasicMaterial({color:'#38322a',transparent:true,opacity:.65,depthWrite:false}),80);
   for(const m of [this.flameA,this.flameB,this.smokeMesh,this.burnMarks]){Object.assign(m.userData,nonSolid);m.frustumCulled=false;this.root.add(m);}this.obj=new THREE.Object3D();
   const rubble=new THREE.Group();for(const d of this.debris){for(let j=0;j<3;j++){const m=box(.16,.2,2,'#5e5548',d.center.x+(j-1)*.5,.15,d.center.z,rubble);m.rotation.y=j*.7;}}world.mergeDetails(rubble);this.root.add(rubble);
  }
  this.root.visible=true;if(!this.fireLight){this.fireLight=new THREE.PointLight('#ff6725',0,18,2);scene.add(this.fireLight);}this.animate(0);
 }
 animate(t){if(!this.root||!this.active)return;const o=this.obj;let at=0,sm=0,marks=0;
  for(const [i,f] of this.fires.entries()){
   const distance=Math.hypot(f.center.x-pos.x,f.center.z-pos.z);if(distance>world.visibleDistance+12)continue;const far=distance>36||world.quality>0;const height=f.level==='INFERNO'?11:f.level==='LARGE'?7:f.level==='SMALL'?2.5:4.6;
   for(let j=0;j<(far?2:5);j++){const a=j*2.4+i*.8,spread=j?f.radius*.5:0,scale=.85+.12*Math.sin(t*3+j+i);o.position.set(f.center.x+Math.cos(a)*spread,height*.44*scale,f.center.z+Math.sin(a)*spread);const facing=Math.atan2(camera.position.x-f.center.x,camera.position.z-f.center.z);o.rotation.set(0,facing,Math.sin(t*2+i+j)*.06);o.scale.set(f.radius*(far?1.7:.92),height*scale,1);o.updateMatrix();this.flameA.setMatrixAt(at,o.matrix);o.scale.x*=.48;o.scale.y*=.62;o.position.y-=height*.17;o.position.x+=Math.sin(facing)*.12;o.position.z+=Math.cos(facing)*.12;o.updateMatrix();this.flameB.setMatrixAt(at++,o.matrix);}
   for(let j=0;j<(far?1:3);j++){o.position.set(f.center.x+1+j*.65,height*.75+j*height*.42,f.center.z-1-j*.6);o.rotation.set(0,Math.atan2(camera.position.x-o.position.x,camera.position.z-o.position.z),0);o.scale.set(f.radius*2+j*.7,height*.95+j,1);o.updateMatrix();this.smokeMesh.setMatrixAt(sm++,o.matrix);}
   o.position.set(f.center.x,.1,f.center.z);o.rotation.set(-Math.PI/2,0,0);o.scale.set(f.radius,f.radius,1);o.updateMatrix();this.burnMarks.setMatrixAt(marks++,o.matrix);
  }
  for(const s of this.smokes){if(Math.hypot(s.center.x-pos.x,s.center.z-pos.z)>world.visibleDistance)continue;o.position.set(s.center.x,2.3,s.center.z);o.rotation.set(0,Math.atan2(camera.position.x-s.center.x,camera.position.z-s.center.z),0);o.scale.set(s.radius*2,4.6,1);o.updateMatrix();this.smokeMesh.setMatrixAt(sm++,o.matrix);}
  if(this.fireLight){const nearest=this.fires.reduce((a,f)=>!a||Math.hypot(f.center.x-pos.x,f.center.z-pos.z)<Math.hypot(a.center.x-pos.x,a.center.z-pos.z)?f:a,null);if(nearest){this.fireLight.position.set(nearest.center.x,2,nearest.center.z);this.fireLight.intensity=12+Math.sin(t*4)*1.5;}}
  this.flameA.count=this.flameB.count=at;this.smokeMesh.count=sm;this.burnMarks.count=marks;for(const m of [this.flameA,this.flameB,this.smokeMesh,this.burnMarks])m.instanceMatrix.needsUpdate=true;
 }
 snapshot(){return {fires:this.fires.map(f=>({...f,center:{...f.center}})),smokes:this.smokes.map(s=>({...s,center:{...s.center}})),safeRoute:this.safeRoute.map(p=>({...p})),queries:this.queryCount};}
}
const hazards=new HazardField();
