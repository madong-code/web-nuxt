import { createI18n } from 'vue-i18n'
import storage from '@/utils/storage'

// 定义语言文件模块接口
interface LanguageFileModule {
  default: Record<string, any>
}

// 类型保护函数，确保模块符合预期格式
function isLanguageFileModule(module: any): module is LanguageFileModule {
  return module && typeof module === 'object' && 'default' in module && typeof module.default === 'object'
}

// 递归处理嵌套结构
const flattenMessages = (obj: any, path: string = '') => {
  let result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newPath = path ? `${path}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenMessages(value, newPath))
    } else {
      result[newPath] = String(value)
    }
  }
  return result
}

// 自动扫描加载所有语言文件
const loadAllLanguageFiles = () => {
  const messages: Record<string, Record<string, any>> = {}
  
  try {
    // 加载所有语言文件（包括子目录）
    const languageFiles = import.meta.glob('~/lang/**/*.json', { 
      eager: true 
    }) as Record<string, LanguageFileModule>
    
    // 处理语言文件
    for (const [filePath, module] of Object.entries(languageFiles)) {
      if (isLanguageFileModule(module)) {
        const pathParts = filePath.split('/')
        const langIndex = pathParts.indexOf('lang')
        
        if (langIndex >= 0 && pathParts.length > langIndex + 1) {
          const langCode = pathParts[langIndex + 1] ?? ''
          
          if (langCode) {
            if (!messages[langCode]) {
              messages[langCode] = {}
            }
            
            // 只使用文件名作为键前缀，不包含目录名
            const fileName = (pathParts[pathParts.length - 1] ?? '').replace('.json', '')
            const fileKey = fileName
            
            // 处理嵌套结构
            const flattenedMessages = flattenMessages(module.default)
            
            // 如果有文件键前缀，添加到所有消息键前
            if (fileKey) {
              const prefixedMessages: Record<string, string> = {}
              for (const [key, value] of Object.entries(flattenedMessages)) {
                prefixedMessages[`${fileKey}.${key}`] = value
              }
              messages[langCode] = {
                ...messages[langCode],
                ...prefixedMessages
              }
            } else {
              // 没有前缀，直接合并
              messages[langCode] = {
                ...messages[langCode],
                ...flattenedMessages
              }
            }
          }
        }
      }
    }
    
    // 加载 apps 目录下的语言文件
    const appsLanguageFiles = import.meta.glob('~/apps/**/lang/**/*.json', {
      eager: true
    }) as Record<string, LanguageFileModule>

    // 处理 apps 语言文件
    for (const [filePath, module] of Object.entries(appsLanguageFiles)) {
      if (isLanguageFileModule(module)) {
        const pathParts = filePath.split('/')
        const appsIndex = pathParts.indexOf('apps')
        const langIndex = pathParts.indexOf('lang')
        
        if (appsIndex >= 0 && langIndex >= 0 && pathParts.length > langIndex + 1) {
          const langCode = pathParts[langIndex + 1] ?? ''
          
          if (langCode) {
            if (!messages[langCode]) {
              messages[langCode] = {}
            }
            
            // 提取模块名（apps目录下的子目录名）
            const moduleName = pathParts[appsIndex + 1] ?? ''
            
            // 只使用文件名作为键前缀，不包含目录名
            const fileName = (pathParts[pathParts.length - 1] ?? '').replace('.json', '')
            
            // 构建文件键，包含模块名前缀
            let fileKey = moduleName
            if (fileName) {
              fileKey = `${moduleName}.${fileName}`
            }
            
            // 处理嵌套结构
            const flattenedMessages = flattenMessages(module.default)
            
            // 如果有文件键前缀，添加到所有消息键前
            if (fileKey) {
              const prefixedMessages: Record<string, string> = {}
              for (const [key, value] of Object.entries(flattenedMessages)) {
                prefixedMessages[`${fileKey}.${key}`] = value
              }
              messages[langCode] = {
                ...messages[langCode],
                ...prefixedMessages
              }
            } else {
              // 没有前缀，直接合并
              messages[langCode] = {
                ...messages[langCode],
                ...flattenedMessages
              }
            }
          }
        }
      }
    }
    
    // 如果没有任何语言文件，使用默认配置
    if (Object.keys(messages).length === 0) {
      console.warn('未找到任何语言文件，使用默认语言配置')
      messages['zh-cn'] = { common: {} }
      messages['en'] = { common: {} }
    }
    
    return messages
  } catch (error) {
    console.error('加载语言文件时出错:', error)
    // 返回默认配置
    return {
      'zh-cn': { common: {} },
      'en': { common: {} }
    }
  }
}

export default defineNuxtPlugin((NuxtApp) => {
  // 加载所有语言消息
  const messages = loadAllLanguageFiles()
  
  // 从存储中读取语言设置，默认为 zh-cn
  const savedLocale = storage.get('lang') ?? 'zh-cn'
  
  const i18n = createI18n({
    legacy: false, // 使用Composition API
    locale: savedLocale, // 使用存储中的语言设置
    fallbackLocale: 'zh-cn', // 回退语言
    globalInjection: true, // 全局注入
    messages: messages,
    silentFallbackWarn: true,
    silentTranslationWarn: true
  })
  
  NuxtApp.vueApp.use(i18n)

  return {
    provide: {
      i18n: i18n.global, // 提供全局实例
      getI18n: () => i18n
    }
  }
})
