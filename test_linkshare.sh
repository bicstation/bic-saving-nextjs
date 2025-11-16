#!/bin/bash

# ====================================================================
# LinkShare (Rakuten Marketing) API テストスクリプト
# MID 2557 (Dell) のテキストリンク取得までをテストします。
# ====================================================================

# --------------------------------------------------------------------
# 1. 認証情報の定義 (ご提示いただいた値)
# --------------------------------------------------------------------
LS_CLIENT_ID="ybRFc2fz6l9Wc1rDgywekOuMfBRzOyUO"
LS_CLIENT_SECRET="2J72oAHLaIbSocWC2RaA2Wm3oZ7TuLhL"
LS_ACCOUNT_ID="3750988"
DELL_MID="2557"

echo "--- LinkShare API テスト開始 ---"

# --------------------------------------------------------------------
# 2. ステップ 1: アクセストークンの取得 (Basic認証)
# --------------------------------------------------------------------
echo "## ステップ 1: アクセストークンの取得 (OAuth)"

# Client IDとSecretをコロンで結合し、Base64エンコード
CREDENTIALS="${LS_CLIENT_ID}:${LS_CLIENT_SECRET}"
TOKEN_KEY=$(echo -n "$CREDENTIALS" | base64)

echo "-> Authorization: Basic ${TOKEN_KEY:0:15}..."

TOKEN_RESPONSE=$(curl -s -X POST 'https://api.linksynergy.com/token' \
  -H "Authorization: Basic ${TOKEN_KEY}" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "scope=${LS_ACCOUNT_ID}" \
  --data-urlencode "grant_type=password")

echo "--- レスポンス ---"
echo "$TOKEN_RESPONSE" | jq .

# jqが利用できない環境のために、access_tokenの抽出を単純化
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "!!! エラー: アクセストークンの取得に失敗しました。認証情報が正しくありません (Status 401の原因)。"
    exit 1
fi

echo "--- 成功 ---"
echo "ACCESS_TOKEN (取得成功)"
echo "--------------------------------------------------------"

# --------------------------------------------------------------------
# 3. ステップ 2: テキストリンクの取得 (Bearerトークン使用)
# --------------------------------------------------------------------
echo "## ステップ 2: テキストリンクの取得 (MID: $DELL_MID)"

ENDPOINT="https://api.linksynergy.com/linklocator/1.0/getTextLinks/${DELL_MID}/-1///-1/1"

echo "-> Endpoint: $ENDPOINT"
echo "-> Authorization: Bearer ${ACCESS_TOKEN:0:15}..."

LINK_RESPONSE=$(curl -s -X GET "$ENDPOINT" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Accept: application/xml')

# XMLは長いため、先頭数行のみ表示して成功を確認
echo "--- レスポンス (XML - 先頭10行) ---"
echo "$LINK_RESPONSE" | head -n 10

if echo "$LINK_RESPONSE" | grep -q "getTextLinksResponse"; then
    echo "--- 成功 ---"
    echo "LinkShare APIからデルのリンクデータが正常に取得されました。"
else
    echo "!!! エラー: リンクデータの取得に失敗しました。レスポンスを確認してください。"
fi

echo "--- LinkShare API テスト完了 ---"