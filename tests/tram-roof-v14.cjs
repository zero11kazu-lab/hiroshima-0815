// Real Three.js triangles and front-face raycasts; no browser/GPU claims.
const {run}=require('./helpers/game-math.cjs');
const result=run(`(()=>{init();const check=(v,m)=>{if(!v)throw Error(m)},report=[];const originalCollider=JSON.stringify(walls),tram=world.tram;
for(const post of [false,true]){
setTramDamage(post);tram.updateMatrixWorld(true);const geometry=tram.tramMeshes[0].geometry,p=geometry.attributes.position,roof=[],edges=new Map();
for(let i=0;i<p.count;i+=3){const points=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,i+k));if(points.every(v=>v.y>=2.449)&&points.some(v=>Math.abs(Math.abs(v.z)-2.95)<.0001))roof.push(points);}
for(const tri of roof)for(let j=0;j<3;j++){const key=v=>v.toArray().map(x=>x.toFixed(4)).join(','),a=key(tri[j]),b=key(tri[(j+1)%3]),edge=[a,b].sort().join('/');edges.set(edge,(edges.get(edge)||0)+1);}
check(roof.length>0&&Array.from(edges.values()).every(n=>n===2),'roof has open/non-manifold edges');
const cast=(start,direction)=>{const o=new THREE.Vector3(...start).add(tram.position),r=new THREE.Raycaster(o,new THREE.Vector3(...direction).normalize(),0,50);return r.intersectObject(tram.tramMeshes[0]).filter(h=>h.point.y-tram.position.y>=2.449);};
const views=[{name:'top',s:[0,4,0],d:[0,-1,0]},{name:'underside',s:[0,2.40,0],d:[0,1,0]},{name:'front',s:[0,2.60,4],d:[0,0,-1]},{name:'back',s:[0,2.60,-4],d:[0,0,1]},{name:'side',s:[1.7,2.48,0],d:[-1,0,0]},{name:'oblique',s:[2,2.60,4],d:[-2,0,-4]},{name:'far',s:[0,2.60,20],d:[0,0,-1]}];
for(const v of views)check(cast(v.s,v.d).length>0,'roof missing from '+v.name);
const missing=cast([.60,4,0],[0,-1,0]);check(post?!missing.length:missing.length>0,'post damage opening lost/normal roof gap');
for(const distance of [8,45]){world.lastVisibility=0;world.updateVisibility({x:tram.position.x,z:tram.position.z+distance});check(tram.tramMeshes[0].visible,'roof hidden by detail LOD');}
check(tram.tramMeshes.every(m=>m.material.side===THREE.FrontSide),'double-sided material workaround');report.push({post,roofTriangles:roof.length,views:views.map(v=>v.name),closedEdges:true});}
check(JSON.stringify(walls)===originalCollider,'collider changed');setTramDamage(false);return{PASS:true,testType:'Real geometry/front-face rays; renderer stubbed',report,collidersUnchanged:true};})()`);
console.log(JSON.stringify(result));
