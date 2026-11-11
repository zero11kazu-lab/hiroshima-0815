// Renderer and lifecycle initialization happen after the user's start tap.
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#bfd8df');scene.fog=new THREE.Fog('#bfd8df',32,76);
 camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.1,130);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.setSize(Math.max(2,innerWidth),Math.max(2,innerHeight),false);renderer.outputColorSpace=THREE.SRGBColorSpace;$('game').appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight('#f8f3d9','#8b8374',1.8));const sun=new THREE.DirectionalLight('#fff0d3',1.8);sun.position.set(-20,35,15);scene.add(sun);
 world=new World(scene,WORLD_DATA);storyLayout=prepareStoryPopulation();createPlayer();cacheCameraObstacles();
 npcManager=new NPCManager(scene,NPC_DATA,worldAllowed);
 gameClock=new GameClock();missionController=new MissionController(npcManager,MISSION_DATA);dialogue=new DialogueController(npcManager,new DialogueResolver(missionController));storyController=new StoryController(npcManager,storyLayout);
 renderer.domElement.addEventListener('webglcontextlost',loseContext14);
 renderer.domElement.addEventListener('webglcontextrestored',restoreContext14);
 reset();resize();window.addEventListener('resize',scheduleViewportResize14);window.addEventListener('orientationchange',scheduleViewportResize14);window.visualViewport?.addEventListener('resize',scheduleViewportResize14);requestAnimationFrame(tick);
}
window.__game={getState:()=>({x:pos.x,z:pos.z,input:{...input},camera:camera?.position.toArray(),started,fps,worldState,playerMoveScale,yaw,cameraYaw,cameraAvoidYaw,cameraPitch,cameraDistance,normalCameraDistance,faded:cameraObstacles.filter(o=>o.faded).length,npcCount:npcManager?.people.length,visibleNPCs:npcManager?.visibleCount,drawCalls:renderer?.info.render.calls,quality:world?.quality,time:gameClock?.seconds,timeStopped:gameClock?.stopped,dialogueNPC:dialogue?.active?.id,talkTarget:dialogue?.target?.id,spatialChecks:npcManager?.grid.checks,replans:npcManager?.stats.replans,missionState:missionController?.state,dialogueNode:dialogue?.node?.id,story:storyController?.snapshot(),audio:morningAudio.snapshot()}),allowed,worldAllowed,getNPCs:()=>npcManager?.snapshots(),getMissions:()=>missionController?.snapshot(),getAmbient:()=>ambientAudio.snapshot(),getPostMissions:()=>postMissions.snapshot(),getSurvival:()=>survival.snapshot(),getHazards:()=>hazards.snapshot(),getAftermath:()=>aftermath.snapshot(),getEvent:()=>event0815.snapshot(),getStory:()=>storyController?.snapshot()};
