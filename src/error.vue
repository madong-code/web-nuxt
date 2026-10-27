<script setup lang="ts">
/**
 * 全站错误页（Nuxt 约定 src/error.vue，srcDir=src）：
 * - 404（路由未匹配 / 权限码校验失败 / 内容不存在）→ 带布局的 AppNotFound 视图
 *   （header/footer 保留：粘性页脚照常生效，导航仍可点）
 * - 其他错误码（500 等）→ 简约降级视图（错误码 + 文案 + 返回首页）
 * - 按钮必须 clearError 清除错误态后再导航；无回退历史时兜底回首页
 */
import AppNotFound from '~/components/common/AppNotFound.vue'
import { Home } from 'lucide-vue-next'

const props = defineProps<{
    error: {
        statusCode?: number
        statusMessage?: string
        message?: string
    }
}>()

const is404 = computed(() => (props.error?.statusCode ?? 500) === 404)

/** 返回首页：清除错误态并重定向 */
function goHome() {
    clearError({ redirect: '/' })
}

/** 返回上一页：有 vue-router 回退记录则回退，否则兜底回首页 */
const router = useRouter()
function goBack() {
    const hasBack = typeof window !== 'undefined' && !!window.history.state?.back
    if (hasBack) {
        clearError()
        nextTick(() => router.back())
    } else {
        clearError({ redirect: '/' })
    }
}

// 错误页不参与索引
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })
</script>

<template>
  <NuxtLayout>
    <div class="err-page">
      <AppNotFound
        v-if="is404"
        :code="404"
        title="页面不存在"
        description="你访问的页面可能已被移除、重命名或暂时不可用，检查一下链接，或从下面的入口继续浏览"
        @home="goHome"
        @back="goBack"
      />
      <!-- 非 404：简约降级 -->
      <div v-else class="err-fallback">
        <p class="err-code">{{ error.statusCode || 500 }}</p>
        <h1 class="err-title">页面出错了</h1>
        <p class="err-desc">服务器开小差了，请稍后重试；若持续出现请联系管理员</p>
        <button type="button" class="err-btn" @click="goHome">
          <Home class="err-btn-icon" />
          返回首页
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.err-page {
  width: 100%;
}

/* 非 404 降级视图 */
.err-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 16px 32px;
  text-align: center;
}

.err-code {
  margin: 0;
  font-size: clamp(56px, 14vw, 88px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.06em;
  color: var(--md-text-3);
}

.err-title {
  margin: 16px 0 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--md-text-1);
}

.err-desc {
  margin: 10px auto 0;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--md-text-3);
}

.err-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  margin-top: 24px;
  padding: 0 24px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--el-color-primary-dark-2);
  }
}

.err-btn-icon {
  width: 16px;
  height: 16px;
}
</style>
