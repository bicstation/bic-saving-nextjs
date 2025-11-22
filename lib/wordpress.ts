// /lib/wordpress.ts (ページネーション対応版)

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
    content: RenderedContent; // 詳細記事ページ用で必須
    date: string;
    categories: number[]; 
    featured_media_url?: string; 
    excerpt?: RenderedContent;
    _embedded?: { 
        'wp:featuredmedia'?: FeaturedMedia[];
    };
}

/**
* 記事一覧ページ用 (contentを持たない) の型
*/
export interface PostSummary {
    id: number;
    slug: string;
    link: string; 
    title: RenderedContent;
    date: string;
    categories: number[]; 
    featured_media_url?: string; 
    excerpt?: RenderedContent; 
}

/**
* ★ 新規追加: getSalePosts の戻り値として使用する型 (記事リストと総件数)
*/
export interface PostListResponse {
    posts: PostSummary[];
    totalCount: number; // WordPress APIの X-WP-Total ヘッダーの値
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

export interface WPTag {
    id: number;
    name: string;
    slug: string;
    count: number; 
}

/**
* ★ 修正: ページネーションパラメータ (page, per_page) を追加 ★
*/
export interface FilterParams {
    category?: string | number; // カテゴリID
    tag?: string | number; // タグID
    page?: number;         // ページ番号
    per_page?: number;     // 1ページあたりの記事数
}


// -----------------------------------------------------------
// 3. データ取得関数
// -----------------------------------------------------------

/**
* 全記事一覧を取得する (カテゴリID/タグID/ページネーションによるフィルタリングに対応)
* ★ 修正: 戻り値の型を PostListResponse に変更 ★
*/
export async function getSalePosts(params?: FilterParams): Promise<PostListResponse> {
    let url = `${WORDPRESS_API_URL}?_embed`;
    
    // フィルタリングパラメータの追加
    if (params?.category) {
        url += `&categories=${params.category}`;
    }
    if (params?.tag) {
        url += `&tags=${params.tag}`;
    }
    
    // ★ ページネーションパラメータの追加 ★
    if (params?.page) {
        url += `&page=${params.page}`;
    }
    if (params?.per_page) {
        url += `&per_page=${params.per_page}`;
    }

    try {
        const res = await fetch(url, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch WordPress posts: HTTP ${res.status}`);
            return { posts: [], totalCount: 0 }; // エラー時は空の結果を返す
        }

        // ★ 総記事数 (X-WP-Total ヘッダー) の取得 ★
        const totalCountHeader = res.headers.get('x-wp-total');
        const totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : 0;

        const rawData: any = await res.json(); 
        const postsArray: any[] = rawData || []; 
        
        if (!Array.isArray(postsArray)) {
            return { posts: [], totalCount: 0 };
        }

        // 健全性チェック (slugが存在すること)
        const filteredPosts = postsArray.filter(post => 
            post && typeof post === 'object' && typeof post.slug === 'string'
        );
        
        // 必要な PostSummary のプロパティのみを明示的にマッピング
        const postsSummary: PostSummary[] = filteredPosts.map(post => ({
            id: post.id,
            slug: post.slug,
            link: post.link,
            // 文字列クリーンアップ
            title: { rendered: post.title.rendered.replace(/\u0000/g, '').trim(), protected: post.title.protected }, 
            date: post.date,
            categories: post.categories, 
            // 文字列クリーンアップ
            excerpt: { rendered: post.excerpt?.rendered?.replace(/\u0000/g, '').trim() || '', protected: post.excerpt?.protected || false },
            featured_media_url: getFeaturedImageUrl(post as Post) 
        }));
        
        // ★ PostListResponse 型で返却 ★
        return { posts: postsSummary, totalCount };

    } catch (error) {
        console.error("Error fetching sale posts in getSalePosts:", error);
        return { posts: [], totalCount: 0 }; // エラー時は空の結果を返す
    }
}

/**
* 特定のスラッグを持つ記事を取得する (アイキャッチ情報を含む)
*/
export async function getPostBySlug(slug: string): Promise<Post | null> {
    try {
        const res = await fetch(`${WORDPRESS_API_URL}?slug=${slug}&_embed`);
        
        if (!res.ok) {
            console.error(`Failed to fetch post by slug: HTTP ${res.status}`);
            return null;
        }

        const rawData: any = await res.json();
        const posts: any[] = rawData || [];
        
        if (Array.isArray(posts) && posts.length > 0 && posts[0] && typeof posts[0].slug === 'string') {
            const post = posts[0];
            
            // JSON.stringify() を妨げる要素を文字列から削除/置換する (Null文字 \u0000 の除去)
            const cleanContent = post.content.rendered
                .replace(/\u0000/g, '') 
                .trim();
            const cleanTitle = post.title.rendered.replace(/\u0000/g, '').trim();
            const cleanExcerpt = post.excerpt?.rendered?.replace(/\u0000/g, '').trim() || '';

            // 必要な Post のプロパティのみを明示的にマッピングし、クリーンな文字列データを使用
            return {
                id: post.id,
                slug: post.slug,
                link: post.link,
                title: { rendered: cleanTitle, protected: post.title.protected },
                content: { rendered: cleanContent, protected: post.content.protected },
                date: post.date,
                categories: post.categories, 
                excerpt: { rendered: cleanExcerpt, protected: post.excerpt?.protected || false },
                featured_media_url: getFeaturedImageUrl(post as Post)
            } as Post;
        }

        return null; 
    } catch (error) {
        console.error("Error fetching post by slug in getPostBySlug:", error);
        return null;
    }
}

/**
* カテゴリ一覧を取得する
*/
export async function getWPCategories(): Promise<WPCategory[]> {
    const CATEGORIES_API_URL = `${BASE_URL}/categories`; 

    try {
        const res = await fetch(CATEGORIES_API_URL, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch WordPress categories: HTTP ${res.status}`);
            return []; 
        }
        
        const rawData: any = await res.json();
        const categories: WPCategory[] = rawData || [];
        return Array.isArray(categories) ? categories : [];

    } catch (error) {
        console.log("Error fetching categories in getWPCategories:", error); 
        return []; 
    }
}

