<template>
<div class="ma-header">
    <div class="header-container">
        <!-- 左侧logo -->
        <div class="header-left">
            <Logo clickable show-text size="medium" />
        </div>

        <!-- 中间菜单区域（靠右显示） -->
        <div class="header-center">
            <client-only>
                <el-scrollbar class="hidden-sm-and-down" style="height: var(--el-header-height);">
                    <Menu class="frontend-header-menu" :ellipsis="false" mode="horizontal" :show-icon="true" />
                </el-scrollbar>
            </client-only>
        </div>

        <!-- 右侧功能区域 -->
        <div class="header-right">
            <client-only>
                <div v-if="isMobile" class="mobile-menu-wrapper">
                    <div
                        v-if="!systemStore.$state.site.menu_expand"
                        @click="systemStore.toggleMenuExpand(true)"
                        class="mobile-menu-toggle mr-2"
                    >
                        <Icon icon="ant-design:menu-outlined" color="var(--el-color-primary)" size="20" />
                    </div>
                </div>
                <el-scrollbar class="hidden-sm-and-down" style="height: var(--el-header-height);">
                    <HeaderActions class="frontend-header-menu" :ellipsis="false" mode="horizontal" v-if="!isMobile"/>
                </el-scrollbar>
            </client-only>
        </div>
    </div>

    <!-- 移动端抽屉菜单（仅在移动端显示） -->
    <MobileDrawer 
        v-if="isMobile"
        v-model="systemStore.$state.site.menu_expand"
        @language-changed="handleLanguageChange"
        @logged-out="handleLogout"
    />
</div>
</template>

<script setup lang="ts">
import Menu from './menu.vue'
import Logo from './logo.vue'
import MobileDrawer from './mobile-drawer.vue'
import HeaderActions from './header-actions.vue'
import { Icon } from '~/components/icon'
import { useSystemStore } from '~/stores/system'


// 判断是否为移动端
const isMobile = ref(false)
const systemStore = useSystemStore()
const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
})

const handleLanguageChange = (languageName: string) => {
    if (isMobile.value) {
        useSystemStore().toggleMenuExpand(false)
    }
}

const handleLogout = () => {
    // 可以添加额外的登出处理逻辑
}

const toggleDarkMode = () => {
    setDark(!getDark())
}
</script>

<style scoped lang="scss">
.ma-header {
    background-color: var(--ma-bg-color-overlay);
    /* 暂时注释掉阴影，避免左右两边出现阴影线条 */
    /* box-shadow: 0 2px 4px rgba(0 0 0 / 8%); */
    position: relative;
    z-index: 1000;
    width: 100%;
}

.header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1450px;
    margin: 0 auto;
    padding: 0 20px;
    height: var(--el-header-height);
}

.header-left {
    flex-shrink: 0;
    display: flex;
    align-items: center;
}

.header-center {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    margin: 0 20px;
    
    .frontend-header-menu {
        height: var(--el-header-height);
        background: transparent;
        .el-menu-item,
        .el-sub-menu .el-sub-menu__title {
            &.is-active {
                color: var(--el-color-primary) !important;
            }
            &:hover {
                background-color: transparent !important;
                color: var(--el-menu-hover-text-color) !important;
            }
        }
    }
    
    :deep(.el-menu--horizontal) {
        border-bottom: none;
    }
}

.header-right {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0;
    
    .frontend-header-menu {
        height: var(--el-header-height);
        background: transparent;
        .el-menu-item,
        .el-sub-menu .el-sub-menu__title {
            &.is-active {
                color: var(--el-color-primary) !important;
            }
            &:hover {
                background-color: transparent !important;
                color: var(--el-menu-hover-text-color) !important;
            }
        }
    }
}

.header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.header-action-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.3s ease;
    color: var(--el-text-color-primary);
    
    &:hover {
        background-color: var(--el-fill-color-light);
    }
}

.mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    cursor: pointer;
    border-radius: 6px;
    height: 40px;
    width: 40px;
    
    &:hover {
        background-color: var(--el-fill-color-light);
    }
}

.mobile-menu-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
}

// 响应式设计
@media screen and (max-width: 768px) {
    .header-container {
        padding: 0 15px;
    }
    
    .header-center {
        display: none;
    }
    
    .header-right {
        justify-content: flex-start;
    }
}

@media screen and (max-width: 414px) {
    .header-container {
        padding: 0 10px;
    }
}
</style>