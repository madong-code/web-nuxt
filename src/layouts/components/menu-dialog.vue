<template>
    <el-dialog
        v-if="currentMeta"
        v-model="visible"
        align-center
        width="960px"
        :custom-class="dialogClass"
        :show-close="true"
        :close-on-click-modal="true"
        append-to-body
        @closed="handleClosed"
    >
        <template #header>
            <div class="menu-dialog-header">
                <Icon v-if="currentMeta.icon" :icon="currentMeta.icon" size="22" color="var(--el-color-primary)" />
                <span class="menu-dialog-title">{{ currentMeta.title }}</span>
            </div>
        </template>

        <component :is="asyncComponent" v-if="asyncComponent" />
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useMenuDialog } from '~/composables/menu-dialog'
import { Icon } from '~/components/icon'

const { visible, currentPath, getMeta, getLoader, close } = useMenuDialog()

const currentMeta = computed(() => {
    const path = currentPath.value
    if (!path) return null
    return getMeta(path) || null
})

const asyncComponent = computed(() => {
    const path = currentPath.value
    if (!path) return null
    const loader = getLoader(path)
    if (!loader) return null
    return defineAsyncComponent(loader)
})

const dialogClass = computed(() => {
    return 'menu-dialog !rounded-[var(--rounded-big)]'
})

function handleClosed() {
    close()
}
</script>

<style lang="scss" scoped>
.menu-dialog-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.menu-dialog-title {
    font-size: 17px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}
</style>

<style lang="scss">
.menu-dialog {
    .el-dialog__header {
        padding: 18px 24px 14px;
        border-bottom: 1px solid var(--el-border-color-light);
        margin-right: 0;
    }

    .el-dialog__body {
        padding: 20px 24px 24px;
    }

    .el-dialog__headerbtn {
        top: 16px;
        right: 20px;
    }
}
</style>
