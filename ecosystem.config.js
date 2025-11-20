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
        
        // 既存の楽天アフィリエイトID (変更なし)
        RAKUTEN_AFFILIATE_ID: 'R9f1WByH5RE', 
        
        // ★★★ .bashrc から移植した LinkShare/Rakuten Marketing 変数 ★★★
        LS_3750988_HOST: 'aftp.linksynergy.com',
        LS_3750988_USER: 'rkp_3750988',
        LS_3750988_PASS: 'u5NetPVZEAhABD7HuW2VRymP', 
        LS_API_CLIENT_ID: 'ybRFc2fz6l9Wc1rDgywekOuMfBRzOyUO',
        LS_API_CLIENT_SECRET: '2J72oAHLaIbSocWC2RaA2Wm3oZ7TuLhL',
      },
    },
  ],
};