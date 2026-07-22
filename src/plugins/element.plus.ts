// 引入 Element Plus 全部图标组件（@element-plus/icons-vue 含数百个图标）
// 注意：此处全量全局注册会将这些图标组件全部打包进主 bundle，体积代价较大。
// 若后续追求极致首屏体积，可改为按需引入（如 unplugin-icons 或局部 import 具体图标）。
//@ts-ignore
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default defineNuxtPlugin((NuxtApp) => {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        NuxtApp.vueApp.component(key, component)
    }
})