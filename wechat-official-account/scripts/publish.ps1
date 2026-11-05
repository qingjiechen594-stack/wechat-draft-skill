[CmdletBinding(DefaultParameterSetName = 'Publish')]
param(
    [Parameter(ParameterSetName = 'Publish', Mandatory = $true)]
    [string]$Html,

    [Parameter(ParameterSetName = 'Publish', Mandatory = $true)]
    [string]$Cover,

    [Parameter(ParameterSetName = 'Publish', Mandatory = $true)]
    [string]$Title,

    [Parameter(ParameterSetName = 'Publish', Mandatory = $true)]
    [string]$Digest,

    [Parameter(ParameterSetName = 'Publish')]
    [string]$SourceUrl = '',

    [Parameter(ParameterSetName = 'Publish')]
    [string]$Author = '',

    [Parameter(ParameterSetName = 'Check', Mandatory = $true)]
    [switch]$CheckAuth
)

$ErrorActionPreference = 'Stop'
$configPath = Join-Path $env:LOCALAPPDATA 'Codex\wechat-official-account\credentials.json'
if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Encrypted credentials not found. Run $PSScriptRoot\configure.ps1 first."
}

$config = Get-Content -Raw -LiteralPath $configPath -Encoding UTF8 | ConvertFrom-Json
$secureSecret = ConvertTo-SecureString -String $config.encrypted_app_secret
$credential = [System.Net.NetworkCredential]::new('', $secureSecret)

$env:WECHAT_APPID = [string]$config.app_id
$env:WECHAT_APPSECRET = $credential.Password
$env:WECHAT_AUTHOR = if ($Author) { $Author } else { [string]$config.author }

try {
    $scriptPath = Join-Path $PSScriptRoot 'publish_wechat_draft.cjs'
    if ($CheckAuth) {
        & node $scriptPath --check-auth
    } else {
        $resolvedHtml = (Resolve-Path -LiteralPath $Html).Path
        $resolvedCover = (Resolve-Path -LiteralPath $Cover).Path
        & node $scriptPath --html $resolvedHtml --cover $resolvedCover --title $Title --digest $Digest --source-url $SourceUrl
    }
    if ($LASTEXITCODE -ne 0) {
        throw "WeChat draft command failed with exit code $LASTEXITCODE."
    }
} finally {
    Remove-Item Env:WECHAT_APPID -ErrorAction SilentlyContinue
    Remove-Item Env:WECHAT_APPSECRET -ErrorAction SilentlyContinue
    Remove-Item Env:WECHAT_AUTHOR -ErrorAction SilentlyContinue
    $credential.Password = ''
}
