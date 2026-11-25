<div align="center">

# Madong Web

**Member-side frontend application · Built with Nuxt 4.x**

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt\&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs\&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-409EFF?logo=element\&logoColor=white)](https://element-plus.org)
[![Pinia](https://img.shields.io/badge/Pinia-FFD859?logo=pinia\&logoColor=1B1B18)](https://pinia.vuejs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[中文](./README.md) · [English](./README.en.md)

</div>

***

## Repository Scope

> **MaDong Web is a shared frontend template repository**, referenced by both installation modes:
>
> - **mono (monorepo mode)**: Lives in the same repo as the admin and platform frontends
> - **separated (multi-repo mode)**: Pulled as an independent frontend repository

Regardless of installation mode, the member-facing Web app always comes from this repository.

## Repository Addresses

This repo uses **GitHub as the primary source**, with Gitee / GitCode as synchronized mirrors. All three platforms carry identical content — Issues and PRs are tracked on GitHub.

| GitHub                                    | Gitee Mirror                             | GitCode Mirror                             |
| :---------------------------------------- | :--------------------------------------- | :----------------------------------------- |
| <https://github.com/madong-code/web-nuxt> | <https://gitee.com/motion-code/web-nuxt> | <https://gitcode.com/motion-code/web-nuxt> |

## Backend Compatibility

This template communicates with the backend purely over HTTP APIs and is agnostic to the backend framework. Verified backends:

| Backend             | Framework    | API Path | Notes                                                                                |
| ------------------- | ------------ | -------- | ------------------------------------------------------------------------------------ |
| **Madong Standard** | Webman (PHP) | `/api`   | Single-tenant deployments                                                            |
| **Madong SaaS**     | Webman (PHP) | `/api`   | Multi-tenant deployments — tenants are isolated via the `X-Tenant-Id` request header |

> The `X-Tenant-Id` header is configured via `.env`. Leave it empty to skip injection (compatible with single-tenant backends).

## Tech Stack

| Category           | Technology               |
| ------------------ | ------------------------ |
| Frontend Framework | Nuxt 4                   |
| UI Library         | Element Plus 2           |
| Language           | TypeScript 5             |
| State Management   | Pinia 3                  |
| i18n               | Vue I18n                 |
| Styling            | SCSS + UnoCSS            |
| Icons              | Nuxt Icons (Iconify)     |
| Build              | Vite (bundled with Nuxt) |
| Code Quality       | ESLint + OXC             |
| HTTP Client        | Axios                    |

## Key Features

- **Authentication**: Username/password login, SMS verification-code registration, CAPTCHA, route guards
- **Member Center**: Profile, password change, points, balance, sign-in, third-party account binding
- **Permission System**: Dynamic routes and page permissions driven by backend-delivered menus
- **i18n**: Chinese / English, extensible language packs on the backend
- **Theme Switching**: Light / dark mode toggle
- **Three Routing Modes**: `frontend` (declared in frontend) / `backend` (fully delivered by backend) / `hybrid` (mixed)
- **SSR Support**: Production build defaults to SSR; also supports static generation (`build:static`) and embedded mode (`build:integrated`)

## Quick Start

Requires Node.js `22.18+` or `24+`, pnpm `10+`.

### 1. Clone the repository

```bash
# Primary source (recommended)
git clone https://github.com/madong-code/web-nuxt.git web

# Use Gitee mirror when GitHub is inaccessible
git clone https://gitee.com/motion-code/web-nuxt.git web

cd web
```

### 2. Install dependencies

```bash
pnpm install
```

Slow install? Switch to the Chinese mirror:

```bash
pnpm config set registry https://registry.npmmirror.com
```

### 3. Start the development server

```bash
# Default (hybrid routing + SSR)
pnpm dev

# Explicit routing mode
pnpm dev:frontend   # Frontend-declared menu
pnpm dev:backend    # Fully backend-delivered menu
```

Dev server runs at `http://localhost:3000`. Vite proxies `/api` requests to `http://127.0.0.1:8500`.

### 4. Build for production

```bash
# SSR (default, recommended for standalone deployment)
pnpm build

# Static site generation
pnpm build:static

# Embedded mode — ships into MaDong backend at public/web with /web URL prefix
pnpm build:integrated
```

### 5. Run the production SSR server

```bash
pnpm start
```

## Environment Variables

Configuration is managed via `.env.*` files. Common variables:

| Variable                   | Default                     | Description                                                                                   |
| -------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE_URL` | `/api`                      | Browser-side API prefix; Nginx reverse-proxies this to the backend                            |
| `NUXT_API_SERVER_BASE`     | `http://127.0.0.1:8500/api` | SSR server-side API endpoint — **must be reachable from the container in Docker deployments** |
| `NUXT_PUBLIC_SITE_NAME`    | `MaDong`                    | Fallback site name shown when the backend site config is missing                              |
| `NUXT_PUBLIC_X_TENANT_ID`  | *(empty)*                   | Multi-tenant ID header. Leave empty to skip injection (single-tenant compatible)              |
| `NUXT_PUBLIC_ROUTING_MODE` | `frontend`                  | Route menu mode: `frontend` / `backend` / `hybrid`                                            |
| `NUXT_APP_BASE_URL`        | `/`                         | Application base path. Set to `/web/` for embedded builds                                     |

> `.env.production` applies to production builds, `.env.development` to local dev, `.env.integrated` to embedded builds.

## Directory Structure

```
template/web/
├── .env.*                 # Environment variables (common / dev / prod / embedded)
├── .vscode/               # VS Code settings
├── public/                # Static assets (favicon, icons)
├── scripts/               # Build helper scripts
│   ├── ensure-index.mjs          # Generate index.html fallback for SSR builds
│   ├── materialize-output.mjs     # Replace SSR symlinks with real directories
│   └── download-icons/            # Batch icon download utility
├── src/
│   ├── api/               # API definitions (auth / member / site / system / upload)
│   ├── assets/            # Static assets (images / fonts / styles)
│   ├── components/        # Shared components
│   ├── composables/       # Composables
│   ├── lang/              # i18n language files (zh-cn / en)
│   ├── layouts/           # Layout components (default / member)
│   ├── middleware/        # Route middleware (auth / global)
│   ├── pages/             # Page components
│   ├── plugins/           # Nuxt plugins
│   ├── stores/            # Pinia stores
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── app.vue            # Root component
│   └── router.options.ts  # Route configuration
├── nuxt.config.ts         # Nuxt main config
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
└── uno.config.ts          # UnoCSS config
```

## Nginx Deployment Notes

### Standalone Deployment (SSR Mode)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Nuxt SSR (Node process)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API reverse proxy
    location /api {
        proxy_pass http://127.0.0.1:8500;
        proxy_set_header Host $host;
    }
}
```

### Embedded in MaDong Backend (build output goes to public/web)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Backend main entry
    location / {
        proxy_pass http://127.0.0.1:8500;
    }

    # Member-side static assets
    location /web/ {
        alias /path/to/backend/public/web/;
        try_files $uri $uri/ /web/index.html;
    }
}
```

## Build Scripts Reference

| Command                       | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `pnpm dev`                    | Start dev server (default hybrid routing)         |
| `pnpm dev:frontend`           | Dev — frontend-declared routes                    |
| `pnpm dev:backend`            | Dev — backend-delivered routes                    |
| `pnpm build`                  | Build SSR output (recommended)                    |
| `pnpm build:static`           | Build static site output                          |
| `pnpm build:integrated`       | Build embedded output (under backend `/web` path) |
| `pnpm start`                  | Run production SSR server                         |
| `pnpm preview`                | Preview production build                          |
| `pnpm lint` / `pnpm lint:fix` | Lint and auto-fix                                 |
| `pnpm typecheck`              | TypeScript type check                             |

## Contributing

1. Fork this repository
2. Create a feature branch (`feat/xxx` / `fix/xxx`)
3. Commit your changes
4. Open a Pull Request

## License

[MIT](./LICENSE)
