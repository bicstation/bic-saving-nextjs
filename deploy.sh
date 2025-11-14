#!/bin/bash

# --- 0. 環境変数とアプリ名の設定 ---
APP_NAME="bic-saving-app" # PM2で管理する一意のアプリケーション名
NEXT_PORT="3005"          # Next.jsアプリケーションの待ち受けポート (Nginxのproxy_passと合わせる)

# スクリプトの実行ディレクトリをプロジェクトルートに移動
# ※ このスクリプトが /var/www/bic-saving.com/ にある場合は不要ですが、デプロイの安全性を高めるために記述を推奨します。
# cd /var/www/bic-saving.com/


echo "--- 1. 既存のNext.jsプロセスを停止し、再起動準備 ---"
# 特定のアプリのみを停止・削除することで、他のプロセス(webhook-listenerなど)を保護します
pm2 stop $APP_NAME
pm2 delete $APP_NAME


echo "--- 2. Next.js ビルドキャッシュをクリア ---"
# .next/cache のみ削除 (ビルド関連のトラブル回避のため)
# sudo rm -rf .next/cache # 以前のビルド問題が解決していれば不要な場合もありますが、安全のために残します
rm -rf .next/cache

echo "--- 3. アプリケーションのクリーンビルド ---"
npm run build

# ビルドの成功を確認
if [ $? -ne 0 ]; then
 echo "❌ ビルドに失敗しました。スクリプトを中断します。"
 exit 1
fi

echo "--- 4. Next.jsサーバーをPM2でバックグラウンド起動 (ポート $NEXT_PORT) ---"
# npm run start -- -p $NEXT_PORT で指定ポートで起動します
pm2 start npm --name "$APP_NAME" -- run start -- --port $NEXT_PORT

echo "--- 5. PM2ステータスの確認 ---"
pm2 status

echo "✅ デプロイプロセスが完了しました。$APP_NAME が online であることを確認してください。"

# Nginxのリロードが必要な場合は、デプロイ完了後に別途手動で実行してください
# sudo systemctl reload nginx