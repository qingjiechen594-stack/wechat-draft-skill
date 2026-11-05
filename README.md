# 微信公众号草稿箱 Skill

一句话让 AI 把文章排版成公众号图文，并存入你自己公众号的**草稿箱**。

- 支持聊天里贴的文字，或本地的 Markdown、HTML、Word 文章
- 自动清理正文、做公众号兼容排版、准备封面、上传正文图片
- **只存草稿，不会群发**。发不发、什么时候发，由你在公众号后台决定

## 使用前准备

1. **Windows 电脑**，并安装 [Node.js](https://nodejs.org/zh-cn)（下载 LTS 版本，一路"下一步"即可）
2. **自己公众号的 AppID 和 AppSecret**：登录公众号后台 → 设置与开发 → 开发接口管理 / 基本配置
3. **IP 白名单**：在同一页面把你电脑的出口 IP 加入"IP 白名单"，否则会报错 `40164`（错误信息里会显示你的实际 IP，照着填就行）

## 安装

**Claude 网页版或桌面 App**：点仓库页面右上角绿色的 **Code → Download ZIP**，解压后把里面的 `wechat-official-account` 文件夹重新压缩成 zip，在 Claude 的技能设置里上传。

**Claude Code**：把 `wechat-official-account` 文件夹复制到 `C:\Users\你的用户名\.claude\skills\` 下。

## 第一次使用：配置密钥

在 PowerShell 里运行 skill 文件夹里的配置脚本，按提示输入 AppID 和 AppSecret：

```powershell
& "<skill 所在文件夹>\wechat-official-account\scripts\configure.ps1"
```

密钥会用 Windows 自带的加密方式保存在你自己的电脑上，**不会写进 skill 文件，也不要把密钥发到聊天里**。

## 怎么用

对 AI 说：

> 把这篇文章排版后存到公众号草稿箱

AI 完成后会回报草稿是否创建成功。打开公众号后台的"草稿箱"，就能看到并继续编辑。

## 常见报错

| 错误码 | 原因 | 处理 |
| --- | --- | --- |
| 40164 | 电脑 IP 不在白名单 | 把报错里的 IP 加入公众号后台白名单 |
| 40013 | AppID 无效 | 重新运行配置脚本 |
| 40125 | AppSecret 无效或已重置 | 重新运行配置脚本 |

> 说明：skill 内部文档里的示例路径写的是 `.codex\skills\...`，如果你装在别的位置，按实际路径替换即可。

## 许可

仅供学习和个人使用，使用者自行负责所绑定公众号的内容与合规。
