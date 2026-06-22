# 图标组件使用说明

## 功能特性

- 支持多种图标库：Ant Design、Element Plus、Carbon、IC、Lucide、Ri 等
- 支持自定义图标
- 支持图标选择器组件
- 支持离线模式

## 安装依赖

```bash
pnpm add @iconify/vue @iconify/json
```

## 使用方式

### 1. 基础图标组件 (Iconify)

```vue
<template>
  <Iconify icon="ant-design:home-outlined" />
  <Iconify icon="ep:home-filled" />
  <Iconify icon="carbon:home" />
  <Iconify icon="ic:baseline-home" />
  <Iconify icon="lucide:home" />
  <Iconify icon="ri:home-line" />
</template>

<script setup lang="ts">
import Iconify from '~/components/iconify.vue'
</script>
```

### 2. 自定义尺寸和颜色

```vue
<template>
  <Iconify icon="ant-design:home-outlined" width="24" height="24" />
  <Iconify icon="ant-design:home-outlined" width="32" height="32" color="#409eff" />
  <Iconify icon="ant-design:home-outlined" size="1.5em" color="#67c23a" />
</template>
```

### 3. 图标选择器 (IconSelector)

```vue
<template>
  <IconSelector v-model="selectedIcon" text="选择图标" width="300px" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IconSelector from '~/components/icon-selector.vue'

const selectedIcon = ref('')
</script>
```

### 4. 监听图标选择事件

```vue
<template>
  <IconSelector v-model="selectedIcon" @get-icon="handleGetIcon" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IconSelector from '~/components/icon-selector.vue'

const selectedIcon = ref('')

const handleGetIcon = (icon: string) => {
  console.log('选择的图标:', icon)
}
</script>
```

## 支持的图标库

| 图标库 | 前缀 | 示例 |
|--------|------|------|
| Ant Design | `ant-design` | `ant-design:home-outlined` |
| Element Plus | `ep` | `ep:home-filled` |
| Carbon | `carbon` | `carbon:home` |
| IC | `ic` | `ic:baseline-home` |
| Lucide | `lucide` | `lucide:home` |
| Ri | `ri` | `ri:home-line` |

## 自定义添加图标库

### 1. 安装图标库

```bash
pnpm add @iconify-json/your-icon-library
```

### 2. 在 load-icon.ts 中添加

```typescript
import YourIcons from '@iconify/json/json/your-icon-library.json'
addCollection(YourIcons)
```

### 3. 在 icon-selector.vue 中添加

```typescript
const iconifyPrefixs = ['ant-design', 'carbon', 'ic', 'lucide', 'ep', 'ri', 'your-icon-library']
```

## 配置说明

### 离线模式

在 `.env` 文件中配置：

```env
VITE_APP_ICON_OFFLINE=true
VITE_APP_ICONIFY_PREFIX=ant-design,carbon,ic,lucide,ep,ri
```

### 图标选择器配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | string | '' | v-model 绑定的图标值 |
| text | string | '图标选择器' | 显示文本 |
| width | string | '200px' | 组件宽度 |
| size | string | 'default' | 组件大小：large/default/small |
| disabled | boolean | false | 是否禁用 |

## 注意事项

1. 图标名称格式：`图标库名称:图标名称`
2. 离线模式下需要预先加载所有图标数据
3. 图标选择器支持搜索功能
4. 图标选择器支持分页显示

## 示例代码

完整示例请参考项目中的使用场景。
