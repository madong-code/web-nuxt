# Madong-Nuxt

## 项目介绍

MadongAdmin的Nuxt-Web工程，基于Nuxt 4.x、TypeScript、Vite、Pinia和Element Plus构建的现代化管理系统前端。

## 技术栈

- **前端框架**：Nuxt 4
- **UI 库**：Element Plus
- **开发语言**：TypeScript
- **状态管理**：Pinia
- **国际化**：Vue I18n
- **样式方案**：SCSS + UnoCSS
- **图标库**：Nuxt Icons
- **构建工具**：Vite

## 核心功能

- **认证系统**：登录/注册、验证码、路由守卫
- **会员中心**：个人资料管理
- **国际化**：多语言支持（中文/英文）
- **主题系统**：深色/浅色模式切换
- **路由系统**：动态路由、布局路由

## 目录结构

```
web/
├── app/                  # 主应用目录
│   ├── api/              # API 接口定义
│   ├── apps/             # 功能模块目录
│   ├── assets/           # 静态资源
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

## 安装教程

1.  克隆仓库
    ```bash
    git clone <仓库地址>
    cd web
    ```

2.  安装依赖
    ```bash
    pnpm install
    ```

3.  启动开发服务器
    ```bash
    pnpm run dev
    ```

4.  构建生产版本
    ```bash
    pnpm run build
    ```

## 使用说明

1.  开发模式：`pnpm run dev` - 启动开发服务器，支持热更新
2.  构建生产：`pnpm run build` - 构建生产版本
3.  预览生产：`pnpm run preview` - 预览生产构建结果
4.  代码检查：`pnpm run lint` - 运行 ESLint 检查代码质量

## 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request

## 许可证

[MIT](LICENSE)
