<template>
  <div class="ad-float-card" @click="handleClick">
    <div class="ad-image-wrapper">
      <img :src="ad.image" :alt="ad.title" class="ad-image" />
    </div>
    <div class="ad-content">
      <h3 class="ad-title">{{ ad.title }}</h3>
      <p v-if="ad.description" class="ad-description">{{ ad.description }}</p>
      <span class="ad-badge">广告</span>
    </div>
    <button
      v-if="closable"
      class="ad-close-btn"
      @click.stop="handleClose"
      title="关闭"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AdvertisementItem } from '~/api/site/types'

interface Props {
  ad: AdvertisementItem
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closable: false
})

const emit = defineEmits<{
  click: [ad: AdvertisementItem]
  close: [ad: AdvertisementItem]
}>()

const handleClick = () => {
  emit('click', props.ad)
}

const handleClose = () => {
  emit('close', props.ad)
}
</script>

<style scoped lang="scss">
.ad-float-card {
  position: relative;
  width: 100%;
  background: #fff;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;

  .ad-image-wrapper {
    width: 100%;
    border-radius: 1px 1px 0 0;
  }

  .ad-image {
    width: 100%;
    height: 120px;
    object-fit: contain;
    display: block;
  }

  .ad-content {
    padding: 12px;
  }

  .ad-title {
    color: #1a1a1a;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ad-description {
    color: #666;
    font-size: 12px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 10px;
  }

  .ad-badge {
    display: inline-block;
    padding: 3px 6px;
    background: #f5f5f5;
    color: #999;
    font-size: 11px;
    font-weight: 500;
    border-radius: 3px;
    margin-top: 8px;
    line-height: 1;
  }

  .ad-close-btn {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    background: transparent;
    border-radius: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(0, 0, 0, 0.6);
    opacity: 1;
    transition: all 0.2s ease;

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      opacity: 1;
      color: rgba(0, 0, 0, 1);
    }
  }
}
</style>
