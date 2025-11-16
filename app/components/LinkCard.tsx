// /components/LinkCard.tsx

import React from 'react';
// CSS Modulesをインポート
import styles from './link-card.module.css';

interface OGPData {
 title: string | null;
 description: string | null;
 imageUrl: string | null;
 siteUrl: string;
 faviconUrl: string | null;
}

interface LinkCardProps {
 data: OGPData | null;
}

const LinkCard: React.FC<LinkCardProps> = ({ data }) => {
 if (!data || !data.title) {
  // フォールバック
  return <a href={data?.siteUrl || '#'} className="simple-link-fallback">{data?.siteUrl || 'リンク'}</a>;
 }

 const { title, description, imageUrl, siteUrl, faviconUrl } = data;
 
 // URLからホスト名を取得
 let siteName = siteUrl;
 try {
   siteName = new URL(siteUrl).hostname;
 } catch(e) {
   // 無効なURLの場合のフォールバック
 }


 return (
  <a
   href={siteUrl} 
   target="_blank" 
   rel="noopener noreferrer"
   className={styles.linkCardContainer} 
  >
        {/* ★★★ 1. 画像ラッパー (左側) ★★★ */}
        {imageUrl && (
    <div className={styles.linkCardImageWrapper}>
     <img
      src={imageUrl}
      alt={title || siteName}
      className={styles.linkCardImage} 
     />
            {/* ★★★ 2. ファビコンとサイト名を画像の下に配置するための新ラッパー ★★★ */}
            <div className={styles.linkCardFooterInImage}> 
                {faviconUrl && (
                    <img 
                        src={faviconUrl} 
                        alt="Favicon" 
                        className={styles.linkCardFavicon} 
                    />
                )}
                {siteName}
            </div>
    </div>
   )}
        {/* ★★★ 3. テキストコンテンツラッパー (右側) ★★★ */}
   <div className={styles.linkCardContent}>
    <h3 className={styles.linkCardTitle}>
     {title}
    </h3>
    {description && (
     <p className={styles.linkCardDescription}>
      {description}
     </p>
    )}
        {/* linkCardFooter は削除 */}
   </div>
  </a>
 );
};

export default LinkCard;