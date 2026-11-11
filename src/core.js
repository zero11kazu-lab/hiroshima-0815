
'use strict';
const $=id=>document.getElementById(id);let renderer,scene,camera,player,legs=[],arms=[],started=false,last=0,phase=0,frames=0,fps=0,fpsTime=0;const input={x:0,y:0,id:null},keys=new Set(),walls=[],pos={x:0,z:10},camTarget=new THREE.Vector3();let yaw=0, cameraYaw=0, cameraAvoidYaw=0, cameraPitch=Math.atan2(2.35,5.6), cameraDistance=Math.hypot(5.6,2.35);
const cameraObstacles=[], cameraDirection=new THREE.Vector3();
let softenFoliage=false;
const normalCameraDistance=Math.hypot(5.6,2.35), cameraRadius=.25;
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

let npcManager=null,world=null;
const look={id:null,x:0,manualUntil:0};
const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,8),leaf:new THREE.IcosahedronGeometry(1,0)};
const mats={};function mat(c){return mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));}
function box(w,h,d,c,x,y,z,parent=scene){const m=new THREE.Mesh(geometries.box,mat(c));m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m;}
function cylinder(r,h,c,x,y,z,parent=scene){const m=new THREE.Mesh(geometries.cylinder,mat(c));m.scale.set(r,h,r);m.position.set(x,y,z);parent.add(m);return m;}
function block(x,z,w,d){walls.push({x,z,w:w/2+.28,d:d/2+.28});}
