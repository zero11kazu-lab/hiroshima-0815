// Dedicated low-poly landmarks. All existing map records, actor systems and colliders remain authoritative.
const LANDMARK14=HISTORICAL_DATA.landmark_finish_v14;
const landmark14Cache=new Map();
function landmark14Parts(post=false){
 const tools=ruins14Tools(false);
 const part=(name,w,h,d,x,y,z,tile=3,fine=false,tint='#ffffff',rotation=[0,0,0],jagged=false)=>tools.part(name,w,h,d,x,y,z,tile,fine?1:0,rotation,tint,jagged);
 const finish=()=>[0,1].map(i=>building14Merge(tools.batches[i]));
 return {...tools,part,finish,post};
}
function attachLandmark14(group,geometry,post,names){
 const meshes=geometry.map((g,i)=>{const m=new THREE.Mesh(g,post?ruins14Material():building14Material());m.name=names+'-'+(i?'details':'shell');if(i)m.userData.cameraDecoration=true;group.add(m);return m;});group.userData.details=[meshes[1]];return meshes;
}
function publicGeometry14(b,post){
 const key=b.id+post;if(landmark14Cache.has(key))return landmark14Cache.get(key);
 const t=landmark14Parts(post),{part}=t,w=b.w,d=b.d,h=b.h,floors=b.id==='hiroden-senda'?2:3,storey=h/floors,stone=b.id==='hiroden-senda'?'#edbb9d':'#f0e4cc',wallTint=post?'#aaa08d':stone;
 part('foundation',w,.18,d,0,.09,0,3,false,post?'#9b9281':'#d8cfb9');
 // Recessed window rows, with real openings in the masonry strips.
 const windows=Math.max(3,Math.floor((w-1)/2)),spacing=(w-.9)/windows,opening=Math.min(.85,spacing*.58);
 for(const side of [-1,1])for(let row=0;row<floors;row++){
  const base=row*storey,lower=.70,windowHeight=Math.min(1.12,storey-1.00),upper=storey-lower-windowHeight,z=side*(d/2-.09);
  const entry=side===1&&row===0,strip=(name,x0,x1,height,y)=>{const add=(a,b)=>{if(b-a>.001)part(name,b-a,height,.18,(a+b)/2,y,z,3,false,wallTint);};if(entry){if(x0< -1.1)add(x0,Math.min(x1,-1.1));if(x1>1.1)add(Math.max(x0,1.1),x1);}else add(x0,x1);};
  strip('spandrel',-w/2,w/2,lower,base+lower/2);
  if(upper>.02)strip('head-band',-w/2,w/2,upper,base+lower+windowHeight+upper/2);
  let cursor=-w/2;
  for(let j=0;j<windows;j++){
   const x=-w/2+.45+spacing*(j+.5),left=x-opening/2,right=x+opening/2;
   strip('masonry-pier',cursor,left,windowHeight,base+lower+windowHeight/2);cursor=right;
   if(!(entry&&Math.abs(x)<1.1+opening/2))part('recessed-glass',opening,windowHeight,.024,x,base+lower+windowHeight/2,side*(d/2-.15),post?6:4,false,post?'#515a50':'#647d7c');
   if(!(entry&&Math.abs(x)<1.1+opening/2)&&(!post||(j+row)%3!==1)){part('window-sill',opening+.12,.07,.17,x,base+lower-.015,side*(d/2-.005),3,true,post?'#827968':'#d9cdb3');part('window-mullion',.035,windowHeight,.04,x,base+lower+windowHeight/2,side*(d/2-.10),0,true,post?'#746856':'#baae98');}
   if(post&&(j+row)%3===0)part('broken-infill',opening*.28,windowHeight*.33,.04,x-opening*.25,base+lower+windowHeight*.18,side*(d/2-.11),1,true,'#857c69',[0,0,.12],true);
  }
  strip('edge-pier',cursor,w/2,windowHeight,base+lower+windowHeight/2);
 }
 for(const side of [-1,1])for(let row=0;row<floors;row++){
  const base=row*storey,lower=.70,wh=Math.min(1.12,storey-1),upper=storey-lower-wh,number=Math.max(2,Math.floor((d-.8)/2)),step=(d-.8)/number,opening=.70,x=side*(w/2-.09);
  part('side-spandrel',.18,lower,d-.18,x,base+lower/2,0,3,false,wallTint);part('side-head',.18,upper,d-.18,x,base+lower+wh+upper/2,0,3,false,wallTint);
  let cursor=-d/2+.09;
  for(let j=0;j<number;j++){const z=-d/2+.4+step*(j+.5),left=z-opening/2,right=z+opening/2;part('side-pier',.18,wh,left-cursor,x,base+lower+wh/2,(left+cursor)/2,3,false,wallTint);cursor=right;
   if(!post||j%3!==1)part('side-glass',.024,wh,opening,side*(w/2-.15),base+lower+wh/2,z,post?6:4,false,post?'#515a50':'#647d7c');
   part('side-sill',.17,.07,opening+.1,side*(w/2-.005),base+lower-.015,z,3,true,post?'#857a68':'#d9cdb3');
  }
  part('side-edge',.18,wh,d/2-.09-cursor,x,base+lower+wh/2,(d/2-.09+cursor)/2,3,false,wallTint);
 }
 for(let row=1;row<floors;row++)part('floor-cornice',w+.12,.10,d+.12,0,row*storey,0,3,false,post?'#877e6c':'#c8bea7');
 part('roof-coping',w+.4,.18,d+.4,0,h+.09,0,3,false,post?'#8c8374':'#d4c9b1');
 // Entry elements stay inside the old collider margin, rather than growing into the street.
 part('entry-recess',2.20,2.05,.035,0,1.09,d/2-.11,6,false,post?'#695e4c':'#978b72');
 part('door-head',2.2,.10,.18,0,2.116,d/2-.09,3,false,wallTint);
 part('entrance-lintel',3.0,.18,.44,0,2.28,d/2-.02,3,false,wallTint);
 for(const x of [-1.22,1.22])part('entry-column',.22,2.15,.22,x,1.075,d/2+.06,3,false,wallTint);
 part('entry-step',3.05,.10,.30,0,.05,d/2+.06,3,true,post?'#958b79':'#c6baa0');
 if(b.id==='cityhall'){
  part('raised-core',3.4,2.10,3.0,0,h+1.05,0,3,false,wallTint);
  part('raised-coping',3.7,.20,3.3,0,h+2.20,0,3,false,post?'#857b69':'#b4aa92');
  for(const x of [-.95,0,.95])part('upper-recess',.46,.80,.035,x,h+1.10,1.52,post?6:4,true,post?'#554e40':'#647d7c');
 }else if(b.id==='bunrika'){
  part('entry-riser',3.6,.45,1.0,0,h+.225,d/2-.50,3,false,wallTint);
  part('entry-cap',3.9,.25,1.1,0,h+.575,d/2-.50,3,false,post?'#8e8370':'#d1c4a9');
 }else{
  part('industrial-cap',w+.5,.145,d+.6,0,h+.2525,0,2,false,post?'#918876':'#9c9b8b');
  for(const x of [-w*.30,w*.30])part('loading-door',2.2,2.5,.045,x,1.25,d/2+.035,0,false,post?'#75624d':'#a5987b');
 }
 if(post){
  for(let i=0;i<6;i++)part('spalled-masonry',.32,.22,.13,-w*.40+i*w*.15,.11,d/2-.05,1,true,'#aaa08a',[0,i*.2,0],true);
  part('scorched-plaque',Math.min(w*.65,5),.42,.05,0,2.90,d/2+.13,0,true,'#74624a');
 }
 const result=t.finish();landmark14Cache.set(key,result);return result;
}
function buildPublicLandmark14(world,b,post=false,group=null){
 const g=group||new THREE.Group();if(!group){g.position.set(b.x,0,b.z);g.userData.preBlast=true;}
 attachLandmark14(g,publicGeometry14(b,post),post,b.id+'-landmark14');g.userData.landmark14={id:b.id,post,confidence:LANDMARK14.confidence,sourceIds:b.sourceIds};
 if(!post){world.addSign(b.name,g,0,2.90,b.d/2+.18,Math.min(b.w*.65,5));const plaque=g.children.at(-1);plaque.userData.cameraDecoration=true;g.userData.details.push(plaque);world.addGroup(g,b.x,b.z);world.buildings.push({id:b.id,position:{x:b.x,z:b.z},rotation:0,data:b,preBlastModel:g,postBlastModel:null,damageState:'INTACT',distanceFromHypocenter:b.historicalDistanceMetres});block(b.x,b.z,b.w,b.d);walls[walls.length-1].buildingId=b.id;}
 return g;
}
function tramGeometry14(post){
 const key='tram'+post;if(landmark14Cache.has(key))return landmark14Cache.get(key);const t=landmark14Parts(post),{part}=t,paint=post?'#8e8a76':'#729a79',cream=post?'#a59b82':'#eee4c8';
 // Chamfered end corners replace the old rectangular box silhouette.
 const shape=new THREE.Shape(),outline=[[-.66,-2.70],[.66,-2.70],[.84,-2.48],[.84,2.48],[.66,2.70],[-.66,2.70],[-.84,2.48],[-.84,-2.48]];outline.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();
 const body=new THREE.ExtrudeGeometry(shape,{depth:.86,bevelEnabled:false,steps:1});body.rotateX(Math.PI/2);body.translate(0,1.57,0);const bp=body.attributes.position,bn=body.attributes.normal,bu=body.attributes.uv;for(let i=0;i<bp.count;i++){const nx=Math.abs(bn.getX(i)),ny=Math.abs(bn.getY(i));bu.setXY(i,ny>.5?(bp.getX(i)+.84)/1.68:nx>.5?(bp.getZ(i)+2.70)/5.40:(bp.getX(i)+.84)/1.68,ny>.5?(bp.getZ(i)+2.70)/5.40:(bp.getY(i)-.71)/.86);}t.add(body,1,paint,0);
 part('chassis',1.62,.16,5.35,0,.65,0,6,false,post?'#625c4c':'#a3a497');
 for(const side of [-1,1]){
  part('waist-rail',.085,.13,5.02,side*.84,1.59,0,4,false,cream);part('top-rail',.09,.11,5.08,side*.84,2.40,0,4,false,cream);
  for(let i=0;i<6;i++){
   const z=(i-2.5)*.77;
   if(!post||i%3!==1)part('side-window',.028,.61,.63,side*.835,2.0,z,post?6:4,false,post?'#515d58':'#657e80');
   part('window-post',.10,.75,.055,side*.85,2.0,z+.35,4,true,cream);
   if(i===0||i===5)part('door-panel',.035,.78,.43,side*.86,1.18,z,0,true,post?'#74614d':'#b8a58a');
  }
  for(const z of [-1.65,1.65]){const g=new THREE.CylinderGeometry(.26,.26,.12,10);g.rotateZ(Math.PI/2);g.translate(side*.76,.52,z);t.add(g,6,post?'#6e6b5b':'#7c8079',0);part('axle-box',.13,.15,.30,side*.77,.52,z,6,true,post?'#756d5b':'#a5a69a');}
 }
 for(const end of [-1,1]){
  for(const x of [-.31,.31])if(!post||x<0)part('front-window',.53,.54,.028,x,2.0,end*2.66,post?6:4,false,post?'#515d58':'#657e80');
  for(const x of [-.62,0,.62])part('front-pillar',.055,.75,.09,x,2.0,end*2.67,4,true,cream);
  part('destination-board',.58,.17,.055,0,2.36,end*2.69,0,true,post?'#78634c':'#c6baa0');part('end-bumper',1.30,.13,.13,0,.77,end*2.73,6,false,post?'#675f50':'#a5a89c');
  const lamp=new THREE.CylinderGeometry(.075,.075,.04,8);lamp.rotateX(Math.PI/2);lamp.translate(0,1.30,end*2.73);t.add(lamp,4,post?'#8c8068':'#e3d7ae',1);
 }
 // Closed shallow vault: the old top-only panels vanished from below/at the ends.
 // Keep the original upper outline and post-blast missing band; close each exposed edge.
 const xs=[-.975,-.79,-.43,0,.43,.79,.975],ys=[2.51,2.65,2.75,2.78,2.75,2.65,2.51],base=2.45,roofTint=post?'#928977':'#8b938d',present=i=>i>=0&&i<6&&!(post&&i===4);
 for(let i=0;i<6;i++){
  if(!present(i))continue;const left=xs[i],right=xs[i+1],a=ys[i],b=ys[i+1],panel=points=>t.panel(points,4,0,roofTint);
  panel([[left,a,2.95],[right,b,2.95],[right,b,-2.95],[left,a,-2.95]]);
  panel([[left,base,2.95],[left,base,-2.95],[right,base,-2.95],[right,base,2.95]]);
  for(const end of [-1,1]){const p=[[left,base,end*2.95],[right,base,end*2.95],[right,b,end*2.95],[left,a,end*2.95]];panel(end===1?p:p.reverse());}
  if(!present(i-1))panel([[left,base,2.95],[left,a,2.95],[left,a,-2.95],[left,base,-2.95]]);
  if(!present(i+1))panel([[right,base,2.95],[right,base,-2.95],[right,b,-2.95],[right,b,2.95]]);
 }
 const result=t.finish();landmark14Cache.set(key,result);return result;
}
function buildTram14(world){
 const g=new THREE.Group();g.position.set(1.2,TRAM_TRACK14.railTop-.26,-55);g.userData.preBlast=true;g.userData.tram=true;g.userData.finish14=true;g.userData.damageState='INTACT';g.userData.confidence=LANDMARK14.confidence;
 g.tramMeshes=attachLandmark14(g,tramGeometry14(false),false,'tram14');
 const points=(post)=>new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,2.76,-.45),new THREE.Vector3(post?.35:0,(post?3.60:5.60)-g.position.y,post?-.20:.10)]),pole=new THREE.Line(points(false),new THREE.LineBasicMaterial({color:'#4c5048'}));pole.userData.nonSolid=true;g.add(pole);g.pole14=pole;g.poleGeometry14=[pole.geometry,points(true)];
 world.tram=g;world.addGroup(g,1.2,-55);block(1.2,-55,1.9,5.8);walls[walls.length-1].tram=true;return g;
}
function setTramState14(post){
 if(world.tramTrack14)world.tramTrack14.material=tramTrackMaterial14(post);
 const tram=world.tram;if(!tram)return;const geometry=tramGeometry14(post);for(let i=0;i<2;i++){tram.tramMeshes[i].geometry=geometry[i];tram.tramMeshes[i].material=post?ruins14Material():building14Material();}tram.pole14.geometry=tram.poleGeometry14[post?1:0];tram.userData.damageState=post?'DAMAGED':'INTACT';
 for(const r of world.railDetails14||[]){r.mesh.geometry=post?r.post:r.pre;r.mesh.material=post?ruins14Material():building14Material();if(r.label)r.label.material.color.set(post?'#9a9181':'#ffffff');}
}
function addRailDetail14(world,group,bridge=null){
 world.railDetails14=world.railDetails14||[];const make=post=>{const t=landmark14Parts(post),{part}=t;if(bridge){for(const x of [-bridge.w/2+.3,bridge.w/2-.3])for(const side of [-1,1]){part('pier-cap',.34,.12,.28,x,1.08,side*bridge.d/2,3,false,post?'#8c8170':'#d6ccb6',[0,0,0],post);part('cap-joint',.28,.035,.29,x,.99,side*bridge.d/2,3,false,post?'#827766':'#ada38d');}}else{part('stop-board',.96,.60,.045,0,1.8,0,4,false,post?'#9b8c72':'#dfd7bd',[0,0,0],post);part('stop-base',.16,.10,.16,0,.05,0,3,false,post?'#807665':'#beb49c');}return building14Merge(t.batches[0]);};
 const pre=make(false),post=make(true),mesh=new THREE.Mesh(pre,building14Material());mesh.userData.cameraDecoration=true;mesh.userData.nonSolid=true;group.add(mesh);group.userData.details=[mesh];world.railDetails14.push({mesh,pre,post,label:bridge?null:group.children.find(m=>m.isMesh&&m.geometry.type==='PlaneGeometry')});
}

