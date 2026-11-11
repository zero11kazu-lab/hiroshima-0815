// Shared 2m spatial hash: collision/separation examine local people, never all pairs per frame.
class SpatialGrid {
 constructor(size=2){this.size=size;this.cells=new Map();this.checks=0;}
 key(x,z){return `${Math.floor(x/this.size)},${Math.floor(z/this.size)}`;}
 insert(n){const key=this.key(n.position.x,n.position.z);if(!this.cells.has(key))this.cells.set(key,new Set());this.cells.get(key).add(n);n.gridKey=key;}
 move(n){const key=this.key(n.position.x,n.position.z);if(key===n.gridKey)return;this.cells.get(n.gridKey)?.delete(n);this.insert(n);}
 rebuild(people){this.cells.clear();for(const n of people)if(!n.hiddenFromWorld)this.insert(n);}
 query(x,z,r=2){const result=[];for(let ix=Math.floor((x-r)/this.size);ix<=Math.floor((x+r)/this.size);ix++)for(let iz=Math.floor((z-r)/this.size);iz<=Math.floor((z+r)/this.size);iz++){
  const cell=this.cells.get(`${ix},${iz}`);if(!cell)continue;
  for(const n of cell){if(n.hiddenFromWorld)continue;this.checks++;if((n.position.x-x)**2+(n.position.z-z)**2<=r*r)result.push(n);}
 }return result;}
}

// Cached static walking grid. Bounded A* is only used for schedule changes or recovery.
class Navigation {
 constructor(isOpen,cell=.55){this.isOpen=isOpen;this.cell=cell;this.cache=new Map();this.searches=0;this.expanded=0;}
 segmentClear(a,b){const steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.16);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!this.isOpen(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
 open(ix,iz){const key=`${ix},${iz}`;if(!this.cache.has(key))this.cache.set(key,this.isOpen(ix*this.cell,iz*this.cell));return this.cache.get(key);}
 findPath(start,goal,free,maxNodes=1600){
  this.searches++;const s=this.cell,sx=Math.round(start.x/s),sz=Math.round(start.z/s);
  // Find a reachable free grid start without snapping through a wall.
  let root=null;
  for(let r=0;r<=2&&!root;r++)for(let dx=-r;dx<=r&&!root;dx++)for(let dz=-r;dz<=r;dz++){
   const x=sx+dx,z=sz+dz,p={x:x*s,z:z*s};if(this.open(x,z)&&free(p.x,p.z)&&this.segmentClear(start,p)){root={ix:x,iz:z,x:p.x,z:p.z,g:0,parent:null};break;}
  }
  if(!root)return null;
  const heap=[];
  const push=n=>{heap.push(n);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p].f<=n.f)break;heap[i]=heap[p];i=p;}heap[i]=n;};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(last.f<=heap[c].f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;};
  root.f=Math.hypot(root.x-goal.x,root.z-goal.z);push(root);const costs=new Map([[`${root.ix},${root.iz}`,0]]);let count=0;
  const offsets=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(heap.length&&count++<maxNodes){
   const n=pop();this.expanded++;if(n.g>costs.get(`${n.ix},${n.iz}`)+1e-6)continue;
   if(Math.hypot(n.x-goal.x,n.z-goal.z)<s*1.5&&free(goal.x,goal.z)&&this.segmentClear(n,goal)){
    const path=[{x:goal.x,z:goal.z}];for(let p=n;p;p=p.parent)path.push({x:p.x,z:p.z});path.reverse();return path;
   }
   for(const [dx,dz] of offsets){const ix=n.ix+dx,iz=n.iz+dz,x=ix*s,z=iz*s;if(!this.open(ix,iz)||!free(x,z))continue;
    const p={x,z};if(!this.segmentClear(n,p))continue;
    const g=n.g+Math.hypot(dx,dz)*s,key=`${ix},${iz}`;if(g>=(costs.get(key)??Infinity))continue;
    costs.set(key,g);push({ix,iz,x,z,g,f:g+Math.hypot(x-goal.x,z-goal.z),parent:n});
   }
  }return null;
 }
}

