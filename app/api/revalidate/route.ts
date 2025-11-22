import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// 秘密のトークンを環境変数から取得
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

export async function GET(request: NextRequest) {
  // 1. シークレットトークンのチェック
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  // 2. リバリデーション処理
  try {
    // セール情報一覧のパスをリバリデーション
    revalidatePath('/sale-blog');
    
    // (必要であれば) 個別記事のパスもリバリデーションできます
    // const path = request.nextUrl.searchParams.get('path');
    // if (path) {
    //   revalidatePath(path);
    // }
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    // リバリデーションに失敗した場合 (Next.jsの設定ミスなど)
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}