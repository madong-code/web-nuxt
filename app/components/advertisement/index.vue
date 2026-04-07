<template>
  <transition name="ad-fade">
    <div v-if="!isHidden && displayedAds.length > 0" class="advertisement-wrapper" :class="[`ad-${type}`, position && type === 'float' ? `ad-position-${position}` : '']">
      <div
        v-for="ad in displayedAds"
        :key="ad.id"
        class="ad-item"
      >
        <!-- 简单模式 -->
        <component
          v-if="type === 'simple'"
          :is="SimpleModeRaw"
          :ad="ad"
          @click="handleClick"
        />

        <!-- 悬浮模式 -->
        <component
          v-else-if="type === 'float'"
          :is="FloatModeRaw"
          :ad="ad"
          :closable="closable"
          @click="handleClick"
          @close="handleClose"
        />

        <!-- 自定义扩展模式 -->
        <component
          v-else-if="customModeComponent"
          :is="customModeComponent"
          :ad="ad"
          v-bind="customModeProps"
          @click="handleClick"
          @close="handleClose"
        />

        <!-- 默认模式（向后兼容） -->
        <div
          v-else
          class="ad-card"
          @click="handleClick(ad)"
        >
          <div class="ad-image-wrapper">
            <img
              :src="ad.image"
              :alt="ad.title"
              class="ad-image"
              loading="lazy"
            />
            <div class="ad-gradient"></div>
            <div v-if="showTitle" class="ad-content">
              <h3 class="ad-title">{{ ad.title }}</h3>
              <p v-if="ad.description" class="ad-description">{{ ad.description }}</p>
              <span class="ad-badge">广告</span>
            </div>
          </div>
          <button
            v-if="closable"
            class="ad-close-btn"
            @click.stop="handleClose(ad)"
            title="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, markRaw, shallowRef } from 'vue'
import type { Component } from 'vue'
import { getAdvertisements } from '~/api/site'
import type { AdvertisementItem } from '~/api/site/types'
import SimpleMode from './modes/simple.vue'
import FloatMode from './modes/float.vue'
import { getModeComponent, registerMode } from './modes'

interface Props {
  type?: string // 简化类型定义，支持字符串类型
  offset?: number
  limit?: number
  showTitle?: boolean
  closable?: boolean
  showTodayBtn?: boolean
  autoCloseDelay?: number
  position?: 'top' | 'center' | 'bottom'
  customModeProps?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'simple',
  offset: 0,
  limit: 0,
  showTitle: false,
  closable: false,
  showTodayBtn: false,
  autoCloseDelay: 0,
  position: 'center',
  customModeProps: () => ({})
})

const emit = defineEmits<{
  click: [ad: AdvertisementItem]
  close: [ad: AdvertisementItem]
}>()

// 将组件标记为原始组件，避免响应式代理
const SimpleModeRaw = markRaw(SimpleMode)
const FloatModeRaw = markRaw(FloatMode)

// 使用这些标记为原始的组件

const ads = ref<AdvertisementItem[]>([])
const isHidden = ref(false)
const customModeComponent = shallowRef<Component | null>(null)

const COMPONENT_STORAGE_KEY = `ad_component_${props.type}_${props.offset}`

// 动态获取自定义模式组件
onMounted(() => {
  if (!['simple', 'float'].includes(props.type!)) {
    const component = getModeComponent(props.type!)
    if (component) {
      customModeComponent.value = markRaw(component)
    }
  }
})

const checkTodayClosed = () => {
  const today = new Date().toDateString()
  const stored = localStorage.getItem(`ad_today_${COMPONENT_STORAGE_KEY}`)
  return stored === today
}

onMounted(async () => {
  if (checkTodayClosed()) {
    isHidden.value = true
    return
  }

  try {
    ads.value = await getAdvertisements()
  } catch (error) {
    console.error('获取广告失败:', error)
  }
})

const displayedAds = computed(() => {
  const now = Date.now() / 1000
  const validAds = ads.value.filter(
    ad =>
      ad.enabled === 1 &&
      ad.start_time <= now &&
      ad.end_time >= now
  )
  const slicedAds = validAds.slice(props.offset)
  const result = props.limit > 0 ? slicedAds.slice(0, props.limit) : slicedAds

  return result
})

const handleClick = (ad: AdvertisementItem) => {
  emit('click', ad)
  if (ad.link) {
    window.open(ad.link, '_blank')
  }
}

const handleClose = (ad: AdvertisementItem) => {
  isHidden.value = true
  emit('close', ad)
}

// 导出注册方法供外部使用
defineExpose({
  registerMode
})
</script>

<style scoped lang="scss">
// 基础广告卡片
.advertisement-wrapper {
  width: 100%;

  &.ad-simple {
    display: block;
  }

  &.ad-float {
    display: block;
  }
}

.ad-item {
  display: block;
}

// 悬浮广告定位
.ad-float {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  width: 200px;

  .ad-item {
    width: 100%;
  }
}

// 右上位置
.ad-float.ad-position-top {
  top: 24px;
  transform: none;
}

// 右中位置（默认）
.ad-float.ad-position-center {
  top: 50%;
  transform: translateY(-50%);
}

// 右下位置
.ad-float.ad-position-bottom {
  top: auto;
  bottom: 24px;
  transform: none;
}

// 默认卡片样式（向后兼容）
.ad-card {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 0;
  background: transparent;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.07),
    0 10px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: none;
    box-shadow:
      0 8px 12px rgba(102, 126, 234, 0.2),
      0 20px 40px rgba(0, 0, 0, 0.15);

    .ad-close-btn {
      opacity: 1;
      transform: rotate(90deg);
    }
  }

  .ad-image-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 0;
  }

  .ad-image {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
  }

  .ad-gradient {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.4) 50%,
      transparent 100%
    );
    pointer-events: none;
  }

  .ad-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24px;
    z-index: 1;
  }

  .ad-title {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    line-height: 1.4;
  }

  .ad-description {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    margin: 0 0 12px;
    line-height: 1.5;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .ad-badge {
    display: none;
  }

  .ad-close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    padding: 0;
    background: rgba(255, 255, 255, 0.95);
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    opacity: 0;
    transform: rotate(0deg);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: #fff;
      color: #333;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

// 动画
.ad-fade-enter-active,
.ad-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ad-fade-enter-from,
.ad-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// 响应式
@media (max-width: 768px) {
  .ad-float {
    right: 12px;
    width: 160px;

    .ad-card {
      .ad-title {
        font-size: 16px;
      }

      .ad-description {
        font-size: 13px;
      }
    }
  }

  .ad-card {
    &:hover {
      transform: none;
      box-shadow: 0 8px 12px rgba(102, 126, 234, 0.2);
    }

    .ad-close-btn {
      opacity: 1;
      transform: translateY(0);
    }

    .ad-title {
      font-size: 16px;
    }

    .ad-description {
      font-size: 13px;
    }
  }
}
</style>
