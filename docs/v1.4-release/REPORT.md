# HIROSHIMA 08:15 Version 1.4 正式公開

既存の正式Site `REDACTED_SITE_ID` とURLを維持。
検証済みゲームの基準コミット: `8da0c0d0fd7f80bb654f3dbbac2a5f7cf1377649`（V1.4テストサイト保存版14）。
正式公開前のコミット: `3ecb6ad83845c91206916d22a48041ae858df37c`（正式サイト保存版32）。

ゲームJS・データ・素材は検証済みコミットとバイト単位で同一。
公開用差分はブラウザタイトル・タイトル下部のVersion 1.4表示、画像とPDFへの内容ハッシュクエリ、正式Siteのhosting.json。
画像/PDFは従来の相対パスを維持し、`?v=<SHA256先頭16桁>`で旧キャッシュの混在を回避。
HTML・JS・データは一つのHTMLに同梱。既存サーバーの `Cache-Control: public, max-age=0, must-revalidate` を公開後も確認する。
Service Workerは追加せず、localStorageやゲームの保存内容を消去しない。

## バックアップと復旧

`dist/downloads/HIROSHIMA_08_15_V1.0_COMPLETE_BACKUP.zip` は4,299,943バイトのまま保持。
SHA256: `9302855767defe7c9df01fc471ede09b1c9181fa7f7edfa2c177e2cde52211c4`。
正式公開直前のHTMLをHTTPで取得し、旧コミットのdist/index.htmlとの一致を確認。
旧配信一式のtar.gz、Git履歴bundle、既存ZIPの別コピー、旧デプロイ・設定情報を公開外のバックアップフォルダに保存。
tar.gzを一時展開し、全配信ファイルが旧コミットと一致することを検証。bundle verifyも成功。

復旧用保存版ID:
`REDACTED_SITE_ID~appgver_389ca5bb9d808191bc3f886d1d9aa97b`。
同じ正式Siteへこの保存版を再デプロイすれば、V1.0へ復旧できる。
ソースも正式公開コミットの直前に旧コミットを保持し、公開コミットをrevertして再公開する復旧方法を残す。
V1.4テスト環境は更新せず、そのコミット・URL・設定を維持する。

## 検証の範囲

Three.jsの実際のシーン・ゲーム状態を使い、縦横リサイズ、開始・東西ランダム配置1,000回、橋のカメラ120ケース、ミッション1→2→3→マサミ再会、エンディングA/B、慰霊碑・「完」、RESET・タイトル復帰の自動テストを実行。
DOMとWebGLRendererはスタブであり、ブラウザ映像・音の聴取・iPhone Safari実機操作・実機FPS/メモリは今回の環境では未確認。
正式公開後はHTTP 200、配信HTMLとローカル成果物の完全一致、画像/PDF、バックアップZIP、ETagの旧値に対する再検証応答、V1.4テストサイトの未変更を確認する。

現在の正式サイトは所有者限定アクセス。今回その設定は変更しないため、所有者のログインが必要。
