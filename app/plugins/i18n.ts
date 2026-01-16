import { createI18n } from 'vue-i18n'

// 定义语言文件模块接口
interface LanguageFileModule {
  default: Record<string, any>
}

// 类型保护函数，确保模块符合预期格式
function isLanguageFileModule(module: any): module is LanguageFileModule {
  return module && typeof module === 'object' && 'default' in module && typeof module.default === 'object'
}

// 自动扫描加载所有语言文件
const loadAllLanguageFiles = () => {
  const messages: Record<string, Record<string, any>> = {}
  
  try {
    // 加载所有语言文件
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
          const fileName = (pathParts[pathParts.length - 1] ?? '').replace('.json', '')
          
          if (langCode && fileName) {
            if (!messages[langCode]) {
              messages[langCode] = {}
            }
            // 直接合并所有文件内容到对应语言下
            messages[langCode] = {
              ...messages[langCode],
              ...module.default
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
  
  const i18n = createI18n({
    legacy: false, // 使用Composition API
    locale: 'zh-cn', // 默认语言
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