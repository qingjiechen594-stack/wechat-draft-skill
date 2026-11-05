# 微信公众号草稿箱 Skill

一句话让 AI 把文章排版成公众号图文，并存入你自己公众号的**草稿箱**。

- 支持聊天里贴的文字，或本地的 Markdown、HTML、Word 文章
- 自动清理正文、做公众号兼容排版、准备封面、上传正文图片
- **只存草稿，不会群发**。发不发、什么时候发，由你在公众号后台决定

本 skill 采用通用的 Skill 格式（一个文件夹 + `SKILL.md`），可用于 **Claude、WorkBuddy、ChatGPT / Codex** 等支持 Skill 的 AI 工具。

---

## 一、先看你的工具能不能用

"排版"在哪里都能做；"存入草稿箱"需要在**你自己的 Windows 电脑上**运行脚本，因为密钥加密保存在本机，公众号后台也只认白名单里的 IP。

| 工具 | 排版 | 存入草稿箱 |
| --- | --- | --- |
| WorkBuddy（桌面版） | ✅ | ✅ |
| Claude Code / Claude 桌面 App（已关联本地电脑） | ✅ | ✅ |
| Codex（ChatGPT 的本地版：桌面 App 或命令行） | ✅ | ✅ |
| ChatGPT 网页版 / Claude 网页版 | ✅ | ❌ 云端无法访问你电脑上的密钥 |

---

## 二、使用前准备（只做一次）

1. **Windows 电脑**，并安装 [Node.js](https://nodejs.org/zh-cn)（下载 LTS 版本，一路"下一步"即可）
2. **公众号的 AppID 和 AppSecret**：登录公众号后台 → 设置与开发 → 开发接口管理 / 基本配置
3. **IP 白名单**：在同一页面把你电脑的出口 IP 加入"IP 白名单"，否则会报错 `40164`（报错信息里会显示你的实际 IP，照着填即可）

---

## 三、安装

先下载：点本页面右上方绿色的 **Code → Download ZIP**，解压后得到 `wechat-official-account` 文件夹。

### WorkBuddy
- **最简单**：打开【技能管理】，选"通过 URL 导入"，粘贴本仓库地址。
- **手动**：把 `wechat-official-account` 文件夹复制到 `C:\Users\你的用户名\.workbuddy\skills\`，再到【技能管理】里确认已启用。

### Claude
- **网页版 / 桌面 App**：把 `wechat-official-account` 文件夹压缩成 zip，在 Claude 的技能设置里上传。
- **Claude Code**：把文件夹复制到 `C:\Users\你的用户名\.claude\skills\`。

### ChatGPT / Codex
- **Codex（推荐，能存草稿）**：把文件夹复制到 `C:\Users\你的用户名\.agents\skills\`（旧版本使用 `.codex\skills\`）。
- **ChatGPT 网页版**：Skill 功能目前仍在逐步开放，部分账号或工作区需管理员开启。可以在账号的 Skills 页面里新建技能，把 `SKILL.md` 的内容作为说明粘贴进去。只能使用排版功能。

> 不同工具的界面和菜单会更新，以各工具的最新说明为准。

---

## 四、第一次使用：配置密钥

打开 PowerShell，运行 skill 文件夹里的配置脚本，按提示输入 AppID 和 AppSecret：

```powershell
& "C:\你的skill路径\wechat-official-account\scripts\configure.ps1"
```

- 密钥用 Windows 自带的加密方式保存在本机，**不会写进 skill 文件**
- **不要把密钥发到聊天里**，任何工具都不需要你这样做

配置后可以先让 AI 运行一次"检查公众号授权"，确认密钥和 IP 白名单都没问题。

---

## 五、怎么用

对 AI 说：

> 把这篇文章排版后存到公众号草稿箱

AI 完成后会回报草稿是否创建成功。打开公众号后台的"草稿箱"，就能看到并继续编辑。

只想要排版、不存草稿，可以说：

> 把这篇文章排版成公众号格式，给我 HTML

---

## 六、常见报错

| 错误码 | 原因 | 处理 |
| --- | --- | --- |
| 40164 | 电脑 IP 不在白名单 | 把报错里的 IP 加入公众号后台白名单 |
| 40013 | AppID 无效 | 重新运行配置脚本 |
| 40125 | AppSecret 无效或已重置 | 重新运行配置脚本 |
| 找不到 node | 没装 Node.js | 安装 Node.js 后重启电脑或 AI 工具 |

---

## 许可

仅供学习和个人使用，使用者自行负责所绑定公众号的内容与合规。