// Cosmetic embedded tracks; wheel centres define the staged scale, not a surveyed route.
const TRAM_TRACK14={centres:[-1.2,1.2],wheelHalfGauge:.76,headWidth:.085,railTop:.040,grooveTop:.026,base:.017,turnRadius:5,turnSteps:16};
function tramTrackMaterial14(post){const key='track-material-'+post;if(!landmark14Cache.has(key))landmark14Cache.set(key,new THREE.MeshLambertMaterial({vertexColors:true,color:post?'#82786a':'#ffffff'}));return landmark14Cache.get(key);}
function buildTramTrack14(world){
 const c=TRAM_TRACK14,roads=world.data.roads.filter(r=>r.tram),vertical=roads.filter(r=>r.d>r.w),horizontal=[],paths=[],positions=[],colors=[],covered=new Map();
 // Join the east approach to the existing east/west row, without duplicate rail pairs.
 for(const r of roads.filter(r=>r.w>=r.d).sort((a,b)=>(a.z-b.z)||((a.x-a.w/2)-(b.x-b.w/2)))){const last=horizontal.at(-1),start=r.x-r.w/2,end=r.x+r.w/2;if(last&&last.z===r.z&&start<=last.x+last.w/2+.001){const left=last.x-last.w/2,right=Math.max(last.x+last.w/2,end);last.x=(left+right)/2;last.w=right-left;}else horizontal.push({...r});}
 // Coalesce touching straight road records so the V1.1 boundary has no duplicate rail ends.
 const columns=new Map();for(const r of vertical){if(!columns.has(r.x))columns.set(r.x,[]);columns.get(r.x).push([Math.max(r.z-r.d/2,r.tramStartZ??-Infinity),(r.tramEndZ??r.z+r.d/2)]);}
 for(const [x,intervals]of columns){intervals.sort((a,b)=>a[0]-b[0]);const merged=[];for(const span of intervals){const last=merged.at(-1);if(last&&span[0]<=last[1]+.001)last[1]=Math.max(last[1],span[1]);else merged.push([...span]);}for(const [a,b]of merged)for(const centre of c.centres)for(const side of [-1,1])paths.push({axis:'z',centre,side,points:[[x+centre+side*c.wheelHalfGauge,a],[x+centre+side*c.wheelHalfGauge,b]]});}
 for(const r of horizontal){
  const start=r.x-r.w/2,end=r.x+r.w/2,join=vertical.find(v=>Math.abs(start-v.x)<.001&&r.z-c.turnRadius>=v.z-v.d/2&&r.z<=v.z+v.d/2);
  for(const centre of c.centres)for(const side of [-1,1]){
   const points=[];if(join){const radius=c.turnRadius-centre-side*c.wheelHalfGauge;for(let i=0;i<=c.turnSteps;i++){const t=i*Math.PI/2/c.turnSteps;points.push([start+c.turnRadius-radius*Math.cos(t),r.z-c.turnRadius+radius*Math.sin(t)]);}points.push([end,r.z-centre-side*c.wheelHalfGauge]);}
   else points.push([start,r.z+centre+side*c.wheelHalfGauge],[end,r.z+centre+side*c.wheelHalfGauge]);
   const outgoing=vertical.find(v=>v.tramStartZ===r.z+c.turnRadius&&Math.abs(end-v.x)<.001);
   if(outgoing){points.pop();const cx=outgoing.x-c.turnRadius,cz=r.z+c.turnRadius,radius=c.turnRadius+centre+side*c.wheelHalfGauge;points.push([cx,r.z-centre-side*c.wheelHalfGauge]);for(let i=1;i<=c.turnSteps;i++){const a=-Math.PI/2+i*Math.PI/2/c.turnSteps;points.push([cx+radius*Math.cos(a),cz+radius*Math.sin(a)]);}}
   paths.push({axis:'x',centre,side,points});
  }
 }
 // Split the straight spans at bridge edges and approach grade changes.
 for(const path of paths)if(path.axis==='x'){
  const split=[path.points[0]];for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],cuts=[];
   if(Math.abs(a[1]-b[1])<1e-8&&b[0]>a[0])for(const bridge of GEO1945.bridges.filter(b=>b.tram))for(const x of [bridge.x-bridge.w/2-.5,bridge.x-bridge.w/2,bridge.x+bridge.w/2,bridge.x+bridge.w/2+.5,bridge.x+bridge.w/2+8])if(x>a[0]+1e-7&&x<b[0]-1e-7)cuts.push([x,b[1]]);
   cuts.sort((a,b)=>a[0]-b[0]);split.push(...cuts,b);
  }path.points=split;
 }
 const lift=(x,z)=>{let y=eastApproachLift14(x,z);for(const b of GEO1945.bridges.filter(b=>b.tram))if(Math.abs(z-b.z)<b.d/2)y=Math.max(y,.225*Math.max(0,Math.min(1,(b.w/2+.5-Math.abs(x-b.x))/.5)));return y;};
 const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 const half=(poly,a,b,sign,inside)=>{const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=cross(a,b,p)*sign,dq=cross(a,b,q)*sign,ip=inside?dp>=-1e-9:dp<=1e-9,iq=inside?dq>=-1e-9:dq<=1e-9;if(ip)out.push(p);if(ip!==iq){const t=dp/(dp-dq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}return out;};
 const subtract=(poly,clip)=>{const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))],a=bounds(poly),b=bounds(clip);if(a[1]<=b[0]+1e-9||b[1]<=a[0]+1e-9||a[3]<=b[2]+1e-9||b[3]<=a[2]+1e-9)return [poly];let rest=poly;const out=[],area=clip.reduce((n,p,i)=>n+p[0]*clip[(i+1)%clip.length][1]-p[1]*clip[(i+1)%clip.length][0],0),sign=area>=0?1:-1;for(let i=0;i<clip.length&&rest.length>=3;i++){const a=clip[i],b=clip[(i+1)%clip.length],outside=half(rest,a,b,sign,false);if(outside.length>=3)out.push(outside);rest=half(rest,a,b,sign,true);}return out;};
 const triangle=(a,b,d,color)=>{for(const p of [a,b,d])positions.push(p[0],p[1]+lift(p[0],p[2]),p[2]);for(let i=0;i<3;i++)colors.push(color.r,color.g,color.b);};
 const metal=new THREE.Color('#77796d'),groove=new THREE.Color('#34372f'),edge=new THREE.Color('#5c6055');
 const top=(poly,y,color)=>{const prior=covered.get(y)||[];let pieces=[poly];for(const clip of prior){pieces=pieces.flatMap(p=>subtract(p,clip));if(!pieces.length)break;}prior.push(poly);covered.set(y,prior);for(const p of pieces){const area=p.reduce((n,v,i)=>n+v[0]*p[(i+1)%p.length][1]-v[1]*p[(i+1)%p.length][0],0);if(Math.abs(area)<1e-10)continue;if(area>0)p.reverse();for(let i=1;i<p.length-1;i++)triangle([p[0][0],y,p[0][1]],[p[i][0],y,p[i][1]],[p[i+1][0],y,p[i+1][1]],color);}};
 const wall=(a,b,high,low)=>{triangle([a[0],low,a[1]],[b[0],low,b[1]],[b[0],high,b[1]],edge);triangle([a[0],low,a[1]],[b[0],high,b[1]],[a[0],high,a[1]],edge);};
 for(const path of paths){const points=path.points,normals=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);return [-dz/length,dx/length];}),offset=(i,d)=>[points[i][0]+normals[i][0]*d,points[i][1]+normals[i][1]*d],grooveCentre=path.side*.022,lo=grooveCentre-.008,hi=grooveCentre+.008,w=c.headWidth/2;
  for(let i=0;i<points.length-1;i++){
   for(const [a,b,y,color]of [[-w,lo,c.railTop,metal],[lo,hi,c.grooveTop,groove],[hi,w,c.railTop,metal]])top([offset(i,a),offset(i+1,a),offset(i+1,b),offset(i,b)],y,color);
   wall(offset(i+1,-w),offset(i,-w),c.railTop,c.base);wall(offset(i,w),offset(i+1,w),c.railTop,c.base);
   wall(offset(i,lo),offset(i+1,lo),c.railTop,c.grooveTop);wall(offset(i+1,hi),offset(i,hi),c.railTop,c.grooveTop);
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,tramTrackMaterial14(false));mesh.name='tram-rails';mesh.userData.nonSolid=true;mesh.userData.cameraDecoration=true;mesh.userData.trackPaths=paths;mesh.userData.confidence='gameplay_adjusted';world.scene.add(mesh);world.tramTrack14=mesh;
}

