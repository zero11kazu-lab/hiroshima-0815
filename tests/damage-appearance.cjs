const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const THREE=require('../src/vendor/three.min.js');
const ctx=vm.createContext({THREE,console,assert});
vm.runInContext(`const geometries={box:new THREE.BoxGeometry(),cylinder:new THREE.CylinderGeometry()};const mat=c=>new THREE.MeshLambertMaterial({color:c});let worldState='PRE';const WORLD_STATE={POST_BLAST:'POST'};const PLAYER_PROFILE={spouseId:'wife'};const POST_MISSION_DATA={maleId:'mission-man'};const pos={x:0,z:0};`,ctx);
vm.runInContext(fs.readFileSync('src/survival-data.js','utf8').match(/const hash10=.*;/)[0],ctx);
vm.runInContext(fs.readFileSync('src/npc.js','utf8'),ctx);
vm.runInContext(`
const people=Array.from({length:1000},(_,index)=>({index,id:'npc'+index,type:'man',position:{x:1,z:1},height:1,yaw:0,phase:0}));people[0].id='wife';people[1].type='child';
const scene=new THREE.Scene(),visuals=new NPCVisuals(scene,people),before=Array.from(visuals.boxes.instanceColor.array);
for(const n of people)visuals.write(n,true);
worldState='POST';const counts={};
for(const n of people){n.postBlastState='DOWN';visuals.write(n,true);counts[n.damageAppearance]=(counts[n.damageAppearance]||0)+1;}
assert.equal(people[0].damageAppearance,'MASAMI_LIGHT');assert.equal(people[1].damageAppearance,'CLOTHED');
assert(counts.CHARRED>300&&counts.CHARRED<400);assert(counts.BURN_FULL>200&&counts.BURN_FULL<300);
const walkingCounts={};for(const n of people){n.postBlastState='MOVING_SLOWLY';n.moving=true;visuals.write(n,true);assert.notEqual(n.damageAppearance,'CHARRED');walkingCounts[n.damageAppearance]=(walkingCounts[n.damageAppearance]||0)+1;}
for(const [variant,target] of [['BURN_FULL',.3],['BURN_PARTIAL',.3],['CLOTH_HALF',.4]])assert(Math.abs(walkingCounts[variant]/998-target)<.04);
const half=people.find(n=>n.damageAppearance==='CLOTH_HALF');for(let k=0;k<visuals.parts;k++){const a=new THREE.Color(),b=new THREE.Color();visuals.boxes.getColorAt(half.index*visuals.parts+k,a);visuals.boxes.getColorAt(people[0].index*visuals.parts+k,b);assert(a.equals(b));}
console.log('PASS: walking ratios',walkingCounts,'; half-clothed palette matches Masami');
assert.equal(scene.children.length,5);assert([...visuals.boxes.instanceMatrix.array].every(Number.isFinite));
worldState='PRE';for(const n of people)visuals.write(n,true);assert.deepEqual(Array.from(visuals.boxes.instanceColor.array),before);
worldState='POST';const wife=people[0];visuals.write(wife,true);const copy={...wife,roomAppearance:true};visuals.write(copy,true);assert.equal(copy.damageAppearance,'PRE');assert.equal(wife.damageAppearance,'MASAMI_LIGHT');
console.log('PASS: fallen ratios',counts,'; no walking charred; protected wife/child; five batches; reset colors; room override');
`,ctx);
// Player damage must remain cloneable for the ending and restore shared materials.
const canvas={getContext:()=>({fillRect(){},beginPath(){},moveTo(){},lineTo(){},fill(){}})};
ctx.document={createElement:()=>canvas};
vm.runInContext(`let player=new THREE.Group();const torso=new THREE.Mesh(geometries.box,mat('#727a61'));player.add(torso);`,ctx);
vm.runInContext(fs.readFileSync('src/player.js','utf8'),ctx);
vm.runInContext(`const original=torso.material;setPlayerDamageAppearance(true);assert.notEqual(torso.material,original);player.clone(true);const damaged=torso.material;setPlayerDamageAppearance(false);assert.equal(torso.material,original);setPlayerDamageAppearance(true);assert.equal(torso.material,damaged);console.log('PASS: player clone, reset and cached materials');`,ctx);
