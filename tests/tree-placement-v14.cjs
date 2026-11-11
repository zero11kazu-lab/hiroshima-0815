const assert=require('node:assert/strict'),fs=require('node:fs'),{run}=require('./helpers/game-math.cjs');
const result=run(`(()=>{init();const check=(c,m)=>{if(!c)throw Error(m);},context=tree14Context(world),report=world.treePlacementReport;
check(report.checked===20&&report.hidden===0,'unexpected tree loss');const locations=JSON.stringify(world.trees.map(t=>[t.x,t.z]));
for(const t of world.trees){const conflicts=tree14Conflicts(world,context,t,t.placementScale);check(!conflicts.length,t.id+': '+conflicts.join(','));const collider=walls.find(w=>w.treeId===t.id),group=world.groups.find(g=>g.group===t.preModel);check(collider.x===t.x&&collider.z===t.z,'invisible old collision');check(group.x===t.x&&group.z===t.z&&t.preModel.position.x===t.x&&t.preModel.position.z===t.z,'render/culling mismatch');check(Math.hypot(t.x-t.originalPosition.x,t.z-t.originalPosition.z)<=BUILDING14.treePlacement.maximumShift+.001,'excess movement');}
// Synthetic future overlap: both trunk and canopy-only contacts must be rejected.
const synthetic={...context,buildings:[{id:'future-building',box:new THREE.Box3(new THREE.Vector3(-1,0,-1),new THREE.Vector3(1,4,1))}],solids:[],missions:[],paths:[],accepted:[]};
check(tree14Conflicts(world,synthetic,{x:0,z:0}).includes('building-trunk'),'trunk detector');check(tree14Conflicts(world,synthetic,{x:2,z:0}).includes('building-canopy'),'canopy detector');
const sides={E:0,W:0},types={},variants={};for(const b of world.buildings){const a=b.preBlastModel.userData.architecture;if(!a)continue;sides[placementSide(b.data)]++;types[a.kind]=(types[a.kind]||0)+1;(variants[a.kind]||(variants[a.kind]=new Set())).add(a.variant);check(a.confidence==='gameplay_adjusted'&&a.signFictional,'fiction metadata lost');}
check(types.home===37&&types.shop===19&&types.nagaya===15,'missing rollout');for(const set of Object.values(variants))check(set.size===4,'missing variation');
on0815Event();event0815.elapsed=event0815.postStartTime;event0815.apply();world.lastVisibility=0;world.updateVisibility(pos);check(world.buildings.every(b=>!b.preBlastModel.visible),'pre decor survives blast');
for(const t of world.trees)check(t.postModel.position.x===t.x&&t.postModel.position.z===t.z,'post tree not aligned');
// Check only non-tree gameplay positions; IDs and all route/candidate data remain untouched.
for(const seed of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]){const plan=postMissions.planner.select(seed,pos,false);check(plan.routes.wakeToMother.length&&plan.routes.patientToRefuge.length,'mission unreachable');}
reset();check(JSON.stringify(world.trees.map(t=>[t.x,t.z]))===locations,'RESET randomized scenery');check(npcManager.people.length===37,'NPC count changed');
return {PASS:true,testType:'Actual geometry/state, renderer stubbed',trees:report,types,sides,variants:Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,[...v].sort()])),resetStable:true,missionLayouts:20};})()`);
console.log(JSON.stringify(result));
