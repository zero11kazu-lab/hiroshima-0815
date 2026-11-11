// Actual clock/event/replay state; DOM, audio and WebGLRenderer are stubs.
const {run}=require('./helpers/game-math.cjs');
console.log(JSON.stringify(run(`(()=>{init();const check=(c,m)=>{if(!c)throw Error(m)},trials=[];
for(let trial=0;trial<3;trial++){
reset();check(gameClock.format()==='07:45','start time');const plan=ending.plan;let real=0;while(gameClock.seconds<GAME_CONFIG.STOP_TIME){gameClock.update(.1,true);real+=.1;check(real<181,'dialogue paused clock');}
check(event0815.active,'08:15 did not trigger');check(!event0815.audio.played,'sound before configured delay');event0815.elapsed=EVENT0815_CONFIG.FLASH_TO_SOUND_DELAY-.01;event0815.apply();check(!event0815.audio.played,'sound early');event0815.elapsed+=.02;event0815.apply();check(event0815.audio.played,'sound missing');let frames=0;while(event0815.active&&frames<1500){event0815.update(.1);frames++;}
check(!event0815.active&&worldState==='POST_BLAST'&&playerControlEnabled,'wake failed');check(ending.plan===plan,'ending rerolled during blast');check(postMissions.routes.wakeToMother?.length,'mother unreachable');check(world.tram.visible||Math.hypot(pos.x-1.2,pos.z+55)>38,'near damaged tram hidden');trials.push({start:'07:45',stop:gameClock.format(),realSeconds:Math.round(real),eventFrames:frames,layout:postMissions.locationPlan.mission1Set});}
return {PASS:true,trials,limitation:'No browser/GPU/audio playback verification'};})()`)));
