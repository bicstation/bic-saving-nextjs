// /app/components/CategorySidebar.tsx (カテゴリとメーカーを統一した最終版)

"use client";

import { useState, MouseEvent, useEffect } from 'react';
import Link from "next/link";
import { Category, Maker } from "@/types/index"; 
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; 


// =========================================================
// ★★★ 統合されたメーカー分類データ (静的) ★★★
// ※ 外部ファイル（JSONなど）に切り出すことも推奨されますが、今回はファイル統合のためここに定義
const MAKER_CATEGORIES = [
    {
      "categoryName": "ファッション・アパレル",
      "icon": "👕",
      "makers": [
        "【公式】オシャレウォーカー", "aimerfeel 下着・ランジェリーのエメフィール公式通販サイト", "ASBee ONLINE SHOP", "CHARLES & KEITH 公式オンラインストア", "coen ONLINE STORE", "Gap Japan", "Honeys（ハニーズ）公式通販サイト", "lululemon（ルルレモン）", "PAL CLOSET（パルクローゼット）", "SANYO ONLINE STORE", "SHIROHATO（白鳩）", "STRIPE CLUB（ストライプクラブ）", "TATRAS CONCEPT STORE", "UGG(R) 公式サイト（アグ 公式サイト）", "YAMADAYA（ヤマダヤオンラインストア)", "Zoff", "ZUTTO", "クロックス 公式オンラインショップ", "セシール", "ニッセン", "ニューバランス公式オンラインストア", "ハッピーマリリン", "ハルメク公式通販サイト", "ファッション通販fifth(フィフス)", "プーマオンラインストア", "ミズノ公式オンライン", "メガネのOWNDAYS（オンデーズ）公式オンラインストア", "ワイシャツの山喜オフィシャル通販 「YAMAKI ONLINE SHOP」"
      ]
    },
    {
      "categoryName": "電化製品・IT・PC",
      "icon": "💻",
      "makers": [
        "ASUS 公式オンラインストア「ASUS Store Online」", "DNS公式通販", "Dynabook Direct（旧東芝ダイレクト）", "Dyson（ダイソン）オンラインストア", "EIZOダイレクト", "HP Directplus -HP公式オンラインストア-", "MYTREX 公式オンラインストア", "NEC「得選街」", "ウイルスバスター公式トレンドマイクロ・オンラインショップ", "エディオン　-公式通販サイト-", "キングソフト", "ソースネクスト", "ソフマップ・ドットコム", "デル株式会社", "富士通 WEB MART"
      ]
    },
    {
      "categoryName": "コスメ・美容・健康",
      "icon": "💄",
      "makers": [
        "＠ｃｏｓｍｅ ｓｈｏｐｐｉｎｇ", "ISETAN BEAUTY online", "きれいみつけた", "江原道/ Koh Gen Do 公式オンラインショップ"
      ]
    },
    {
      "categoryName": "雑貨・インテリア・ホビー",
      "icon": "🎁",
      "makers": [
        "CASETiFY", "Daniel Wellington JP（ダニエル・ウェリントン公式オンラインストア）", "e87.com(千趣会イイハナ)", "LUPIS（ルピス）公式通販", "MoMA Design Store", "Yogibo(ヨギボー)", "タカラトミーモール", "ベルメゾンネット", "一番くじONLINE"
      ]
    },
    {
      "categoryName": "ギフト・生活・総合通販",
      "icon": "🛒",
      "makers": [
        "anatae", "au PAY マーケット", "AXES(アクセス)海外ブランドのファッション通販サイト", "FREAK'S STORE (Daytona Park)", "Ropping（ロッピング）", "TSUNAGU 内祝い専門店　by senshukai", "アウトドア＆フィッシング　ナチュラム", "アリノマ", "アンティナ ギフトスタジオ", "おこころざし.com", "オンワード・クローゼット", "カバン・小物専門店　ギャレリアモール", "ココデカウ", "ダイレクトテレショップ　公式通販サイト", "ディノス オンラインショップ", "テレ東アトミックゴルフ本店", "フェリシモ【定期便】新規購入キャンペーン アフィリエイトプログラム", "ブックオフオンライン【PC・携帯共通】", "小田急オンラインショッピング", "西川公式オンラインショップ", "贈り物のコンシェルジュ　リンベル", "通販生活ウェブサイト", "婦人画報のお取り寄せ"
      ]
    },
    {
      "categoryName": "食品・飲料・その他",
      "icon": "🍽️",
      "makers": [
        "ENOTECA Online（ワイン通販 エノテカ・オンライン）"
      ]
    },
    {
      "categoryName": "ふるさと納税・サービス",
      "icon": "💡",
      "makers": [
        "au PAY ふるさと納税", "READYFOR (レディーフォー)", "ウェブポ（年賀状総合サービス）"
      ]
    },
    {
      "categoryName": "趣味・専門",
      "icon": "⚽",
      "makers": [
        "e-CAPCOM", "HMV&BOOKS online", "サッカーショップ加茂", "ダンロップスポーツ公式オンラインストア", "犬・猫の総合情報サイト『PEPPY（ペピイ）』", "ペットゴー　公式オンラインストア"
      ]
    }
];
// ★★★ 統合されたメーカー分類データ 終了 ★★★
// =========================================================

