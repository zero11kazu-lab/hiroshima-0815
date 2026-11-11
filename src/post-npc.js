// Local avoidance at 15 Hz nearby / 2 Hz far away. Old commuting routes never run.
class PostNPCController {
 constructor(){this.steps=0;this.recoveries=0;}
 update(dt){
  for(const n of npcManager.people){if(n.hiddenFromWorld){npcManager.visuals.write(n,false);continue;}const distance=Math.hypot(n.position.x-pos.x,n.position.z-pos.z);n.postDebt=(n.postDebt||0)+dt;const interval=distance<28?1/15:.5;if(n.postDebt<interval)continue;const step=Math.min(.5,n.postDebt);n.postDebt=0;this.steps++;n.moving=false;n.postTimer=(n.postTimer||0)+step;
   if(n.conversing&&n.postRole!=='child'){const target=Math.atan2(n.position.x-pos.x,n.position.z-pos.z);if(n.postRole)n.yaw=target;else this.turn(n,target,step);}
   else if(!n.supported&&n.id!==PLAYER_PROFILE.spouseId&&['MOVING_SLOWLY','SEARCHING'].includes(n.postBlastState))this.move(n,step);
   n.eventTilt=n.postRole==='evacuee'?(n.supported?.12:n.postBlastState==='DOWN'?1.1:.55):n.postBlastState==='DEAD'?1.12:n.postRole==='child'?.18:n.postRole==='male'?.6:n.postBlastState==='DOWN'?1.15:n.postBlastState==='STATIC'?.58:n.postBlastState==='DISORIENTED'?.2:0;n.eventRoll=0;n.state=n.postBlastState;
   npcManager.visuals.write(n,distance<(n.id===PLAYER_PROFILE.spouseId?14:world.visibleDistance-4));
  }npcManager.visuals.flush();
 }
 turn(n,target,dt){if(!Number.isFinite(target))return;const current=Number.isFinite(n.yaw)?n.yaw:0,delta=Math.atan2(Math.sin(target-current),Math.cos(target-current)),limit=.9*Math.min(.5,Math.max(0,dt));n.yaw=Math.atan2(Math.sin(current+Math.max(-limit,Math.min(limit,delta))),Math.cos(current+Math.max(-limit,Math.min(limit,delta))));}
 move(n,dt){
  if((n.postPause||0)>0){n.postPause-=dt;return;}if(!Number.isFinite(n.postHeading))n.postHeading=Number.isFinite(n.yaw)?n.yaw:0;
  const p=n.position,s=hazards.sample(p.x,p.z);let dx=0,dz=0;
  if(s.heat>35||s.contact>0){for(const {zone:f,kind} of hazards.nearby(p.x,p.z))if(kind==='fire'){const d=Math.max(.5,Math.hypot(p.x-f.center.x,p.z-f.center.z)),v=Math.max(0,1-d/(f.radius+8));dx+=(p.x-f.center.x)/d*v;dz+=(p.z-f.center.z)/d*v;}}
  else{const searching=n.postBlastState==='SEARCHING',limit=n.id===PLAYER_PROFILE.spouseId?1.7:searching?5:7;
   if(n.postTimer>5){n.postHeading+=1.7;n.postTimer=0;}
   const anchorDistance=Math.hypot(p.x-n.postAnchor.x,p.z-n.postAnchor.z);if(anchorDistance>limit)n.postReturning=true;if(anchorDistance<limit*.5)n.postReturning=false;if(n.postReturning){dx=n.postAnchor.x-p.x;dz=n.postAnchor.z-p.z;}else{dx=-Math.sin(n.postHeading);dz=-Math.cos(n.postHeading);}if(!searching){const bank=-40;dx+=Math.sign(bank-p.x)*.25;}
  }
  const neighbors=npcManager.grid.query(p.x,p.z,1.7);for(const o of neighbors){if(o===n)continue;const ox=p.x-o.position.x,oz=p.z-o.position.z,d=Math.max(.01,Math.hypot(ox,oz));if(d<1.35){dx+=ox/d*(1.35-d)*1.3;dz+=oz/d*(1.35-d)*1.3;}}
  const pd=Math.hypot(p.x-pos.x,p.z-pos.z);if(pd<1.6&&pd>.001){dx+=(p.x-pos.x)/pd*(1.6-pd)*2;dz+=(p.z-pos.z)/pd*(1.6-pd)*2;}
  const length=Math.hypot(dx,dz);if(!Number.isFinite(length)||length<.025){n.postPause=.6;return;}dx/=length;dz/=length;const speed=(.28+hash10(n.index)*.12),step=speed*dt;let moved=false;
  for(const side of [0,(n.index%2?1:-1)*.65,(n.index%2?-1:1)*.65,1.3,-1.3]){const x=p.x+(dx*Math.cos(side)-dz*Math.sin(side))*step,z=p.z+(dx*Math.sin(side)+dz*Math.cos(side))*step;
   if(n.id===PLAYER_PROFILE.spouseId&&Math.hypot(x-n.postAnchor.x,z-n.postAnchor.z)>1.7)continue;
   const nextPlayerDistance=Math.hypot(x-pos.x,z-pos.z);if(!worldAllowed(x,z)||(nextPlayerDistance<.73&&nextPlayerDistance<=pd+.00001))continue;const next=hazards.sample(x,z);if(next.heat>68&&next.heat>s.heat)continue;
   if(npcManager.grid.query(x,z,.77).some(o=>o!==n&&Math.hypot(o.position.x-x,o.position.z-z)<.7))continue;
   const target=Math.atan2(p.x-x,p.z-z);p.x=x;p.z=z;if(n.postRole)n.yaw=target;else this.turn(n,target,dt);n.phase+=dt*2.8;n.moving=true;npcManager.grid.move(n);moved=true;break;
  }
  n.postStuck=moved?0:(n.postStuck||0)+dt;
  if(n.postStuck>2.5){n.postHeading+=1.1+(n.index%3)*.45;n.postTimer=0;n.postStuck=0;n.postPause=.6;this.recoveries++;}
 }
}
const postNPCController=new PostNPCController();
