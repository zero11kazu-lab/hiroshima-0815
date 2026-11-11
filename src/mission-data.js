// One short errand, with no inventory/reward/real-person testimony attached.
const MISSION_DATA=[{
 id:'morning-delivery',title:'朝の届け物',description:'米穀店で預かった糸の包みを、仕立て仕事をする澄江さんに届ける。',giverNpcId:'citizen-21',targetNpcId:'citizen-22',state:'inactive',reward:null,
 objective:{inactive:'米穀店の村田清吉さんと話そう',active:'井上澄江さんに糸の包みを届ける',completed:'届け物を終えた。街を歩いてみよう'},
 offer:{id:'delivery-offer',pages:['そうだ、澄江さんの糸の包みを預かっていてね。','西の路地を抜けた仕立ての店まで、届けてもらえるかい？'],choices:[{label:'引き受ける',action:'accept'},{label:'今はやめておく',action:'decline'}]},
 accepted:{id:'delivery-accepted',pages:['ありがとう。井上澄江さんは、北西の仕立ての店先にいるよ。','小さな印を目当てにしておくれ。急がなくて大丈夫だよ。']},
 giverActive:[{id:'delivery-remind-0',pages:['預けた糸の包み、お願いするね。','澄江さんは、西の路地を抜けた店先にいるよ。']},{id:'delivery-remind-1',pages:['道は分かりそうかい？','細い路地を北へ抜けて、左の仕立ての店だよ。']},{id:'delivery-remind-2',pages:['頼まれ事を引き受けてくれて、うれしいよ。','用事を終えたら、また顔を見せておくれ。']}],
 targetActive:{id:'delivery-handover',pages:['清吉さんから、私に包みを預かってきてくれたの？','糸を頼んでいたのよ。ここで受け取ってもいいかしら。'],choices:[{label:'包みを渡す',action:'complete'},{label:'まだ渡さない',action:'decline'}]},
 targetActiveAlternates:[{id:'delivery-handover-1',pages:['あら、その包みは私に？','清吉さんに頼んでいた糸かしら。受け取ってもいい？'],choices:[{label:'包みを渡す',action:'complete'},{label:'まだ渡さない',action:'decline'}]},{id:'delivery-handover-2',pages:['届け物の用で来てくれたのね。','もし私あての糸なら、ここで預かるわ。'],choices:[{label:'包みを渡す',action:'complete'},{label:'まだ渡さない',action:'decline'}]}],
 delivered:{id:'delivery-thanks',pages:['ありがとう。ちょうど使いたかった糸なの。','届けてくれて助かったわ。清吉さんにも、よろしくね。']},
 giverCompleted:[{id:'delivery-giver-done-0',pages:['澄江さんに渡してくれたんだね。ありがとう。','おかげで、こちらも店の仕事を続けられたよ。']},{id:'delivery-giver-done-1',pages:['あの包みは、無事に届いたんだね。','顔なじみに頼めると、ありがたいものだよ。']},{id:'delivery-giver-done-2',pages:['今朝はひと手間かけてもらったね。','用事が済んだら、あとはゆっくり街を歩いておいで。']}],
 targetCompleted:[{id:'delivery-target-done-0',pages:['さっきの糸は、棚にしまっておいたわ。','これで、朝の縫い物を続けられる。ありがとう。']},{id:'delivery-target-done-1',pages:['届けてもらった糸、布の色にちょうど合いそうよ。','また近くを通ったら、顔を見せてね。']},{id:'delivery-target-done-2',pages:['今朝は、ずいぶん助けてもらったね。','お礼を言えるうちに、もう一度。ありがとう。']}]
}];
