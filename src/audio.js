// The shared pre-limiter gain affects music, ambience and effects together.
const MASTER_VOLUME_MULTIPLIER=2;
// Render the original score once on the audio thread, then loop one buffer source.
class MorningAudio {
 constructor(){this.enabled=true;this.ctx=null;this.buffer=null;this.promise=null;this.source=null;this.ended=false;this.pauseTimer=null;this.error=null;}
 create(){if(this.ctx)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('WebAudio unavailable');
  this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=.95*MASTER_VOLUME_MULTIPLIER;this.limiter=this.ctx.createDynamicsCompressor();this.limiter.threshold.value=-8;this.limiter.knee.value=12;this.limiter.ratio.value=6;this.limiter.attack.value=.004;this.limiter.release.value=.15;this.master.connect(this.limiter);this.meter=this.ctx.createAnalyser();this.meter.fftSize=2048;this.limiter.connect(this.meter);this.meter.connect(this.ctx.destination);this.channels={};
  for(const [name,level] of Object.entries(AUDIO_LEVELS)){const gain=this.ctx.createGain();gain.gain.value=level;gain.connect(this.master);this.channels[name]=gain;}
  this.ctx.onstatechange=()=>this.renderButton();
 }
 async makeBuffer(){
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!Offline)throw Error('Offline audio unavailable');
  const rate=22050,beat=60/MORNING_SCORE.bpm,duration=MORNING_SCORE.bars.length*3*beat,tail=2;
  const off=new Offline(2,Math.ceil((duration+tail)*rate),rate),mix=off.createBiquadFilter();mix.type='lowpass';mix.frequency.value=2400;mix.Q.value=.4;mix.connect(off.destination);
  const piano=off.createPeriodicWave(new Float32Array(7),new Float32Array([0,1,.32,.13,.045,.025,.01]));
  const flute=off.createPeriodicWave(new Float32Array(6),new Float32Array([0,1,.04,.11,.015,.025]));
  const voice=(pitch,time,length,level,woodwind=false)=>{
   const oscillator=off.createOscillator(),gain=off.createGain(),pan=off.createStereoPanner?off.createStereoPanner():off.createGain();oscillator.setPeriodicWave(woodwind?flute:piano);oscillator.frequency.value=440*Math.pow(2,(pitch-69)/12);if(pan.pan)pan.pan.value=woodwind?.13:-.12;
   const release=woodwind?.2:1.35,stop=time+length+release;
   gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(level,time+(woodwind?.06:.012));
   gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level*(woodwind?.66:.25)),time+Math.max(.09,length*.7));gain.gain.exponentialRampToValueAtTime(.0001,stop-.02);gain.gain.linearRampToValueAtTime(0,stop);
   oscillator.connect(gain);gain.connect(pan);pan.connect(mix);oscillator.start(time);oscillator.stop(stop+.01);
  };
  MORNING_SCORE.bars.forEach((bar,i)=>{const t=i*3*beat;voice(bar.chord[0],t,.55*beat,.085);for(const b of [1,2]){voice(bar.chord[1],t+b*beat,.32*beat,.035);voice(bar.chord[2+(b%2)],t+b*beat+.025,.38*beat,.028);}for(const [pitch,onset,length] of bar.notes)voice(pitch,t+onset*beat,length*beat,.09,true);});
  const rendered=await off.startRendering(),frames=Math.round(duration*rate),loop=this.ctx.createBuffer(2,frames,rate);
  for(let ch=0;ch<2;ch++){const input=rendered.getChannelData(ch),output=loop.getChannelData(ch);output.set(input.subarray(0,frames));for(let i=frames;i<input.length;i++)output[i-frames]+=input[i];}
  this.buffer=loop;return loop;
 }
 startFromGesture(){
  clearTimeout(this.pauseTimer);this.ended=false;
  try{this.error=null;this.create();if(!this.enabled){this.renderButton();return;}const resumed=this.ctx.resume();
   if(!this.promise)this.promise=this.makeBuffer();
   Promise.all([resumed,this.promise]).then(([,buffer])=>{if(!this.enabled||this.ended)return;if(!this.source){this.source=this.ctx.createBufferSource();this.source.buffer=buffer;this.source.loop=true;this.source.connect(this.channels.bgm);this.source.start();}this.channels.bgm.gain.cancelScheduledValues(this.ctx.currentTime);this.channels.bgm.gain.setTargetAtTime(AUDIO_LEVELS.bgm,this.ctx.currentTime,.08);ambientAudio.startPre();this.renderButton();}).catch(e=>{this.error=e.message;this.promise=null;this.renderButton();});
  }catch(e){this.error=e.message;this.renderButton();}
 }
 toggle(){if(storyController?.ended)return;if(this.error||(this.enabled&&this.ctx&&this.ctx.state!=='running')){this.enabled=true;this.startFromGesture();return;}this.enabled=!this.enabled;if(this.enabled)this.startFromGesture();else{this.ctx?.suspend();this.renderButton();}}
 pauseForPage(){if(this.ctx)this.ctx.suspend().catch(()=>{});}
 resumeForPage(){if(this.enabled&&!this.ended&&this.ctx)this.ctx.resume().then(()=>this.renderButton()).catch(()=>this.renderButton());}
 end(){this.ended=true;if(!this.ctx)return;const t=this.ctx.currentTime;this.channels.bgm.gain.cancelScheduledValues(t);this.channels.bgm.gain.setTargetAtTime(0,t,.09);this.pauseTimer=setTimeout(()=>{if(this.ended){try{this.source?.stop();}catch(_){}this.source=null;this.ctx.suspend().catch(()=>{});this.renderButton();}},350);}
 renderButton(){const post=worldState===WORLD_STATE.POST_BLAST,on=this.enabled&&(post||!this.ended)&&this.ctx?.state==='running'&&!this.error;$('music-toggle').textContent=this.error?'♪ 再開':on?(post?'♪ 環境音':'♪ ON'):'♪ OFF';$('music-toggle').setAttribute('aria-pressed',String(!!on));}
 snapshot(){return {enabled:this.enabled,state:this.ctx?.state||'not-started',playing:!!this.source,loop:this.source?.loop||false,duration:this.buffer?.duration||0,error:this.error,bpm:MORNING_SCORE.bpm,channels:{...AUDIO_LEVELS}};}
}
const morningAudio=new MorningAudio();
