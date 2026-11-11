const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),THREE=require('../src/vendor/three.min.js');
const ctx=vm.createContext({THREE});vm.runInContext(fs.readFileSync('src/visual-quality.js','utf8'),ctx);
const make=vm.runInContext('roadSurfaceGeometry',ctx),roads=JSON.parse(fs.readFileSync('data/roads_1945.json','utf8'));
function verify(data){const covered=[],pieces=[];let meshes=0;
for(const road of data){const g=make(road,covered);covered.push(road);if(!g)continue;meshes++;const p=g.attributes.position,uv=g.attributes.uv,n=g.attributes.normal;
for(let i=0;i<p.count;i++){const x=p.getX(i)+road.x,z=road.z-p.getY(i);assert.equal(p.getZ(i),0);assert(Math.abs(uv.getX(i)-(x-road.x+road.w/2)/3)<1e-5);assert(Math.abs(uv.getY(i)-(road.z+road.d/2-z)/3)<1e-5);assert(n.getZ(i)>.999);}
for(let i=0;i<p.count;i+=6){const xs=Array.from({length:6},(_,k)=>p.getX(i+k)+road.x),zs=Array.from({length:6},(_,k)=>road.z-p.getY(i+k));pieces.push({minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)});}
g.dispose();}
const xs=[...new Set(data.flatMap(r=>[r.x-r.w/2,r.x+r.w/2]))].sort((a,b)=>a-b),zs=[...new Set(data.flatMap(r=>[r.z-r.d/2,r.z+r.d/2]))].sort((a,b)=>a-b);let union=0;
for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){const x=(xs[i-1]+xs[i])/2,z=(zs[j-1]+zs[j])/2,expected=data.some(r=>Math.abs(x-r.x)<r.w/2&&Math.abs(z-r.z)<r.d/2),count=pieces.filter(p=>x>p.minX&&x<p.maxX&&z>p.minZ&&z<p.maxZ).length;assert.equal(count,expected?1:0,`Coverage/overlap at ${x},${z}`);if(expected)union+=(xs[i]-xs[i-1])*(zs[j]-zs[j-1]);}
assert.equal(pieces.reduce((a,p)=>a+(p.maxX-p.minX)*(p.maxZ-p.minZ),0),union);assert(meshes<=data.length);return {meshes,rectangles:pieces.length,union,originalArea:data.reduce((a,r)=>a+r.w*r.d,0)};}
const result=verify(roads);assert(result.originalArea>result.union);const duplicate=verify([roads[0],roads[0]]);assert.equal(duplicate.meshes,1);
verify([{x:0,z:0,w:4,d:4},{x:0,z:0,w:10,d:10},{x:8,z:1,w:12,d:3}]);
console.log('PASS: one surface per point; identical road footprint, original UVs/up normals; no extra meshes; duplicate fully removed',result);
