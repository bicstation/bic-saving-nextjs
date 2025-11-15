import { Suspense } from 'react';
import CategorySidebar from './CategorySidebar';
import { getCategories, getAllMakers } from "@/lib/data"; // データ取得

// この新しいコンポーネント内でデータ取得と変数の定義を行う
export default async function CategoryDataFetcher() {
    // カテゴリとメーカーのデータを並行取得
    const [ecCategories, allMakers] = await Promise.all([
        getCategories().catch(() => []), 
        getAllMakers().catch(() => []),
    ]);
    const safeECCategories = Array.isArray(ecCategories) ? ecCategories : [];
    const safeAllMakers = Array.isArray(allMakers) ? allMakers : [];

    return (
        <Suspense fallback={<div>Loading Filters...</div>}>
            <CategorySidebar 
                categories={safeECCategories}
                makers={safeAllMakers} 
            />
        </Suspense>
    );
}