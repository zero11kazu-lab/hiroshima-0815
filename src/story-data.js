// All people and dialogue are fictional. No character has knowledge of a future event.
const PLAYER_PROFILE={id:'kazuo_nishimoto',name:'西本 一雄',reading:'にしもと かずお',role:'広島で暮らす一般市民',spouseId:'masami_nishimoto'};
const MAIN_OBJECTIVES={BEFORE_0800:'BEFORE_0800',FIND_MASAMI_BEFORE_BLAST:'FIND_MASAMI_BEFORE_BLAST',POST_BLAST_FIND_MASAMI:'POST_BLAST_FIND_MASAMI'};
const MASAMI_PROFILE={id:'masami_nishimoto',name:'西本 マサミ',type:'woman',occupation:'街で用事を済ませている',relationship:'一雄の妻',roleAction:'朝の用足し',important:true,homeRadius:1.7,startFraction:0,speed:.66,pause:5,schedule:[],missionFlags:{spouse:true},dialogue:HISTORICAL_DATA.couple_dialogue.preBlast};

// Population identities are built once; the morning location is chosen separately on each new play.
function prepareStoryPopulation(){
 const position={x:GEO1945.masamiPre.x,z:GEO1945.masamiPre.z},side=-1,sideWord='西',nav=new Navigation(worldAllowed);
 const wife=JSON.parse(JSON.stringify(MASAMI_PROFILE));wife.homePosition=position;wife.routeId='masami-local';wife.route=[position,{x:position.x+.8,z:position.z}];NPC_DATA.push(wife);
 const witnesses=[{index:16,role:'riverWitness',x:0,z:-10},{index:18,role:'northRoadWitness',x:-26,z:-22},{index:10,role:'cornerWitness',x:-26,z:-37},{index:8,role:'nearWitness',x:-25,z:-47}];
 for(const w of witnesses){const n=NPC_DATA[w.index];n.clueRole=w.role;n.stayLocal=true;n.homePosition={x:w.x,z:w.z};n.homeRadius=2;n.schedule=[];n.startFraction=0;n.routeId='morning-'+w.role;n.route=[{x:w.x,z:w.z},{x:w.x+.7,z:w.z}];n.pause=2.5;}
 // Append after Masami so every V1.0 identity, appearance index and witness stays unchanged.
 for(const [i,entry] of FIELD_EXPANSION.npcs.entries()){
  if(NPC_DATA.some(n=>n.id===entry.id))continue;
  const template=NPC_DATA[entry.dialogueTemplate],n=JSON.parse(JSON.stringify(template));
  Object.assign(n,{id:entry.id,name:['藤井 文','岡田 清','小林 実','森 千代'][i],type:entry.type,routeId:entry.id,route:entry.route.map(([x,z])=>({x,z})),startFraction:.25,schedule:[],important:false,stayLocal:false,missionFlags:{},speed:.72,pause:2});
  delete n.clueRole;delete n.homePosition;delete n.homeRadius;
  n.dialogue=n.dialogue.filter(d=>!d.when).map((d,j)=>({...d,id:entry.id+'-daily-'+j}));NPC_DATA.push(n);
 }
 appendV13Residents(NPC_DATA);
 for(const n of NPC_DATA)n.masamiInfo={level:'none',source:'未確認'};
 return {position,side,sideWord,pathDistance:90,reachableCells:null,walkRoute:[],witnesses};
}
