// Fictional, non-graphic scenes. These are not records of real individuals.
const POST_LOCATION_DATA=HISTORICAL_DATA.post_locations_v12;
const POST_MISSION_STATES={
 M1_INACTIVE:'MISSION_1_INACTIVE',M1_ACTIVE:'MISSION_1_ACTIVE',M1_CHILD_FOUND:'MISSION_1_CHILD_FOUND',M1_RETURN:'MISSION_1_RETURN_TO_MOTHER',M1_COMPLETED:'MISSION_1_COMPLETED',
 M2_INACTIVE:'MISSION_2_INACTIVE',M2_ACTIVE:'MISSION_2_ACTIVE',M2_WATER_COLLECTED:'MISSION_2_WATER_COLLECTED',M2_RETURN:'MISSION_2_RETURN',M2_COMPLETED:'MISSION_2_COMPLETED',M3_INACTIVE:'MISSION_3_INACTIVE',M3_ACTIVE:'MISSION_3_ACTIVE',M3_ESCORT:'MISSION_3_ESCORT',M3_ARRIVED:'MISSION_3_ARRIVED',M3_COMPLETED:'MISSION_3_COMPLETED',FIND_MASAMI:'FIND_MASAMI_ACTIVE'};
const POST_MISSION_DATA={childBuildingId:'block-17',motherId:'citizen-02',childId:'citizen-04',maleId:'citizen-05',requesterId:'citizen-06',evacueeId:'citizen-07',
 motherPosition:{...POST_LOCATION_DATA.sites[0].position},childPosition:{...POST_LOCATION_DATA.sites[1].position},malePosition:{...POST_LOCATION_DATA.sites[12].position},hydrantPosition:{...POST_LOCATION_DATA.sites[14].position},MASAMI_MIN_DISTANCE:45,
 missions:[{id:'post-child',title:'子どもを探して',giverNpcId:'citizen-02',targetNpcId:'citizen-04',state:'MISSION_1_INACTIVE'},
 {id:'post-water',title:'水をくれ',giverNpcId:'citizen-05',targetNpcId:'broken-hydrant',state:'MISSION_2_INACTIVE'},
 {id:'post-living-path',title:'生きる道',giverNpcId:'citizen-06',targetNpcId:'citizen-07',state:'MISSION_3_INACTIVE'}]};
const POST_SCENES={
 motherOffer:{id:'post-mother-offer',pages:['子どもが見つからないんです。西の路地に、屋根の傾いた家が残っています。','お願いです。あの辺りを、探してもらえませんか。'],choices:[{label:'探す',action:'post-accept-child'},{label:'今はできない',action:'decline'}]},
 childAccepted:{id:'post-child-accepted',pages:['一雄「分かりました。通れる道から探してきます。」','「西側の路地です。半分残った屋根を、目印にしてください。」']},
 motherWaiting:{id:'post-mother-waiting',pages:['西側の路地に、傾いた屋根の家があります。','……どうか、あの子を。']},
 rescue:{id:'post-rescue',pages:['一雄「待ってろ。今、出してやる。」','子ども「お母さん……。」','瓦礫に手をかけ、動かそうとする。','一雄「聞こえるか。もう少し……。」','子どもから、応答がなくなった。','一雄「……聞こえるか。」']},
 childCheck:{id:'post-child-check',pages:['呼びかけても、応答はなかった。','一雄「……お母さんのところへ戻ろう。」']},
 motherReport:{id:'post-mother-report',pages:['一雄「傾いた屋根の家で、見つけました。」','一雄「出そうとしたのですが……。助けられませんでした。」','母親「……そう、ですか。」','一雄は、その場にしばらく立ち止まった。']},
 motherAfter:{id:'post-mother-after',pages:['母親は、子どものいた方を見つめている。','千田町の南側で、水を求めている人がいるようだ。']},
 maleEarly:{id:'post-male-early',pages:['「……水……。」','男性はその場に身を寄せている。']},
 maleOffer:{id:'post-male-offer',pages:['「水……水を……。」','西の道で、破損した住宅給水管から水の流れる音がする。'],choices:[{label:'水を探す',action:'post-accept-water'},{label:'今はできない',action:'decline'}]},
 waterAccepted:{id:'post-water-accepted',pages:['一雄「水を探してくる。ここで待っていてくれ。」','西へ続く道で、水音を確かめよう。']},
 maleWaiting:{id:'post-male-waiting',pages:['男性は、目を閉じたまま待っている。']},
 hydrant:{id:'post-hydrant',pages:['破損した住宅給水管から、水が流れている。','水を汲みますか？'],choices:[{label:'はい',action:'post-collect-water'},{label:'いいえ',action:'decline'}]},
 collected:{id:'post-water-collected',pages:['一雄は水を汲んだ。','男性のもとへ戻ろう。']},
 maleDeadEarly:{id:'post-male-dead-early',pages:['呼びかけても、男性は応えない。','水を探し、もう一度戻ってこよう。']},
 maleConfirm:{id:'post-male-confirm',pages:['一雄「水を持ってきた。……聞こえるか。」','男性に、応答はなかった。','一雄は反応を確かめる。男性は、すでに亡くなっていた。','一雄「……マサミ。」']},
 maleAfter:{id:'post-male-after',pages:['男性は、呼びかけに応えない。']},
 down:{id:'post-down-check',pages:['一雄「声は、聞こえますか。」','短い応答が返る。今は、長く話せる様子ではない。']}
};
const POST_ROLE_VARIANTS={
 motherWaiting:[POST_SCENES.motherWaiting,{id:'post-mother-waiting-2',pages:['あの家の屋根だけが、傾いて残っているんです。','西の路地です。火のない方から……。']},{id:'post-mother-waiting-3',pages:['あの子の声が、聞こえた気がしたんです。','どうか、通れる道で確かめてください。']}],
 motherAfter:[POST_SCENES.motherAfter,{id:'post-mother-after-2',pages:['母親は、しばらく言葉を発しなかった。','一雄も、その場で息を整える。']},{id:'post-mother-after-3',pages:['「……探してくださって、ありがとう。」','小さな声が返ってきた。']}],
 maleEarly:[POST_SCENES.maleEarly,{id:'post-male-early-2',pages:['男性は、かすかに水を求めている。','まだ、長く話せる様子ではない。']},{id:'post-male-early-3',pages:['「……水を……。」','男性は身を動かさず、道の脇に座っている。']}],
 maleWaiting:[POST_SCENES.maleWaiting,{id:'post-male-waiting-2',pages:['「……頼む……。」','男性は、顔を上げようとしている。']},{id:'post-male-waiting-3',pages:['男性の呼吸が、わずかに聞こえる。','西の道の水音を確かめよう。']}]
};

