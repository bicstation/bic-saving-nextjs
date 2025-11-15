// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'bic-saving-next', // PM2で表示される名前
      script: 'npm',
      args: 'start', // Next.js の本番起動コマンド
      cwd: '/var/www/bic-saving.com', // 実行ディレクトリ
      exec_mode: 'fork',
      instances: 1,
      // 起動時に必要な環境変数をここで定義する
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.bic-saving.com',
        NEXT_PUBLIC_API_BASE_URL: 'https://api.bic-saving.com',
        RAKUTEN_AFFILIATE_ID: 'R9f1WByH5RE', // ★あなたのIDに置き換えてください★
      },
    },
  ],
};