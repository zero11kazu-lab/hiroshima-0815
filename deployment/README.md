# 配信設定の引き継ぎ

ゲームは静的ファイルで配信できます。公開するルートは `dist/` です。
`dist/` の中身をそのまま配信し、画像・PDFの相対パスを保ってください。
JS・CSS・JSONはビルド済みHTMLに同梱されています。

元プロジェクトのSites設定は `static.directory = dist` でした。
個人用のproject_idと接続情報は除外し、構造だけを `static-hosting.example.json` に保存しています。
これは設定例であり、実際のデプロイを実行する設定ファイルではありません。

このバックアップにCloudflareの認証情報、アカウントID、wrangler設定、Worker bindingsは含まれません。
この制作環境では既存Workerの管理設定を取得できていないため、推測の設定を作っていません。
既存Worker `hiroshima-0806` を更新するときは、認証可能な環境で次を先に確認してください。

1. アカウントと既存Workerの同一性。
2. 現在のデプロイ/バージョン、スクリプト、静的assets設定、bindings、routes。
3. 現行版のバックアップとロールバック方法。
4. 既存Workerの設定を維持した、`dist/` を配信する方法。

Workerを新規作成・削除しないでください。この移管作業ではCloudflareへデプロイしません。
自動デプロイ用のGitHub Actionsや認証用シークレットは追加していません。
