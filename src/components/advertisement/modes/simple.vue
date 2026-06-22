<template>
  <div class="ad-simple-layout" @click="handleClick">
    <img :src="ad.image" :alt="ad.title" class="ad-simple-image" />
    <!-- <span class="ad-badge">广告</span> -->
  </div>
</template>

<script setup lang="ts">
import type { AdvertisementItem } from '~/api/site/types'

interface Props {
  ad: AdvertisementItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [ad: AdvertisementItem]
}>()

const handleClick = () => {
  emit('click', props.ad)
}
</script>

<style scoped lang="scss">
.ad-simple-layout {
  position: relative;
  width: 100%;
  height: 50px;
  margin: 4px 0;
  overflow: hidden;
  background: transparent;
  border-radius: 1px;
  cursor: pointer;
  transition: box-shadow 0.2s ease;

  &:hover {
    background-color: rgb(218, 225, 225);
  }

  .ad-simple-image {
    width: 100%;
    height: 50px;
    object-fit: contain;
    display: block;
  }

  .ad-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 10px;
    font-weight: 500;
    border-radius: 2px;
    line-height: 1;
    z-index: 1;
  }
}
</style>
