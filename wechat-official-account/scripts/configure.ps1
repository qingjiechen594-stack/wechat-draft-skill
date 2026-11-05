[CmdletBinding()]
param(
    [string]$ExistingEnv,
    [string]$Author
)

$ErrorActionPreference = 'Stop'
$configDirectory = Join-Path $env:LOCALAPPDATA 'Codex\wechat-official-account'
$configPath = Join-Path $configDirectory 'credentials.json'

function Read-EnvFile {
    param([string]$Path)

    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
        if ($line -match '^\s*#' -or $line -notmatch '=') {
            continue
        }
        $name, $value = $line -split '=', 2
        $value = $value.Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$name.Trim()] = $value
    }
    return $values
}

$appId = ''
$plainSecret = ''

if ($ExistingEnv) {
    $resolvedEnv = (Resolve-Path -LiteralPath $ExistingEnv).Path
    $envValues = Read-EnvFile -Path $resolvedEnv
    $appId = [string]$envValues['WECHAT_APPID']
    $plainSecret = [string]$envValues['WECHAT_APPSECRET']
    if (-not $Author) {
        $Author = [string]$envValues['WECHAT_AUTHOR']
    }
}

if (-not $appId) {
    $appId = Read-Host 'Enter WeChat Official Account AppID'
}

if (-not $plainSecret) {
    $secureSecret = Read-Host 'Enter WeChat Official Account AppSecret' -AsSecureString
} else {
    $secureSecret = ConvertTo-SecureString -String $plainSecret -AsPlainText -Force
}

if (-not $appId -or $secureSecret.Length -eq 0) {
    throw 'AppID and AppSecret are required.'
}

$encryptedSecret = ConvertFrom-SecureString -SecureString $secureSecret
$config = [ordered]@{
    app_id = $appId
    encrypted_app_secret = $encryptedSecret
    author = if ($Author) { $Author } else { '' }
    protection = 'windows-dpapi-current-user'
    updated_at = (Get-Date).ToString('o')
}

New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null
$config | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8

Write-Output (@{
    ok = $true
    config_path = $configPath
    app_id_suffix = $appId.Substring([Math]::Max(0, $appId.Length - 6))
    secret_stored = $true
} | ConvertTo-Json -Compress)
