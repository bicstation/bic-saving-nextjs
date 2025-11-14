// /app/hooks/useViewport.ts

import { useState, useEffect } from 'react';

// Tailwind CSSのmdブレークポイント（768px）を使用
const MD_BREAKPOINT = 768; 

export const useViewport = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // クライアント側で実行されていることを確認
        setIsClient(true);
        
        const checkViewport = () => {
            // ウィンドウ幅がMD_BREAKPOINT (768px) 以下ならモバイルと判断
            setIsMobile(window.innerWidth <= MD_BREAKPOINT);
        };

        // 初期ロード時とリサイズ時にチェック
        checkViewport();
        window.addEventListener('resize', checkViewport);

        // クリーンアップ関数
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    // サーバーサイドレンダリング (SSR) の際にエラーを防ぐため、isClientも返す
    if (!isClient) {
        return { isMobile: false, isDesktop: true, viewport: 'SSR/Initial' };
    }

    return {
        isMobile: isMobile,
        isDesktop: !isMobile,
        viewport: isMobile ? 'モバイル (<= 768px)' : 'デスクトップ (> 768px)'
    };
};