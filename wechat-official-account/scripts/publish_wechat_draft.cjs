const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`缺少必需凭证：${name}`);
  return value;
}

function requiredArg(args, name) {
  const value = args[name];
  if (!value) throw new Error(`缺少必需参数：--${name}`);
  return value;
}

function mimeFor(file) {
  const extension = path.extname(file).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
  };
  if (!types[extension]) throw new Error(`不支持的图片格式：${extension}`);
  return types[extension];
}

function multipart(filePath) {
  const boundary = `----codex-wechat-${crypto.randomBytes(12).toString('hex')}`;
  const file = fs.readFileSync(filePath);
  const head = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="media"; filename="${path.basename(filePath)}"\r\n` +
    `Content-Type: ${mimeFor(filePath)}\r\n\r\n`,
    'utf8'
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  return {
    body: Buffer.concat([head, file, tail]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`微信 API 返回非 JSON 内容，HTTP ${response.status}`);
  }
  if (!response.ok || json.errcode) {
    throw new Error(`微信 API 调用失败：${JSON.stringify(json)}`);
  }
  return json;
}

async function getAccessToken(appId, appSecret) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', appSecret);
  const json = await requestJson(url);
  if (!json.access_token) throw new Error('微信 API 未返回 access_token。');
  return json.access_token;
}

async function uploadFile(url, filePath) {
  const form = multipart(filePath);
  return requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': form.contentType },
    body: form.body,
  });
}

function extractContent(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const sectionMatch = body.match(/<section(?:\s[^>]*)?>[\s\S]*<\/section>/i);
  const content = (sectionMatch ? sectionMatch[0] : body)
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim();
  if (!content) throw new Error('提取后的文章正文为空。');
  return content;
}

function decodeDataImage(source, temporaryDirectory) {
  const match = source.match(/^data:(image\/(?:png|jpeg|gif));base64,([\s\S]+)$/i);
  if (!match) return null;
  const extension = match[1].toLowerCase() === 'image/jpeg' ? '.jpg' : `.${match[1].split('/')[1].toLowerCase()}`;
  const filePath = path.join(temporaryDirectory, `inline-${crypto.randomBytes(8).toString('hex')}${extension}`);
  fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
  return filePath;
}

async function uploadBodyImages(content, htmlDirectory, accessToken) {
  const sources = [...content.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)]
    .map((match) => match[2])
    .filter((value, index, all) => all.indexOf(value) === index);
  if (sources.length === 0) return content;

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-wechat-'));
  let updated = content;
  try {
    for (const source of sources) {
      if (/^https:\/\//i.test(source)) continue;
      let imagePath = decodeDataImage(source, temporaryDirectory);
      if (!imagePath) {
        if (/^[a-z]+:\/\//i.test(source)) {
          throw new Error(`正文图片必须是 HTTPS、本地文件或 data URI：${source}`);
        }
        imagePath = path.isAbsolute(source) ? source : path.resolve(htmlDirectory, source);
      }
      if (!fs.existsSync(imagePath)) throw new Error(`找不到正文图片：${imagePath}`);

      const url = new URL('https://api.weixin.qq.com/cgi-bin/media/uploadimg');
      url.searchParams.set('access_token', accessToken);
      const uploaded = await uploadFile(url, imagePath);
      if (!uploaded.url) throw new Error(`正文图片上传成功但未返回 URL：${imagePath}`);
      updated = updated.split(source).join(uploaded.url);
    }
    return updated;
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

async function uploadCover(accessToken, coverPath) {
  const size = fs.statSync(coverPath).size;
  if (size > 2 * 1024 * 1024) throw new Error('封面图片不能超过 2MB。');
  const url = new URL('https://api.weixin.qq.com/cgi-bin/material/add_material');
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('type', 'image');
  const json = await uploadFile(url, coverPath);
  if (!json.media_id) throw new Error('封面上传成功但未返回 media_id。');
  return json;
}

async function addDraft(accessToken, article) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/draft/add');
  url.searchParams.set('access_token', accessToken);
  const json = await requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ articles: [article] }),
  });
  if (!json.media_id) throw new Error('草稿创建成功但未返回 media_id。');
  return json.media_id;
}

async function getDraft(accessToken, mediaId) {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/draft/get');
  url.searchParams.set('access_token', accessToken);
  return requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ media_id: mediaId }),
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const appId = requiredEnv('WECHAT_APPID');
  const appSecret = requiredEnv('WECHAT_APPSECRET');
  const accessToken = await getAccessToken(appId, appSecret);

  if (args['check-auth']) {
    console.log(JSON.stringify({
      ok: true,
      auth_verified: true,
      app_id_suffix: appId.slice(-6),
    }));
    return;
  }

  const htmlPath = path.resolve(requiredArg(args, 'html'));
  const coverPath = path.resolve(requiredArg(args, 'cover'));
  const title = requiredArg(args, 'title');
  const digest = requiredArg(args, 'digest');
  if (!fs.existsSync(htmlPath)) throw new Error(`找不到文章 HTML：${htmlPath}`);
  if (!fs.existsSync(coverPath)) throw new Error(`找不到封面图片：${coverPath}`);

  let content = extractContent(fs.readFileSync(htmlPath, 'utf8'));
  content = await uploadBodyImages(content, path.dirname(htmlPath), accessToken);
  const cover = await uploadCover(accessToken, coverPath);
  const mediaId = await addDraft(accessToken, {
    title,
    author: process.env.WECHAT_AUTHOR || '',
    digest,
    content,
    content_source_url: args['source-url'] || '',
    thumb_media_id: cover.media_id,
    need_open_comment: 0,
    only_fans_can_comment: 0,
  });

  const verifiedDraft = await getDraft(accessToken, mediaId);
  const verifiedArticle = verifiedDraft.news_item?.[0] || verifiedDraft.articles?.[0] || null;
  const verifiedTitle = verifiedArticle?.title || '';
  console.log(JSON.stringify({
    ok: true,
    draft_media_id: mediaId,
    cover_media_id: cover.media_id,
    verified: verifiedTitle === title,
    verified_title: verifiedTitle,
    title,
  }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
