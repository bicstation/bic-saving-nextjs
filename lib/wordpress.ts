// lib/wordpress.ts

// 記事取得のベースURL
const WORDPRESS_API_URL = "http://blog.bic-saving.com/wp-json/wp/v2/posts";

// --- アフィリエイト定数 ---
// メルマガに記載されていたリンクシェアIDを暫定的に使用。
// 実際にはあなたのIDに置き換えてください。
const LINKSYNERGY_ID = "R9f1WByH5RE"; 
const DELL_OFFER_ID = "39250"; // DellのオファーID
const DELL_PROMO_OFFER_ID = "10003522"; // 例: 売れ筋・広告掲載モデルへのリンクID

// -----------------------------------------------------------
// 1. 記事 (Post) 関連の型定義
// -----------------------------------------------------------

// 描画されたコンテンツの基本型 (title, content, excerptなどで共通)
export interface RenderedContent {
    rendered: string;
    protected: boolean; // JSONデータで確認
}

// アイキャッチ画像 (FeaturedMedia) の型
export interface FeaturedMedia {
    source_url: string;
    media_details: {
        width: number;
        height: number;
    }
}

// 記事データ (Post) の型
export interface Post {
    id: number;
    slug: string;
    link: string; 
    title: RenderedContent;
    content: RenderedContent;
    date: string;
    
    // excerpt プロパティ全体をオプショナル ('?') にすることで、赤線が消えます。
    excerpt?: RenderedContent; 
    
    // _embed パラメータで取得される画像情報用のフィールド
    _embedded?: {
        'wp:featuredmedia'?: FeaturedMedia[];
    };
}


// -----------------------------------------------------------
// 2. カテゴリ (Category) 関連の型定義
// -----------------------------------------------------------

// WordPress カテゴリ（ターム）の型
export interface WPCategory {
    id: number;
    name: string;
    slug: string;
    count: number; // そのカテゴリに属する記事の数
}


// -----------------------------------------------------------
// 3. データ取得関数
// -----------------------------------------------------------

/**
 * 全記事一覧を取得する (アイキャッチ情報を含む)
 */
export async function getSalePosts(): Promise<Post[]> {
    // _embed を追加してアイキャッチ画像のURLを記事データに含める
    const res = await fetch(`${WORDPRESS_API_URL}?_embed`, {
        cache: 'force-cache'
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch WordPress posts: ${res.statusText}`);
    }

    return res.json();
}

/**
 * 特定のスラッグを持つ記事を取得する (アイキャッチ情報を含む)
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
    // スラッグでフィルタリングし、_embed を追加
    const res = await fetch(`${WORDPRESS_API_URL}?slug=${slug}&_embed`);
    
    if (!res.ok) {
        throw new Error(`Failed to fetch post by slug: ${res.statusText}`);
    }

    const posts: Post[] = await res.json();
    
    return posts.length > 0 ? posts[0] : null;
}

/**
 * カテゴリ一覧を取得する
 */
export async function getWPCategories(): Promise<WPCategory[]> {
    // WordPressのカテゴリAPIエンドポイント
    const CATEGORIES_API_URL = "http://blog.bic-saving.com/wp-json/wp/v2/categories";

    const res = await fetch(CATEGORIES_API_URL, {
        cache: 'force-cache'
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch WordPress categories: ${res.statusText}`);
    }

    return res.json();
}


// -----------------------------------------------------------
// 4. ヘルパー関数
// -----------------------------------------------------------

/**
 * 記事データからアイキャッチ画像URLを抽出する
 */
export function getFeaturedImageUrl(post: Post): string | null {
    const media = post._embedded?.['wp:featuredmedia'];
    if (media && media.length > 0) {
        // メイン画像（通常は最初の要素）のURLを返す
        return media[0].source_url; 
    }
    return null;
}

