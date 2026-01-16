<script lang="ts">
import type { CSSProperties } from 'vue'

export default defineComponent({
    name: 'Icon',
    props: {
        name: {
            type: String,
            required: true,
        },
        size: {
            type: [String, Number],
            default: '18px',
        },
        color: {
            type: String,
            default: '#000000',
        },
        attr: {
            type: Object,
            default: () => {},
        },
    },
    setup(props:any) {
        // 添加isExternal函数定义
        const isExternal = (path: string): boolean => {
            return /^(https?:|mailto:|tel:)/.test(path)
        }

        const iconStyle = computed((): CSSProperties => {
            const { size, color } = props
            // 修复：添加类型检查，确保size是字符串才能调用replace方法
            let fontSize = typeof size === 'string' ? `${size.replace('px', '')}px` : `${size}px`
            return {
                fontSize: fontSize,
                color: color,
            }
        })

        if (props.name.startsWith('el-icon-')) {
            // 提取去掉前缀后的组件名
            const iconName = props.name.replace('el-icon-', '')
            return () =>
                h(resolveComponent('el-icon'), { class: [props.name, 'icon'], style: iconStyle.value, ...props.attr }, () =>
                    h(resolveComponent(iconName))
                )
        } else if (props.name.startsWith('local-') || isExternal(props.name)) {
              const name = props.name.replace('local-', '')
            return () => h(resolveComponent('nuxt-icon'), { class: [props.name, 'icon'], name: name, style: iconStyle.value, ...props.attr })
        } else {
            // 处理fa前缀和其他普通图标
            return () => h('i', { class: [props.name, 'icon'], style: iconStyle.value, ...props.attr })
        }
    },
})
</script>