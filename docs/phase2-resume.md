# フェーズ2 再開時の確認と仕上げ

開始時点：main / 3a2c19d2246a0be724db9369c75462656217ec0d。
既存サイトのリモートも同じコミット。変更済み20ファイル、前回追加のデータ・描画ヘルパー・資料・テストを確認。削除なし。ルートに残る旧試作の未追跡スクリーンショットや検証スクリプトは上書き・コミット対象にしない。

実装済み：地理JSON7種、出典台帳、2河川、御幸橋、電車通り、三つの専用公共建築、37棟、屋根・壁・路面の質感、25人のNPC、被害状態、炎・煙LOD。入力・会話・ミッション・BGM・エンディングは既存系統を維持。

今回の続き：母親・子ども・給水管の位置参照を既存world JSONへ統一（座標値は変更なし）。既存の通しテストへ3回リセット時の重複検査を追加。新しいManager・モデル・ゾーン・入力リスナーは追加していない。最終検証・ビルド・成果物整理・ソース保存・公開を実施。

入力：input.jsは試作11から未変更。Pointer Eventsと既存Touchフォールバックは同じ保持フラグを更新し、移動や体力を二重加算しない。リスナー登録は起動スクリプト1回、resetでは登録しない。NPCManager/World/各Missionは単一生成箇所。JSONのID・ビルド読込順は重複なし。

リセット検査：3回ともNPC25、建物37、火災32、煙34、投下後ミッション2、scene直下134。二重8:15発火なし。通しプレイの最終探索時は追加エリアを含め火災34・煙36、再会時HP84.5。

保存テスト結果：docs/qa/。テストはChromium/SwiftShaderとモバイルタッチエミュレーション。iPhone Safari実機、熱による長時間性能低下は未検証。texture atlasは未導入で、共有小型テクスチャ・材質別結合で代替。河岸線・道路線・模型外形の測量復元は今回の対象外で、データにゲーム用簡略配置と明記。

## 再開時の既存差分
```
M	build.py
M	dist/index.html
M	src/aftermath.js
M	src/bootstrap.js
M	src/camera.js
M	src/event0815.js
M	src/game.js
M	src/hazards.js
M	src/index.template.html
M	src/npc.js
M	src/player.js
M	src/post-mission-data.js
M	src/post-missions.js
M	src/post-npc.js
M	src/story-data.js
M	src/story.js
M	src/survival-data.js
M	src/world-data.js
M	src/world-state.js
M	src/world.js
```

## 再開時の新規ファイル
```
data/buildings_1945.json
data/fire_zones.json
data/landmarks_1945.json
data/postblast_damage.json
data/roads_1945.json
data/smoke_zones.json
data/sources.json
data/world_1945.json
docs/phase2-render-budget.json
docs/phase2-report.md
docs/qa/audio.txt
docs/qa/build.txt
docs/qa/camera.txt
docs/qa/complete.json
docs/qa/controls.txt
docs/qa/diff-check.txt
docs/qa/layout.txt
docs/qa/source-duplicates.txt
docs/qa/survival.txt
src/geography.js
src/visual-quality.js
tests/phase2-audio.cjs
tests/phase2-camera.cjs
tests/phase2-complete.cjs
tests/phase2-controls.cjs
```

## 既存テスト一覧

- tests/camera04.cjs
- tests/camera05.cjs
- tests/camera06.cjs
- tests/camera07.cjs
- tests/cluster10.cjs
- tests/controls-audio10r.cjs
- tests/controls06.cjs
- tests/controls07.cjs
- tests/controls08.cjs
- tests/controls09.cjs
- tests/crowd10.cjs
- tests/ending11.cjs
- tests/exploration10.cjs
- tests/framerate10r.cjs
- tests/geometry09.cjs
- tests/journey10r.cjs
- tests/layout06.cjs
- tests/layout10.cjs
- tests/live08.cjs
- tests/live09.cjs
- tests/live10.cjs
- tests/locations10.cjs
- tests/locations10r.cjs
- tests/npc05.cjs
- tests/npc06.cjs
- tests/npc07.cjs
- tests/performance04.cjs
- tests/performance05.cjs
- tests/performance06.cjs
- tests/performance07.cjs
- tests/performance09.cjs
- tests/phase2-audio.cjs
- tests/phase2-camera.cjs
- tests/phase2-complete.cjs
- tests/phase2-controls.cjs
- tests/post-bgm11.cjs
- tests/post-story10r.cjs
- tests/prototype04.cjs
- tests/prototype05.cjs
- tests/prototype06.cjs
- tests/prototype07.cjs
- tests/prototype08.cjs
- tests/prototype09.cjs
- tests/regression08.cjs
- tests/regression09.cjs
- tests/survival10.cjs
- tests/survival11.cjs

旧テストの歴代マップ固有座標や距離の期待値は、そのまま新マップの合否に用いない。layout10・survival11は同じテストを一時的にポート変更して再利用。今回用phase2テスト4本を再利用した。
