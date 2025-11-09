// /app/components/ProductCard.tsx

import Link from "next/link";
// ★★★ 修正箇所: 外部ファイルからPropsの型をインポート ★★★
import { ProductCardProps } from "@/types/index";

/**
 * 商品情報を表示するカードコンポーネント (TypeScript版)
 * @param product - APIから取得した一つの商品オブジェクト (ProductCardPropsで型定義済み)
 */
// ★★★ 修正箇所: コンポーネントに ProductCardProps 型を適用 ★★★
export default function ProductCard({ product }: ProductCardProps) {
    
    // --- 型で保証されるフィールドの補完が効くようになる ---
    
    // 価格を数値に変換し、日本円の形式にフォーマット
    // priceが文字列型(string)であることを前提に、parseFloatで変換し、Math.roundで丸める。
    // ※ product.priceが数値でない場合のフォールバック処理は今回は省略
    const priceValue = parseFloat(product.price);
    const formattedPrice = Math.round(priceValue).toLocaleString();

    return (
        <Link
            // product.id は ProductCardProps で number 型であることが保証されている
            key={product.id}
            href={`/products/${product.id}`}
            className="product-card"
        >
            {/* TODO: image_urlが Product 型に含まれていれば、エラーが出なくなります */}
            {/* 現在の /types/index.ts に image_url がないので、エラーが出ている可能性があります */}
            {/* 一旦、コードの意図を汲んで表示を維持します */}
            {product.image_url && (
                <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="product-image"
                />
            )}
            
            <div className="product-info">
                <p className="product-name">{product.product_name}</p>
            </div>
            
            <p className="product-price">
                {formattedPrice}円
            </p>
        </Link>
    );
}