// Single-file passages admit one walker at a time. Opposing walkers wait in an open bay.
class PassageController {
 constructor(manager){this.manager=manager;this.items=[];this.discover();}
 discover(){
  const open=this.manager.isOpen;
  for(const n of this.manager.people)for(let i=0;i<n.route.length;i++){
   const a=n.route[i],b=n.route[(i+1)%n.route.length],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<1.5)continue;
   let ux=(b.x-a.x)/length,uz=(b.z-a.z)/length;if(ux<-.01||(Math.abs(ux)<.01&&uz<0)){ux=-ux;uz=-uz;}
   const steps=Math.ceil(length/.4);let run=null;
   const finish=end=>{if(run===null)return;const start=run;run=null;if(end-start<.7)return;
    const t=(start+end)/2/length,c={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
    if(this.items.some(p=>Math.hypot(p.x-c.x,p.z-c.z)<1&&Math.abs(p.ux*ux+p.uz*uz)>.9))return;
    this.items.push({id:this.items.length,x:c.x,z:c.z,ux,uz,half:(end-start)/2+.15,active:new Set(),queue:new Map(),direction:0,admitted:0});
   };
   for(let k=0;k<=steps;k++){const d=length*k/steps,x=a.x+(b.x-a.x)*k/steps,z=a.z+(b.z-a.z)*k/steps;
    let width=0;for(const side of [-1,1])for(let r=.2;r<=1.2;r+=.2){if(!open(x-uz*r*side,z+ux*r*side))break;width+=.2;}
    if(width<1.2){if(run===null)run=d;}else finish(d);
   }finish(length);
  }
 }
 projection(p,n){return {t:(n.position.x-p.x)*p.ux+(n.position.z-p.z)*p.uz,lateral:(n.position.x-p.x)*-p.uz+(n.position.z-p.z)*p.ux};}
 target(n){
  const m=this.manager;
  if(m.clock>=(this.nextPrune||0)){this.nextPrune=m.clock+.25;
  for(const p of this.items)for(const [id,ticket] of p.queue){
   const q=this.projection(p,ticket.n),goal=ticket.n.destination||ticket.n.route[ticket.n.next],tt=(goal.x-p.x)*p.ux+(goal.z-p.z)*p.uz;
   if(Math.abs(q.t)>p.half+4||Math.abs(q.lateral)>3.2||Math.sign(tt-q.t)!==ticket.direction||q.t*ticket.direction>p.half+.2)p.queue.delete(id);
  }}
  if(n.passageTravel){
   const {passage:p,direction:dir}=n.passageTravel,q=this.projection(p,n),exit=p.half+1.5;
   if(q.t*dir>=exit-.2){
    p.active.delete(n.id);if(!p.active.size){p.direction=0;p.admitted=0;}
    n.passageTravel=null;n.gateBay=null;n.timer=0;n.detour=[];m.resetProgress(n);
    // Skip the entrance/exit waypoints just traversed; keep the next point ahead in the bay.
    for(let i=0;i<n.route.length;i++){const point=n.route[n.next],t=((point.x-p.x)*p.ux+(point.z-p.z)*p.uz)*dir;if(t>exit+.1)break;n.next=(n.next+1)%n.route.length;}
    if(n.destination){const t=((n.destination.x-p.x)*p.ux+(n.destination.z-p.z)*p.uz)*dir;if(t<=exit)n.destination=null;}
    return null;
   }
   const entry={x:p.x-p.ux*dir*(p.half+.55),z:p.z-p.uz*dir*(p.half+.55)};
   if(!n.passageTravel.crossing&&(Math.hypot(n.position.x-entry.x,n.position.z-entry.z)<.22||(q.t*dir>-p.half-.4&&Math.abs(q.lateral)<.12)))n.passageTravel.crossing=true;
   return {target:n.passageTravel.crossing?{x:p.x+p.ux*dir*exit,z:p.z+p.uz*dir*exit}:entry,locked:n.passageTravel.crossing,waiting:false};
  }
  for(const p of this.items){
   const q=this.projection(p,n),target=n.destination||n.route[n.next],tt=(target.x-p.x)*p.ux+(target.z-p.z)*p.uz;
   if(Math.abs(q.t)>p.half+3.8||Math.abs(q.lateral)>3.1)continue;
   const direction=Math.sign(tt-q.t)||1;
   if(q.t*direction>p.half+.2||tt*direction<-p.half+.1)continue;
   if(!p.queue.has(n.id)||p.queue.get(n.id).direction!==direction)p.queue.set(n.id,{n,direction,since:m.clock});
   const canEnter=!p.active.size&&p.queue.keys().next().value===n.id;
   if(canEnter){p.direction=direction;p.admitted++;p.active.add(n.id);p.queue.delete(n.id);n.passageTravel={passage:p,direction,crossing:false};n.gateBay=null;n.timer=0;n.detour=[];n.recoveryPending=false;return this.target(n);}
   if(!n.gateBay||n.gateBay.passage!==p.id||n.gateBay.direction!==direction){
    for(const side of [n.index%2?1:-1,n.index%2?-1:1])for(const lateral of [.85,1.55,2.25]){
     const t=-direction*(p.half+1+(n.index%3)*.75),x=p.x+p.ux*t-p.uz*lateral*side,z=p.z+p.uz*t+p.ux*lateral*side;
     if(m.clear(n,x,z)){n.gateBay={x,z,passage:p.id,direction};break;}
    }
   }
   n.recoveryPending=false;return {target:n.gateBay||{...n.position},locked:false,waiting:true};
  }
  return null;
 }
}
