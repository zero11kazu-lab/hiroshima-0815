const GAME_CONFIG={TIME_SCALE:10,START_TIME:7*3600+45*60,STOP_TIME:8*3600+15*60,PAUSE_TIME_DURING_DIALOGUE:false};
class GameClock {
 constructor(config=GAME_CONFIG){this.config=config;this.reset();}
 reset(){this.seconds=this.config.START_TIME;this.stopped=false;this.lastText='';this.render();}
 update(realSeconds,inDialogue=false){if(!this.stopped&&!(inDialogue&&this.config.PAUSE_TIME_DURING_DIALOGUE)){
  this.seconds=Math.min(this.config.STOP_TIME,this.seconds+Math.max(0,realSeconds)*this.config.TIME_SCALE);this.stopped=this.seconds>=this.config.STOP_TIME;
 }this.render();storyController?.onTime(this.seconds);}
 format(withSeconds=false){const v=Math.floor(this.seconds),h=String(Math.floor(v/3600)).padStart(2,'0'),m=String(Math.floor(v/60)%60).padStart(2,'0');return `${h}:${m}`+(withSeconds?':'+String(v%60).padStart(2,'0'):'');}
 render(){const text=this.format();if(text!==this.lastText){$('clock').textContent=text;this.lastText=text;}}
}
let gameClock=null,dialogue=null;
