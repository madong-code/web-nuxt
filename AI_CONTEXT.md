# AI 架构上下文

## 项目概览

这是一个基于 Nuxt 4 和 Element Plus 的现代化管理系统前端项目，使用 TypeScript 开发，旨在提供高效、美观、可扩展的管理界面。

### 技术栈
- **前端框架**：Nuxt 4
- **UI 库**：Element Plus
- **开发语言**：TypeScript
- **状态管理**：Pinia
- **国际化**：Vue I18n
- **样式方案**：SCSS + UnoCSS
- **图标库**：Nuxt Icons
- **构建工具**：Vite

## 目录结构

```
web/
├── app/                  # 主应用目录
│   ├── api/              # API 接口定义
│   ├── apps/             # 功能模块目录
│   │   └── cms/          # CMS 功能模块
│   ├── assets/           # 静态资源
│   │   ├── icons/        # 图标文件
│   │   ├── images/       # 图片文件
│   │   └── scss/         # SCSS 样式文件
│   ├── components/       # Vue 组件
│   ├── composables/      # 组合式函数
│   ├── lang/             # 国际化语言文件
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   ├── plugins/          # 插件
│   ├── stores/           # Pinia 状态管理
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   ├── app.vue           # 根组件
│   └── router.options.ts # 路由配置
├── public/               # 公共静态资源
├── .gitignore            # Git 忽略文件
├── nuxt.config.ts        # Nuxt 配置
├── package.json          # 项目依赖和脚本
├── tsconfig.json         # TypeScript 配置
└── uno.config.ts         # UnoCSS 配置
```

## 核心功能

### 认证系统
- **登录/注册**：完整的用户认证流程
- **验证码**：集成短信验证码和图形验证码
- **路由守卫**：保护需要认证的路由

### 会员中心
- **个人资料**：用户信息管理和编辑
- **专属布局**：独立的会员中心布局

### 国际化
- **多语言支持**：内置中文和英文
- **动态切换**：实时语言切换功能

### 主题系统
- **深色模式**：支持浅色/深色主题切换
- **主题定制**：基于 SCSS 的灵活主题配置

### 路由系统
- **动态路由**：从功能模块自动加载路由
- **布局路由**：基于路由元信息的智能布局切换

## 技术架构

### 前端架构
- **MVVM 模式**：基于 Vue 3 的响应式数据绑定
- **组件化开发**：模块化、可复用的组件设计
- **组合式 API**：使用 Vue 3 的组合式 API 进行状态管理和逻辑复用
- **路由管理**：基于 Vue Router 的完整路由系统
- **状态管理**：使用 Pinia 进行高效的全局状态管理

### 构建系统
- **Vite**：现代化的开发服务器和构建工具
- **ESLint**：确保代码质量和一致性
- **TypeScript**：提供类型安全保障
- **SCSS**：强大的 CSS 预处理器
- **UnoCSS**：高性能的原子化 CSS 框架

### 部署方案
- **Docker**：支持容器化部署
- **Nitro**：Nuxt 的服务器引擎，支持 SSR/SSG 等多种渲染模式

## 核心 API 和服务

### API 接口
- **认证接口**：`app/api/auth.ts` - 处理登录、注册等认证相关请求
- **会员接口**：`app/api/member.ts` - 处理会员相关请求
- **系统接口**：`app/api/system.ts` - 处理系统相关请求

### 工具函数
- **请求工具**：`app/utils/request.ts` - 封装 HTTP 请求
- **存储工具**：`app/utils/storage.ts` - 封装本地存储
- **路由工具**：`app/utils/router.ts` - 路由相关工具函数
- **验证工具**：`app/utils/validate.ts` - 表单验证工具
- **语言工具**：`app/utils/language.ts` - 语言相关工具函数
- **通用工具**：`app/utils/common.ts` - 通用工具函数
- **深色模式工具**：`app/utils/dark.ts` - 深色模式相关工具函数

### 状态管理
- **应用状态**：`app/stores/app.ts` - 应用全局状态
- **配置状态**：`app/stores/config.ts` - 系统配置状态
- **全局状态**：`app/stores/globals.ts` - 全局共享状态
- **会员状态**：`app/stores/member.ts` - 会员相关状态
- **个人中心状态**：`app/stores/personal-center.ts` - 个人中心相关状态
- **系统状态**：`app/stores/system.ts` - 系统相关状态

## 配置信息

### Nuxt 配置
- **模块集成**：Element Plus、Pinia、VueUse、UnoCSS 等
- **CSS 配置**：SCSS 和 UnoCSS
- **路由配置**：自定义路由，支持动态加载功能模块路由
- **服务器代理**：配置 API 代理，解决跨域问题

### 依赖管理
- **包管理工具**：pnpm
- **核心依赖**：Element Plus、Vue I18n、Pinia、NProgress 等
- **开发依赖**：TypeScript、ESLint、Sass 等

## 关键文件和模块

### 路由配置
- `app/router.options.ts`：自定义路由配置，支持从功能模块自动加载路由
- `app/pages/routes.ts`：主应用路由定义
- `app/apps/cms/pages/routes.ts`：CMS 功能模块路由定义

### 布局组件
- `app/layouts/default.vue`：默认布局
- `app/layouts/member.vue`：会员中心布局
- `app/layouts/container.vue`：容器布局

### 页面组件
- `app/pages/index.vue`：首页
- `app/pages/member/profile.vue`：会员个人资料页
- `app/apps/cms/pages/index.vue`：CMS 首页

### 核心组件
- `app/components/login-dialog/`：登录/注册对话框
- `app/components/sms-code/`：短信验证码组件
- `app/components/icon.vue`：图标组件

### 组合式函数
- `app/composables/login.ts`：登录相关逻辑
- `app/composables/captcha.ts`：验证码相关逻辑
- `app/composables/lang.ts`：语言相关逻辑
- `app/composables/send-sms.ts`：发送短信相关逻辑

## 开发规范

### 代码风格
- 使用 TypeScript 进行类型检查
- 使用 ESLint 进行代码质量检查
- 遵循 Vue 3 的最佳实践

### 命名规范
- **组件名**：使用 PascalCase（如 `LoginDialog`）
- **文件名**：使用 kebab-case（如 `login-dialog.vue`）
- **变量名**：使用 camelCase（如 `userInfo`）
- **常量名**：使用 UPPER_CASE（如 `API_BASE_URL`）

### 目录结构规范
- 功能模块放在 `app/apps/` 目录下
- 通用组件放在 `app/components/` 目录下
- 页面组件放在 `app/pages/` 目录下
- 工具函数放在 `app/utils/` 目录下

## 未来扩展

### 功能扩展
- 支持更多功能模块的集成
- 增强国际化支持，添加更多语言
- 提供更多主题选项和自定义能力

### 性能优化
- 实现更细粒度的代码分割和懒加载
- 优化静态资源加载
- 进一步优化构建流程

### 安全增强
- 加强认证和授权机制
- 防止 XSS 和 CSRF 攻击
- 实现敏感数据加密

## 总结

本项目是一个现代化的前端应用，基于 Nuxt 4 和 Element Plus 构建，使用 TypeScript 确保类型安全，采用组件化、模块化的开发方式。项目支持国际化、深色模式等现代前端特性，结构清晰，代码组织合理，具有良好的可扩展性和可维护性。

通过使用 Nuxt 4 的强大功能和 Element Plus 的丰富组件，项目能够快速构建出美观、高效的管理系统界面，同时为未来的功能扩展和性能优化提供了坚实的基础。项目使用 pnpm 作为包管理工具，提高了依赖安装和管理的效率。