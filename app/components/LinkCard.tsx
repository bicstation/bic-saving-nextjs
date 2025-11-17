// /components/LinkCard.tsx (最終修正版)

import React from 'react';
// Next.jsの内部リンク機能を使用するため、インポートを追加
import Link from 'next/link'; 
// CSS Modulesをインポート
import styles from '../components/link-card.module.css';

interface OGPData {
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    siteUrl: string;
    faviconUrl: string | null;
}

// ★★★ 修正箇所: LinkCardProps に linkType を追加 ★★★
interface LinkCardProps {
    data: OGPData | null;
    // リンクのタイプを定義: 'internal' (Next/Link) または 'external' (通常の<a>)
    linkType?: 'internal' | 'external';
}
// ★★★ ----------------------------------------- ★★★

const LinkCard: React.FC<LinkCardProps> = ({ data, linkType = "external" }) => { // linkTypeをpropsとして受け取る
    if (!data || !data.title) {
        // フォールバック: タイトルがない場合は、URLを表示した<a>タグで代用
        return <a href={data?.siteUrl || '#'} className="simple-link-fallback">{data?.siteUrl || 'リンク'}</a>;
    }

    const { title, description, imageUrl, siteUrl, faviconUrl } = data;

    // URLからホスト名を取得
    let siteName = siteUrl;
    try {
        siteName = new URL(siteUrl).hostname;
    } catch(e) {
        // 無効なURLの場合のフォールバック
        siteName = 'サイト';
    }

    // 外部リンクか内部リンクかによってコンポーネントを切り替え
    const ContainerTag = linkType === 'internal' ? Link : 'a';

    // 内部リンクの場合は rel や target は不要
    const relProps = linkType === 'external' ? "noopener noreferrer" : undefined;
    const targetProps = linkType === 'external' ? "_blank" : undefined;

    return (
        <ContainerTag
            href={siteUrl} 
            target={targetProps} 
            rel={relProps}
            className={styles.linkCardContainer} 
        >
            {/* ★★★ 1. 画像ラッパー (左側) ★★★ */}
            {imageUrl && (
                <div className={styles.linkCardImageWrapper}>
                    {/* Next/Imageの使用が望ましいが、OGP画像は外部からの取得でサイズが不明確なため、標準の<img>を使用 */}
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
        </ContainerTag>
    );
};

export default LinkCard;