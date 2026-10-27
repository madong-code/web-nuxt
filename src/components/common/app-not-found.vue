<script setup lang="ts">
/**
 * 全站 404 / 异常空态视图（框架层组件，error.vue 与 PortalRouteShell 复用）：
 * - 纯内联 SVG 插画（零网络请求）+ 渐变错误码大字 + 引导文案 + 操作按钮
 * - 仅保留「返回首页 / 返回上一页」两个动作：不提供任何指向插件路由的快捷入口，
 *   保证第三方插件卸载后本组件零依赖、不出现死链或异常
 * - 颜色全部消费 --md- 与 --el- 前缀语义变量，明暗主题自动适配
 * - 动效尊重 prefers-reduced-motion；触控目标 ≥ 44px；320px 起响应式
 * - 组件保持纯展示：按钮经 emit 交给宿主处理（error.vue 需 clearError）
 */
import { ArrowLeft, Home } from 'lucide-vue-next'

defineOptions({ name: 'AppNotFound' })

const props = withDefaults(
    defineProps<{
        /** 标题（默认页面不存在；内容不存在场景可传「内容不存在或已下架」） */
        title?: string
        /** 引导描述 */
        description?: string
        /** 错误码大字（404；非 404 错误页可传其他码） */
        code?: string | number
    }>(),
    {
        title: '页面不存在',
        description: '你访问的页面可能已被移除、重命名或暂时不可用，检查一下链接后再试试',
        code: 404,
    },
)

const emit = defineEmits<{
    /** 返回首页 */
    (e: 'home'): void
    /** 返回上一页（宿主自行决定回退策略） */
    (e: 'back'): void
}>()
</script>

<template>
  <section class="nf" aria-labelledby="nf-title">
    <!-- 插画：断线窗口 + 放大镜（内联 SVG，跟随主题变量） -->
    <div class="nf-art" aria-hidden="true">
      <svg viewBox="0 0 320 170" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 背景光晕 -->
        <circle cx="86" cy="78" r="62" fill="var(--el-color-primary)" opacity="0.06" />
        <circle cx="238" cy="96" r="44" fill="var(--el-color-primary)" opacity="0.05" />
        <!-- 窗口卡片 -->
        <g class="nf-art-window">
          <rect x="52" y="34" width="150" height="102" rx="12" stroke="var(--md-border)" stroke-width="2" fill="var(--el-bg-color)" />
          <line x1="52" y1="58" x2="202" y2="58" stroke="var(--md-border)" stroke-width="2" />
          <circle cx="66" cy="46" r="3" fill="var(--el-color-primary)" opacity="0.55" />
          <circle cx="78" cy="46" r="3" fill="var(--el-color-primary)" opacity="0.3" />
          <circle cx="90" cy="46" r="3" fill="var(--md-border)" />
          <!-- 404 大字 -->
          <text x="127" y="102" text-anchor="middle" class="nf-art-code">404</text>
        </g>
        <!-- 断裂路径：此路不通 -->
        <g class="nf-art-path">
          <path d="M214 108 C 244 108 244 84 268 84" stroke="var(--el-color-primary)" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 9" />
          <path d="M282 84 L 292 84" stroke="var(--el-color-primary)" stroke-width="3" stroke-linecap="round" opacity="0.35" />
          <circle cx="274" cy="84" r="4" fill="var(--el-color-primary)" opacity="0.5" />
        </g>
        <!-- 放大镜 -->
        <g class="nf-art-lens">
          <circle cx="243" cy="52" r="17" stroke="var(--md-text-2)" stroke-width="3" fill="var(--el-fill-color-light)" />
          <line x1="255" y1="65" x2="268" y2="79" stroke="var(--md-text-2)" stroke-width="3" stroke-linecap="round" />
          <text x="243" y="58" text-anchor="middle" class="nf-art-q">?</text>
        </g>
        <!-- 漂浮点 -->
        <circle class="nf-art-dot nf-art-dot-1" cx="36" cy="136" r="4" fill="var(--el-color-primary)" opacity="0.35" />
        <circle class="nf-art-dot nf-art-dot-2" cx="296" cy="30" r="3" fill="var(--el-color-primary)" opacity="0.28" />
      </svg>
    </div>

    <!-- 错误码渐变大字 -->
    <p class="nf-giant" aria-hidden="true">{{ code }}</p>

    <!-- 引导文案 -->
    <h1 id="nf-title" class="nf-title">{{ title }}</h1>
    <p class="nf-desc">{{ description }}</p>

    <!-- 操作按钮（仅返回首页 / 返回上一页两个动作） -->
    <div class="nf-actions">
      <button type="button" class="nf-btn nf-btn-primary" @click="emit('home')">
        <Home class="nf-btn-icon" />
        返回首页
      </button>
      <button type="button" class="nf-btn nf-btn-plain" @click="emit('back')">
        <ArrowLeft class="nf-btn-icon" />
        返回上一页
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.nf {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px 8px;
  text-align: center;
}

