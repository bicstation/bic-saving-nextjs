// lib/wordpress.ts (HTTPS修正版)

// 記事取得のベースURLをHTTPSに修正
const BASE_URL = "https://blog.bic-saving.com/wp-json/wp/v2";
const WORDPRESS_API_URL = `${BASE_URL}/posts`;

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
    tag?: string | number;      // タグID
}


// -----------------------------------------------------------
// 3. データ取得関数
// -----------------------------------------------------------

/**
 * 全記事一覧を取得する (カテゴリID/タグIDによるフィルタリングに対応)
 * @param params - オプションのフィルタリングパラメータ (categoryまたはtag)
 */
// ★★★ 修正: ネットワークエラー時やAPI失敗時に空配列を返すガード句を追加 ★★★
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
    
    try {
        const res = await fetch(url, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            // API応答が200 OKでない場合（この時点では301リダイレクトは追跡されているはず）
            console.error(`Failed to fetch WordPress posts: HTTP ${res.status}`);
            return []; // 失敗時は空の配列を返す
        }

        // JSONパースエラーもここで捕捉される
        const posts: Post[] = await res.json(); 
        return Array.isArray(posts) ? posts : []; // 配列保証を徹底

    } catch (error) {
        // ネットワークエラー、JSONパースエラーなど
        console.error("Error fetching sale posts in getSalePosts:", error);
        return []; // 失敗時は空の配列を返す
    }
}

/**
 * 特定のスラッグを持つ記事を取得する (アイキャッチ情報を含む)
 */
// ★★★ 修正: ネットワークエラー時やAPI失敗時に null を返すガード句を追加 ★★★
export async function getPostBySlug(slug: string): Promise<Post | null> {
    try {
        const res = await fetch(`${WORDPRESS_API_URL}?slug=${slug}&_embed`);
        
        if (!res.ok) {
            console.error(`Failed to fetch post by slug: HTTP ${res.status}`);
            return null;
        }

        const posts: Post[] = await res.json();
        
        return Array.isArray(posts) && posts.length > 0 ? posts[0] : null; 
    } catch (error) {
        console.error("Error fetching post by slug in getPostBySlug:", error);
        return null; // 失敗時は null を返す
    }
}

/**
 * カテゴリ一覧を取得する
 */
// ★★★ 修正: ネットワークエラー時やAPI失敗時に空配列を返すガード句を追加 ★★★
export async function getWPCategories(): Promise<WPCategory[]> {
    const CATEGORIES_API_URL = `${BASE_URL}/categories`; // HTTPS化

    try {
        const res = await fetch(CATEGORIES_API_URL, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch WordPress categories: HTTP ${res.status}`);
            return []; // 失敗時は空の配列を返す
        }
        
        const categories: WPCategory[] = await res.json();
        return Array.isArray(categories) ? categories : [];

    } catch (error) {
        console.error("Error fetching categories in getWPCategories:", error);
        return []; // 失敗時は空の配列を返す
    }
}

/**
 * ★★★ 追加: タグ一覧を取得する関数 ★★★
 */
// ★★★ 修正: ネットワークエラー時やAPI失敗時に空配列を返すガード句を追加 ★★★
export async function getWPTags(): Promise<WPTag[]> {
    const TAGS_API_URL = `${BASE_URL}/tags`; // HTTPS化

    try {
        // 記事のカウントが0より大きいタグのみを取得
        const res = await fetch(`${TAGS_API_URL}?orderby=count&order=desc&hide_empty=true&per_page=100`, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch WordPress tags: HTTP ${res.status}`);
            return []; // 失敗時は空の配列を返す
        }
        
        const tags: WPTag[] = await res.json();
        return Array.isArray(tags) ? tags : [];

    } catch (error) {
        console.error("Error fetching tags in getWPTags:", error);
        return []; // 失敗時は空の配列を返す
    }
}

/**
 * 全記事一覧を取得する (count件まで)
 */
// ★★★ 修正: ネットワークエラー時やAPI失敗時に空配列を返すガード句を追加 ★★★
export async function getPosts(count: number = 100): Promise<Post[]> {
    try {
        const res = await fetch(`${WORDPRESS_API_URL}?_embed&per_page=${count}`, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch WordPress posts for static params: HTTP ${res.status}`);
            return []; // 失敗時は空の配列を返す
        }

        const rawPosts: any[] = await res.json();
        // ★ 注意: rawPostsが配列であることを仮定しているため、念のためArray.isArrayチェックを推奨 ★
        if (!Array.isArray(rawPosts)) {
            console.error("API response was not an array in getPosts.");
            return [];
        }
        
        return rawPosts.map(post => ({
            ...post,
            categories: post.categories, 
            featured_media_url: getFeaturedImageUrl(post as Post) 
        }));
    } catch (error) {
        console.error("Error fetching posts in getPosts:", error);
        return []; // 失敗時は空の配列を返す
    }
}


// -----------------------------------------------------------
// 4. ヘルパー関数
// -----------------------------------------------------------

/**
 * カテゴリIDからカテゴリ名を取得する関数
 */
export async function getCategoryNameById(id: number): Promise<string | null> {
    const CATEGORIES_API_URL = `${BASE_URL}/categories`; // HTTPS化

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
    const TAGS_API_URL = `${BASE_URL}/tags`; // HTTPS化

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