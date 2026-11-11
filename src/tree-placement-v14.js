// Placement-time only. Keep source coordinates immutable and move visuals with their own collider.
function tree14RectDistance(p,r){return Math.hypot(Math.max(Math.abs(p.x-r.x)-r.w/2,0),Math.max(Math.abs(p.z-r.z)-r.d/2,0));}
function tree14SegmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
function tree14Context(world){
 world.scene.updateMatrixWorld(true);
 const buildings=world.buildings.map(r=>{const box=new THREE.Box3().setFromObject(r.preBlastModel);return {id:r.id,box};});
 const missions=[...HISTORICAL_DATA.post_locations_v12.sites.map(s=>s.position),...HISTORICAL_DATA.masami_pre_locations.sites.map(s=>s.position),...Object.values(GEO1945.missionPositions),GEO1945.playerStart];
 const paths=Object.values(NPC_ROUTES).map(route=>route.map(p=>({x:p[0],z:p[1]})));
 // Preserve the authored pre-blast Masami approach paths too.
 for(const s of HISTORICAL_DATA.masami_pre_locations.sites)paths.push(s.route);
 return {buildings,missions,paths,solids:walls.filter(w=>!w.treeId),accepted:[]};
}
function tree14Conflicts(world,context,p,scale=1){
 const reasons=new Set(),trunk=.15*scale,canopy=1.55*scale,low=1.75*scale,high=4.65*scale,cfg=BUILDING14.treePlacement,b=world.data.bounds;
 if(p.x-canopy<b.minX||p.x+canopy>b.maxX||p.z-canopy<b.minZ||p.z+canopy>b.maxZ)reasons.add('boundary');
 if(!geographicWalkable(p.x,p.z)||[[-trunk,0],[trunk,0],[0,-trunk],[0,trunk]].some(([dx,dz])=>waterAt(p.x+dx,p.z+dz)))reasons.add('river');
 for(const r of context.buildings){const q=r.box,rect={x:(q.min.x+q.max.x)/2,z:(q.min.z+q.max.z)/2,w:q.max.x-q.min.x,d:q.max.z-q.min.z},distance=tree14RectDistance(p,rect);
  if(q.min.y<2.8*scale&&q.max.y>0&&distance<trunk+.12)reasons.add('building-trunk');
  if(q.min.y<high&&q.max.y>low&&distance<canopy-cfg.canopyOverlapAllowance)reasons.add('building-canopy');
  // Reserve the existing fallen-tree variant's low horizontal trunk as well.
  if(tree14RectDistance({x:p.x+.8*scale,z:p.z},rect)<1.4*scale&&q.min.y<.4)reasons.add('building-fallen');
 }
 for(const r of world.data.roads)if(tree14RectDistance(p,r)<trunk+cfg.roadMargin)reasons.add(r.tram?'tram':'road');
 for(const r of GEO1945.bridges)if(tree14RectDistance(p,r)<trunk+.4)reasons.add('bridge');
 for(const [x,z]of world.data.poles)if(Math.hypot(x-p.x,z-p.z)<.25+trunk)reasons.add('pole');
 for(const w of context.solids)if(tree14RectDistance(p,{...w,w:w.w*2,d:w.d*2})<trunk+.12)reasons.add('prop');
 for(const q of context.missions)if(Math.hypot(q.x-p.x,q.z-p.z)<cfg.missionClearance)reasons.add('mission');
 for(const path of context.paths)for(let i=1;i<path.length;i++)if(tree14SegmentDistance(p,path[i-1],path[i])<.8+trunk)reasons.add('route');
 for(const q of context.accepted)if(Math.hypot(q.x-p.x,q.z-p.z)<.9)reasons.add('tree');
 return [...reasons];
}
function placeTrees14(world){
 const context=tree14Context(world),cfg=BUILDING14.treePlacement,report={checked:world.trees.length,initialConflicts:0,moved:0,scaled:0,hidden:0,records:[]};
 for(const t of world.trees){const origin={x:t.x,z:t.z},initial=tree14Conflicts(world,context,origin);let selected=null;
  if(!initial.length)selected={...origin,scale:1};else{
   report.initialConflicts++;
   // Ordered rings give the nearest safe option first; deterministic, no per-play scenery lottery.
   for(const scale of [1,.85,.7]){if(selected)break;for(let radius=0;radius<=cfg.maximumShift&&!selected;radius+=.5){const steps=radius?Math.max(16,Math.ceil(2*Math.PI*radius/.5)):1;for(let i=0;i<steps;i++){const p={x:origin.x+Math.cos(i*2*Math.PI/steps)*radius,z:origin.z+Math.sin(i*2*Math.PI/steps)*radius};if(!tree14Conflicts(world,context,p,scale).length){selected={...p,scale};break;}}}}
  }
  const collider=walls.find(w=>w.treeId===t.id);t.originalPosition=origin;
  if(!selected){report.hidden++;t.placementScale=0;t.preModel.scale.setScalar(0);if(collider)walls.splice(walls.indexOf(collider),1);report.records.push({id:t.id,from:origin,to:null,reasons:initial});continue;}
  t.x=selected.x;t.z=selected.z;t.placementScale=selected.scale;t.preModel.position.set(t.x,0,t.z);t.preModel.scale.setScalar(selected.scale);
  const item=world.groups.find(item=>item.group===t.preModel);item.x=t.x;item.z=t.z;
  if(collider){collider.x=t.x;collider.z=t.z;collider.w=collider.d=.175*selected.scale+.28;}
  const moved=Math.hypot(t.x-origin.x,t.z-origin.z)>.01;if(moved)report.moved++;if(selected.scale<1)report.scaled++;
  context.accepted.push({x:t.x,z:t.z});report.records.push({id:t.id,from:origin,to:{x:t.x,z:t.z},scale:selected.scale,reasons:initial});
 }
 world.treePlacementReport=report;
}
