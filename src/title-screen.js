// Title-only UI. Existing START implementation remains the sole game initializer.
const TITLE_PDF='assets/docs/hiroshima_history_map_design.pdf';
const titlePages={
 tutorial:{heading:'チュートリアル',body:`<h3>このゲームについて</h3><p>30分前後で完結する短編ストーリーゲームです。</p><p>毎回目標位置が変わるため、何度でも異なる探索でプレイできます。</p><h3>基本操作</h3><p>画面左下の仮想スティックで一雄を移動します。画面右側をドラッグするとカメラを動かせます。</p><p>投下後は「走る」ボタンを押しながら移動すると走れます。スタミナがなくなると歩行に戻ります。NPCの近くでは「話す」ボタンから会話できます。</p><h3>情報ウィンドウ</h3><p>「現在の目的」は右上の「−」をワンタップすると折りたためます。「目的」をもう一度タップすると再表示できます。画面を広く見たい時に使用してください。</p><h3>一雄の目標</h3><p>プレイヤーは西本 一雄として1945年8月6日の広島を行動します。街の人々と会話しながら行動し、物語の進行後は妻・マサミを探すことが大きな目的となります。次にすることは「現在の目的」に表示されます。</p><h3>ダメージと危険環境 — 炎</h3><p>炎の近くや炎の中では急速にダメージを受けます。無理に通過せず、安全な迂回路を探してください。</p><h3>暑さ</h3><p>高温地帯では「熱さ」が上昇します。危険な暑さに長時間留まると体力に影響します。火災地帯から離れることで危険を減らせます。</p><h3>煙</h3><p>濃い煙の中では呼吸が困難になり、体力が徐々に減少します。炎が見えない場所でも濃い煙に長時間留まらないよう注意してください。</p><h3>体力</h3><p>体力が0になると一雄は行動できなくなります。炎・暑さ・煙の状態を確認しながら進んでください。</p>`},
 documents:{heading:'史実に基づくゲーム資料',body:`<h3>HIROSHIMA 08:15<br>歴史考証・ゲームマップ基本設計</h3><p>歴史考証・マップ設計.pdf — 原本・全29ページ</p><p><a href="${TITLE_PDF}" target="_blank" rel="noopener">資料PDFを開く ↗</a></p><p>新しいタブの標準PDFビューアで閲覧できます。読み終えたらこのタブへ戻ってください。本文・図表・出典は原本のままです。</p><h3>Version 1.2 ミッション「生きる道」の参考資料</h3><p>広島市・広島平和記念資料館 学習ハンドブック「被爆体験証言」梶本淑子さんの、当時14才で歩けない友人を担架で避難させたという証言を制作の参考にしました。</p><p>ミッションの人物・場所・会話と、肩を貸して歩く支援方法は創作です。梶本さん本人の体験や発言を再現したものではありません。原本PDFは変更していません。</p><p><a href="https://www.city.hiroshima.lg.jp/atomicbomb-peace/1036658/1021119/1026964/1026965/1020880.html" target="_blank" rel="noopener">広島市公式・被爆体験証言を読む ↗</a></p><iframe title="歴史考証・マップ設計.pdf 原本" src="${TITLE_PDF}"></iframe>`},
 credits:{heading:'クレジット',body:`<div class="title-credits"><h3>HIROSHIMA 08:15</h3><p>企画・制作<br>ニッシー</p><p>ゲームデザイン<br>ニッシー</p><p>原案<br>ニッシー</p><p>制作協力<br>AI Development Support</p><small>本作品は史実・公開資料を参考に制作したフィクションです。<br>登場人物および一部の出来事・会話は創作です。</small><small>タイトル背景：Oilstreet「Genbaku Dome04-r」(2013)<br><a href="https://commons.wikimedia.org/wiki/File:Genbaku_Dome04-r.JPG" target="_blank" rel="noopener">Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by/2.5/" target="_blank" rel="noopener">CC BY 2.5</a><br>縮小・WebP変換、暗色グラデーションを重ねて使用。<br>タイトルは現在の原爆ドームを用いた追憶の表現です。</small></div>`}
};
const titleAudio={source:null,gain:null,buffer:null,busy:false,leaving:false,
 async start(){if(this.leaving)return;try{morningAudio.create();const c=morningAudio.ctx;await c.resume();if(this.source||this.busy)return;this.busy=true;
  if(!this.buffer){const rate=22050,duration=32,Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext,off=new Offline(2,rate*duration,rate);
   const phrase=[62,65,69,67,65,62,60,57,62,65,67,69,67,65,62,60];
   phrase.forEach((note,i)=>{const t=i*2,o=off.createOscillator(),g=off.createGain();o.type='sine';o.frequency.value=440*Math.pow(2,(note-69)/12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.19,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+1.95);o.connect(g);g.connect(off.destination);o.start(t);o.stop(t+2);});
   for(const f of [146.83,220]){const o=off.createOscillator(),g=off.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,0);g.gain.linearRampToValueAtTime(.015,2);g.gain.setValueAtTime(.015,30);g.gain.linearRampToValueAtTime(0,32);o.connect(g);g.connect(off.destination);o.start();o.stop(32);}
   this.buffer=await off.startRendering();
  }
  if(this.leaving)return;this.gain=c.createGain();this.gain.gain.setValueAtTime(0,c.currentTime);this.gain.gain.linearRampToValueAtTime(1.30,c.currentTime+1.2);this.gain.connect(morningAudio.master);this.source=c.createBufferSource();this.source.buffer=this.buffer;this.source.loop=true;this.source.connect(this.gain);this.source.start();$('title-audio-hint').textContent='♪ タイトル音楽';
 }catch(_){$('title-audio-hint').textContent='STARTを押すと物語が始まります';}finally{this.busy=false;}},
 stop(){this.leaving=true;if(!this.source)return;const c=morningAudio.ctx,t=c.currentTime;this.gain.gain.cancelScheduledValues(t);this.gain.gain.setValueAtTime(this.gain.gain.value,t);this.gain.gain.linearRampToValueAtTime(0,t+.4);const source=this.source,gain=this.gain;source.onended=()=>{source.disconnect();gain.disconnect();};source.stop(t+.42);this.source=null;}
};
const titleScreen={busy:false,returnFocus:null,
 open(page,button){if(this.busy)return;this.returnFocus=button;const data=titlePages[page];$('title-modal-heading').textContent=data.heading;$('title-modal-body').innerHTML=data.body;$('title-modal').hidden=false;$('intro').inert=true;$('title-modal-body').scrollTop=0;$('title-modal-close').focus();},
 close(){$('title-modal').hidden=true;$('title-modal-body').innerHTML='';$('intro').inert=false;this.returnFocus?.focus();}
};
const originalStart=$('start').onclick;
$('start').onclick=()=>{if(titleScreen.busy)return;titleScreen.busy=true;titleAudio.stop();try{morningAudio.create();morningAudio.ctx.resume().catch(()=>{});}catch(_){}$('intro').classList.add('title-leaving');setTimeout(()=>{playerControlEnabled=cameraManualControlEnabled=true;originalStart();if(!started){titleScreen.busy=false;titleAudio.leaving=false;$('intro').classList.remove('title-leaving');}},450);};
for(const button of document.querySelectorAll('[data-title-page]'))button.onclick=()=>{titleAudio.start();titleScreen.open(button.dataset.titlePage,button);};
$('title-modal-close').onclick=()=>titleScreen.close();
for(const element of [$('intro'),$('title-modal')])element.addEventListener('click',()=>titleAudio.start(),{passive:true});
$('title-modal').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();titleScreen.close();}if(e.key==='Tab'){const nodes=[...$('title-modal').querySelectorAll('a,button,[tabindex="0"]')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});

