// Geography-aware placement uses authored sites, never arbitrary runtime coordinates.
const POST_PLACEMENT_CONFIG={eastProbability:.50,eventAlternationProbability:.70,bridgeCrossingProbability:.70,escortCrossingShare:.50,
 minimumEventDistance:10,minimumMasamiDistance:45,minimumMasamiRoute:70,maximumMasamiRoute:240,
 routeHeatLimit:40,routeSmokeLimit:.01,escortSpeedScale:.60,escortGap:.85,escortLeash:1.65};
function placementSide(p){const bridge=GEO1945.bridges.find(b=>b.id==='miyuki');return p.x>bridge.x?'E':'W';}
function placementRandom(seed){let n=seed>>>0;return ()=>{n=(n+0x6D2B79F5)>>>0;let t=Math.imul(n^(n>>>15),n|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function placementWeights(triple=false){const e=Math.max(0,Math.min(1,POST_PLACEMENT_CONFIG.eastProbability)),c=Math.max(0,Math.min(POST_PLACEMENT_CONFIG.bridgeCrossingProbability,2*Math.min(e,1-e)));
 if(!triple)return {EE:e-c/2,EW:c/2,WE:c/2,WW:1-e-c/2};
 const q=Math.max(0,Math.min(1,POST_PLACEMENT_CONFIG.escortCrossingShare));return {EEE:(1-c)*(1-q)/2,WWW:(1-c)*(1-q)/2,EWW:c/2,WEE:c/2,EEW:(1-c)*q/2,WWE:(1-c)*q/2};
}
function placementDraw(sets,weights,rng,lastId){
 const alternatives=sets.filter(s=>s.id!==lastId);if(alternatives.length)sets=alternatives;
 const groups=Object.entries(weights).map(([key,weight])=>({key,weight,sets:sets.filter(s=>s.sides===key)})).filter(g=>g.weight>0&&g.sets.length);
 if(!groups.length)return null;let value=rng()*groups.reduce((n,g)=>n+g.weight,0),group=groups.at(-1);
 for(const g of groups){value-=g.weight;if(value<0){group=g;break;}}
 const fresh=group.sets.filter(s=>s.id!==lastId),pool=fresh.length?fresh:group.sets;return pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
}
class PostRouteCatalog {
 constructor(){
  const b=WORLD_DATA.bounds;this.minX=Math.floor(b.minX/2);this.minZ=Math.floor(b.minZ/2);this.nx=Math.ceil(b.maxX/2)-this.minX+1;this.nz=Math.ceil(b.maxZ/2)-this.minZ+1;
  this.open=new Uint8Array(this.nx*this.nz);this.edges=new Uint8Array(this.open.length);this.trees=new Map();this.cache=new Map();this.queries=0;
  for(let k=0;k<this.open.length;k++){const p=this.point(k);this.open[k]=this.safe(p)?1:0;}
  for(let k=0;k<this.open.length;k++)if(this.open[k])for(const [di,dj,bit,opposite]of [[1,0,1,2],[0,1,4,8]]){const i=k%this.nx,j=Math.floor(k/this.nx),ii=i+di,jj=j+dj,n=jj*this.nx+ii;if(ii>=this.nx||jj>=this.nz||!this.open[n]||!this.clear(this.point(k),this.point(n)))continue;this.edges[k]|=bit;this.edges[n]|=opposite;}
 }
 point(k){return {x:(k%this.nx+this.minX)*2,z:(Math.floor(k/this.nx)+this.minZ)*2};}
 safe(p){if(!worldAllowed(p.x,p.z))return false;const s=hazards.sample(p.x,p.z);return s.heat<POST_PLACEMENT_CONFIG.routeHeatLimit&&s.smoke<=POST_PLACEMENT_CONFIG.routeSmokeLimit&&s.contact===0;}
 clear(a,b){const count=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.2));for(let i=0;i<=count;i++)if(!this.safe({x:a.x+(b.x-a.x)*i/count,z:a.z+(b.z-a.z)*i/count}))return false;return true;}
 node(p){let best=-1,distance=Infinity;const ix=Math.round(p.x/2)-this.minX,iz=Math.round(p.z/2)-this.minZ;
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=ix+dx,z=iz+dz,k=z*this.nx+x;if(x<0||z<0||x>=this.nx||z>=this.nz||!this.open[k])continue;const q=this.point(k),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<distance&&this.clear(p,q)){best=k;distance=d;}}
  return best;
 }
 route(a,b){const key=[a.x,a.z,b.x,b.z].join(',');if(this.cache.has(key))return this.cache.get(key);this.queries++;
  const start=this.node(a),goal=this.node(b);if(start<0||goal<0)return [];
  if(!this.trees.has(start)){const prev=new Int32Array(this.open.length);prev.fill(-1);prev[start]=start;const queue=new Int32Array(this.open.length);queue[0]=start;let end=1;
   for(let head=0;head<end;head++){const k=queue[head];for(const [bit,n]of [[1,k+1],[2,k-1],[4,k+this.nx],[8,k-this.nx]])if((this.edges[k]&bit)&&prev[n]===-1){prev[n]=k;queue[end++]=n;}}
   this.trees.set(start,prev);
  }
  const prev=this.trees.get(start);if(prev[goal]===-1)return [];const path=[{...b}];for(let k=goal;k!==start;k=prev[k])path.push(this.point(k));path.push(this.point(start),{...a});path.reverse();this.cache.set(key,path);return path;
 }
 length(route){return route.reduce((s,p,i)=>s+(i?Math.hypot(p.x-route[i-1].x,p.z-route[i-1].z):0),0);}
 crosses(route){return route.some((p,i)=>i&&placementSide(p)!==placementSide(route[i-1]))&&route.some(p=>onBridge(p.x,p.z));}
 siteSafe(p){return this.safe(p)&&[[.7,1.1],[-.7,1.1],[.7,-1.1],[-.7,-1.1]].some(([dx,dz])=>this.safe({x:p.x+dx,z:p.z+dz})&&this.clear(p,{x:p.x+dx,z:p.z+dz}));}
}
// One navigation graph per hazard revision; no per-frame placement search.
class PostPlacementPlanner {
 constructor(controller,masamiOnly=false){
  this.controller=controller;this.catalog=new PostRouteCatalog();this.sites=new Map(POST_LOCATION_DATA.sites.map(s=>[s.id,s]));this.compatibility=new Map();this.valid={};
  this.actorIds=new Set([POST_MISSION_DATA.motherId,POST_MISSION_DATA.childId,POST_MISSION_DATA.maleId,POST_MISSION_DATA.requesterId,POST_MISSION_DATA.evacueeId,PLAYER_PROFILE.spouseId]);
  if(!masamiOnly)for(const [name,min,max]of [['mission1',28,180],['mission2',45,190],['mission3',22,150]])this.valid[name]=POST_LOCATION_DATA[name].map(s=>{
   const a=this.sites.get(s.giver),b=this.sites.get(s.target),c=s.shelter?this.sites.get(s.shelter):null;
   if(![a,b,...c?[c]:[]].every(p=>this.safeSite(p.position)))return null;
   const path=this.catalog.route(a.position,b.position),length=this.catalog.length(path),evac=c?this.catalog.route(b.position,c.position):[],evacLength=this.catalog.length(evac);
   if(!path.length||length<min||length>max||c&&(!evac.length||evacLength<28||evacLength>145))return null;
   if(s.sides!==a.side+b.side+(c?c.side:''))throw Error('Invalid authored bank classification: '+s.id);
   if((a.side!==b.side)!==this.catalog.crosses(path)||c&&(b.side!==c.side)!==this.catalog.crosses(evac))return null;
   return {...s,points:[a,b,...c?[c]:[]],path,evac,length,evacLength};
  }).filter(Boolean);
 }
 safeSite(p){return this.catalog.siteSafe(p)&&!npcManager.grid.query(p.x,p.z,.9).some(n=>!this.actorIds.has(n.id)&&!n.hiddenFromWorld);}
 compatible(a,b){const key=a.id+'|'+b.id;if(this.compatibility.has(key))return this.compatibility.get(key);const value=a.points.every(p=>b.points.every(q=>{if(Math.hypot(p.position.x-q.position.x,p.position.z-q.position.z)<4)return false;const r=this.catalog.route(p.position,q.position);return r.length&&this.catalog.length(r)>=POST_PLACEMENT_CONFIG.minimumEventDistance;}));this.compatibility.set(key,value);return value;}
 history(key){try{return localStorage.getItem(key)||this.controller.lastLayoutIds?.[key];}catch(_){return this.controller.lastLayoutIds?.[key];}}
 remember(key,id){this.controller.lastLayoutIds=this.controller.lastLayoutIds||{};this.controller.lastLayoutIds[key]=id;try{localStorage.setItem(key,id);}catch(_){}}
 select(seed,wake=pos,remember=true){
  const rng=placementRandom(seed),opposite=s=>s==='E'?'W':'E',givers=[rng()<.5?'E':'W'];
  givers.push(rng()<POST_PLACEMENT_CONFIG.eventAlternationProbability?opposite(givers[0]):givers[0]);givers.push(rng()<POST_PLACEMENT_CONFIG.eventAlternationProbability?opposite(givers[1]):givers[1]);
  const cross=[0,1,2].map(()=>rng()<POST_PLACEMENT_CONFIG.bridgeCrossingProbability),desired=givers.map((s,i)=>s+(cross[i]?opposite(s):s)),masamiOpposite=rng()<POST_PLACEMENT_CONFIG.eventAlternationProbability,history=k=>this.history('hiroshima.lastMission'+k+'Set');
  const order=(sets,i,strict)=>sets.filter(s=>!strict||s.sides.slice(0,2)===desired[i]).map(s=>({s,rank:(s.sides[0]!==givers[i]?4:0)+(s.sides[1]!==desired[i][1]?2:0)+(s.id===history(i+1)?1.1:0)+rng()})).sort((a,b)=>a.rank-b.rank).map(x=>x.s);
  const first=this.valid.mission1.filter(s=>{const r=this.catalog.route(wake,s.points[0].position);return r.length&&this.catalog.length(r)>=8;});let a,b,c;
  const find=strict=>{for(const aa of order(first,0,strict)){for(const bb of order(this.valid.mission2.filter(t=>this.compatible(aa,t)),1,strict)){for(const cc of order(this.valid.mission3.filter(t=>this.compatible(aa,t)&&this.compatible(bb,t)),2,strict)){
   const pool=this.masamiCandidates(cc.points[2].position,[...aa.points,...bb.points,...cc.points]);if(!pool.some(q=>q.side==='E')||!pool.some(q=>q.side==='W'))continue;a=aa;b=bb;c=cc;return true;
  }}}return false;};
  if(!find(true)&&!find(false))throw Error('No safe authored three-mission layout');
  const position=s=>({...s.position}),masamiSide=masamiOpposite?opposite(c.sides[0]):c.sides[0];
  const plan={placementPolicy:{givers,cross,masamiSide,fallbacks:[a,b,c].flatMap((s,i)=>s.sides.slice(0,2)===desired[i]?[]:[{mission:i+1,requested:desired[i],actual:s.sides.slice(0,2),reason:'No compatible reachable authored combination'}])},mission1Set:a.id,mission2Set:b.id,mission3Set:c.id,mother:position(a.points[0]),child:position(a.points[1]),man:position(b.points[0]),water:position(b.points[1]),requester:position(c.points[0]),evacuee:position(c.points[1]),shelter:position(c.points[2]),siteIds:[...a.points,...b.points,...c.points].map(s=>s.id),sides:[a.sides,b.sides,c.sides],crossings:[this.catalog.crosses(a.path),this.catalog.crosses(b.path),this.catalog.crosses(c.path)||this.catalog.crosses(c.evac)],routeLengths:[a.length,b.length,c.length,c.evacLength]};
  const routes={wakeToMother:this.catalog.route(wake,plan.mother),motherToChild:a.path,motherToMale:this.catalog.route(plan.mother,plan.man),maleToWater:b.path,maleToRescue:this.catalog.route(plan.man,plan.requester),rescueToPatient:c.path,patientToRefuge:c.evac};
  // Reserve alternatives, not a chosen Masami location. The actual draw happens only after M3.
  for(const q of this.masamiCandidates(plan.shelter,[...a.points,...b.points,...c.points]))routes['future-'+q.id]=this.catalog.route(plan.shelter,q.position);
  if(remember)for(const [i,s]of [a,b,c].entries())this.remember('hiroshima.lastMission'+(i+1)+'Set',s.id);
  return {plan,routes};
 }
 masamiCandidates(start,used=[]){return POST_LOCATION_DATA.masami.map(s=>{const d=Math.hypot(s.position.x-start.x,s.position.z-start.z),path=this.catalog.route(start,s.position),length=this.catalog.length(path);
  if(d<POST_PLACEMENT_CONFIG.minimumMasamiDistance||!path.length||length<POST_PLACEMENT_CONFIG.minimumMasamiRoute||length>POST_PLACEMENT_CONFIG.maximumMasamiRoute||!this.safeSite(s.position)||used.some(q=>Math.hypot(q.position.x-s.position.x,q.position.z-s.position.z)<8))return null;
  return {...s,sides:s.side,routeLength:length,distance:d};}).filter(Boolean);}
}
