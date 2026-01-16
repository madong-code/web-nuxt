import { nextTick } from 'vue'

class Language {
    private i18n: any;
    private loadLocale: Array<string> = []; //已加载的语言
    public file: string = '';

    constructor(i18n: any) {
        this.i18n = i18n
    }

    /**
     *
     * @param locale 设置语言
     */
    public setI18nLanguage(locale: string) {
        if (this.i18n.mode === 'legacy') {
            this.i18n.global.locale = locale
        } else {
            this.i18n.global.locale = locale
        }
        let html = document.querySelector('html')
        html && html.setAttribute('lang', locale)
    }

    /**
     * 加载语言包
     * @param path
     * @param locale
     * @returns
     */
    public async loadLocaleMessages(app: string, path: string, locale: string) {
        try {
            const file = path == '/' ? 'index' : path.replace('/', '').replaceAll('/', '.')

            if (this.loadLocale.includes(`${app}/${locale}/${file}`)) {
                return nextTick()
            }
            this.loadLocale.push(`${app}/${locale}/${file}`)

            if (app != 'app' && !this.loadLocale.includes(`${app}/${locale}/pages`)) {
                const pagesMessages = await import(`~/addon/${app}/lang/${locale}/pages.json`)
                this.i18n.global.mergeLocaleMessage(locale, pagesMessages)
                this.loadLocale.push(`${app}/${locale}/pages`)
            }

            // 引入语言包文件
            const messages = await import(app == 'app' ? `~/app/lang/${locale}/${file}.json` : `~/addon/${app}/lang/${locale}/${file}.json`)
            const prefix = this.getFileKey(app, path)

            let data: Record<string, string> = {}
            Object.keys(messages.default).forEach(key => {
                data[`${prefix}.${key}`] = messages.default[key]
            })

            this.i18n.global.mergeLocaleMessage(locale, data)
            this.setI18nLanguage(locale)
            return nextTick()
        } catch {
            this.setI18nLanguage(locale)
            return nextTick()
        }
    }

    /**
     * @param app
     * @param path
     */
    public getFileKey = (app: string, path: string) => {
        const file = path == '/' ? 'index' : path.replace('/', '').replaceAll('/', '.')
        return `${app}.${file}`
    }

}

export default Language