// Explicit, prevalidated sites/sets. Coordinates are fictional staging, not surveyed addresses.
const MASAMI_SEARCH_RULES=Object.freeze({minimumDistance:45,minimumRoute:70,maximumRoute:240});
const MASAMI_SEARCH_CANDIDATES=POST_LOCATION_DATA.masami;
const MISSION1_SETS=POST_LOCATION_DATA.mission1,MISSION2_SETS=POST_LOCATION_DATA.mission2,MISSION3_SETS=POST_LOCATION_DATA.mission3;

const RESCUE_SCENES={
 early:{id:'post-rescue-early',pages:['「動けない知人がいるんです……。」','近くで助けを求める声がする。まずは、その人の話を聞こう。']},
 offer:{id:'post-rescue-offer',pages:['「知人が怪我をして、一人では避難できないんです。」','「どうか、手を貸してもらえませんか。」'],choices:[{label:'助けに行く',action:'post-accept-rescue'},{label:'今はできない',action:'decline'}]},
 accepted:{id:'post-rescue-accepted',pages:['一雄「通れる道から行ってみます。どの辺りですか。」','「煙の薄い道を確かめながら、お願いします。」']},
 patient:{id:'post-rescue-patient',pages:['「足に力が入らんのです……一人では、歩けなくて。」','一雄「肩につかまってくれ。ゆっくり行こう。」'],choices:[{label:'支えて避難する',action:'post-support-patient'},{label:'道を確かめる',action:'decline'}]},
 supporting:{id:'post-rescue-supporting',pages:['一雄「急がんでいい。歩幅を合わせよう。」','肩を支え、火と煙の薄い方へ歩き出す。']},
 moving:{id:'post-rescue-moving',pages:['一雄「つかまっていてくれ。ゆっくり行こう。」','「……ありがとうございます。」']},
 waiting:{id:'post-rescue-waiting',pages:['「あの人を……頼みます。」']},
 patientEarly:{id:'post-rescue-patient-early',pages:['倒壊物のそばで、動けずにいる人がいる。','助けを求める声の主に、様子を聞こう。']},
 arrived:{id:'post-rescue-arrived',pages:['一雄「ここは、今のところ火と煙が少ない。ここで助けを待とう。」','「……ありがとう。これから、どうなるんでしょう……。」','一雄「まだ分からん。今は、ここで休んでいてくれ。」']},
 after:{id:'post-rescue-after',pages:['怪我が治ったわけではない。避難した人は、その場で助けを待っている。']}
};
