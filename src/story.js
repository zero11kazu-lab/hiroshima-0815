let storyController=null,storyLayout=null;
class StoryController {
 constructor(manager,layout){this.manager=manager;this.layout=layout;this.reset();for(const n of manager.people){const info=this.informationFor(n);n.masamiInfo={level:info.level,stage:info.stage};}}
 reset(){this.state=MAIN_OBJECTIVES.BEFORE_0800;this.met=false;this.ended=false;this.endEventCount=0;this.inquiries=[];this.bestClue=null;this.lastSecond=-1;this.meetCount=0;$('prototype-end').hidden=true;}
 onTime(seconds){
  if(this.ended)return;
  if(seconds>=8*3600&&this.state===MAIN_OBJECTIVES.BEFORE_0800){this.state=MAIN_OBJECTIVES.FIND_MASAMI_BEFORE_BLAST;missionController?.render();if(dialogue?.active)dialogue.render();}
  if(seconds>=8*3600+15*60)on0815Event();
 }
 get canAsk(){return worldState===WORLD_STATE.PRE_BLAST&& this.state===MAIN_OBJECTIVES.FIND_MASAMI_BEFORE_BLAST&&!this.met&&!this.ended;}
 get primary(){return this.state!==MAIN_OBJECTIVES.BEFORE_0800;}
 markMet(){if(this.met)return;this.met=true;this.meetCount++;missionController.render();}
 informationFor(n){
  const side=this.layout.sideWord,far=this.layout.position,d=Math.hypot(n.position.x-far.x,n.position.z-far.z);
  const direction=Math.abs(n.position.x-far.x)>Math.abs(n.position.z-far.z)?(far.x<n.position.x?'西':'東'):(far.z<n.position.z?'北':'南');
  if(d<12)return {level:'accurate',stage:5,pages:[`マサミさんなら、この近くで見ましたよ。`,`${direction}側の家並みの間です。路地の奥を確かめてみてください。`],summary:`この近くの${direction}側。家並みの間にいるらしい。`};
  if(d<35||n.clueRole==='cornerWitness')return {level:'direction',stage:4,pages:[`ここから${direction}の方で見かけました。`,`家並みの間の路地です。大きな道からは見えにくい所ですよ。`],summary:`この通りから${direction}へ。家並みの間の路地を確かめよう。`};
  if(n.important||n.clueRole||n.index%4===2)return {level:'direction',stage:2,pages:['一雄さん、奥さんを探しているんですね。',`用足しで、ここから${direction}の方へ行くのを見ました。${placementSide(n.position)!==placementSide(far)?'御幸橋を渡った向こうの家並みでも、尋ねてみては。':'そちらの家並みで、また尋ねてみては。'}`],summary:`${direction}の方へ。${placementSide(n.position)!==placementSide(far)?'御幸橋の向こう側の':'この岸の'}家並みで聞いてみよう。`};
  if(n.index%3===0)return {level:'stale',stage:0,pages:['朝早くなら、商店の辺りで見かけました。','でも、だいぶ前のことです。今いる場所は分かりません。'],summary:null};
  return {level:'none',stage:0,pages:[n.type==='child'?'今日はまだ見ていないよ。':'すみません、今日はまだ見かけていません。',n.index%2?'お店の人なら、何か聞いているかもしれません。':'近くを通った人にも、尋ねてみてはどうでしょう。'],summary:null};
 }
 inquire(n){
  const info=this.informationFor(n);n.masamiInfo={level:info.level,stage:info.stage,heardAt:gameClock.seconds};this.inquiries.push({npcId:n.id,level:info.level,stage:info.stage,at:gameClock.seconds});
  if(info.summary&&(!this.bestClue||info.stage>=this.bestClue.stage)){this.bestClue={stage:info.stage,text:info.summary,from:n.name};missionController.render();}
  return {id:'masami-inquiry-'+n.id,pages:['一雄「妻のマサミを見ませんでしたか？」',...info.pages],choices:[{label:'話の続きへ',action:'return-dialogue'}]};
 }
 snapshot(){return {player:{...PLAYER_PROFILE},phase:this.state,met:this.met,ended:this.ended,endEventCount:this.endEventCount,bestClue:this.bestClue?{...this.bestClue}:null,inquiryCount:this.inquiries.length};}
}

// Stable integration point for the next field transition.
function on0815Event(){if(storyController&&!event0815.active&&worldState===WORLD_STATE.PRE_BLAST)event0815.begin();}

// Separate from post-blast placement. Authored, pre-blast-validated sites only.
const PRE_MASAMI_HISTORY='hiroshima.lastPreMasamiSpawnId';
let previousPreMasami=null,preMasamiRoutes=null;
function preMasamiCandidates(){
 if(preMasamiRoutes)return preMasamiRoutes;
 const start=GEO1945.playerStart,nav=new Navigation(worldAllowed);
 preMasamiRoutes=HISTORICAL_DATA.masami_pre_locations.sites.flatMap(site=>{
  const p=site.position;
  if(!worldAllowed(p.x,p.z)||Math.hypot(p.x-start.x,p.z-start.z)<45)return [];
  // Routes were surveyed against this version of the static pre-blast collision map.
  const path=site.route;
  if(!path?.length||!nav.segmentClear(start,path[0])||!nav.segmentClear(path.at(-1),p)||!path.every((q,i)=>worldAllowed(q.x,q.z)&&(!i||nav.segmentClear(path[i-1],q))))return [];
  const length=path.reduce((sum,q,i)=>sum+(i?Math.hypot(q.x-path[i-1].x,q.z-path[i-1].z):0),0);
  if(length<55||length>240)return [];
  return [{...site,path,length}];
 });
 if(!preMasamiRoutes.length)throw new Error('No reachable authored morning Masami site');
 return preMasamiRoutes;
}
function randomizePreMasami(){
 let last=previousPreMasami;try{last=localStorage.getItem(PRE_MASAMI_HISTORY)||last;}catch(_){}
 const valid=preMasamiCandidates(),pool=valid.filter(s=>s.id!==last),choices=pool.length?pool:valid,site=choices[Math.floor(Math.random()*choices.length)],n=missionController.person(PLAYER_PROFILE.spouseId),p={...site.position};
 previousPreMasami=site.id;try{localStorage.setItem(PRE_MASAMI_HISTORY,site.id);}catch(_){}
 // Keep the same identity, renderer and clothing. She waits at her errand stop.
 n.position={...p};n.homePosition={...p};n.route=[{...p},{...p}];n.next=1;n.speed=0;n.homeRadius=1.7;n.stayLocal=true;n.schedule=[];n.destination=null;n.detour=[];n.passageTravel=null;n.gateBay=null;n.timer=5;n.state='waiting';n.moving=false;n.hiddenFromWorld=false;n.conversing=false;n.yaw=0;
 Object.assign(storyLayout,{position:p,selectedId:site.id,side:site.side==='east'?1:-1,sideWord:site.side==='east'?'東':'西',pathDistance:site.length,walkRoute:site.path});
 npcManager.resetProgress(n);npcManager.grid.rebuild(npcManager.people);npcManager.visuals.write(n,true);npcManager.visuals.flush();
}