// --- 共通ヘルパー関数 ---

/**
 * category が targetId の祖先または自身であるかチェックする再帰関数
 */
const isAncestorOf = (category: Category, targetId: number | null | undefined): boolean => {
    if (!targetId) return false;
    
    // 自身がターゲットであればtrue
    if (category.id === targetId) return true;
    
    // 子カテゴリを再帰的にチェック
    if (category.children && category.children.length > 0) {
        return category.children.some(child => isAncestorOf(child, targetId));
    }
    
    return false;
};

// --- 1. SubCategoryList コンポーネント ---

interface SubCategoryListProps {
    subCategories: Category[];
    currentCategoryId: number | null | undefined; 
}

const SubCategoryList = ({ subCategories, currentCategoryId }: SubCategoryListProps) => {
    const sortedSubCategories = [...subCategories].sort((a, b) => 
        (b.product_count || 0) - (a.product_count || 0)
    );
    const top20SubCategories = sortedSubCategories.slice(0, 20); // 上位20件のみ表示

    return (
        <ul className="sub-category-list">
            {top20SubCategories.map((subCat) => (
                <li 
                    key={subCat.id} 
                    className={`sub-category-item ${subCat.id === currentCategoryId ? 'active' : ''}`}
                >
                    <Link href={`/category/${subCat.id}`}>
                        {subCat.name || subCat.category_name} 
                        
                        {subCat.product_count !== undefined && (
                            <span className="count">({subCat.product_count})</span>
                        )}
                    </Link>
                </li>
            ))}
        </ul>
    );
};


// --- 2. CategoryItem コンポーネント ---

interface CategoryItemProps {
    category: Category; 
    activeId: number | null; 
    setActiveId: (id: number | null) => void;
    currentCategoryId: number | null | undefined; 
}

const CategoryItem = ({ category, activeId, setActiveId, currentCategoryId }: CategoryItemProps) => {
    const isOpen = activeId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    
    // 現在のカテゴリがこの親カテゴリ、またはその子孫に含まれるかチェック
    const isPathActive = isAncestorOf(category, currentCategoryId);

    const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); 
        setActiveId(isOpen ? null : category.id);
    };

    return (
        <li 
            className={`category-item ${isOpen ? 'open' : ''} ${isPathActive ? 'current-path' : ''}`}
        >
            <div className="category-header">
                <Link
                    href={`/category/${category.id}`}
                    className="category-link"
                >
                    <span className="icon">🔗</span>{" "}
                    {category.name || category.category_name}
                </Link>

                {hasChildren && (
                    <button onClick={handleToggle} className="toggle-button">
                        {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>
                )}
            </div>

            {/* 子カテゴリリスト */}
            {isOpen && hasChildren && (
                <SubCategoryList 
                    subCategories={category.children as Category[]} 
                    currentCategoryId={currentCategoryId} 
                />
            )}
        </li>
    );
};