// Final-screen navigation reuses the existing reset and shared audio context.
titleScreen.returnFromEnding=async function(){
 if(this.returning||!ending.active||ending.state!=='THE_END'||ending.time<3.7)return;
 this.returning=true;started=false;stop();$('ending-return-title').disabled=true;
 const ctx=morningAudio.ctx;ctx?.resume().catch(()=>{});
 if(ending.audioGain&&ctx){const gain=ending.audioGain.gain,t=ctx.currentTime;gain.cancelScheduledValues(t);gain.setValueAtTime(gain.value,t);gain.linearRampToValueAtTime(0,t+.35);}
 await new Promise(resolve=>setTimeout(resolve,400));
 reset({newPlay:false});this.needsNewPlay=true;started=false;last=0;playerControlEnabled=cameraManualControlEnabled=false;
 navigationHUD.collapsed=false;navigationHUD.peekUntil=0;navigationHUD.renderObjective();
 $('talk').hidden=true;$('compass').hidden=true;$('debug').classList.remove('visible');$('event-debug').hidden=true;$('debug-toggle').setAttribute('aria-pressed','false');
 $('title-modal').hidden=true;$('title-modal-body').innerHTML='';$('intro').inert=false;$('intro').classList.remove('hidden','title-leaving');
 this.busy=false;this.returning=false;titleAudio.leaving=false;morningAudio.ended=false;clearTimeout(morningAudio.pauseTimer);
 titleAudio.start();$('start').focus();
};
$('ending-return-title').onclick=()=>titleScreen.returnFromEnding();
