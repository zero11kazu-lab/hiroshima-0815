// Dialogue owns only the current node. Narrative and mission text live in data files.
class DialogueController {
 constructor(manager,resolver){this.manager=manager;this.resolver=resolver;this.target=null;this.active=null;this.node=null;this.index=0;this.elapsed=0;this.inquiryReturn=null;}
 update(dt){
  this.elapsed+=dt;if(this.active||this.elapsed<.1)return;this.elapsed=0;
  if(worldState===WORLD_STATE.POST_BLAST&&(!playerControlEnabled||survival.dead)){this.target=null;$('talk').hidden=true;return;}
  const goal=missionController.target(),range=worldState===WORLD_STATE.POST_BLAST?3.1:2.25;
  const close=(n)=>n&&!n.hiddenFromWorld&&Math.hypot(n.position.x-pos.x,n.position.z-pos.z)<range&&this.manager.navigation.segmentClear(pos,n.position);
  const nearby=worldState===WORLD_STATE.POST_BLAST?this.manager.grid.query(pos.x,pos.z,range).filter(close).sort((a,b)=>Math.hypot(a.position.x-pos.x,a.position.z-pos.z)-Math.hypot(b.position.x-pos.x,b.position.z-pos.z))[0]:this.manager.nearest(pos);
  const nearest=worldState===WORLD_STATE.POST_BLAST?(postMissions.propTarget(pos)|| (close(goal)?goal:nearby)):(close(goal)?goal:nearby);this.target=nearest;$('talk').hidden=!nearest;
  if(nearest){$('talk').style.opacity='';$('talk').style.pointerEvents='auto';$('talk').textContent=`${worldState===WORLD_STATE.POST_BLAST?postMissions.actionLabel(nearest):'話す'} · ${nearest.name}`;}

 }
 open(){
  if(!playerControlEnabled||worldState===WORLD_STATE.POST_BLAST&&survival.dead)return;
  const n=this.target;if(!n||n.hiddenFromWorld||Math.hypot(n.position.x-pos.x,n.position.z-pos.z)>(worldState===WORLD_STATE.POST_BLAST?3.3:2.5)||!this.manager.navigation.segmentClear(pos,n.position))return;
  stop();this.active=n;this.index=0;this.node=this.resolver.resolve(n,gameClock.seconds);if(n.id===PLAYER_PROFILE.spouseId&&worldState===WORLD_STATE.PRE_BLAST)storyController.markMet();n.conversing=!n.isProp&&!['DEAD','CHILD_DEAD'].includes(n.postBlastState);n.moving=false;n.state=n.conversing?'talking':n.postBlastState;
  $('talk').hidden=true;$('conversation').style.opacity='';$('conversation').hidden=false;$('stick').classList.add('locked');this.render();
 }
 render(){
  const n=this.active,final=this.index>=this.node.pages.length-1,choices=final?this.node.choices:[];
  if(worldState===WORLD_STATE.POST_BLAST)postMissions.page(this.node,this.index);
  $('npc-name').textContent=n.name;$('npc-relation').textContent=[n.occupation,n.relationship].filter(Boolean).join(' · ');
  $('dialogue-text').textContent=this.node.pages[this.index]||'少し立ち話をしていきませんか。';
  $('dialogue-page').textContent=`${this.index+1} / ${this.node.pages.length}`;
  $('dialogue-next').hidden=choices.length>0;$('dialogue-next').textContent=final?'話を終える':'次へ';
  $('dialogue-accept').hidden=true;$('dialogue-decline').hidden=true;
  for(const [i,c] of choices.entries()){const button=$(i===0?'dialogue-accept':'dialogue-decline');button.hidden=false;button.textContent=c.label;button.dataset.action=c.action;}
  $('dialogue-ask').hidden=!(worldState===WORLD_STATE.POST_BLAST?postMissions.canAskNPC(n)&&!survival.dead:storyController?.canAsk)||n.id===PLAYER_PROFILE.spouseId||!!this.inquiryReturn;
  $('dialogue-choices').hidden=!choices.length;$('conversation').classList.toggle('has-choices',choices.length>0);
 }
 next(){if(!this.active)return;if(this.index<this.node.pages.length-1){this.index++;this.render();}else if(!this.node.choices.length)this.close();}
 choose(action){
  if(!this.active||this.index<this.node.pages.length-1||!this.node.choices.some(c=>c.action===action))return;
  if(action==='return-dialogue'){this.node=this.inquiryReturn.node;this.index=this.inquiryReturn.index;this.inquiryReturn=null;this.render();return;}
  if(action.startsWith('post-')){const node=postMissions.choose(action);if(node){this.node=node;this.index=0;this.render();}return;}
  const m=missionController.current;
  if(action==='decline'){this.close();return;}
  if(action==='accept'&&missionController.accept(this.active.id))this.node={...m.accepted,choices:[]};
  else if(action==='complete'&&missionController.complete(this.active.id))this.node={...m.delivered,choices:[]};
  else return;
  this.index=0;this.render();
 }
 askMasami(){if(!this.active||!(worldState===WORLD_STATE.POST_BLAST?postMissions.canAskNPC(this.active)&&!survival.dead:storyController.canAsk)||this.active.id===PLAYER_PROFILE.spouseId||this.inquiryReturn)return;this.inquiryReturn={node:this.node,index:this.index};this.node=worldState===WORLD_STATE.POST_BLAST?survival.ask(this.active):storyController.inquire(this.active);this.index=0;this.render();}
 close(){
  if(this.active&&worldState===WORLD_STATE.POST_BLAST&&!survival.dead&&this.node&&!this.inquiryReturn)postMissions.finish(this.node,this.index>=this.node.pages.length-1&&!this.node.choices.length);
  if(this.active){this.active.conversing=false;this.active.state=['DEAD','CHILD_DEAD'].includes(this.active.postBlastState)?this.active.postBlastState:'waiting';this.active.timer=.35;this.active.waitKind='rest';if(!this.active.isProp)this.manager.resetProgress(this.active);}
  this.active=null;this.target=null;this.node=null;this.inquiryReturn=null;stop();$('conversation').hidden=true;$('stick').classList.remove('locked');this.elapsed=1;this.update(0);
 }
}
