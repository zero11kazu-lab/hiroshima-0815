// CameraController — 試作03の追従・干渉回避を維持。
// Cached world bounds include eaves, foliage and bridge rails, independently of movement colliders.
// A draw-call batch can contain disconnected objects on opposite sides of a passage.
// Cache connected surface bounds, not the empty space enclosed by the batch's outer box.
const cameraGeometryParts=new WeakMap();
function cameraPartBounds(geometry){
 if(cameraGeometryParts.has(geometry))return cameraGeometryParts.get(geometry);
 const positions=geometry.attributes.position,index=geometry.index,count=positions.count;
 const parents=new Int32Array(count),vertices=new Map();
 function root(i){while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;}
 function join(a,b){parents[root(a)]=root(b);}
 for(let i=0;i<count;i++){
  parents[i]=i;
  // Weld UV/normal seams only for this collision cache; render geometry stays untouched.
  const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*100000)).join(',');
  if(vertices.has(key))join(i,vertices.get(key));else vertices.set(key,i);
 }
 const n=index?index.count:count;
 for(let i=0;i<n;i+=3){const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;join(a,b);join(b,c);}
 const parts=new Map(),point=new THREE.Vector3();
 for(let i=0;i<count;i++){const key=root(i);if(!parts.has(key))parts.set(key,new THREE.Box3());parts.get(key).expandByPoint(point.fromBufferAttribute(positions,i));}
 const result=[...parts.values()];cameraGeometryParts.set(geometry,result);return result;
}
function cacheCameraObstacles(){
 for(const o of cameraObstacles)if(o.faded)fadeObstacle(o,false);cameraObstacles.length=0;scene.updateMatrixWorld(true);
 scene.traverse(mesh=>{
  if(!mesh.isMesh || mesh.userData.nonSolid || mesh.userData.dynamic || player.getObjectById(mesh.id))return;
  for(let p=mesh;p;p=p.parent)if(!p.visible)return;
  const bounds=new THREE.Box3().setFromObject(mesh);
  if(bounds.max.y<.3)return;
  const solids=cameraPartBounds(mesh.geometry).map(b=>b.clone().applyMatrix4(mesh.matrixWorld)).filter(b=>b.max.y>=.3).map(b=>b.expandByScalar(cameraRadius));
  cameraObstacles.push({mesh,bounds,solid:bounds.clone().expandByScalar(cameraRadius),solids,faded:false});
 });
}
// Slab intersection also detects a camera endpoint inside a wall (surface rays alone can miss it).
function segmentEntry(origin,direction,length,bounds){
 let near=0,far=length;
 for(const axis of ['x','y','z']){
  const d=direction[axis],o=origin[axis];
  if(Math.abs(d)<1e-7){if(o<bounds.min[axis]||o>bounds.max[axis])return Infinity;continue;}
  let a=(bounds.min[axis]-o)/d,b=(bounds.max[axis]-o)/d;
  if(a>b){const swap=a;a=b;b=swap;}
  near=Math.max(near,a);far=Math.min(far,b);
  if(near>far)return Infinity;
 }
 return near;
}
function fadeObstacle(o,fade){
 if(o.faded===fade)return;
 // Materials are shared by the town: clone only the affected mesh's material.
 if(!o.privateMaterial){o.mesh.material=o.mesh.material.clone();o.privateMaterial=true;}
 o.mesh.material.transparent=fade;o.mesh.material.opacity=fade?.18:1;
 o.mesh.material.depthWrite=!fade;o.mesh.material.needsUpdate=true;o.faded=fade;
}
let cameraCandidates=cameraObstacles;
function cameraLimit(origin,direction,length,applyFade=true){
 let limit=length;
 for(const o of cameraCandidates){
  let entry=Infinity;
  for(const solid of o.nearSolids||o.solids)entry=Math.min(entry,segmentEntry(origin,direction,length,solid));
  // Foliage/eaves can overlap the player's pivot despite an unobstructed walking surface.
  // Fade this exceptional occluder rather than placing the camera inside it.
  const overlaps=entry===0;
  const soft=(softenFoliage&&o.mesh.userData.cameraFoliage&&Number.isFinite(entry))||(o.mesh.userData.cameraDecoration&&entry<1.5);
  if(applyFade)fadeObstacle(o,overlaps||soft);
  if(!overlaps&&!soft&&Number.isFinite(entry))limit=Math.min(limit,Math.max(.08,entry-.06));
 }
 return limit;
}
const cameraViewportSize=new THREE.Vector2();
function syncCameraViewport(){resize();}