// Limited corridor corrections. Keep source history/map data immutable and use the same
// corrected records for both normal geometry and its aftermath/collision variants.
function prepareTrackSpace14(world){
 if(world.trackSpace14)return;
 const edits={cityhall:{x:-13.5,z:-56.61107441745099},'block-34':{x:11.072996771088706,z:43.39431904221777}},source=world.data;
 world.trackSpace14={margin:.65,moved:[],conflicts:[]};
 const buildings=source.buildings.map(b=>{const p=edits[b.id];if(!p)return b;world.trackSpace14.moved.push({type:'building',id:b.id,from:{x:b.x,z:b.z},to:p});return {...b,...p,corridor14Original:{x:b.x,z:b.z}};});
 const gardens=source.gardens.map(g=>{if(g.x!==20||g.z!==38)return g;const p={x:20,z:44};world.trackSpace14.moved.push({type:'garden-with-laundry-and-three-fences',from:{x:g.x,z:g.z},to:p});return {...g,...p};});
 const poles=source.poles.map(p=>{if(p[0]!==5.9||p[1]!==37)return p;world.trackSpace14.moved.push({type:'pole',from:{x:p[0],z:p[1]},to:{x:5.9,z:35}});return [5.9,35];});
 const end=GEO1945.bounds.maxZ+86,roads=source.roads.map(r=>r.id==='v11-south-main'?{...r,w:10,tram:true,corridor14:true}:r.id==='v11-east-approach'?{...r,tram:true,corridor14:true}:r.id==='v11-east-main'?{...r,tram:true,tramStartZ:source.roads.find(q=>q.id==='v11-east-approach').z+TRAM_TRACK14.turnRadius,tramEndZ:GEO1945.bounds.maxZ,corridor14:true}:r);
 roads.push({id:'v14-south-track-backdrop',name:'南側軌道の遠景接続（創作補完）',x:0,z:(GEO1945.bounds.maxZ+end)/2,w:10,d:end-GEO1945.bounds.maxZ,tram:true,decorative:true,confidence:'gameplay_adjusted'});
 world.data={...source,buildings,gardens,poles,roads};world.trackSpace14.south={start:50,playableEnd:GEO1945.bounds.maxZ,sceneryEnd:end,width:10};
}
function addSouthTrackBackdrop14(world,material){
 const s=world.trackSpace14.south,ground=texturedPlane(26,s.sceneryEnd-s.playableEnd,material,0,(s.sceneryEnd+s.playableEnd)/2,5);ground.position.y=-.015;ground.name='south-track-shoulders14';ground.userData.nonSolid=true;world.surfaces.push({mesh:ground,pre:material,post:surface('char','#78756c')});
}
function trackSpaceIntersects14(world,bounds){
 const m=world.trackSpace14.margin;
 return world.tramTrack14.userData.trackPaths.some(path=>path.points.some((b,i)=>{
  if(!i)return false;const a=path.points[i-1];let near=0,far=1;
  for(const [axis,index]of [['x',0],['z',1]]){const min=bounds.min[axis]-m,max=bounds.max[axis]+m,d=b[index]-a[index];if(Math.abs(d)<1e-9){if(a[index]<min||a[index]>max)return false;continue;}let p=(min-a[index])/d,q=(max-a[index])/d;if(p>q)[p,q]=[q,p];near=Math.max(near,p);far=Math.min(far,q);if(near>far)return false;}return true;
 }));
}
function auditTrackSpace14(world){
 world.scene.updateMatrixWorld(true);const conflicts=[],check=(type,id,group)=>{if(trackSpaceIntersects14(world,new THREE.Box3().setFromObject(group)))conflicts.push({type,id});};
 for(const b of world.buildings)check('building',b.id,b.preBlastModel);
 for(const [i,r]of world.domesticProps.entries())check(r.type,i,r.preModel);
 for(const [i,p]of world.data.poles.entries()){const group=world.groups.find(g=>g.x===p[0]&&g.z===p[1]&&!g.group.userData.preBlast&&!g.group.userData.preTree);if(group)check('pole',i,group.group);}
 for(const [i,p]of world.finishProps.entries())check('street-prop',i,p.pre);
 for(const t of world.trees){const trunk=new THREE.Box3(new THREE.Vector3(t.x-.16,0,t.z-.16),new THREE.Vector3(t.x+.16,2.8,t.z+.16));if(trackSpaceIntersects14(world,trunk))conflicts.push({type:'tree-trunk',id:t.id});}
 world.trackSpace14.conflicts=conflicts;return conflicts;
}

// Only the existing east bridge approach is graded. No extra street or crossing is added.
function eastApproachLift14(x,z){const b=GEO1945.bridges.find(b=>b.id==='miyuki'),edge=b.x+b.w/2;return x>=edge&&x<=edge+8&&Math.abs(z-b.z)<=b.d/2+.001?.225*(1-(x-edge)/8):0;}
function bridgePavement14(world,b,group){
 const road=world.data.roads.find(r=>r.id==='tram-miyuki'),material=surface('gravel','#d0c7ad'),deck=texturedBox(b.w,.28,b.d,material,0,.1,0,group);deck.geometry=deck.geometry.clone();const p=deck.geometry.attributes.position,uv=deck.geometry.attributes.uv;
 for(let i=0;i<p.count;i++){const x=b.x+p.getX(i)*b.w,z=b.z+p.getZ(i)*b.d;uv.setXY(i,(x-(road.x-road.w/2))/3,(road.z+road.d/2-z)/3);}deck.userData.keepSeparate=true;deck.name='miyuki-pavement14';world.surfaces.push({mesh:deck,pre:material,post:surface('char','#8b8476')});return deck;
}
