// Visual injury categories preserve V1.0 allocation. These are game art ratios, not historical statistics.
const injuryMaterialCache=new Map();
function injuryStyle(variant){return variant==='CLOTHED'?'covered':variant==='CLOTH_HALF'?'light':'severe';}
function injurySkinPixel(rgb,u,v,variant,salt=0){
 const charred=variant==='CHARRED',wide=['BURN_FULL','BURN_UPPER'].includes(variant),mild=['KAZUO_LIGHT','MASAMI_LIGHT','CLOTHED'].includes(variant);
 const wave=(Math.sin(u*13+salt)*Math.cos(v*11-salt*.3)+Math.sin((u+v)*23+salt)*.35)/1.35,
  grain=((Math.imul(Math.floor(u*61)+7,15731)^Math.imul(Math.floor(v*63)+salt*13+3,789221))>>>0)%101/100;
 if(charred)return [48,43,38].map((c,i)=>c*(.68+grain*.29)+[24,23,21][i]*Math.max(0,wave)*.40);
 const amount=mild?.16:wide?.76:variant==='CLOTH_HALF'?.37:.48,edge=Math.max(0,Math.min(1,(amount-(wave*.5+.5))/.16+.5));
 const red=[171,85,67],deep=[116,65,51],burn=red.map((c,i)=>c*(.78+grain*.22)+deep[i]*Math.max(0,-wave)*.16),soot=Math.max(0,wave-.30)*(mild?.18:.40);
 return rgb.map((c,i)=>(c*(1-edge)+burn[i]*edge)*(.94+grain*.09)*(1-soot));
}
function injuryTorso(p,style='light',sides=8){return importantCached('injury-torso-'+(p.female?'f':'m')+'-'+style+'-'+sides,()=>{
 const female=!!p.female,mild=style==='mild',covered=style==='covered',bare=style==='severe',rings=female?[[.89,.175,.11],[1.02,.17,.12],[1.17,.205,.14],[1.32,.225,.14],[1.43,.215,.115],[1.47,.16,.09]]:[[.89,.19,.115],[1.0,.205,.125],[1.17,.245,.145],[1.35,.26,.14],[1.45,.26,.12],[1.49,.19,.095]],cloth=kazuoLoft(rings,sides,0);
 storyCutGeometry(cloth,(x,y,z)=>covered?y<.98&&x<-.05&&z<0:mild?(x<-.14&&y>1.28&&z<-.02||x>.12&&y<1.06&&z<0):bare?!(x>.15&&y>1.28||y<.99&&x>.04):x<0);
 const skin=kazuoLoft(rings.map(([y,x,z],i)=>[y+(i===0?.006:i===rings.length-1?-.006:0),x*.90,z*.90]),sides,covered?11:2),pieces=[skin,cloth,kazuoLoft([[1.45,.057,.058],[1.60,.055,.056]],8,2)];
 // A plain inner chest wrap keeps female/child exposure restrained; arms and sides show damage.
 if(female&&!covered&&!mild)pieces.push(kazuoLoft([[1.16,.191,.126],[1.28,.204,.128],[1.34,.202,.122]],sides,11));
 if(covered||mild)for(const side of [-1,1])pieces.push(kazuoPiece(new THREE.BoxGeometry(.045,.07,.014),11,side*.05,1.43,-.12));
 else if(!bare)pieces.push(kazuoPiece(new THREE.BoxGeometry(.045,.07,.014),11,.05,1.43,-.12));
 return kazuoMerge(pieces).translate(0,-1.15,0);
 });}
function injuryLimb(key,style,side=0,sides=8){return importantCached('injury-limb-'+key+'-'+style+'-'+side+'-'+sides,()=>{
 const upper=key==='upper',rings=upper?[[.05,.045,.05],[0,.09,.092],[-.17,.084,.085],[-.33,.066,.069]]:[[.02,.066,.069],[-.13,.061,.065],[-.29,.042,.046]],cloth=kazuoLoft(rings,sides,13);
 storyCutGeometry(cloth,(x,y,z)=>style==='covered'?y<-.22&&x<-.02&&z<0:style==='mild'?y<-.13&&y>-.28&&x<-.025&&z<0:style==='severe'||style==='light'&&side===0?upper?y<-.015:true:y<-.24&&x<.02);
 const core=kazuoLoft(rings.map(([y,x,z],i)=>[y+(i===0?-.006:i===rings.length-1?.006:0),x*.73,z*.73]),sides,2);return kazuoMerge([core,cloth]);
 });}
function applyStoryInjuries(model,p){
 const chest=model.getObjectByName('kazuo-chest');chest.userData.postGeometry=injuryTorso(p,'light',12);chest.userData.severeGeometry=injuryTorso(p,'severe',12);chest.userData.clothedGeometry=injuryTorso(p,'covered',12);
 for(let i=0;i<2;i++)for(const [name,key]of [['sleeve','upper'],['forearm','forearm']]){const m=model.getObjectByName('kazuo-'+name+'-'+i);m.userData.postGeometry=injuryLimb(key,'light',i,10);m.userData.severeGeometry=injuryLimb(key,'severe',i,10);m.userData.clothedGeometry=injuryLimb(key,'covered',i,10);}
}
function storyInjuryVariant(p){
 if(p.key==='masami')return 'MASAMI_LIGHT';if(p.child)return 'CLOTHED';if(p.key==='evacuee')return 'CLOTH_HALF';
 const roll=hash10(NPC_DATA.findIndex(n=>n.id===p.id)+816);return roll<.30?'BURN_FULL':roll<.60?'BURN_PARTIAL':'CLOTH_HALF';
}
function preparePlayerInjuries(model){
 model.getObjectByName('kazuo-chest').userData.playerDamageGeometry=injuryTorso({female:false},'mild',12);
 for(let i=0;i<2;i++)for(const [name,key]of [['sleeve','upper'],['forearm','forearm']])model.getObjectByName('kazuo-'+name+'-'+i).userData.playerDamageGeometry=injuryLimb(key,'mild',i,10);
}
function playerInjuryMaterial(){
 if(injuryMaterialCache.has('player'))return injuryMaterialCache.get('player');
 const a=kazuoTexture('post').image,t=new THREE.DataTexture(a.data.slice(),a.width,a.height,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;
 for(let y=0;y<256;y++)for(let x=128;x<192;x++)if(y<64){const i=(y*256+x)*4,rgb=injurySkinPixel([t.image.data[i],t.image.data[i+1],t.image.data[i+2]],(x%64)/63,y/63,'KAZUO_LIGHT',4);for(let c=0;c<3;c++)t.image.data[i+c]=rgb[c];}
 t.needsUpdate=true;const m=new THREE.MeshLambertMaterial({map:t,color:'#ffffff'});injuryMaterialCache.set('player',m);return m;
}
function injuryLowGeometry(p,pose,style){return importantCached('story-injury-low-'+(p.child?'child':p.female?'female':'man')+pose+style,()=>crowdLowGeometry(p,pose,style).clone());}
