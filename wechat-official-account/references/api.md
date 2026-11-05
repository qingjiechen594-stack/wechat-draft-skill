# 配置与接口

## 凭证

配置文件位于：

`%LOCALAPPDATA%\Codex\wechat-official-account\credentials.json`

`AppSecret` 使用 Windows DPAPI 按当前 Windows 用户加密。不得把配置文件内容、解密后的密钥或 `access_token` 输出到对话或日志。

首次配置或密钥重置后执行：

```powershell
& "$env:USERPROFILE\.codex\skills\wechat-official-account\scripts\configure.ps1"
```

也可以从已有 `.env` 安全迁移：

```powershell
& "$env:USERPROFILE\.codex\skills\wechat-official-account\scripts\configure.ps1" `
  -ExistingEnv "C:\path\to\.env"
```

迁移成功后先执行 `publish.ps1 -CheckAuth`。确认成功后，再从旧 `.env` 删除 `WECHAT_APPID` 和 `WECHAT_APPSECRET`。

## 官方 API

脚本依次调用：

1. `GET https://api.weixin.qq.com/cgi-bin/token`
2. `POST https://api.weixin.qq.com/cgi-bin/media/uploadimg`，仅正文中存在本地图片时调用
3. `POST https://api.weixin.qq.com/cgi-bin/material/add_material?type=image`
4. `POST https://api.weixin.qq.com/cgi-bin/draft/add`
5. `POST https://api.weixin.qq.com/cgi-bin/draft/get`

创建草稿字段：

- `title`
- `author`
- `digest`
- `content`
- `content_source_url`
- `thumb_media_id`
- `need_open_comment`
- `only_fans_can_comment`

脚本只创建草稿，不调用发布或群发接口。
