# Madong-Nuxt

## Project Introduction

MadongAdmin's Nuxt-Web project, a modern admin system frontend built with Nuxt 4.x, TypeScript, Vite, Pinia, and Element Plus.

## Tech Stack

- **Frontend Framework**: Nuxt 4
- **UI Library**: Element Plus
- **Development Language**: TypeScript
- **State Management**: Pinia
- **Internationalization**: Vue I18n
- **Styling Solution**: SCSS + UnoCSS
- **Icon Library**: Nuxt Icons
- **Build Tool**: Vite

## Core Features

- **Authentication System**: Login/Register, CAPTCHA, Route Guard
- **Member Center**: Personal profile management
- **Internationalization**: Multi-language support (Chinese/English)
- **Theme System**: Light/Dark mode switching
- **Routing System**: Dynamic routes, Layout routes

## Directory Structure

```
web/
├── app/                  # Main application directory
│   ├── api/              # API interface definitions
│   ├── apps/             # Feature modules directory
│   ├── assets/           # Static assets
│   ├── components/       # Vue components
│   ├── composables/      # Composables
│   ├── lang/             # Internationalization language files
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   ├── plugins/          # Plugins
│   ├── stores/           # Pinia state management
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── app.vue           # Root component
│   └── router.options.ts # Route configuration
├── public/               # Public static resources
├── .gitignore            # Git ignore file
├── nuxt.config.ts        # Nuxt configuration
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── uno.config.ts         # UnoCSS configuration
```

## Installation

1.  Clone the repository
    ```bash
    git clone <repository-url>
    cd web
    ```

2.  Install dependencies
    ```bash
    pnpm install
    ```

3.  Start development server
    ```bash
    pnpm run dev
    ```

4.  Build for production
    ```bash
    pnpm run build
    ```

## Usage

1.  Development mode: `pnpm run dev` - Start development server with hot reload
2.  Build for production: `pnpm run build` - Build production version
3.  Preview production: `pnpm run preview` - Preview production build
4.  Code linting: `pnpm run lint` - Run ESLint to check code quality

## Contribution

1.  Fork the repository
2.  Create Feat_xxx branch
3.  Commit your code
4.  Create Pull Request

## License

[MIT](LICENSE)
