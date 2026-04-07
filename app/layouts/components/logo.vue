<template>
  <div @click="handleClick" class="logo-container" :class="{ 'clickable': clickable, [`size-${size}`]: true }">
    <img :src="effectiveLogoUrl" :alt="altText" class="logo-image" />
    <span v-if="showText" class="site-name">{{ siteName }} </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  clickable?: boolean
  showText?: boolean
  size?: 'small' | 'medium' | 'large'
  logoUrl?: string
  altText?: string
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  showText: true,
  size: 'medium',
  logoUrl: '',
  altText: 'Logo'
})

const systemStore = useSystemStore()
const siteName = computed(() => systemStore?.site?.site_name || '快速开发框架')

// 在组件顶部导入图片
import logoImage from '~/assets/images/logo.png'

const effectiveLogoUrl = computed(() => {
  if (props.logoUrl) {
    return props.logoUrl
  }
  return logoImage
})

const handleClick = () => {
  if (props.clickable) {
    navigateTo('/')
  }
}
</script>

<style scoped lang="scss">
.logo-container {
  display: flex;
  align-items: center;
  cursor: default;
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  // 修复：尺寸样式应该设置在父容器上，然后影响子元素
  &.size-small {
    .logo-image {
      height: 24px;
      width: 24px;
    }
  }
  
  &.size-medium {
    .logo-image {
      height: 34px;
      width: 34px;
    }
  }
  
  &.size-large {
    .logo-image {
      height: 48px;
      width: 48px;
    }
  }
}

.logo-image {
  // 基础样式可以放在这里
  object-fit: contain;
}

.site-name {
  padding-left: 8px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  
  .logo-container.size-small & {
    font-size: var(--el-font-size-small);
  }
  
  .logo-container.size-medium & {
    font-size: var(--el-font-size-large);
  }
  
  .logo-container.size-large & {
    font-size: var(--el-font-size-extra-large);
  }
}
</style>