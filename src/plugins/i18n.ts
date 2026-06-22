import { createI18n } from 'vue-i18n'
import storage from '@/utils/storage'

type LocaleMessages = Record<string, any>

let conflictWarnCount = 0

// ============ 工具函数 ============

function deepMerge(target: LocaleMessages, source: LocaleMessages): LocaleMessages {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {}
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

function setNestedValue(
  obj: LocaleMessages,
  keys: string[],
  value: LocaleMessages,
): void {
  if (keys.length === 0) return

  let current: LocaleMessages = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i] as string
    if (!current[key]) current[key] = {}
    current = current[key] as LocaleMessages
  }
  const lastKey = keys[keys.length - 1] as string
  const existing = current[lastKey]
  if (
    existing &&
    typeof existing === 'object' &&
    !Array.isArray(existing) &&
    typeof value === 'object'
  ) {
    deepMerge(existing as LocaleMessages, value)
  } else if (existing !== undefined && conflictWarnCount < 10) {
    conflictWarnCount++
    const keyPath = keys.join('.')
    console.warn(
      `[i18n] Key conflict detected: "${keyPath}" is being overwritten. ` +
        `This may be caused by both directory-based file and dotted-filename file producing the same key.`,
    )
    current[lastKey] = value
  } else {
    current[lastKey] = value
  }
}

// ============ 模式1: 目录+文件+key (用于 lang/) ============

function extractDirFileKeys(
  path: string,
  baseDir: string,
): null | { fileKeys: string[]; localeDir: string } {
  const parts = path.split('/')
  const baseIndex = parts.lastIndexOf(baseDir)
  if (baseIndex === -1 || baseIndex + 2 >= parts.length) return null

  const localeDir = parts[baseIndex + 1]
  if (!localeDir) return null

  // 目录路径作为 key 前缀（如 auth/register/ → ['auth', 'register']）
  const dirParts = parts.slice(baseIndex + 2, -1)
  // 文件名作为整体，不按点拆分（如 login.json → ['login']）
  const fileName = parts.at(-1)?.replace('.json', '') || ''
  const fileNameParts = [fileName]

  return { localeDir, fileKeys: [...dirParts, ...fileNameParts] }
}

// ============ 模式2: 插件命名空间 + 目录+文件+key (用于 plugin/*/lang/) ============

function extractPluginFileKeys(
  path: string,
): null | { fileKeys: string[]; localeDir: string } {
  const parts = path.split('/')
  const pluginIndex = parts.indexOf('plugin')
  const langIndex = parts.indexOf('lang')
  if (pluginIndex === -1 || langIndex === -1 || langIndex + 2 >= parts.length)
    return null

  const pluginKey = parts[pluginIndex + 1]
  const localeDir = parts[langIndex + 1]
  if (!pluginKey || !localeDir) return null

  // 目录路径作为 key 前缀
  const dirParts = parts.slice(langIndex + 2, -1)
  // 文件名作为整体，不按点拆分
  const fileName = parts.at(-1)?.replace('.json', '') || ''
  const fileNameParts = [fileName]

  return { localeDir, fileKeys: [pluginKey, ...dirParts, ...fileNameParts] }
}

// ============ 语言包加载函数 ============

function loadAppLangLocales(localeDir: string): LocaleMessages {
  const messages: LocaleMessages = {}

  const langModules = import.meta.glob<{ default: LocaleMessages }>(
    '~/lang/**/*.json',
    { eager: true },
  )

  for (const [path, module] of Object.entries(langModules)) {
    const result = extractDirFileKeys(path, 'lang')
    if (!result || result.localeDir !== localeDir) continue
    setNestedValue(messages, result.fileKeys, module.default)
  }

  return messages
}

function loadPluginLocales(localeDir: string): LocaleMessages {
  const messages: LocaleMessages = {}

  const pluginModules = import.meta.glob<{ default: LocaleMessages }>(
    '~/plugin/**/lang/**/*.json',
    { eager: true },
  )

  for (const [path, module] of Object.entries(pluginModules)) {
    const result = extractPluginFileKeys(path)
    if (!result || result.localeDir !== localeDir) continue
    setNestedValue(messages, result.fileKeys, module.default)
  }

  return messages
}

function loadAllLocaleMessages(locale: string): LocaleMessages {
  const localeDir = locale
  const messages: LocaleMessages = {}

  deepMerge(messages, loadAppLangLocales(localeDir))
  deepMerge(messages, loadPluginLocales(localeDir))

  return messages
}

// ============ Nuxt 插件定义 ============

export default defineNuxtPlugin((NuxtApp) => {
  const locale = storage.get('lang') || 'zh-cn'

  const messages: Record<string, any> = {}
  const locales = ['zh-cn', 'en']
  for (const loc of locales) {
    messages[loc] = loadAllLocaleMessages(loc)
  }

  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-cn',
    globalInjection: true,
    messages,
    silentFallbackWarn: true,
    silentTranslationWarn: true,
  })

  NuxtApp.vueApp.use(i18n)

  return {
    provide: {
      i18n: i18n.global,
      getI18n: () => i18n,
    },
  }
})