/**
* タグ一覧を取得する関数
*/
export async function getWPTags(): Promise<WPTag[]> {
    const TAGS_API_URL = `${BASE_URL}/tags`; 

    try {
        // 記事のカウントが0より大きいタグのみを取得
        const res = await fetch(`${TAGS_API_URL}?orderby=count&order=desc&hide_empty=true&per_page=100`, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch WordPress tags: HTTP ${res.status}`);
            return []; 
        }
        
        const rawData: any = await res.json();
        const tags: WPTag[] = rawData || [];
        return Array.isArray(tags) ? tags : [];

    } catch (error) {
        console.error("Error fetching tags in getWPTags:", error);
        return [];
    }
}

/**
* 全記事一覧を取得する (count件まで)
* generateStaticParamsで使用されることを想定し、厳密にフィルタリングを行う
*/
export async function getPosts(count: number = 100): Promise<Post[]> {
    try {
        const res = await fetch(`${WORDPRESS_API_URL}?_embed&per_page=${count}`, {
            cache: 'force-cache'
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch WordPress posts for static params: HTTP ${res.status}`);
            return []; 
        }

        const rawPosts: any = await res.json();
        const postsArray: any[] = rawPosts || []; 

        if (!Array.isArray(postsArray)) {
            console.error("API response was not an array in getPosts.");
            return [];
        }
        
        // 厳密なフィルタリング
        const filteredPosts = postsArray.filter(post => 
            post && typeof post === 'object' && typeof post.slug === 'string'
        );
        
        // 必要な Post のプロパティのみを明示的にマッピング + 文字列クリーンアップ適用
        return filteredPosts.map(post => {
            const cleanContent = post.content.rendered.replace(/\u0000/g, '').trim();
            const cleanTitle = post.title.rendered.replace(/\u0000/g, '').trim();
            const cleanExcerpt = post.excerpt?.rendered?.replace(/\u0000/g, '').trim() || '';

            return {
                id: post.id,
                slug: post.slug,
                link: post.link,
                title: { rendered: cleanTitle, protected: post.title.protected },
                content: { rendered: cleanContent, protected: post.content.protected },
                date: post.date,
                categories: post.categories, 
                excerpt: { rendered: cleanExcerpt, protected: post.excerpt?.protected || false },
                // _embedded は getFeaturedImageUrlで利用するのみにし、Postオブジェクトには直接渡さない
                featured_media_url: getFeaturedImageUrl(post as Post) 
            }
        });
    } catch (error) {
        console.error("Error fetching posts in getPosts:", error);
        return []; 
    }
}


// -----------------------------------------------------------
// 4. ヘルパー関数
// -----------------------------------------------------------

/**
* カテゴリIDからカテゴリ名を取得する関数
*/
export async function getCategoryNameById(id: number): Promise<string | null> {
    const CATEGORIES_API_URL = `${BASE_URL}/categories`; 

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
* タグIDからタグ名を取得する関数
*/
export async function getTagNameById(id: number): Promise<string | null> {
    const TAGS_API_URL = `${BASE_URL}/tags`; 

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
* アイキャッチ画像のURLを抽出するヘルパー関数
*/
export function getFeaturedImageUrl(post: Post | PostSummary): string | undefined {
    const postWithEmbedded = post as Post; 

    if (postWithEmbedded._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
        return postWithEmbedded._embedded['wp:featuredmedia'][0].source_url;
    }
    return post.featured_media_url; 
}