// =========================================================
// ★★★ 4. MakerCategoryItem コンポーネント (CategoryItemをベースに統一) ★★★
// =========================================================

interface MakerCategoryItemProps {
    category: typeof MAKER_CATEGORIES[number];
    availableMakers: { name: string, slug: string }[];
    activeCategoryName: string | null;
    setActiveCategoryName: (name: string | null) => void;
    currentMakerSlug?: string;
}

const MakerCategoryItem: React.FC<MakerCategoryItemProps> = ({ 
    category, 
    availableMakers,
    activeCategoryName, 
    setActiveCategoryName,
    currentMakerSlug
}) => {
    const isOpen = activeCategoryName === category.categoryName;

    // 現在のメーカーがこの分類に含まれているかどうかをチェック（開閉初期状態用）
    const isPathActive = availableMakers.some(m => m.slug === currentMakerSlug);


    const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); 
        setActiveCategoryName(isOpen ? null : category.categoryName);
    };

    return (
        <li 
            className={`category-item ${isOpen ? 'open' : ''} ${isPathActive ? 'current-path' : ''}`}
        >
            <div className="category-header">
                {/* メーカー分類名をクリックしても何も起こらないようにボタンに変更 */}
                <button
                    onClick={handleToggle}
                    className="category-link" // styleを流用
                    style={{ cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', width: '100%' }}
                >
                    <span className="icon">{category.icon}</span>{" "}
                    {category.categoryName} ({availableMakers.length})
                </button>

                {/* トグルボタン */}
                <button onClick={handleToggle} className="toggle-button">
                    {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
            </div>

            {/* メーカーリスト */}
            {isOpen && (
                <ul className="sub-category-list"> 
                    {availableMakers.map((maker) => (
                        <li key={maker.slug} className={`sub-category-item ${maker.slug === currentMakerSlug ? 'active' : ''}`}>
                            <Link 
                                href={`/maker/${maker.slug}`}
                                // スタイルを sub-category-item の a 要素に合わせる
                                className="block font-normal text-sm" 
                            >
                                {maker.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};


// =========================================================
// ★★★ 5. MakerList コンポーネント (統合前の MakerAccordion を MakerCategoryItem のリストに置換) ★★★
// =========================================================

interface MakerListProps {
    categorizedMakers: typeof MAKER_CATEGORIES;
    makers: Maker[]; 
    currentMakerSlug?: string;
}

const MakerList: React.FC<MakerListProps> = ({ categorizedMakers, makers, currentMakerSlug }) => {
    const [openCategory, setOpenCategory] = useState<string | null>(null);

    // APIから取得したMakerリストを Map に変換: MakerName -> Slug
    const makerSlugMap = new Map<string, string>();
    makers.forEach(m => makerSlugMap.set(m.name, m.slug));

    // URLスラッグを決定するヘルパー関数
    const getMakerUrlSlug = (makerName: string): string | undefined => {
        return makerSlugMap.get(makerName); 
    };
    
    // アクティブなパスがあれば、そのカテゴリを初期で開く
    useEffect(() => {
        if (currentMakerSlug) {
            const currentCategory = categorizedMakers.find(cat => 
                cat.makers.some(name => getMakerUrlSlug(name) === currentMakerSlug)
            );
            if (currentCategory) {
                setOpenCategory(currentCategory.categoryName);
            }
        }
    }, [currentMakerSlug, categorizedMakers]);


    return (
        <ul className="category-accordion space-y-1 text-sm"> {/* カテゴリ一覧と同じクラスを適用 */}
            {categorizedMakers.map((category) => {
                // その分野に所属するメーカーのうち、APIデータに存在するメーカーのみをフィルタリング
                let availableMakers = category.makers
                    .map(name => ({ name, slug: getMakerUrlSlug(name) }))
                    .filter(m => m.slug !== undefined) as { name: string, slug: string }[];
                
                // メーカー名をソート (分類内で実施)
                availableMakers.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

                if (availableMakers.length === 0) return null;

                return (
                    <MakerCategoryItem 
                        key={category.categoryName}
                        category={category}
                        availableMakers={availableMakers}
                        activeCategoryName={openCategory}
                        setActiveCategoryName={setOpenCategory}
                        currentMakerSlug={currentMakerSlug}
                    />
                );
            })}
        </ul>
    );
};


// --- 3. CategorySidebar メインコンポーネント ---

interface CategorySidebarProps {
    categories: Category[]; 
    makers?: Maker[]; 
    currentCategoryId?: number | null; 
    currentMakerSlug?: string;
}

export default function CategorySidebar({ 
    categories, 
    makers = [], // makersが渡されることを想定
    currentCategoryId, 
    currentMakerSlug 
}: CategorySidebarProps) {
    
    // カテゴリ用のアコーディオン開閉状態
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(currentCategoryId || null);
    
    // currentCategoryIdが変更されたときに開閉状態を同期
    useEffect(() => {
        if (currentCategoryId !== undefined) {
            setActiveCategoryId(currentCategoryId);
        }
    }, [currentCategoryId]);


    return (
        <aside className="sidebar">
            
            {/* 🔑 管理メニュー */}
            <div className="menu-section">
                <h3>🔑 管理メニュー</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href="#" className="hover:text-indigo-600">管理トップ</Link></li>
                    <li><Link href="#" className="hover:text-indigo-600">商品登録</Link></li>
                </ul>
            </div>

            {/* 📚 カテゴリ一覧 */}
            <div className="menu-section">
                <h3>📚 カテゴリ一覧</h3>
                <ul className="category-accordion space-y-1 text-sm">
                    {categories.length === 0 ? (
                        <p className="text-xs text-gray-500">カテゴリデータが見つかりませんでした。</p>
                    ) : (
                        <>
                            {/* 「全ての商品を見る」リンクを CategoryItem のスタイルに合わせるために調整 */}
                            <li style={{ listStyleType: 'none', padding: '5px 0' }}>
                                <Link 
                                    href="/" 
                                    className={`category-link ${currentCategoryId === undefined || currentCategoryId === null ? 'font-bold text-indigo-600' : 'text-gray-700'}`}
                                >
                                    🏠 全ての商品を見る
                                </Link>
                            </li>
                            {categories.map((category) => (
                                <CategoryItem 
                                    key={category.id} 
                                    category={category}
                                    activeId={activeCategoryId}
                                    setActiveId={setActiveCategoryId}
                                    currentCategoryId={currentCategoryId}
                                />
                            ))}
                        </>
                    )}
                </ul>
            </div>
            
            {/* 🏭 メーカーで絞り込む (カテゴリ形式に統一) */}
            <div className="menu-section">
                <h3>🏭 メーカーで絞り込む</h3>
                
                <MakerList 
                    categorizedMakers={MAKER_CATEGORIES} 
                    makers={makers}
                    currentMakerSlug={currentMakerSlug}
                />

                <div className="mt-4 border-t pt-2" style={{ listStyleType: 'none', padding: '5px 0' }}>
                    <Link 
                        href="/" 
                        // スタイルを category-link のスタイルに合わせる
                        className={`category-link ${currentMakerSlug === undefined ? 'font-bold text-indigo-600' : 'text-gray-700'}`}
                    >
                        🏠 全てのメーカーを見る
                    </Link>
                </div>
            </div>


            {/* 📢 その他メニュー */}
            <div className="menu-section">
                <h3>📢 その他メニュー</h3>
                <ul className="space-y-1 text-sm">
                    <li><Link href="#" className="hover:text-indigo-600">新着情報</Link></li>
                    <li><Link href="#" className="hover:text-indigo-600">おすすめ商品</Link></li>
                </ul>
            </div>
        </aside>
    );
}