// Presentation only: these controls never write mission, movement or camera state.
// Existing map convention: +X east, +Z south, +Y up.
const WORLD_NORTH=Object.freeze({x:0,y:0,z:-1});
const NAVIGATION_HUD_CONFIG={
 REVEAL_ON_IMPORTANT_UPDATE:false,
 IMPORTANT_UPDATE_SECONDS:4
};
const navigationHUD={
 collapsed:false,peekUntil:0,lastObjective:'',direction:new THREE.Vector3(),lastAngle:null,
 init(){
  this.panel=$('objective');this.button=$('objective-toggle');this.compass=$('compass');this.rose=$('compass-rose');
  this.button.onclick=()=>{this.collapsed=!this.panel.classList.contains('is-collapsed');this.peekUntil=0;this.renderObjective();};
  // Only the main objective text counts as important, not distance or clue updates.
  this.observer=new MutationObserver(()=>{
   const text=$('objective-text').textContent;
   if(text===this.lastObjective)return;
   if(this.lastObjective&&this.collapsed&&NAVIGATION_HUD_CONFIG.REVEAL_ON_IMPORTANT_UPDATE){
    this.peekUntil=performance.now()/1000+NAVIGATION_HUD_CONFIG.IMPORTANT_UPDATE_SECONDS;
    this.renderObjective();
   }
   this.lastObjective=text;
  });
  this.observer.observe($('objective-text'),{childList:true,characterData:true,subtree:true});
  this.renderObjective();
 },
 renderObjective(){
  const closed=this.collapsed&&performance.now()/1000>=this.peekUntil;
  this.panel.classList.toggle('is-collapsed',closed);
  this.button.textContent=closed?'目的':'−';
  this.button.setAttribute('aria-expanded',String(!closed));
  this.button.setAttribute('aria-label',closed?'現在の目的を表示':'現在の目的を折りたたむ');
 },
 update(){
  if(this.peekUntil&&performance.now()/1000>=this.peekUntil){this.peekUntil=0;this.renderObjective();}
  this.compass.hidden=!started||!!dialogue?.active||event0815.active||ending.active||!playerControlEnabled;
  if(this.compass.hidden||!camera)return;
  camera.getWorldDirection(this.direction);
  if(Math.hypot(this.direction.x,this.direction.z)<.0001)return;
  const heading=Math.atan2(this.direction.x,-this.direction.z)-Math.atan2(WORLD_NORTH.x,-WORLD_NORTH.z);
  const angle=-heading;
  if(this.lastAngle===null||Math.abs(angle-this.lastAngle)>.001){
   this.rose.style.setProperty('--bearing',angle+'rad');this.lastAngle=angle;
  }
 }
};
navigationHUD.init();
