# 被爆後の生活小物と火災環境音

原因: World.garden / World.fence / World.propの配置が、建物・樹木の被爆後モデル切り替え対象に含まれていなかった。庭の柵は直接sceneへ追加され、庭本体とも別管理だった。

既存WorldにdomesticProps記録を統合。庭2・柵10・木箱1・樽1・手押し車1・井戸1を対象に、同一位置へ静的損傷variantを一度生成する。庭は焦げた土、乱れた畝、倒れた作物、短く傾いた支柱、落下した煤けた布、灰の断片を残す。柵は不連続な低い残骸へ、小物は既存モデルを再利用して焦げ・傾き・一部潰れた外観へ変更。元モデルは保持しRESET時に復元。生活小物のコリジョン・道路・ミッション配置・炎/煙の判定は変更なし。

postRootによる投下前後切り替え、既存距離カリング・共有geometry/material・材質単位の結合を使用。物理・パーティクル追加なし。再生成・RESETで損傷モデルを二重生成しない。

火災環境音はAmbientAudio.fireGain（1500Hz bandpassノイズの1ループ）。AMBIENT_MIX.postFire=0.5を導入し、初期gain .14→.07、位置別更新値(.12+heat/650)→その0.5倍。共通postBus .8、風 .27、BGM、声、水音、呼吸、足音、崩落音、8:15音響・タイトル/エンディング音楽の値は変更なし。元のstartPostはstopで旧ノードを停止・切断するため同じループの蓄積はなかった。

検証: tests/domestic-damage.cjs成功。対象16記録全てが損傷variantへ移行、元モデル非表示。RESETで投下前復元、再度被爆後へ入っても同じモデル参照を再利用。火災gain初期.07、位置別更新値も旧式の正確に0.5倍。再生5回で管理ノード数16のまま。BGMモードpost、postBus .8、風 .27を維持。ブラウザエラー0。

既存tests/default-mission-layout.cjsをGAME_TEST_URL=http://127.0.0.1:8091/?debug=1で実行: 12回RESET、各ミッションとマサミへの到達経路、既存火災/壁の保持、checkpoint再開の配置・seed維持を確認。

ビルド、JS構文、git diff --check成功。確認画角の描画191calls / 16576 triangles（端末FPS測定ではない）。iPhone Safari実機は未検証。重い物理や新たな毎フレームエフェクトは導入していない。
