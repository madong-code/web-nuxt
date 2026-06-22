// 引入 Element Plus 图标组件@element-plus/icons-vue
//@ts-ignore
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default defineNuxtPlugin((NuxtApp) => {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        NuxtApp.vueApp.component(key, component)
    }
})