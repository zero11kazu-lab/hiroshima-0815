// Append after all existing identities, so damage hashes and mission IDs never shift.
const V13_POPULATION=HISTORICAL_DATA.npc_expansion_v13;
function appendV13Residents(people){
 for(const entry of V13_POPULATION.people.slice(0,V13_POPULATION.activeCount)){
  if(people.some(n=>n.id===entry.id))continue;
  const n=JSON.parse(JSON.stringify(people[entry.dialogueTemplate]));
  Object.assign(n,{id:entry.id,name:entry.name,type:entry.type,routeId:entry.id,route:entry.route.map(([x,z])=>({x,z})),startFraction:entry.startFraction,schedule:[],important:false,stayLocal:false,missionFlags:{},speed:entry.speed,pause:entry.pause});
  for(const key of ['clueRole','homePosition','homeRadius','relationship'])delete n[key];
  n.dialogue=n.dialogue.filter(d=>!d.when).map((d,i)=>({...d,id:entry.id+'-daily-'+i}));people.push(n);
 }
}
