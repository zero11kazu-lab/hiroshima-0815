# タイトル画面

原爆ドーム写真、START・チュートリアル・資料・クレジットを追加。
写真はOilstreet撮影、CC BY 2.5。作者・出典・ライセンス・加工をクレジットとassets/title/ATTRIBUTION.txtに記載。WebP約276KB。現在の原爆ドームを使った追憶の表現。

資料は添付PDFの原本をassets/docs/hiroshima_history_map_design.pdfに配置。29ページ、1,472,407 bytes。
SHA256: 360634576f175e33810c7e9cecd2c1c5f82423938bc46189c841094921ca375e
原本・dist内PDFのバイト一致、全29ページのレンダリングを確認。本文や図表の編集なし。
資料モーダル内のiframeと、新規タブでSafari標準PDF表示へ進むリンクを用意。ChatGPT内の添付リンクを使用せず、同一サイトの静的ファイルとして配信。既存サイトの公開範囲は変更しない。

タイトルBGMは独自の32秒ループをOfflineAudioContextで生成。再生は既存morningAudio.ctx/master/limiterを共用し、新たなリアルタイムAudioContextは作らない。メニューへの初回クリックで開始。START時0.4秒で音を絞り、元のSTART処理を呼ぶ。タイトルモーダルはゲームを初期化しない。

本編への変更は、スクロール可能なタイトル説明ウィンドウ内だけtouchmoveのページスクロール禁止対象から除外した1か所のみ。本編の移動・ミッション・イベント・音楽・エンディングのロジックは維持。

検証: python build.py / git diff --check / node tests/title-screen.cjs 成功。
844×390、667×320、568×320、390×844で4メニュー44px以上・画面内。説明スクロール、原本PDFのHTTP取得、クレジット、タイトル音楽、START後07:45・NPC25人・inactiveミッション・本編音楽を確認。ブラウザエラー0。
iPhone Safari実機は未検証。PDFは標準ビューアを併用可能。
