let missionController=null;
class MissionController {
 constructor(manager,data){this.manager=manager;this.peopleById=new Map(manager.people.map(n=>[n.id,n]));this.definitions=data;this.projection=new THREE.Vector3();this.viewport=new THREE.Vector2();this.viewPoint=new THREE.Vector3();this.lastGuide=0;this.reset();}
 reset(){this.missions=this.definitions.map(m=>({...m,state:'inactive'}));this.revision=(this.revision||0)+1;this.render();}
 get current(){return this.missions[0];}
 get state(){return this.current.state;}
 person(id){return this.peopleById.get(id);}
 target(){if(worldState===WORLD_STATE.POST_BLAST)return postMissions.markerTarget();if(worldState!==WORLD_STATE.PRE_BLAST)return null;const m=this.current;if(storyController?.primary&&m.state!=='active')return null;return this.person(m.state==='inactive'?m.giverNpcId:m.state==='active'?m.targetNpcId:null)||null;}
 accept(npcId){const m=this.current;if(m.state!=='inactive'||npcId!==m.giverNpcId)return false;m.state='active';this.changed();return true;}
 complete(npcId){const m=this.current;if(m.state!=='active'||npcId!==m.targetNpcId)return false;m.state='completed';this.changed();return true;}
 changed(){this.revision++;this.lastGuide=0;this.render();}
 render(){
  if(worldState===WORLD_STATE.POST_BLAST){const objective=postMissions.objective();$('objective-title').textContent='現在の目的';$('objective-text').textContent=objective.text;$('objective-guide').hidden=!postMissions.markerTarget();$('story-clue').hidden=!objective.hint;$('story-clue').textContent=objective.hint||'';$('target-marker').hidden=true;$('target-label').textContent=postMissions.markerTarget()?.name||'';return;}
  const m=this.current,primary=storyController?.primary&&m.state!=='active';
  $('objective-text').textContent=primary?(storyController.met?'マサミに会えた。朝の街を歩こう':'マサミに会いに行く'):m.objective[m.state];
  $('objective-title').textContent=primary?'現在の目的':m.state==='completed'?'朝の届け物 · 完了':'現在の目的';
  $('objective').dataset.state=primary?'main':m.state;$('objective-guide').hidden=primary||m.state==='completed';
  const clue=$('story-clue');clue.hidden=!storyController?.primary||storyController.met;
  if(!clue.hidden)clue.textContent=primary?(storyController.bestClue?.text||'街の人に、マサミのことを尋ねてみよう'):'この用事が済んだら、マサミに会いに行こう';
  $('target-marker').hidden=true;$('target-label').textContent=this.target()?.name||'';
 }
 updateGuide(dt){
  const marker=$('target-marker'),n=this.target();if(!n){if(!marker.hidden)marker.hidden=true;return;}
  // Only one tracked person, not a per-frame sweep of mission/NPC conditions.
  this.lastGuide+=dt;
  if(this.lastGuide>=.1){this.lastGuide=0;const dx=n.position.x-pos.x,dz=n.position.z-pos.z,angle=Math.atan2(dx,-dz)+cameraYaw+cameraAvoidYaw;
   this.guideAngle=(this.guideAngle??angle)+angleDelta(angle,this.guideAngle??angle);$('guide-arrow').style.transform=`rotate(${this.guideAngle}rad)`;const text=`${n.name} · ${Math.round(Math.hypot(dx,dz))}m`;if(text!==this.guideText){$('guide-distance').textContent=text;this.guideText=text;}
  }
  this.projection.set(n.position.x,n.height*2.15+.08,n.position.z);this.viewPoint.copy(this.projection).applyMatrix4(camera.matrixWorldInverse);this.projection.project(camera);
  const visible=Math.hypot(n.position.x-pos.x,n.position.z-pos.z)<world.visibleDistance-4&&this.viewPoint.z<0&&Math.abs(this.projection.x)<.92&&Math.abs(this.projection.y)<.9&&!dialogue?.active;
  if(marker.hidden===visible)marker.hidden=!visible;
  if(visible){renderer.getSize(this.viewport);marker.style.transform=`translate(${(this.projection.x*.5+.5)*this.viewport.x}px,${(-this.projection.y*.5+.5)*this.viewport.y}px) translate(-50%,-100%)`;}
 }
 snapshot(){if(worldState===WORLD_STATE.POST_BLAST)return postMissions.missions.map(m=>({...m}));return this.missions.map(m=>({id:m.id,title:m.title,description:m.description,giverNpcId:m.giverNpcId,targetNpcId:m.targetNpcId,state:m.state,reward:m.reward}));}
}

// Selection runs only when a conversation opens. Pages do not change underneath the reader.
class DialogueResolver {
 constructor(missions){this.missions=missions;this.history=new Map();}
 reset(){this.history.clear();}
 historyFor(n){if(!this.history.has(n.id))this.history.set(n.id,{count:0,lastId:null,pools:{},lastPeriod:null});return this.history.get(n.id);}
 choose(pool,h,key){let i=h.pools[key]||0;if(pool.length>1&&pool[i%pool.length].id===h.lastId)i++;h.pools[key]=i+1;return pool[i%pool.length];}
 resolve(n,seconds){
  if(worldState===WORLD_STATE.POST_BLAST)return postMissions.nodeFor(n)||resolvePostDialogue(n,this);
  const h=this.historyFor(n),m=this.missions.current,state=m.state;let node;
  if(n.id===PLAYER_PROFILE.spouseId){const pool=n.dialogue;const extras=pool.filter(d=>d.stage==='extra'&&d.id!==h.lastId);node=h.count<9?pool[h.count]:extras[Math.floor(Math.random()*extras.length)];h.count++;h.lastId=node.id;return {...node,pages:[...node.pages],choices:[]};}
  if(n.id===m.giverNpcId&&state==='active')node=this.choose(m.giverActive,h,'giver-active');
  else if(n.id===m.giverNpcId&&state==='completed')node=this.choose(m.giverCompleted,h,'giver-completed');
  else if(n.id===m.targetNpcId&&state==='active')node=this.choose([m.targetActive,...m.targetActiveAlternates],h,'target-active');
  else if(n.id===m.targetNpcId&&state==='completed')node=this.choose(m.targetCompleted,h,'target-completed');
  else{
   const bank=n.dialogue.filter(d=>typeof d==='object');
   const timed=bank.filter(d=>d.when&&seconds>=(d.when.from||0)&&seconds<(d.when.until??Infinity));
   const period=timed[0]?.id||'morning';
   if(h.count===0){node=bank.find(d=>d.firstOnly)||bank[0];if(node&&timed.length)node={...node,id:node.id+'-'+timed[0].id,pages:[node.pages[0],...timed[0].pages]};}
   else if(timed.length&&period!==h.lastPeriod)node=this.choose(timed,h,'time-'+period);
   else node=this.choose(bank.filter(d=>!d.firstOnly&&!d.when),h,'daily');
   h.lastPeriod=period;
   if(!node)node={id:'legacy',pages:n.dialogue.filter(d=>typeof d==='string')};
   if(n.id===m.giverNpcId&&state==='inactive')node={...node,id:node.id+'-offer',pages:[...node.pages,...m.offer.pages],choices:m.offer.choices};
  }
  h.count++;h.lastId=node.id;return {...node,pages:[...node.pages],choices:node.choices?.map(c=>({...c}))||[]};
 }
}