function updateCamera(dt,moving){
 syncCameraViewport();
 // Use the displayed actor's world position, including a temporarily divergent transform.
 player.getWorldPosition(camTarget);camTarget.y+=1.07;
 const focusX=camTarget.x,focusZ=camTarget.z,groundY=camTarget.y-1.15;
 // Broad phase only; the proven slab tests and camera responses remain unchanged.
 const reach=normalCameraDistance+cameraRadius;
 cameraCandidates=cameraObstacles.filter(o=>o.solid.min.x<=focusX+reach&&o.solid.max.x>=focusX-reach&&o.solid.min.z<=focusZ+reach&&o.solid.max.z>=focusZ-reach);
 for(const o of cameraCandidates)o.nearSolids=o.solids.filter(b=>b.min.x<=focusX+reach&&b.max.x>=focusX-reach&&b.min.z<=focusZ+reach&&b.max.z>=focusZ-reach);
 for(const o of cameraObstacles)if(o.faded&&!cameraCandidates.includes(o))fadeObstacle(o,false);
 if(moving&&look.id===null&&performance.now()/1000>look.manualUntil){const d=angleDelta(yaw,cameraYaw);cameraYaw+=THREE.MathUtils.clamp(d*(1-Math.exp(-2.4*dt)),-1.4*dt,1.4*dt);}
 cameraYaw=angleDelta(cameraYaw,0);
 const basePitch=Math.atan2(2.35,5.6);
 let wantedPitch=basePitch,avoidAngle=0;
 softenFoliage=false;
 function directionAt(pitch){return cameraDirection.set(Math.sin(cameraYaw+avoidAngle)*Math.cos(pitch),Math.sin(pitch),Math.cos(cameraYaw+avoidAngle)*Math.cos(pitch));}
 function choosePitch(){
  let best=cameraLimit(camTarget,directionAt(basePitch),normalCameraDistance,false);
  wantedPitch=basePitch;
  if(best<2.4){
   for(let pitch=basePitch+.12;pitch<=1.50;pitch+=.12){
    const candidate=cameraLimit(camTarget,directionAt(pitch),normalCameraDistance,false);
    if(candidate>best){best=candidate;wantedPitch=pitch;}
    if(candidate>=2.4)break;
   }
  }
  return best;
 }
 let best=choosePitch();
 // Dense crowns may surround every elevated view. Soften foliage only in this case;
 // solid trunks and buildings continue to constrain the camera.
 if(best<1.8){softenFoliage=true;best=choosePitch();}
 // Beneath an eave, vertical retraction alone can reach the character's head.
 // Move the boom sideways toward an open view instead of clipping the player.
 let wantedAvoid=0;
 if(best<1.8){
  let bestAngle=0,bestPitch=wantedPitch;
  for(const offset of [Math.PI/6,-Math.PI/6,Math.PI/3,-Math.PI/3,Math.PI/2,-Math.PI/2,Math.PI*2/3,-Math.PI*2/3,Math.PI]){
   avoidAngle=offset;const candidate=choosePitch();
   if(candidate>best){best=candidate;bestAngle=offset;bestPitch=wantedPitch;}
   if(candidate>=2.4)break;
  }
  wantedAvoid=bestAngle;wantedPitch=bestPitch;
 }
 const easedAvoid=cameraAvoidYaw+angleDelta(wantedAvoid,cameraAvoidYaw)*(1-Math.exp(-4*dt));
 avoidAngle=easedAvoid;
 const transitional=cameraLimit(camTarget,directionAt(wantedPitch),normalCameraDistance,false);
 cameraAvoidYaw=transitional<1.8&&best>=1.8?wantedAvoid:easedAvoid;
 avoidAngle=cameraAvoidYaw;
 const easedPitch=THREE.MathUtils.lerp(cameraPitch,wantedPitch,1-Math.exp(-2.5*dt));
 const easedSafe=cameraLimit(camTarget,directionAt(easedPitch),normalCameraDistance,false);
 cameraPitch=wantedPitch>cameraPitch||easedSafe<Math.min(2.4,best)?wantedPitch:easedPitch;
 const safe=cameraLimit(camTarget,directionAt(cameraPitch),normalCameraDistance);
 // Never interpolate through an obstruction: contraction is immediate, recovery is damped.
 cameraDistance=safe<cameraDistance?safe:THREE.MathUtils.lerp(cameraDistance,safe,1-Math.exp(-2.5*dt));
 camera.position.copy(camTarget).addScaledVector(cameraDirection,cameraDistance);
 camera.lookAt(camTarget);
 // Keep the complete figure in frame when collision forces a shoulder-close view.
 camera.updateMatrixWorld();
 const sample=new THREE.Vector3();let needed=Math.tan(57*Math.PI/360);
 for(const x of [-.5,.5])for(const z of [-.5,.5])for(const y of [.08,2.02]){
  sample.set(focusX+x,groundY+y,focusZ+z).applyMatrix4(camera.matrixWorldInverse);
  if(sample.z<-.05)needed=Math.max(needed,Math.abs(sample.y)/-sample.z*1.12,Math.abs(sample.x)/(-sample.z*camera.aspect)*1.12);
 }
 const wantedFov=THREE.MathUtils.clamp(2*Math.atan(needed)*180/Math.PI,57,110);
 camera.fov=wantedFov>camera.fov?wantedFov:THREE.MathUtils.lerp(camera.fov,wantedFov,1-Math.exp(-3*dt));
 camera.updateProjectionMatrix();
}
