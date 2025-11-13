// lib/wordpress.ts

// 記事取得のベースURL
const WORDPRESS_API_URL = "http://blog.bic-saving.com/wp-json/wp/v2/posts";

// --- アフィリエイト定数 ---
const LINKSYNERGY_ID = "R9f1WByH5RE"; 
const DELL_OFFER_ID = "39250"; 
const DELL_PROMO_OFFER_ID = "10003522"; 

// -----------------------------------------------------------
// 1. 記事 (Post) 関連の型定義
// -----------------------------------------------------------

export interface RenderedContent {
    rendered: string;
    protected: boolean; 
}
export interface FeaturedMedia {
    source_url: string;
    media_details: {
        width: number;
        height: number;
    }
}
export interface Post {
    id: number;
    slug: string;
    link: string; 
    title: RenderedContent;
    content: RenderedContent;
    date: string;
    categories: number[]; 
    featured_media_url?: string; 
    excerpt?: RenderedContent; 
    _embedded?: {
        'wp:featuredmedia'?: FeaturedMedia[];
    };
}


// -----------------------------------------------------------
// 2. カテゴリ・タグ関連の型定義
// -----------------------------------------------------------

export interface WPCategory {
    id: number;
    name: string;
    slug: string;
    count: number; 
}

// ★★★ 追加: WordPress タグの型 ★★★
export interface WPTag {
    id: number;
    name: string;
    slug: string;
    count: number; 
}

// ★★★ 追加: 記事フィルタリング用のパラメータ型 ★★★
export interface FilterParams {
    category?: string | number; // カテゴリID
    tag?: string | number;      // タグID
}


// -----------------------------------------------------------
// 3. データ取得関数
// -----------------------------------------------------------

/**
 * 全記事一覧を取得する (カテゴリID/タグIDによるフィルタリングに対応)
 * @param params - オプションのフィルタリングパラメータ (categoryまたはtag)
 */
// ★★★ 修正: パラメータを FilterParams 型に変更し、タグ/カテゴリに対応 ★★★
export async function getSalePosts(params?: FilterParams): Promise<Post[]> {
    let url = `${WORDPRESS_API_URL}?_embed`;

    // カテゴリIDが存在する場合、APIクエリパラメータに追加
    if (params?.category) {
        url += `&categories=${params.category}`;
    }
    
    // タグIDが存在する場合、APIクエリパラメータに追加
    if (params?.tag) {
        url += `&tags=${params.tag}`;
    }
    
    const res = await fetch(url, {
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
    const CATEGORIES_API_URL = "http://blog.bic-saving.com/wp-json/wp/v2/categories";

    const res = await fetch(CATEGORIES_API_URL, {
        cache: 'force-cache'
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch WordPress categories: ${res.statusText}`);
    }

    return res.json();
}

/**
 * ★★★ 追加: タグ一覧を取得する関数 ★★★
 */
export async function getWPTags(): Promise<WPTag[]> {
    const TAGS_API_URL = "http://blog.bic-saving.com/wp-json/wp/v2/tags";

    // 記事のカウントが0より大きいタグのみを取得
    const res = await fetch(`${TAGS_API_URL}?orderby=count&order=desc&hide_empty=true&per_page=100`, {
        cache: 'force-cache'
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch WordPress tags: ${res.statusText}`);
    }

    return res.json();
}

/**
 * 全記事一覧を取得する (count件まで)
 */
export async function getPosts(count: number = 100): Promise<Post[]> {
    const res = await fetch(`${WORDPRESS_API_URL}?_embed&per_page=${count}`, {
        cache: 'force-cache'
    });
    
    if (!res.ok) {
        throw new Error(`Failed to fetch WordPress posts for static params: ${res.statusText}`);
    }

    const rawPosts: any[] = await res.json();
    return rawPosts.map(post => ({
        ...post,
        categories: post.categories, 
        featured_media_url: getFeaturedImageUrl(post as Post) 
    }));
}


// -----------------------------------------------------------
// 4. ヘルパー関数
// -----------------------------------------------------------

/**
 * カテゴリIDからカテゴリ名を取得する関数
 */
export async function getCategoryNameById(id: number): Promise<string | null> {
    const CATEGORIES_API_URL = "http://blog.bic-saving.com/wp-json/wp/v2/categories";

    const res = await fetch(`${CATEGORIES_API_URL}/${id}`, {
        cache: 'force-cache'
    });
    
    if (!res.ok) {
        return null; 
    }
    
    try {
        const categoryData = await res.json();
        return categoryData.name || null;
    } catch (e) {
        return null;
    }
}

/**
 * ★★★ 追加: タグIDからタグ名を取得する関数 ★★★
 */
export async function getTagNameById(id: number): Promise<string | null> {
    const TAGS_API_URL = "http://blog.bic-saving.com/wp-json/wp/v2/tags";

    const res = await fetch(`${TAGS_API_URL}/${id}`, {
        cache: 'force-cache'
    });
    
    if (!res.ok) {
        return null; 
    }
    
    try {
        const tagData = await res.json();
        return tagData.name || null;
    } catch (e) {
        return null;
    }
}


/**
 * 記事データからアイキャッチ画像URLを抽出する
 */
export function getFeaturedImageUrl(post: Post): string | null {
    const media = post._embedded?.['wp:featuredmedia'];
    if (media && media.length > 0) {
        return media[0].source_url; 
    }
    return null;
}