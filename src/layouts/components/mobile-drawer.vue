<template>
  <el-drawer
    class="ma-aside-drawer"
    :append-to-body="true"
    v-model="drawerVisible"
    :with-header="false"
    direction="ltr"
    :size="'50%'"
  >
    <div class="drawer-header">
      <Logo clickable show-text size="small" />
      <div @click="closeDrawer" class="drawer-close">
        <Icon icon="ant-design:close-outlined" color="var(--el-color-primary)" size="20" />
      </div>
    </div>
    
    <!-- 移动端菜单 -->
    <div class="mobile-menu-section">
      <Menu :show-icon="true" mode="vertical" @menu-click="closeDrawer" />
    </div>

    <!-- 移动端-会员菜单 -->
    <div class="mobile-menu-section">
      <HeaderActions :show-icon="true" mode="vertical" @menu-click="closeDrawer" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import Menu from './menu.vue'
import Logo from './logo.vue'
import HeaderActions from './header-actions.vue'
import { Icon } from '~/components/icon'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  languageChanged: [languageName: string]
  loggedOut: []
}>()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const closeDrawer = () => {
  drawerVisible.value = false
}

</script>

<style scoped lang="scss">
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background-color: var(--el-color-info-light-9);
  border-bottom: 1px solid var(--el-border-color-light);
  
  .drawer-close {
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}

.mobile-menu-section {
  flex: 1;
  overflow-y: auto;
}

.mobile-actions {
  padding: 20px;
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-fill-color-light);
}

.mobile-action-section {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.mobile-action-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-weight: 600;
    padding: 10px 16px;
  color: var(--el-text-color-primary);
}

.theme-toggle-mobile {
  padding: 10px 10px;
}

// 暗黑模式适配
@at-root html.dark {
  .drawer-header {
    background-color: var(--el-bg-color-page);
  }
  
  .mobile-actions {
    border-top-color: var(--el-border-color);
    background-color: var(--el-fill-color-dark);
  }
}
</style>
