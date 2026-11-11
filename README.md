# HIROSHIMA 08:15 — Version 1.4 完成版ソース

制作・テスト済みのVersion 1.4を保存したソース一式です。新たにゲームを作り直したものではありません。
`dist/index.html` と実行用アセットは正式公開版と同一です。ゲームコード・データ・素材は改変していません。
出所と各ファイルのSHA256は `SOURCE_PROVENANCE.json` に記録しています。

- 正式公開版の元コミット: `f5c6284d3da7d4186af6c41eb70b92f85c866302`
- 最終テスト版の元コミット: `8da0c0d0fd7f80bb654f3dbbac2a5f7cf1377649`
- 両者の差はVersion 1.4のタイトル表示と、ビルド時の画像・PDFキャッシュ識別子です。
- ミッション1→2→3「生きる道」→マサミ探索→エンディングA/Bという完成版の進行を含みます。

## 復元・起動

1. ZIPを展開するか、このリポジトリをcloneします。
2. Python 3を使って、展開したフォルダで次を実行します。

```sh
python3 -m http.server 8000 --directory dist
```

3. PCでは `http://localhost:8000/` を開きます。

ビルド済み `dist/` が同梱されているため、起動だけならビルドやnpm installは不要です。
iPhone Safariでの確認には、`dist/` の内容をHTTPSの静的配信先へ配置してください。
iPhoneからPCのlocalhostは開けません。Safariでは最初のタップで音声の再生が許可されます。

## ソースから再ビルド

Python 3標準ライブラリだけでビルドできます。

```sh
python3 build.py
```

`src/index.template.html` 内のHTML/CSS、ローカルのThree.js、ゲームJS、JSONデータを
`dist/index.html` にまとめ、`assets/` を `dist/assets/` へコピーします。
CSSはテンプレート内にあります。CSSファイルが別に存在しないことは欠損ではありません。
新規フォルダを使う場合も、同梱の `dist/` を含めて復元してください。

## ファイル構成

- `src/`: ゲーム・人物・街並み・カメラ・入力・ミッション・音声生成のJSとHTML/CSSテンプレート。
- `src/vendor/three.min.js`: Three.js r160（ローカル同梱）。
- `data/`: 地理、街区、配置候補、会話等のJSON。
- `assets/`: タイトル背景、エンディング背景、歴史考証・マップ設計PDF、背景写真の出典。
- `dist/`: ビルド済みゲームと配信用アセット。
- `tests/`: 開発時の自動検証。古い段階向けの試験も含むため、すべてを現行版の合格条件とは扱わないでください。
- `docs/`: 調査・変更・検証記録と比較画像。古い報告はその時点の記録です。
- `docs/history/`: 元のREADME・検証説明を歴史資料として保存。
- `deployment/`: 個人設定を含まない配信説明・静的配信設定例。
- `licenses/`: 同梱ライブラリのライセンス。

## モデル・テクスチャ・音声・フォント

人物、建物、市電、橋、瓦礫などの3D形状と多くのテクスチャはJS/Canvasで生成します。
BGM、効果音、環境音もWeb Audioで生成するため、外部のmp3等を必要としません。
そのため、独立したモデルファイルや音声ファイルがないことは欠損ではありません。
フォントはCSSで指定したブラウザー・OS標準フォントを利用します。

## 依存関係・資料・権利

- 実行に必要な外部CDN/API通信はありません。Three.js r160を同梱しています。
- ビルド: Python 3（追加パッケージ不要）。自動試験: Node.js（npm install不要）。
- Three.js: MIT。`licenses/three-r160-LICENSE.txt` を参照してください。
- タイトル写真: Oilstreet、CC BY 2.5。`assets/title/ATTRIBUTION.txt` とゲーム内クレジットを維持してください。
- 歴史考証PDF: `assets/docs/hiroshima_history_map_design.pdf`。元ファイルのまま保存しています。
- ゲーム内の広島市史料や写真ライセンスへのリンクは参考資料用です。オフラインではリンク先を閲覧できません。
- 本バックアップはゲーム全体に新しいライセンスを付与するものではありません。

## 検証の実行例

```sh
node tests/viewport-v14.cjs
node tests/bridge-camera-v14.cjs
node tests/bank-balance-v14.cjs
node tests/kazuo-model-v13.cjs v12-m3-EEW-01
node tests/kazuo-return-v13.cjs
```

これらは実際のThree.js形状・ゲーム状態を使いますが、DOMとWebGLRendererはスタブです。
ブラウザーの描画、音声の聞こえ方、iPhone Safari実機の操作やFPSを確認する代わりにはなりません。
バックアップからの再ビルド一致・検証結果は `docs/backup-validation.json` を参照してください。

## 除外したものと公開について

認証情報、APIトークン、秘密鍵、`.env`、`.git`履歴、個人用のSites設定、古いV1.0のZIPは含めません。
旧V1.0バックアップは元の作業環境に保持しています。今回のZIPをV1.0として扱わないでください。
過去の報告書中の個人用Site ID・URL・作業環境絶対パスは置換しました。

このソース移管ではV1.4テストサイト、既存Cloudflare Workerの設定・公開内容を変更していません。
Cloudflareの現行設定・bindings・デプロイ履歴は別環境で確認する必要があります。
既存Workerへ配置する場合は `deployment/README.md` を参照してください。
