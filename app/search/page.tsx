// /app/search/page.tsx
import { getProducts } from "@/lib/data";
import { ProductData } from "@/types/index";
import ProductCard from "@/app/components/ProductCard";
import Pagination from "@/app/components/Pagination";

// 検索結果ページは、URLのクエリパラメータを直接受け取る
interface SearchPageProps {
    searchParams: {
        q?: string; // 検索クエリ (例: ?q=りんご)
        page?: string; // ページ番号 (例: ?page=2)
    };
}

// 検索結果コンポーネント (Server Component)
export default async function SearchPage({ searchParams }: SearchPageProps) {
    // 1. クエリパラメータからキーワードとページ番号を取得
    const query = searchParams.q || "";
    // Note: currentPageはgetProductsに渡すが、Paginationコンポーネントには渡さない
    const currentPage = parseInt(searchParams.page || "1", 10); 
    const productsPerPage = 12;

    let productData: ProductData = { products: [], totalPages: 1 };
    let error: string | null = null;
    
    // 2. APIから検索結果を取得
    try {
        // ★修正: getProductsに関数に query パラメータを渡す
        productData = await getProducts({ 
            page: currentPage, 
            limit: productsPerPage, 
            categoryId: null, // カテゴリ検索はしない
            query: query,      // キーワード検索を有効化
        });
    } catch (e) {
        console.error("Failed to fetch search results:", e);
        error = "検索結果の読み込み中にエラーが発生しました。";
    }

    const { products, totalPages } = productData;
    
    const displayTitle = query 
        ? `「${query}」の検索結果 (${products.length}件)`
        // クエリがない場合は全商品一覧と表示（あるいはメインページへのリダイレクトが望ましい）
        : "全商品一覧"; 

    return (
        <div className="search-page-layout">
            <h2>🔍 {displayTitle}</h2>

            {error && <p className="error-message">{error}</p>}

            {products.length === 0 && !error && (
                <p className="no-results">
                    {query ? `「${query}」に一致する商品が見つかりませんでした。` : "商品がありません。"}
                </p>
            )}

            <div className="product-grid">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* ★修正: Paginationコンポーネントは totalPages のみをPropsとして受け取る */}
            {totalPages > 1 && (
                <Pagination 
                    totalPages={totalPages}
                />
            )}
        </div>
    );
}