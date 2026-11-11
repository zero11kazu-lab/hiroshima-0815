# HIROSHIMA 08:15 — 旧Version 1.0 復旧用引き継ぎ

これは旧Version 1.0の保管用ブランチです。Version 1.4の完成版ではありません。
GitHubのmainブランチやV1.4制作環境とは分離しています。
この引き継ぎではCloudflare Workerや公開サイトを更新していません。

## 保存内容

- `archives/HIROSHIMA_08_15_V1.0_COMPLETE_BACKUP.zip`: 以前作成した完全バックアップの原本と同一のコピー。
  - 4,299,943バイト。
  - SHA256: `9302855767defe7c9df01fc471ede09b1c9181fa7f7edfa2c177e2cde52211c4`
  - ソース、ビルド済みHTML、画像、PDF、音声・モデル生成コード、README、依存関係・ライセンス等を含みます。
- `public/`: 現在公開されている旧Version 1.0の公開用5ファイル。
- `VERIFICATION.json`: 原本・公開ファイル・現在のWorkerとの照合結果。
- `SHA256SUMS.txt`: この引き継ぎ一式のファイル照合用ハッシュ。

## 公開用5ファイル

1. `public/index.html`
2. `public/assets/title/dome.webp`
3. `public/assets/title/ATTRIBUTION.txt`
4. `public/assets/ending/memorial.webp`
5. `public/assets/docs/hiroshima_history_map_design.pdf`

CSS・JavaScript・JSON・Three.jsはHTMLに同梱されています。
音声はWeb Audio、モデル・多くのテクスチャはJS/Canvasで生成する構成です。
別の音声ファイルや3Dモデルファイルがないことは欠損ではありません。

## 新しいCodex環境への取得

V1.4の作業フォルダを上書きせず、別フォルダへ取得してください。

```sh
git clone --branch backup-v1.0 --single-branch https://github.com/zero11kazu-lab/hiroshima-0815.git hiroshima-v1-backup
cd hiroshima-v1-backup
sha256sum -c SHA256SUMS.txt
python3 -m zipfile -t archives/HIROSHIMA_08_15_V1.0_COMPLETE_BACKUP.zip
```

Gitを使わない場合は、GitHubでbackup-v1.0ブランチを選び、Code → Download ZIPを使用できます。
ZIPを展開した後、`archives/` と `public/` が存在することを確認してください。

## 復元・確認方法

公開用ファイルだけを確認する場合:

```sh
python3 -m http.server 8001 --directory public
```

ローカルブラウザーで `http://localhost:8001/` を開きます。
このコマンドはCloudflareへ公開しません。

ソースから確認する場合は、完全バックアップZIPを別フォルダへ展開し、
`HIROSHIMA_08_15_V1.0/source/` で `python3 build.py` を実行してください。
今回、一時展開・再ビルドしたHTMLが現在のWorkerのV1.0と完全一致することを確認しています。

完全バックアップの内部には、旧Sites用の `source/.openai/hosting.json` が含まれます。
内容は旧Siteの識別子とstaticディレクトリだけで、認証トークンは含みません。
これはCloudflareの設定ではありません。Cloudflareへの復旧には、別環境で確認した既存Worker設定・bindings・Version IDを使用してください。

## 照合と復旧情報の範囲

対象公開URL: https://hiroshima-0806.zero11-kazu.workers.dev
今回の確認時点では、公開用5ファイルすべてがHTTP 200で取得でき、
本ブランチのpublic/および完全バックアップ内の同じファイルとバイト単位で一致しました。
完全バックアップのZIP整合性・内部ハッシュ一覧・再ビルドも確認済みです。
秘密鍵・APIトークン等のパターン検査と参照可能な認証値の一致検査で該当はありません。

ここにはCloudflareのAPIトークン、アカウントID、Worker管理設定・bindingsの控え、
Cloudflare復旧用Version IDは含めていません。これらは管理APIを確認した環境で保持してください。
旧公開ファイルの復元と、Cloudflareのデプロイ履歴によるロールバックは別の復旧手段です。
このブランチの保存・取得だけで、Workerの更新やロールバックは実行されません。
