// Newly written fictional post-event dialogue. No testimony is presented as a quotation.
const POST_DIALOGUE_BANK={
 DISORIENTED:[['何が起きたんだ……。一度、立ち止まらせてください。'],['何も見えなくなって……。まだ、耳がよく聞こえません。'],['さっきまで、ここに家が並んでいたのに……。']],
 SEARCHING:[['家族を探しているんです。通れる道を確かめながら……。'],['家へ戻りたいのですが、火で道が分からなくなってしまって。'],['離れてしまった人がいるんです。声の届く所から、探してみます。']],
 MOVING_SLOWLY:[['火のある方には近づかないで。少しずつ、道を確かめましょう。'],['煙が濃い所では立ち止まらず、薄い方へ抜けようと思っています。'],['大通りが塞がっています。脇の道を見ているところです。']],
 STATIC:[['今はここで、様子を見ています。そちらの道は通れましたか。'],['一緒にいた人を、ここで待っているんです。'],['煙の少ない方へ出たいのですが、少し休ませてください。']],
 DOWN:[['少し……待ってください……。'],['まだ、立てそうにありません。話は短く、お願いします。'],['……声は、聞こえています。今はここにいます。']]
};
const POST_PERSONAL_LINES=[
 '橋の方へ行くなら、まず火のない路地を確かめてください。','一緒にいた人と、交差点で離れてしまったんです。','店先にいたはずなのに、何がどちらにあるのか……。',
 '川の形は、まだ見えます。それを目印にしています。','踏み出す前に、足元の木片を見てください。','煙の向こうの声を、聞いていたところです。',
 '家のあった辺りへ、遠回りしてみようと思います。','角まで行って戻ってきました。あちらは火が強いです。','同じ通りなのに、目印がなくなってしまって。',
 'ここで少し、呼吸を整えています。','北の通りへ出られる道が、まだあるようです。','今は、はっきりしたことを言えなくて……。',
 '誰かの名前を呼ぶ声がしたのですが、姿は見えませんでした。','あの塀の残っている所まで、道を確かめていました。','川へ向かう人を、少し前に見ました。',
 '焦らず、火のない方から回ってください。','橋は見えますが、そこまでの大通りは塞がれています。','荷物は置いてきました。今は人を探しています。',
 '北の道は、煙の切れ目から見えました。','この辺りで、誰かを待っている人がいました。','私の店の前も、通り抜けられなくなっています。',
 '糸の包みのことは、今は構いません。通れる方から進んでください。','あなたも、ここへ戻ってきたんですね。まず足元を確かめて。','今は、聞こえたことを少しずつ伝えるしかありません。'];
function makePostDialogue(n){const data={};for(const [state,variants] of Object.entries(POST_DIALOGUE_BANK))data[state]=variants.map((pages,i)=>({id:`post-${n.id}-${state}-${i}`,pages:[...pages,i===0?POST_PERSONAL_LINES[n.index%POST_PERSONAL_LINES.length]:i===1?['すぐ先でも、道の様子を確かめてください。','無理に、火の間を通らないでください。','煙が薄い所で、また声をかけてください。'][n.index%3]:['今は、遠くのことまでは分かりません。','歩ける所を、ひとつずつ確かめています。','すみません、少し休んでから……。'][n.index%3]]}));
 if(n.id===PLAYER_PROFILE.spouseId)for(const state of Object.keys(data))data[state]=[{id:'post-masami-0',pages:['一雄「マサミ……。ここにいたのか。」','マサミ「一雄さん……。少し、ここで息を整えましょう。」']},{id:'post-masami-1',pages:['マサミ「大きな通りには、火が見えました。通れる方を一緒に確かめましょう。」']},{id:'post-masami-2',pages:['一雄「声が聞けてよかった。」','マサミ「急がず、足元を見ていきましょう。」']}];return data;}
function resolvePostDialogue(n,resolver){const h=resolver.historyFor(n),state=n.postBlastState||'DISORIENTED',pool=n.postBlastDialogue[state]||n.postBlastDialogue.DISORIENTED,node=resolver.choose(pool,h,'post-'+state);h.count++;h.lastId=node.id;return {...node,pages:[...node.pages],choices:[]};}
// Eight compass sectors, using the exact north vector displayed by the HUD.
function masamiBearing(from,to){
 const dx=to.x-from.x,dz=to.z-from.z,north=dx*WORLD_NORTH.x+dz*WORLD_NORTH.z,east=dx*(-WORLD_NORTH.z)+dz*WORLD_NORTH.x;
 return ['北','北東','東','南東','南','南西','西','北西'][(Math.round(Math.atan2(east,north)/(Math.PI/4))+8)%8];
}
function postMasamiInformation(n){
 const target=postMissions.masamiSearch?.position||postMissions.wife.position;
 const d=Math.hypot(target.x-n.position.x,target.z-n.position.z),direction=masamiBearing(n.position,target);
 const variant=Math.floor(hash10(postMissions.masamiSeed+n.index*37)*3);
 const building=world.buildings.some(b=>!['DESTROYED','COLLAPSED'].includes(b.postDamage)&&Math.hypot(b.position.x-target.x,b.position.z-target.z)<16);
 const cover=!!hazards.finalCover?.children.length;
 const detail=building?'建物の残っている辺り':cover?'崩れかけた塀の辺り':'その先の道';
 if(d<18){const lines=[`似た方なら、${direction}の${detail}で見かけました。`,`女の人が、${direction}の方で休んでいました。${detail}だったと思います。`,`その方かもしれません。${direction}の${detail}を、確かめてみてください。`];return {level:'uncertain-near',stage:4,pages:[lines[variant],'遠くからでは、顔までは分かりませんでした。通れる方から……。'],summary:`近くの${direction}側、${detail}に似た人がいたという。`};}
 if(d<45){const lines=[`女性が${direction}側の通りへ歩いていくのを見ました。`,`似た方が、${direction}の方へ向かっていたような……。`,`名前は分かりませんが、${direction}の道へ進む女性なら見かけました。`];return {level:'direction',stage:3,pages:[lines[variant],'火の強い通りを避けて、外側から回ってみてください。'],summary:`この辺りから${direction}へ。通れる道で確かめる。`};}
 const lines=[`はっきりしませんが、${direction}の方へ行った人を見た気がします。`,`${direction}の方で、女性の姿を見たような……。遠くて、顔は分かりませんでした。`,`女性なら何人か、${direction}の道へ向かっていました。その方かどうかまでは……。`];
 return {level:'older-information',stage:2,pages:[lines[variant],'通ってきた人にも、尋ねてみてください。遠くの様子までは分からなくて……。'],summary:`${direction}の方に人影があったという。途中でもう一度尋ねる。`};
}
