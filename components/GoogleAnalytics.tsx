'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// window.gtag の型定義を拡張（TypeScriptの場合）
declare global {
  interface Window {
    gtag: (
      type: string,
      action: string,
      params: { page_title?: string; page_path: string; send_to?: string }
    ) => void;
  }
}

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

export const GoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // GA_TRACKING_ID が設定されていない場合は何もしない
    if (!GA_TRACKING_ID) return;

    // パスとクエリパラメータを結合して完全なURLパスを構築
    const url = pathname + (searchParams ? `?${searchParams.toString()}` : '');

    // ページビューイベントをGAに送信
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: url,
        // page_title は自動で取得されることが多い
      });
    }
  }, [pathname, searchParams]);

  return null;
};