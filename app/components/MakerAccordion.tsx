// /app/components/MakerAccordion.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'; // UIライブラリとして仮定

// データの型定義
interface MakerCategory {
  categoryName: string;
  icon: string;
  makers: string[];
}

interface MakerAccordionProps {
  categorizedMakers: MakerCategory[];
  // マッピング関数: メーカー名 (日本語) から URLスラッグへの変換を渡す
  getSlugByName: (name: string) => string;
}

// ヘルパー関数: メーカー名からURLに含めるスラッグを生成
// 例: "公式オシャレウォーカー" -> "公式オシャレウォーカー-43" (IDはダミーまたはAPIから取得)
const getUrlSlug = (name: string, getSlugByName: (name: string) => string): string => {
    // 既存のgetMakerSlugMapからAPIスラッグを取得 (ここではAPIスラッグとID付きスラッグが異なるため、
    // 実際にはAPIからID付きスラッグを取得する必要がありますが、ここでは簡易化のためメーカー名のみ使用)
    // 以前のロジックに基づき、一旦日本語名をそのままURLエンコードします
    return encodeURIComponent(name); 
};


const MakerAccordion: React.FC<MakerAccordionProps> = ({ categorizedMakers, getSlugByName }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-2">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">メーカー (分野別)</h2>
      {categorizedMakers.map((category) => (
        <div key={category.categoryName} className="border border-gray-200 rounded-lg shadow-sm">
          {/* アコーディオンヘッダー */}
          <button
            className="flex justify-between items-center w-full p-4 text-left font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition duration-150 rounded-lg"
            onClick={() => toggleCategory(category.categoryName)}
          >
            <span className="flex items-center">
              <span className="mr-2">{category.icon}</span>
              {category.categoryName} ({category.makers.length})
            </span>
            {openCategory === category.categoryName ? (
              <ChevronUpIcon className="w-5 h-5 text-indigo-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* アコーディオンコンテンツ */}
          {openCategory === category.categoryName && (
            <div className="p-4 bg-white border-t border-gray-200">
              <ul className="space-y-1">
                {category.makers.map((makerName) => {
                  // URLスラッグの生成
                  const urlSlug = getUrlSlug(makerName, getSlugByName);
                  
                  return (
                    <li key={makerName} className="py-1">
                      <Link 
                        href={`/maker/${urlSlug}`}
                        className="text-gray-600 hover:text-indigo-600 hover:underline transition duration-150 block"
                      >
                        {makerName}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MakerAccordion;