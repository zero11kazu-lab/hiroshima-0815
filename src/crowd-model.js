// Stage 3: visual profiles only; never add NPCs or consume gameplay random numbers.
const CROWD_OUTFITS=Object.freeze([
 {name:'workwear',shirt:'#797e68',pants:'#4f574c',hair:'#393c33'},
 {name:'shirt',shirt:'#b0a58b',pants:'#575c50',hair:'#36382f'},
 {name:'elder-man',shirt:'#8b8877',pants:'#595d54',hair:'#8b887e'},
 {name:'blouse-monpe',shirt:'#b5ab92',pants:'#4b5667',hair:'#3e3b32'},
 {name:'kimono',shirt:'#8e8072',pants:'#686461',hair:'#39382f'},
 {name:'elder-woman',shirt:'#777d83',pants:'#4d555c',hair:'#8b877b'},
 {name:'child',shirt:'#aaa08a',pants:'#586056',hair:'#3b3b31'},
 {name:'student',shirt:'#4e5855',pants:'#454e4b',hair:'#34372e'}
]);
const CROWD_DAMAGE=['PRE','CLOTHED','CLOTH_HALF','BURN_PARTIAL','BURN_FULL','BURN_UPPER','CHARRED'];
const crowdTextureCache=new Map(),crowdMaterials=new Map();
function crowdProfile(n){
 const female=n.type==='woman',child=n.type==='child',elder=!child&&(female?n.index%10===3:n.type==='man'&&n.index%6===0);
 const archetype=child?6:n.type==='student'?7:female?elder?5:n.index%3===2?4:3:elder?2:n.index%3===1?1:0,outfit=CROWD_OUTFITS[archetype];
 return {id:n.id,key:'crowd-'+archetype,crowd:true,archetype,female,child,elder,kimono:archetype===4,
  scale:child?.96+(n.index%3)*.02:(female?.90:n.type==='student'?.91:.96)+(n.index%3-1)*.025,
  width:.94+(n.index%4)*.035,face:[.95+(n.index%3)*.035,1,1],hair:female?'low-bun':'short',shirt:outfit.shirt,skin:['#bca183','#c7ac8e','#bfa487'][n.index%3],hairColor:outfit.hair};
}
function crowdTexture(){
 if(crowdTextureCache.has('atlas'))return crowdTextureCache.get('atlas');
 // 8 looks x 8 damage rows, 64px/person. One 512px atlas for every general NPC/state.
 const size=512,tile=64,data=new Uint8Array(size*size*4),rgb=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
 for(let row=0;row<CROWD_DAMAGE.length;row++)for(let look=0;look<8;look++){
  const o=CROWD_OUTFITS[look],variant=CROWD_DAMAGE[row],source=kazuoTexture(row?'post':'pre').image.data,palette=[...KAZUO_PALETTE],charred=variant==='CHARRED',severe=['BURN_FULL','BURN_UPPER'].includes(variant);
  palette[0]=palette[12]=palette[13]=charred?'#45403a':row?'#716958':o.shirt;palette[1]=charred?'#3b3935':row?'#56534b':o.pants;palette[2]=charred?'#39352f':severe?'#a16d58':variant==='BURN_PARTIAL'?'#a57e68':row?'#a78b73':'#c1a687';palette[3]=charred?'#3d3932':o.hair;palette[4]=row?(charred?'#39352f':'#51473e'):o.shirt;palette[11]=charred?'#4b453b':row?'#807363':'#c1b89d';
  for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
   const region=(x>>4)+(y>>4)*4,base=rgb(KAZUO_PALETTE[region]||'#ffffff'),tone=rgb(palette[region]||'#ffffff'),si=((y*4)*256+x*4)*4,di=((row*tile+y)*size+look*tile+x)*4;
   let color=base.map((b,c)=>Math.min(255,source[si+c]*tone[c]/Math.max(1,b)));
   if(row&&region===3&&[3,4,5].includes(look)&&!charred)color=color.map(v=>v*.86);
   if(row&&region===2)color=injurySkinPixel(color,(x%16)/15,(y%16)/15,variant,look+3);
   for(let c=0;c<3;c++)data[di+c]=color[c];data[di+3]=255;
  }
 }
 const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;crowdTextureCache.set('atlas',t);return t;
}
function crowdMaterial(){
 if(!crowdMaterials.has('atlas')){const m=new THREE.MeshLambertMaterial({map:crowdTexture(),color:'#ffffff'});m.onBeforeCompile=s=>{s.vertexShader='attribute vec2 storyAtlasOffset;\n'+s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = (vMapUv + storyAtlasOffset) / vec2(8.0, 8.0);\n#endif');};m.customProgramCacheKey=()=> 'hiroshima-crowd-atlas-v1';crowdMaterials.set('atlas',m);}return crowdMaterials.get('atlas');
}
function storyCutGeometry(g,cut){
 const a=g.attributes.position,ids=[];for(let i=0;i<g.index.count;i+=3){const ix=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ix.reduce((s,j)=>s+a.getX(j),0)/3,y=ix.reduce((s,j)=>s+a.getY(j),0)/3,z=ix.reduce((s,j)=>s+a.getZ(j),0)/3;if(!cut(x,y,z))ids.push(...ix);}g.setIndex(ids);g.computeVertexNormals();return g;
}
function crowdChest(profile,damage='pre'){
 if(damage!=='pre')return injuryTorso(profile,damage,8);
 const shape=profile.kimono?'kimono':profile.female?'female':'male';return importantCached('crowd-chest-'+shape+'-'+damage,()=>{
  const female=profile.female,kimono=profile.kimono,post=damage!=='pre',severe=damage==='severe';
  const rings=[[.88,kimono?.225:.18,.12],[1.03,female?.18:.215,.13],[1.22,female?.205:.245,.14],[1.43,female?.215:.25,.12],[1.48,.17,.10]],cloth=kazuoLoft(rings,8,0);
  if(post)storyCutGeometry(cloth,(x,y,z)=>x<-.11&&y>1.30||y<1.0&&x>.01&&z<0||severe&&z<-.06&&x<.05&&y>1.15);
  const pieces=[cloth,kazuoLoft([[1.46,.055,.055],[1.60,.055,.055]],8,2)];
  if(post)pieces.push(kazuoLoft(rings.map(([y,x,z])=>[y,x*.94,z*.94]),8,female?11:severe?2:11));
  // Wrap collar and narrow belt distinguish kimono; all details are shared low-poly pieces.
  if(kimono){for(const side of [-1,1])pieces.push(kazuoPiece(new THREE.BoxGeometry(.045,.28,.014),11,side*.065,1.36,-.132,1,1,1,0,side*.45));pieces.push(kazuoPiece(new THREE.BoxGeometry(.36,.09,.015),1,0,1.05,-.138));}
  else for(const side of [-1,1])pieces.push(kazuoPiece(new THREE.BoxGeometry(.045,.07,.014),11,side*.05,1.43,-.12));
  return kazuoMerge(pieces).translate(0,-1.15,0);
 });
}
function crowdHead(profile,post=false){return importantCached('crowd-head-'+profile.archetype+(profile.female?'-hair14-'+post:''),()=>{
 const female=profile.female,child=profile.child,elder=profile.elder,width=female?.097:elder?.099:.104;
 const parts=[kazuoLoft([[-.13,width*.55,.065],[-.08,width*.84,.085],[0,width,.097],[.09,width*.94,.087],[.14,.06,.06]],10,2)];if(!female)parts.push(kazuoLoft([[.085,width*.96,.089],[.14,.064,.064],[.155,.025,.025]],10,3));
 for(const side of [-1,1]){parts.push(kazuoPiece(new THREE.SphereGeometry(1,6,4),2,side*.105,-.005,0,.017,.032,.024));parts.push(kazuoPiece(new THREE.BoxGeometry(.023,.009,.008),7,side*.033,.023,-.094));parts.push(kazuoPiece(new THREE.BoxGeometry(.032,.006,.007),8,side*.032,.043,-.091));}
 parts.push(kazuoPiece(new THREE.SphereGeometry(1,6,4),2,0,-.005,-.105,.017,.026,.026));parts.push(kazuoPiece(new THREE.BoxGeometry(.046,.008,.007),9,0,-.065,-.09));
 if(female)parts.push(femaleHair14(profile.elder?'low-bun':profile.kimono?'tucked':'bun',post));
 if(profile.archetype===7)parts.push(kazuoLoft([[.11,.102,.095],[.17,.096,.09]],8,4));
 return kazuoMerge(parts);
 });}
function crowdLimb(key){return importantCached('crowd-limb-'+key,()=>{
 if(key==='thigh')return kazuoLoft([[.015,.105,.105],[-.24,.10,.10],[-.46,.076,.079]],8,1);
 if(key==='calf')return kazuoLoft([[.025,.077,.079],[-.12,.082,.083],[-.43,.054,.057]],8,1);
 if(key==='foot')return kazuoLoft([[-.08,.085,.12,0,-.06],[-.02,.09,.145,0,-.055],[.09,.055,.06]],8,5);
 if(key==='hips')return kazuoLoft([[.84,.18,.115],[.94,.20,.13],[1.01,.19,.12]],8,1).translate(0,-.92,0);
 if(key==='upper')return kazuoLoft([[.05,.04,.05],[0,.09,.092],[-.17,.084,.085],[-.33,.066,.069]],8,13);
 if(key==='forearm')return kazuoLoft([[.02,.066,.069],[-.13,.061,.065],[-.29,.042,.046]],8,13);
 return kazuoMerge([kazuoPiece(new THREE.SphereGeometry(1,6,4),2,0,-.045,0,.046,.08,.033),kazuoPiece(new THREE.SphereGeometry(1,5,3),2,.04,-.025,0,.020,.038,.02)]);
 });}
function crowdTornLimb(key,severe=false,side=0,covered=false){return injuryLimb(key,covered?'covered':severe?'severe':'light',side,8);}
function createCrowdModel(profile){
 const model=createImportantModel(profile),r=kazuoRig(model),set=(name,g)=>{model.getObjectByName(name).geometry=g;};
 set('kazuo-chest',crowdChest(profile));set('kazuo-hips',crowdLimb('hips'));set('kazuo-head',crowdHead(profile));if(profile.female){r.head.userData.postGeometry=crowdHead(profile,true);r.head.userData.severeGeometry=r.head.userData.postGeometry;}if(profile.child)r.head.scale.set(.94,.88,.94);
 const chest=r.chest;chest.userData.postGeometry=crowdChest(profile,'light');chest.userData.severeGeometry=crowdChest(profile,'severe');if(profile.child)chest.userData.clothedGeometry=crowdChest(profile,'covered');
 model.getObjectByName('kazuo-cap').visible=false;model.getObjectByName('kazuo-brim').visible=false;
 for(let i=0;i<2;i++)for(const [name,key]of [['thigh','thigh'],['calf','calf'],['foot','foot'],['sleeve','upper'],['forearm','forearm'],['hand','hand']]){
  const m=model.getObjectByName('kazuo-'+name+'-'+i);m.geometry=crowdLimb(key);if(key==='upper'||key==='forearm'){m.userData.postGeometry=crowdTornLimb(key,false,i);m.userData.severeGeometry=crowdTornLimb(key,true,i);if(profile.child)m.userData.clothedGeometry=crowdTornLimb(key,false,i,true);}
  if(key==='hand'&&i===0)m.geometry=importantCached('crowd-hand-mirror',()=>{const g=m.geometry.clone().scale(-1,1,1),a=g.index.array;for(let j=0;j<a.length;j+=3){const t=a[j+1];a[j+1]=a[j+2];a[j+2]=t;}return g;});
 }
 model.traverse(m=>{if(m.isMesh)m.material=crowdMaterial();});return model;
}
function crowdProne(n){return worldState===WORLD_STATE.POST_BLAST&&['DOWN','DEAD','CHILD_DEAD'].includes(n.postBlastState);}
function crowdLowPose(n){return crowdProne(n)?'down':worldState===WORLD_STATE.POST_BLAST&&n.postBlastState==='STATIC'?'seated':'standing';}
function crowdLowGeometry(p,pose,style='pre'){return importantCached('crowd-low-'+(p.child?'child':p.female?'female':'man')+pose+style,()=>{
 let g=importantLowGeometry(p,pose==='seated').clone();
 if(style!=='pre'){g=g.toNonIndexed();const uv=g.attributes.uv,a=g.attributes.position;for(let i=0;i<a.count;i+=3){const region=Math.floor(uv.getX(i)*4)+Math.floor(uv.getY(i)*4)*4,x=(a.getX(i)+a.getX(i+1)+a.getX(i+2))/3;if([0,13].includes(region)&&(style==='severe'||x<0))for(let j=0;j<3;j++)uv.setXY(i+j,uv.getX(i+j)+(2-region%4)/4,uv.getY(i+j)-Math.floor(region/4)/4); }g.setIndex(Array.from({length:a.count},(_,i)=>i));}
 if(pose==='down'){g.rotateX(-Math.PI/2);g.computeBoundingBox();g.translate(0,-g.boundingBox.min.y,0);}return g;
 });}
function poseCrowd(model,n,p,dt){
 const r=kazuoRig(model),post=worldState===WORLD_STATE.POST_BLAST,dead=n.postBlastState==='DEAD'||n.postBlastState==='CHILD_DEAD';
 animateKazuo(model,n.phase,n.moving?(post?.45:1):0,false,dt,!!n.conversing);r.skeleton.rotation.set(0,0,0);r.skeleton.position.y*=p.child?.64:1;
 if(worldState===WORLD_STATE.EVENT_0815){r.skeleton.rotation.set(n.eventTilt||0,0,n.eventRoll||0);return;}
 if(!post){if(p.elder){r.spine.rotation.x-=.09;r.head.rotation.x=.06;}return;}
 if(crowdProne(n)){
  poseKazuo(model,false);r.skeleton.rotation.set(Math.PI/2-.04,0,.08);r.spine.rotation.x=-.06;r.head.rotation.x=.13;
  r.legs[0].rotation.x=.03;r.legs[1].rotation.x=.02;r.knees[0].rotation.x=0;r.knees[1].rotation.x=0;r.arms[0].rotation.x=.10;r.arms[1].rotation.x=-.10;r.elbows[0].rotation.x=.20;r.elbows[1].rotation.x=.35;r.chest.scale.z=1+(dead?0:Math.sin((n.postTimer||0)*1.7)*.005);
 }else if(n.postBlastState==='STATIC'){
  poseKazuo(model,true);r.spine.rotation.x=-.20;r.head.rotation.x=.12;r.arms[0].rotation.x=.35;r.arms[1].rotation.x=.2;
 }else{r.spine.rotation.x-=p.elder?.20:.12;r.head.rotation.x=.10;r.elbows[0].rotation.x=.7;}
}
function storyGroundMin(model,prone=false){
 if(!prone)return importantFootMin(model);model.updateWorldMatrix(true,true);let min=Infinity;const b=new THREE.Box3();model.traverse(m=>{if(m.isMesh&&m.visible){if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();b.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);min=Math.min(min,b.min.y);}});return min;
}
// Masami keeps the Stage 2 face, proportions and joints. Clothing is a visual shell only.
function masamiBlouse(post=false){return importantCached('masami-blouse-'+post,()=>{
 const rings=[[.88,.198,.12],[1.02,.18,.124],[1.19,.211,.144],[1.34,.222,.14],[1.43,.215,.115],[1.47,.16,.09]],cloth=kazuoLoft(rings,12,0);
 if(post)storyCutGeometry(cloth,(x,y,z)=>x<-.12&&y>1.29||x>.06&&y<1.03&&z<-.02);
 const parts=[cloth,kazuoLoft([[1.45,.059,.06],[1.60,.055,.056]],10,2)];
 if(post)parts.push(kazuoLoft(rings.map(([y,x,z],i)=>[y+(i===0?.006:i===rings.length-1?-.006:0),x*.93,z*.93]),12,11)); // modest inner blouse under torn hem/shoulder
 for(const side of [-1,1])parts.push(kazuoPiece(new THREE.BoxGeometry(.045,.15,.013),11,side*.05,1.40,-.124,1,1,1,0,side*.32));
 // Shallow creases belong to the blouse surface, never separate hanging rods.
 const a=cloth.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i),x=a.getX(i);if(y<1.24&&a.getZ(i)<-.07)a.setZ(i,a.getZ(i)-.004*Math.sin(x*76+y*13));}cloth.computeVertexNormals();
 return kazuoMerge(parts).translate(0,-1.15,0);
 });}
