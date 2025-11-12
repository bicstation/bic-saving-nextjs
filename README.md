# 📚 README: Next.js 15 & React 19 対応 ECサイトプロジェクト

## 🚀 概要

本プロジェクトは、**Next.js 15 App Router**および**React 19**の最新仕様に完全対応した高性能なEコマースサイトのフロントエンド実装です。

BIC-SAVINGという架空のAPIから商品データを取得し、Server Components（RSC）を最大限に活用することで、
高速な初期ロードと優れたSEO性能を実現しています。

主な目的は、最新のNext.jsの機能（Server Actions、動的ルーティング、Metadata APIなど）を実践的に使用し、
モダンなWebアプリケーションを構築することです。

---

## 🛠️ 技術スタック

| カテゴリ | 技術/ツール | 目的と特徴 |
| :--- | :--- | :--- |
| **フレームワーク** | **Next.js 15 (App Router)** | Server Componentsを主体とした高速なレンダリングとルーティング。 |
| **言語** | **TypeScript** | 型安全性を確保し、大規模開発の堅牢性を向上。 |
| **UI/スタイル** | React.CSSProperties | 開発初期段階のためインラインスタイルを多用。将来的にTailwind CSSやCSS Modulesへの移行を推奨。 |
| **APIデータ** | カスタム (`/lib/data.ts`) | 外部ECサイトAPI (BIC-SAVINGを想定) とのデータ連携を抽象化。 |
| **デプロイ** | Vercel / VPS (Nginx) | 本番環境への迅速なデプロイをサポート。 |

---

## 💻 開発環境のセットアップ

### 1. リポジトリのクローン

```bash
git clone [YOUR_REPOSITORY_URL]
cd [project-directory]
2. 依存関係のインストールBashnpm install
# または
yarn install
3. 環境変数の設定プロジェクトルートに**.env.local**ファイルを作成し、以下の変数を設定してください。変数名説明例NEXT_PUBLIC_API_BASE_URL商品データを提供する外部APIのベースURLhttp://localhost:3001/apiNEXT_PUBLIC_PRODUCTION_URL本番環境のドメイン（SEOメタデータ生成に使用）https://www.bic-saving.com4. 開発サーバーの起動Bashnpm run dev
# または
yarn dev
ブラウザで http://localhost:3000 を開いてください。⚙️ プロジェクト・アーキテクチャ本プロジェクトは、Next.jsのApp Routerのベストプラクティスに基づき、責務を明確に分離しています。1. Server Components (RSC) の活用Page Files (/app/**/page.tsx): ほとんどのページは非同期の Server Component として動作します。searchParams を受け取り、データ取得（await getProducts(...)）とHTMLレンダリングを行います。データ層の分離 (/lib/data.ts): データ取得ロジック（API呼び出し）はすべてこのファイルに集約されています。2. Client Components ("use client")ユーザーとのインタラクションが必要なコンポーネントのみを Client Component として定義しています。/app/components/SearchBar.tsx: ユーザーの入力値を管理し、useRouter を使用してURLを更新（検索実行）します。/app/components/Pagination.tsx: useSearchParams と usePathname を利用して現在のURLに基づきページ遷移リンクを生成します。3. SEOとルーティング動的メタデータ (/product/[id]/page.tsx): generateMetadata 関数を Server Component と並行して実行し、商品データに基づいて <title>、OGP、Canonical URLを動的に生成します。構造化データ: 商品詳細ページなどでは、<script type="application/ld+json"> を直接レンダリングし、Product Schema などの構造化データを挿入しています。RSSフィード (/app/rss.xml/route.ts): Route Handler を使用して動的に RSS 2.0 フィードを生成し、最新の商品情報を提供します。⚠️ Next.js 15 & React 19 アップグレード変更点本プロジェクトは、将来の安定性を見据え、特に以下のNext.js 15/React 19に関する主要な変更に対応済みです。1. Client Component の安全性Pagination.tsx: useSearchParams が null を返す可能性に備え、安全な null チェックを導入し、堅牢性を高めています。2. 環境変数の統一管理全てのメタデータ生成ファイル（generateMetadata 関数内）および Route Handler (/rss.xml/route.ts) で、ハードコードされていたURLを process.env.NEXT_PUBLIC_PRODUCTION_URL に統一し、環境依存性の問題を解消しました。部署・担当者担当役割連絡先[氏名]フロントエンド開発 / Next.js 担当[連絡先][氏名]データ API 連携 / サーバーサイド担当[連絡先]