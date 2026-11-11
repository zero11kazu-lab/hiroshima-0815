// Fictional staging coordinates, to be replaced after historical location research.
const WORLD_STATE={PRE_BLAST:'PRE_BLAST',EVENT_0815:'EVENT_0815',POST_BLAST:'POST_BLAST'};
let worldState=WORLD_STATE.PRE_BLAST,playerMoveScale=1;
const BLAST_ORIGIN={x:GEO1945.hypocenter.x,z:GEO1945.hypocenter.z};
const POST_CONFIG={PLAYER_BLAST_NPC_RADIUS:30,PLAYER_DISTANCE:3.2,NPC_DISTANCE:2.5,
 BLACK_HOLD:3,RECOVERY_DURATION:3,STAND_DURATION:2,SLOW_WALK_DURATION:5};
const seeded09=i=>{let v=Math.imul(i+815,1103515245)+12345;return (v>>>0)/4294967296;};