function masamiSleeve(post=false){return importantCached('masami-sleeve-'+post,()=>{
 const cloth=kazuoLoft([[.05,.045,.05],[0,.102,.10],[-.15,.102,.095],[-.32,.072,.073]],10,13);
 if(!post)return cloth;
 storyCutGeometry(cloth,(x,y,z)=>y<-.19&&x<.03||y<-.07&&x<-.055&&z<.035);
 const skin=kazuoLoft([[.035,.066,.069],[-.15,.067,.068],[-.33,.061,.062]],10,2);return kazuoMerge([skin,cloth]);
 });}
function applyMasamiClothes(model){
 const chest=model.getObjectByName('kazuo-chest');chest.geometry=masamiBlouse();chest.userData.postGeometry=masamiBlouse(true);
 for(let i=0;i<2;i++){
  model.getObjectByName('kazuo-forearm-'+i).userData.postGeometry=injuryLimb('forearm','mild',i,10);
  const sleeve=model.getObjectByName('kazuo-sleeve-'+i);sleeve.geometry=masamiSleeve();sleeve.userData.postGeometry=masamiSleeve(true);
  model.getObjectByName('kazuo-thigh-'+i).geometry=importantCached('masami-monpe-thigh',()=>kazuoLoft([[.015,.105,.105],[-.12,.113,.111],[-.29,.101,.095],[-.46,.075,.077]],10,1));
  model.getObjectByName('kazuo-calf-'+i).geometry=importantCached('masami-monpe-calf',()=>kazuoLoft([[.025,.077,.079],[-.13,.091,.091],[-.31,.068,.07],[-.43,.052,.055]],10,1));
 }
}