/* ===== 插画 ===== */
.nf-art {
  width: clamp(220px, 46vw, 300px);
  margin-bottom: -18px;
  animation: nf-rise 0.45s ease-out both;

  svg {
    width: 100%;
    height: auto;
    display: block;
  }
}

.nf-art-code {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 0.04em;
  fill: var(--el-color-primary);
}

.nf-art-q {
  font-size: 16px;
  font-weight: 700;
  fill: var(--el-color-primary);
}

/* 虚线流动 + 放大镜微移（尊重系统减动效偏好） */
.nf-art-path {
  animation: nf-flow 1.6s linear infinite;
}

.nf-art-lens {
  animation: nf-sway 3.2s ease-in-out infinite;
  transform-origin: 243px 52px;
}

.nf-art-dot {
  animation: nf-float 2.8s ease-in-out infinite;
}

.nf-art-dot-2 {
  animation-delay: -1.4s;
}

@media (prefers-reduced-motion: reduce) {
  .nf-art,
  .nf-art-path,
  .nf-art-lens,
  .nf-art-dot {
    animation: none;
  }
}

/* ===== 错误码大字 ===== */
.nf-giant {
  margin: 0;
  font-size: clamp(64px, 16vw, 104px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.06em;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, color-mix(in srgb, var(--el-color-primary) 45%, var(--md-text-1)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: nf-rise 0.45s ease-out 0.08s both;
}

/* ===== 文案 ===== */
.nf-title {
  margin: 14px 0 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--md-text-1);
  animation: nf-rise 0.45s ease-out 0.14s both;
}

.nf-desc {
  margin: 10px auto 0;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--md-text-3);
  animation: nf-rise 0.45s ease-out 0.2s both;
}

/* ===== 操作按钮（触控目标 ≥ 44px） ===== */
.nf-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  animation: nf-rise 0.45s ease-out 0.26s both;
}

.nf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 0 24px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease;

  &:active {
    transform: scale(0.97);
  }
}

.nf-btn-icon {
  width: 16px;
  height: 16px;
}

.nf-btn-primary {
  background: var(--el-color-primary);
  color: #fff;

  &:hover {
    background: var(--el-color-primary-dark-2);
  }
}

.nf-btn-plain {
  background: var(--el-bg-color);
  border-color: var(--md-border);
  color: var(--md-text-2);

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

/* ===== 动效与响应式 ===== */
@keyframes nf-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes nf-flow {
  to {
    stroke-dashoffset: -10;
  }
}

@keyframes nf-sway {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(4px, -3px);
  }
}

@keyframes nf-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nf-art,
  .nf-giant,
  .nf-title,
  .nf-desc,
  .nf-actions {
    animation: none;
  }
}

@media (max-width: 480px) {
  .nf {
    padding-top: 20px;
  }

  .nf-actions {
    width: 100%;
    flex-direction: column;

    .nf-btn {
      width: 100%;
    }
  }
}
</style>
