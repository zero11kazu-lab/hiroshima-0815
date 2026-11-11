# 【完】からタイトルへ戻る

既存のTHE_END状態にのみ「タイトルへ戻る」を追加。【完】が出始める0.7秒から3秒後（THE_END経過3.7秒）に1.2秒かけて表示する。ボタンはそれ以前disabled、THE_END以外hidden。既存の文字・慰霊碑・テロップ・場面順序・音楽進行は変更しない。

クリックは既存のpointer遮断経由で1回のonclickのみ。下部中央、44px以上、safe-area-inset-bottom考慮。入力停止後、既存ending audioGainを0.35秒でフェードし、0.4秒後にreset。タイトルのbusy/leaving状態を戻し、既存titleAudioを開始。AudioContext・タイトル音源バッファは再利用。プレイのlocalStorage履歴は消さない。既存のresetによりmission/locationPlan/seed/clock/HP/heat/stamina/post-world/ending/dialogueを初期化。目的パネル・デバッグ表示など一時UIも初期表示へ戻す。次のSTART時に操作を有効化して既存開始処理へ入る。

node tests/ending-return.cjs成功: 3連続のタイトル復帰・START、ページload1回のみ、同一AudioContext、タイトル音源の再生、本編開始時タイトル音源停止、07:45/HP100/HEAT0/STAMINA100/inactiveミッション/未選択locationPlanを確認。localStorage履歴完全一致。3プレイでM1/M2の別セットが選択された。慰霊碑では非表示。3画面サイズ844×390・667×320・390×844でボタンが画面内、44px以上。ブラウザエラー0。

python build.py / node --check / git diff --check成功。iPhone相当のChromiumモバイル設定で確認。iPhone Safari実機は未検証。
