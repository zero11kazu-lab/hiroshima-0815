// District geometry is authored in data/*.json; historic existence and staging confidence are separate.
const WORLD_DATA={...GEO1945,
 roads:[...HISTORICAL_DATA.roads_1945,...FIELD_EXPANSION.roads],
 buildings:[...HISTORICAL_DATA.buildings_1945,...HISTORICAL_DATA.landmarks_1945,...FIELD_EXPANSION.buildings],
 trees:[...GEO1945.trees,...FIELD_EXPANSION.trees],
 poles:[...GEO1945.poles,...FIELD_EXPANSION.poles],
 gardens:[{x:31,z:-7,w:7,d:6},{x:20,z:38,w:7,d:6},...FIELD_EXPANSION.gardens],
 props:[{type:'crate',x:-6.5,z:12},{type:'barrel',x:-11.5,z:12},{type:'cart',x:34,z:2},{type:'well',x:-36,z:24},...FIELD_EXPANSION.props]
};
// Routes are polylines, not random destinations. All segments are checked against static colliders.
const NPC_ROUTES={
 east:[[2.6,-1],[14.8,-1],[14.8,13.7],[2.6,13.7]],
 west:[[-2.6,-1],[-14.8,-1],[-14.8,13.7],[-2.6,13.7]],
 commute:[[-1.2,-25],[-1.2,29],[1.2,29],[1.2,-25]],
 river:[[-1.1,-25],[-1.1,-40],[1.1,-40],[1.1,-25]],
 eastBlocks:[[26,31],[26,-22],[3.7,-22],[3.7,31]],
 shopRice:[[-10,11.8],[-9.2,11.8]],
 shopTea:[[-20,-3.2],[-19.2,-3.2]],
 shopHouse:[[10,11.8],[10.8,11.8]],
 shopSouth:[[20,26.8],[20.8,26.8]]
};
const NPC_DATA=[];
const typeCycle=['man','woman','student','child','man','woman'];
function addPeople(route,count,offset=0){
 for(let i=0;i<count;i++){
  const id=NPC_DATA.length;NPC_DATA.push({id:`citizen-${String(id+1).padStart(2,'0')}`,name:['田中','山本','佐藤','松本','井上','中村'][id%6]+' '+['実','春','清','文','勇','千代'][Math.floor(id/6)%6],type:typeCycle[id%6],routeId:route,route:NPC_ROUTES[route].map(p=>({x:p[0],z:p[1]})),startFraction:(i+.32+offset)/count,speed:.64+(id%5)*.085,pause:1.3+(id%4)*.65});
 }
}
addPeople('east',6);addPeople('west',5);addPeople('commute',4);addPeople('river',3);addPeople('eastBlocks',2);
for(const route of ['shopRice','shopTea','shopHouse','shopSouth']){addPeople(route,1);const d=NPC_DATA[NPC_DATA.length-1];d.type='shopkeeper';d.speed=.5;d.pause=7;}

// Dialogue and schedules are data, independently extensible from movement/rendering.
for(const [i,n] of NPC_DATA.entries()){
 n.speed=(n.type==='child'?.74:.8)*(.85+(i%7)*.05);
 n.schedule=[];
}
for(const i of [0,7,12])NPC_DATA[i].schedule=[
 {at:7*3600+45*60,action:'家の前から通りへ',waypoint:1},
 {at:7*3600+50*60,action:'商店の近くへ向かう',waypoint:2},
 {at:8*3600,action:'通りを歩く',waypoint:3},
 {at:8*3600+10*60,action:'指定の待ち合わせ場所へ',waypoint:0}
];
