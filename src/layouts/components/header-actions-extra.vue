<template>
  <div class="header-actions-extra">
    <template v-for="action in actions" :key="actionKey(action)">
      <el-badge
        :value="badgeCount(action)"
        :max="99"
        :hidden="badgeCount(action) <= 0"
        class="header-action-badge"
      >
        <div
          class="header-action-item"
          :title="action.title"
          role="button"
          :aria-label="action.title"
          @click="handleClick(action)"
        >
          <Icon
            :icon="action.icon || 'mdi:bell'"
            color="var(--el-text-color-primary)"
            :size="20"
          />
        </div>
      </el-badge>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '~/components/icon'
import { useHeaderActions } from '~/composables/header-actions'

const { actions, actionKey, badgeCount, handleClick } = useHeaderActions()
</script>

<style scoped lang="scss">
.header-actions-extra {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.header-action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s ease;
  color: var(--el-text-color-primary);

  &:hover {
    background-color: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }
}

.header-action-badge {
  display: flex;
  align-items: center;

  :deep(.el-badge__content) {
    border: none;
    box-shadow: 0 0 0 1px var(--ma-bg-color-overlay);
  }
}
</style>
