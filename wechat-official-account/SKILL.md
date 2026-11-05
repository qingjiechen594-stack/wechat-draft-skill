---
name: wechat-official-account
description: 将任意文章转换为微信公众号发文稿，完成正文清理、公众号兼容 HTML 图文排版、封面准备、正文图片上传，并通过微信公众号官方 API 存入草稿箱。用户提到“公众号”“微信公众号”“公众号草稿箱”“存草稿”“发送到公众号草稿”“排版后放进公众号”或要求把本地 Markdown、HTML、DOCX、纯文本文章变成公众号草稿时使用。只创建草稿，不自动群发。
---

# 微信公众号草稿箱

## 目标

把用户提供的文章整理成可直接编辑的微信公众号草稿，并用官方 API 写入已绑定的公众号。保持原文事实、论证和立场，不添加无来源内容。

## 工作流

1. 读取文章正文。支持聊天中的文本或本地 `.md`、`.html`、`.docx` 文件；读取特殊格式时调用对应文档 Skill。
2. 清理与发文无关的过程信息，例如检索汇报、字幕类型、候选淘汰说明、AI 操作说明和内部路径。只有用户要求保留时才保留。
3. 调整为发文视角。保留作者口吻和论证顺序，避免“视频随后”“节目中提到”“整理者认为”等转述腔。不得把作者观点写成已核验事实。
4. 生成标题、摘要和内联样式 HTML。正文使用 `<section>` 作为最外层容器；不要依赖 `<style>`、脚本、外部字体或复杂布局。
5. 准备封面。用户未提供封面时，调用可用的图片生成能力创建 2.35:1 横版封面，建议 `900x383`；标题与关键主体放在中央安全区。
6. 把正文 HTML 和封面保存在当前任务的 `outputs/` 目录。不要把用户文章复制到 Skill 目录。
7. 调用 `scripts/publish.ps1` 创建草稿。此动作会写入公众号草稿箱；用户明确说“存草稿/发送到草稿箱”即视为已授权。不得调用群发接口。
8. 检查脚本输出中的 `ok`、`draft_media_id`、`verified` 和 `verified_title`。只有 `verified=true` 才报告成功。

## 排版要求

- 正文宽度由微信客户端控制，不设置固定页面宽度。
- 使用 16px 左右正文、1.75 至 1.9 行高、深灰正文和高对比度小标题。
- 每段只表达一个意思，避免大段连续粗体。
- 小标题使用关键词式标题，再展开对应内容。
- 引用、提示框和分隔线使用简单内联样式，不使用浮动、定位、表单或交互元素。
- 本地正文图片可保留，脚本会上传并替换为微信图片 URL；远程图片必须是 `https://`。
- 不在文章中展示本地路径、凭证、API 返回值或自动化说明。

## 调用

从任意工作目录执行：

```powershell
& "$env:USERPROFILE\.codex\skills\wechat-official-account\scripts\publish.ps1" `
  -Html "outputs\article.html" `
  -Cover "outputs\cover.png" `
  -Title "文章标题" `
  -Digest "文章摘要" `
  -SourceUrl "https://example.com"
```

`-SourceUrl` 可省略。标题、摘要、HTML 和封面为必填项。

仅检查凭证与 IP 白名单：

```powershell
& "$env:USERPROFILE\.codex\skills\wechat-official-account\scripts\publish.ps1" -CheckAuth
```

## 错误处理

- `40164`：当前出口 IP 不在公众号 API IP 白名单。向用户报告错误中返回的实际 IP。
- `40013`：AppID 无效。重新执行 `scripts/configure.ps1`。
- `40125`：AppSecret 无效或已重置。重新执行配置，不要要求用户把密钥发到聊天里。
- 图片上传失败：检查格式、文件大小和图片路径；不要跳过封面继续创建草稿。
- `draft/add` 无权限：如实说明当前公众号类型或接口权限不支持，禁止改用浏览器模拟绕过。

凭证配置和接口字段详见 [references/api.md](references/api.md)。
