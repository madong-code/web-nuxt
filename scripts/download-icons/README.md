# 离线图标模式使用说明

## 概述

本项目支持离线图标模式，图标数据可以本地缓存，减少对在线 API 的依赖。

## 工作原理

1. **优先从本地加载**：客户端优先从 `/public/icons/` 目录加载图标数据
2. **在线回退**：如果本地没有缓存，自动从 Iconify API 获取
3. **服务端处理**：服务端始终使用在线 API（因为服务端无法访问 public 目录）

## 下载图标到本地

### 快速开始

```bash
# 进入下载脚本目录
cd web/scripts/download-icons

# 运行下载脚本（无需额外依赖）
node download-icons.cjs
```

### 下载结果

脚本会下载以下图标集到 `web/public/icons/` 目录：

- `ant-design.json` - 830 个 Ant Design 图标
- `simple-icons.json` - 3393 个品牌图标
- `mdi.json` - 9032 个 Material Design Icons
- `material-symbols.json` - 15161 个 Material Symbols
- `tabler.json` - 5986 个 Tabler Icons
- `ph.json` - 9072 个 Phosphor Icons
- `lucide.json` - 1669 个 Lucide Icons

**总计：45,143 个图标**

## 目录结构

```
web/
├── public/
│   └── icons/
│       ├── index.json          # 图标索引文件
│       ├── ant-design.json      # Ant Design 图标集
│       ├── simple-icons.json    # Simple Icons 图标集
│       ├── mdi.json             # MDI 图标集
│       ├── material-symbols.json # Material Symbols 图标集
│       ├── tabler.json          # Tabler Icons 图标集
│       ├── ph.json              # Phosphor Icons 图标集
│       └── lucide.json          # Lucide Icons 图标集
└── scripts/
    └── download-icons/
        ├── download-icons.cjs   # 下载脚本
        └── README.md
```

## 使用示例

```vue
<template>
  <Icon icon="ant-design:home-outlined" />
  <Icon icon="simple-icons:gitee" />
  <Icon icon="mdi:account" />
</template>

<script setup>
import { Icon } from '~/components/icon'
</script>
```

## 支持的图标集

| 图标集 | 数量 | 说明 |
|--------|------|------|
| ant-design | 830 | Ant Design 官方图标 |
| simple-icons | 3393 | 品牌图标（GitHub、Gitee 等） |
| mdi | 9032 | Material Design Icons |
| material-symbols | 15161 | Google Material Symbols |
| tabler | 5986 | Tabler Icons |
| ph | 9072 | Phosphor Icons |
| lucide | 1669 | Lucide Icons |

## 注意事项

1. **首次加载**：首次使用时需要下载图标数据到本地
2. **网络要求**：如果本地没有缓存，需要网络连接才能获取图标
3. **更新图标**：如需更新图标集，重新运行下载脚本即可
4. **文件大小**：完整的图标集较大，但已优化为 JSON 格式，加载速度快

## 故障排除

### 图标不显示

1. 检查浏览器控制台是否有错误信息
2. 确认 `/public/icons/` 目录下有对应的 JSON 文件
3. 检查网络连接（如果本地没有缓存）

### 下载失败

1. 检查网络连接
2. 确认 Node.js 版本 >= 14
3. 尝试手动下载图标数据

## 性能优化

- 图标数据会在内存中缓存，避免重复加载
- 使用 CDN 加速图标 SVG 的加载
- 已下载 45,143 个图标，覆盖大部分常用场景

## 技术细节

### 加载策略

```typescript
// 客户端优先从本地加载
if (process.client) {
  try {
    // 1. 尝试从本地加载
    icons = await fetch(`/icons/${prefix}.json`)
  } catch (localError) {
    // 2. 本地加载失败，回退到在线 API
    icons = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`)
  }
} else {
  // 3. 服务端始终使用在线 API
  icons = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`)
}
```

### 缓存机制

- 内存缓存：避免重复请求
- 本地文件：持久化存储
- 在线回退：确保可用性
