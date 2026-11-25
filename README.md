<div align="center">

# MaDong Web

**会员端前台应用 · 基于 Nuxt 4.x 构建**

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-409EFF?logo=element&logoColor=white)](https://element-plus.org)
[![Pinia](https://img.shields.io/badge/Pinia-FFD859?logo=pinia&logoColor=1B1B18)](https://pinia.vuejs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

**中文** · [English](./README.en.md)

</div>

---

## 仓库定位

> **MaDong Web 是共用前端模板仓库**，被以下两种安装模式共同引用：
> - **mono（大仓模式）**：与管理端、平台端同属一个大仓仓库
> - **separated（多仓模式）**：作为独立前端仓库单独拉取

无论选择哪种安装模式，会员端始终来自本仓库。

## 仓库地址

本仓库以 **GitHub 为主仓库**，Gitee / GitCode 为同步镜像（内容完全一致，Issue 和 PR 以 GitHub 为准）。

| GitHub（主仓库） | Gitee 镜像 | GitCode 镜像 |
| :--- | :--- | :--- |
| https://github.com/madong-code/web-nuxt | https://gitee.com/motion-code/web-nuxt | https://gitcode.com/motion-code/web-nuxt |

## 后端适配

本模板通过 HTTP API 与后端通信，无后端框架耦合。已验证适配的 MaDong 后端：

| 后端类型 | 框架 | API 路径 | 说明 |
|----------|------|----------|------|
| **MaDong 标准版** | Webman (PHP) | `/api` | 单租户场景 |
| **MaDong SaaS 版** | Webman (PHP) | `/api` | 多租户场景，额外通过 `X-Tenant-Id` 请求头隔离租户 |

> 请求头 `X-Tenant-Id` 在 `.env` 中配置，留空表示不注入（兼容单租户后端）。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Nuxt 4 |
| UI 库 | Element Plus 2 |
| 开发语言 | TypeScript 5 |
| 状态管理 | Pinia 3 |
| 国际化 | Vue I18n |
| 样式 | SCSS + UnoCSS |
| 图标 | Nuxt Icons（Iconify 体系） |
| 构建 | Vite（Nuxt 内置） |
| 代码规范 | ESLint + OXC |
| HTTP 客户端 | Axios |

## 核心功能

- **认证系统**：账号密码登录、短信验证码注册、图形验证码、路由守卫
- **会员中心**：个人资料、修改密码、积分、余额、签到、第三方账号绑定
- **权限体系**：基于后端菜单下发的动态路由与页面权限
- **国际化**：中文 / 英文，后端可扩展语言包
- **主题切换**：深色 / 浅色模式一键切换
- **三种路由模式**：`frontend`（前端声明）/ `backend`（后端下发）/ `hybrid`（混合）
- **SSR 支持**：生产构建默认 SSR，也支持静态生成（`build:static`）和集成模式（`build:integrated`）

## 快速开始

要求 Node.js `22.18+` 或 `24+`、pnpm `10+`。

### 1. 克隆仓库

```bash
# 默认从 GitHub 拉取（推荐）
git clone https://github.com/madong-code/web-nuxt.git web

# 网络受限时改用 Gitee 镜像
git clone https://gitee.com/motion-code/web-nuxt.git web

cd web
```

### 2. 安装依赖

```bash
pnpm install
```

安装慢时可切国内源：

```bash
pnpm config set registry https://registry.npmmirror.com
```

### 3. 启动开发服务器

```bash
# 默认模式（hybrid 路由 + SSR）
pnpm dev

# 指定路由模式
pnpm dev:frontend   # 前端声明式菜单
pnpm dev:backend    # 后端菜单完全下发
```

开发地址：`http://localhost:3000`，通过 Vite 代理将 `/api` 请求转发到 `http://127.0.0.1:8500`。

### 4. 构建生产版本

```bash
# SSR 模式（默认，推荐用于独立部署）
pnpm build

# 静态生成（纯静态站点）
pnpm build:static

# 集成模式（嵌入 MaDong 后端 public/web 子目录，资源路径带 /web 前缀）
pnpm build:integrated
```

### 5. 运行生产 SSR

```bash
pnpm start
```

## 环境变量

关键配置通过 `.env.*` 文件管理，常用变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NUXT_PUBLIC_API_BASE_URL` | `/api` | 浏览器侧 API 前缀，由 Nginx 反代到后端 |
| `NUXT_API_SERVER_BASE` | `http://127.0.0.1:8500/api` | SSR 服务端取数地址，**容器部署需改为可达地址** |
| `NUXT_PUBLIC_SITE_NAME` | `MaDong` | 站点名称兜底（后端配置缺失时展示） |
| `NUXT_PUBLIC_X_TENANT_ID` | 空 | 多租户 ID，留空则不注入请求头（兼容单租户） |
| `NUXT_PUBLIC_ROUTING_MODE` | `frontend` | 路由菜单模式：`frontend` / `backend` / `hybrid` |
| `NUXT_APP_BASE_URL` | `/` | 应用基础路径，集成模式设为 `/web/` |

> `.env.production` 对应生产构建，`.env.development` 对应本地开发，`.env.integrated` 对应集成构建。

## 目录结构

```
template/web/
├── .env.*                 # 环境变量（公共 / 开发 / 生产 / 集成）
├── .vscode/               # VS Code 配置
├── public/                # 静态资源（favicon、图标）
├── scripts/               # 构建辅助脚本
│   ├── ensure-index.mjs          # SSR 构建兜底生成 index.html
│   ├── materialize-output.mjs     # SSR 产物软链接转真实目录
│   └── download-icons/            # 图标批量下载工具
├── src/
│   ├── api/               # API 接口定义（auth / member / site / system / upload）
│   ├── assets/            # 静态资源（图片 / 字体 / 样式）
│   ├── components/        # 通用组件
│   ├── composables/       # 组合式函数
│   ├── lang/              # 国际化语言文件（zh-cn / en）
│   ├── layouts/           # 布局组件（default / member）
│   ├── middleware/        # 路由中间件（auth / global）
│   ├── pages/             # 页面组件
│   ├── plugins/           # Nuxt 插件
│   ├── stores/            # Pinia 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   ├── app.vue            # 根组件
│   └── router.options.ts  # 路由配置
├── nuxt.config.ts         # Nuxt 主配置
├── package.json           # 依赖与脚本
├── tsconfig.json          # TypeScript 配置
└── uno.config.ts          # UnoCSS 配置
```

## Nginx 部署要点

### 独立部署（SSR 模式）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Nuxt SSR（Node 进程）
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API 反代
    location /api {
        proxy_pass http://127.0.0.1:8500;
        proxy_set_header Host $host;
    }
}
```

### 集成到 MaDong 后端（构建产物放入 public/web）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 后端主入口
    location / {
        proxy_pass http://127.0.0.1:8500;
    }

    # 会员端静态资源
    location /web/ {
        alias /path/to/backend/public/web/;
        try_files $uri $uri/ /web/index.html;
    }
}
```

## 构建脚本一览

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（默认 hybrid 路由） |
| `pnpm dev:frontend` | 开发模式 - 前端声明式路由 |
| `pnpm dev:backend` | 开发模式 - 后端菜单路由 |
| `pnpm build` | 构建 SSR 产物（推荐） |
| `pnpm build:static` | 构建纯静态产物 |
| `pnpm build:integrated` | 构建集成产物（嵌入后端 /web 路径） |
| `pnpm start` | 运行 SSR 生产服务 |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` / `pnpm lint:fix` | 代码检查与修复 |
| `pnpm typecheck` | TypeScript 类型检查 |

## 参与贡献

1. Fork 本仓库
2. 创建功能分支（`feat/xxx` / `fix/xxx`）
3. 提交代码
4. 发起 Pull Request

## 许可证

[MIT](./LICENSE)
