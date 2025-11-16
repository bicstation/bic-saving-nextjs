# test-linkshare.ps1 (カテゴリID 14 指定版)

# ====================================================================
# LinkShare (Rakuten Marketing) API テストスクリプト (PowerShell版)
# - メルマガ指定のカテゴリID 14 を使用してリンク取得を試行
# ====================================================================

# --------------------------------------------------------------------
# 1. 認証情報とパラメータの定義
# --------------------------------------------------------------------
$LS_CLIENT_ID="ybRFc2fz6l9Wc1rDgywekOuMfBRzOyUO"
$LS_CLIENT_SECRET="2J72oAHLaIbSocWC2RaA2Wm3oZ7TuLhL"
$LS_ACCOUNT_ID="3750988"
$DELL_MID="2557"

Write-Host "--- LinkShare API テスト開始 (PowerShell) ---"

# --------------------------------------------------------------------
# 2. ステップ 1: アクセストークンの取得 (Basic認証)
# --------------------------------------------------------------------
# トークン取得ロジック (成功済みのため省略せず完全版を再掲)
Write-Host "## ステップ 1: アクセストークンの取得 (OAuth)"
$Credentials = "$($LS_CLIENT_ID):$($LS_CLIENT_SECRET)"
$Bytes = [System.Text.Encoding]::UTF8.GetBytes($Credentials)
$TokenKey = [System.Convert]::ToBase64String($Bytes)
Write-Host "-> Authorization: Basic $($TokenKey.Substring(0, 15))..."
$TokenUrl = "https://api.linksynergy.com/token"
$Body = @{ scope = $LS_ACCOUNT_ID; grant_type = 'password' }

try {
    $TokenResponse = Invoke-RestMethod -Uri $TokenUrl -Method Post -Headers @{ Authorization = "Basic $TokenKey" } -ContentType "application/x-www-form-urlencoded" -Body $Body
} catch { Write-Error "!!! エラー: トークン API 呼び出し中にエラーが発生しました。"; exit 1 }

$ACCESS_TOKEN = $TokenResponse.access_token

if (-not $ACCESS_TOKEN) { Write-Host "!!! エラー: アクセストークンの取得に失敗しました。"; exit 1 }
Write-Host "--- 成功 ---"
Write-Host "ACCESS_TOKEN (取得成功)"
Write-Host "--------------------------------------------------------"


# --------------------------------------------------------------------
# 3. ステップ 2: テキストリンクの取得 (カテゴリID 14 を指定)
# --------------------------------------------------------------------
Write-Host "## ステップ 2: テキストリンクの取得 (MID: $DELL_MID, CatID: 14)"

# API仕様: /getTextLinks/{advertiser-id}/{category-id}/{link-start-date}/{link-end-date}/{DEPRECATED-campaign-id}/{page}
$CATEGORY_ID = "14"          # 🚨 修正: Dell 個人ページリンクのID
$START_DATE = "01012000"    
$END_DATE = "12312099"      
$CAMPAIGN_ID = "-1"
$PAGE = "1"

$Endpoint = "https://api.linksynergy.com/linklocator/1.0/getTextLinks/$DELL_MID/$CATEGORY_ID/$START_DATE/$END_DATE/$CAMPAIGN_ID/$PAGE"

Write-Host "-> Endpoint: $Endpoint"
Write-Host "-> Authorization: Bearer $($ACCESS_TOKEN.Substring(0, 15))..."

try {
    $LinkResponse = Invoke-WebRequest -Uri $Endpoint -Method Get -Headers @{ Authorization = "Bearer $ACCESS_TOKEN"; Accept = "application/xml" } -ErrorAction Stop 
    
    $ContentString = $LinkResponse.Content | Out-String
    
    Write-Host "--- レスポンス (XML - 先頭20行) ---"
    $ContentString.Split("`n") | Select-Object -First 20
    
    if ($ContentString -like "*getTextLinksResponse*") {
        Write-Host "--- 成功 ---"
        Write-Host "カテゴリ ID 14 (Dell 個人ページリンク) からリンクデータを取得しました。"
        Write-Host "目的のリンク名 'Dell 15 ノートパソコン(DC15255)' が含まれているか確認してください。"
        
    } else {
        Write-Host "!!! エラー: リンクデータの取得に失敗しました。予期せぬレスポンスです。"
    }
} catch {
    Write-Error "!!! エラー: リンク取得 API 呼び出し中にエラーが発生しました。"
    
    $ErrorResponse = $_.Exception.Response
    if ($ErrorResponse) {
        $StatusCode = $ErrorResponse.StatusCode.value__
        try {
            $BodyText = $ErrorResponse.Content | Out-String
            Write-Host "HTTP ステータス: $StatusCode"
            Write-Host "レスポンス本文:" $BodyText.Trim()
        } catch {
            Write-Host "HTTP ステータス: $StatusCode"
            Write-Host "レスポンス本文の取得に失敗しました。"
        }
    } else {
        Write-Host "一般的なエラー: $($_.Exception.Message)"
    }
    
    exit 1
}

Write-Host "--- LinkShare API テスト完了 ---"