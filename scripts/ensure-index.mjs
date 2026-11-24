/**
 * 确保 .output/public/ 下有 index.html（同时生成 200.html / 404.html）。
 *
 * Nuxt 两种构建模式的产物差异：
 *   - nuxi generate（SSG）：产出完整静态站点，包含 200.html / 404.html，
 *     index.html 不存在（SPA fallback 由 200.html 承担）。
 *     → 从 200.html 复制一份为 index.html 即可。
 *
 *   - nuxi build（SSR）：产出 .output/server/ + .output/public/，
 *     public/ 里只有静态资源（_nuxt/、favicon 等），**没有任何 HTML**。
 *     → 动态扫描 _nuxt/ 目录找到客户端入口 JS/CSS，拼一个最小可用的 SPA 入口。
 *       让 backend 静态文件服务或任意静态托管都能直接访问（降级为纯客户端渲染）。
 */
import { access, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const publicDir = join(process.cwd(), '.output', 'public')
const nuxtDir = join(publicDir, '_nuxt')
const indexFile = join(publicDir, 'index.html')
const fallback200 = join(publicDir, '200.html')
const fallback404 = join(publicDir, '404.html')

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

/** 动态扫描 _nuxt/ 找客户端入口（SSR 构建模式） */
async function discoverClientEntry() {
  const files = await readdir(nuxtDir)
  const jsFiles = []
  let entryCss = null

  for (const f of files) {
    const p = join(nuxtDir, f)
    const s = await stat(p)
    if (!s.isFile()) continue
    if (f.startsWith('entry.') && f.endsWith('.css')) {
      entryCss = f
    } else if (f.endsWith('.js')) {
      jsFiles.push({ name: f, size: s.size })
    }
  }

  // 入口 JS：选最大的那个（Nuxt 客户端打包的主入口通常是最大的 chunk）
  const entryJs = jsFiles.sort((a, b) => b.size - a.size)[0]?.name

  // buildId：从 builds/meta/*.json 拿
  let buildId = 'unknown'
  try {
    const buildsMetaDir = join(nuxtDir, 'builds', 'meta')
    const metaFiles = await readdir(buildsMetaDir)
    if (metaFiles.length > 0) buildId = metaFiles[0].replace('.json', '')
  } catch { /* ignore */ }

  return { entryJs, entryCss, buildId }
}

/** 从 .env 或默认值取 baseURL（SSR 构建时 env 会被写入 runtimeConfig） */
function guessBaseUrl() {
  const envVal = process.env.NUXT_APP_BASE_URL || '/'
  return envVal.endsWith('/') ? envVal.slice(0, -1) : envVal
}

async function generateIndexFromScratch() {
  const { entryJs, entryCss, buildId } = await discoverClientEntry()
  if (!entryJs) {
    throw new Error('ensure-index: 未在 _nuxt/ 下找到任何 .js 文件，无法生成入口 HTML')
  }

  const base = guessBaseUrl()
  const assetsDir = `${base}/_nuxt/`

  const cssTag = entryCss
    ? `<link rel="stylesheet" href="${assetsDir}${entryCss}" crossorigin>`
    : ''

  const importmap = `<script type="importmap">{"imports":{"#entry":"${assetsDir}${entryJs}"}}</script>`
  const script = `<script type="module" src="${assetsDir}${entryJs}" crossorigin></script>`
  const runtimeConfig = JSON.stringify({
    public: {
      API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      SITE_NAME: process.env.NUXT_PUBLIC_SITE_NAME || 'MaDong',
      REQUEST_HEADER_CHANNEL_KEY: process.env.NUXT_PUBLIC_REQUEST_HEADER_CHANNEL_KEY || 'pc',
      REQUEST_HEADER_TOKEN_KEY: process.env.NUXT_PUBLIC_REQUEST_HEADER_TOKEN_KEY || 'Authorization',
      DEFAULT_LANG: process.env.NUXT_PUBLIC_DEFAULT_LANG || 'zh-CN',
      X_TENANT_ID: process.env.NUXT_PUBLIC_X_TENANT_ID || '',
      ROUTING_MODE: process.env.NUXT_PUBLIC_ROUTING_MODE || 'frontend',
    },
    app: { baseURL: base, buildId, buildAssetsDir: '/_nuxt/', cdnURL: '' },
  })

  const html = `<!DOCTYPE html><html lang="zh-cn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${importmap}${cssTag}${script}</head><body><div id="__nuxt"></div><div id="teleports"></div><script>window.__NUXT__={};window.__NUXT__.config=${runtimeConfig}</script></body></html>`

  return html
}

async function main() {
  let html

  if (await exists(fallback200)) {
    // generate（SSG）模式：已有完整的 200.html，直接复用其内容
    html = await readFile(fallback200, 'utf8')
    console.log('[ensure-index] SSG 模式：从 200.html 复制 index.html + 404.html')
  } else {
    // SSR build 模式：没有任何 HTML，动态扫描生成
    html = await generateIndexFromScratch()
    console.log('[ensure-index] SSR 模式：动态扫描 _nuxt/ 生成 SPA 入口 HTML')
  }

  await writeFile(indexFile, html)
  await writeFile(fallback200, html)
  await writeFile(fallback404, html)
  console.log(`[ensure-index] ✅ 已生成 index.html (${html.length} 字节) + 200.html + 404.html`)
}

main().catch((e) => { console.error('[ensure-index] ❌', e); process.exit(1) })
