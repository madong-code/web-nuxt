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

    <!-- 移动端-头部动作菜单（category='3'：铃铛等，在语言切换前） -->
    <div v-if="actions.length > 0" class="mobile-menu-section">
      <div
        v-for="action in actions"
        :key="actionKey(action)"
        class="mobile-header-action-item"
        @click="handleClick(action, closeDrawer)"
      >
        <Icon v-if="action.icon" :icon="action.icon" :size="20" />
        <span class="action-label">{{ action.title }}</span>
        <el-badge
          v-if="badgeCount(action) > 0"
          :value="badgeCount(action)"
          :max="99"
          class="action-badge"
        />
      </div>
    </div>

    <!-- 移动端-会员菜单（语言、主题、用户） -->
    <div class="mobile-menu-section mobile-header-actions-no-border">
      <HeaderActions :show-icon="true" mode="vertical" @menu-click="closeDrawer" />
    </div>

    <!-- 菜单弹窗容器（dialog 类型菜单的通用渲染器） -->
    <MenuDialog />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Menu from './menu.vue'
import Logo from './logo.vue'
import HeaderActions from './header-actions.vue'
import MenuDialog from './menu-dialog.vue'
import { Icon } from '~/components/icon'
import { useHeaderActions } from '~/composables/header-actions'

const { actions, actionKey, badgeCount, handleClick } = useHeaderActions()

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

// 移动端头部动作菜单（类型3：铃铛等）
.mobile-header-action-item {
  display: flex;
  align-items: center;

  height: var(--el-menu-item-height);
  padding: 0 var(--el-menu-base-level-padding);
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--el-text-color-primary);
  font-size: 14px;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  .action-label {
    flex: 1;
  }

  .action-badge {
    :deep(.el-badge__content) {
      border: none;
    }
  }
}

// 移动端 HeaderActions 区域去掉分割线
.mobile-header-actions-no-border {
  :deep(.el-menu) {
    border-top: none !important;
  }
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
