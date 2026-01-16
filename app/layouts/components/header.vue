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
                <el-scrollbar class="hidden-sm-and-down">
                    <Menu class="frontend-header-menu" :ellipsis="false" mode="horizontal" />
                </el-scrollbar>
            </client-only>
        </div>

        <!-- 右侧功能区域 -->
        <div class="header-right">
            <client-only>
             <el-scrollbar class="hidden-sm-and-down" >
                <HeaderActions class="frontend-header-menu" :ellipsis="false" mode="horizontal" v-if="!isMobile"/>
                <div
                    v-if="isMobile && !personalCenter.state.menu_expand"
                    @click="personalCenter.toggleMenuExpand(true)"
                    class="mobile-menu-toggle mr-2"
                >
                    <Icon name="el-icon-Expand" color="var(--el-color-primary)" size="20" />
                </div>
            </el-scrollbar>
            </client-only>
        </div>
    </div>

    <!-- 移动端抽屉菜单（仅在移动端显示） -->
    <MobileDrawer 
        v-if="isMobile"
        v-model="personalCenterStore.state.menu_expand"
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

const personalCenterStore = usePersonalCenterStore()

// 判断是否为移动端
const isMobile = ref(false)

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
        personalCenter.toggleMenuExpand(false)
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
    background-color: var(--ba-bg-color-overlay);
    box-shadow: 0 0 8px rgba(0 0 0 / 8%);
    position: relative;
    z-index: 1000;
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
    
    &:hover {
        background-color: var(--el-fill-color-light);
    }
}

// 响应式设计
@media screen and (max-width: 768px) {
    .header-container {
        padding: 0 15px;
    }
    
    .header-center {
        display: none;
    }
}

@media screen and (max-width: 414px) {
    .header-container {
        padding: 0 10px;
    }
}
</style>