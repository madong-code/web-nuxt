<template>
  <el-menu :default-active="state.activeMenu" @select="onSelect">
    <!-- 语言切换 -->
    <el-sub-menu 
      v-if="configStore.language.is_enabled && availableLanguages.length > 1" 
      index="language-switch" 
      class="language-switch"
      :key="languageKey"
    >
      <template #title>
        <Icon v-if="showIcon" icon="ant-design:translation-outlined" color="var(--el-text-color-primary)" />
        {{ t("common.language") }}
      </template>
     
      <el-menu-item
        @click="handleLanguageChange(item.name)"
        v-for="item in availableLanguages"
        :key="item.name"
        :index="'language-switch-' + item.name"
        class="language-switch"
        :class="{ 'is-active': item.name === currentLanguage }"
        :title="`item.name: ${item.name}, currentLanguage: ${currentLanguage}`"
      >
        {{ item.value }}
      </el-menu-item>
    </el-sub-menu>

    <!-- 主题切换 -->
    <el-menu-item
      v-if="configStore.theme.is_enabled"
      index="theme-switch"
      class="theme-switch"
      :class="$attrs.mode + '-theme-switch'"
    >
      <DarkSwitch />
      <!-- <DarkToggle v-if="!isMobile" /> -->
    </el-menu-item>

    <!-- 已登录用户场景 -->
    <el-sub-menu
      v-if="memberStore.info"
      index="user-box"
    >
      <template #title>
        <div class="header-user-box">
          <img
            class="header-user-avatar"
            :class="$attrs.mode == 'vertical' ? 'icon-header-user-avatar' : ''"
            :src="getAvatarUrl(memberStore?.info?.avatar || '')"
            alt=""
          />
          {{ memberStore?.info?.nickname || t("common.user") }}
        </div>
      </template>

      <el-menu-item index="user" @click="$emit('menu-click'); navigateTo('/member/profile')">
        <Icon
          v-if="showIcon"
          icon="ant-design:user-outlined"
          color="var(--el-text-color-primary)"
        />
        {{ t("common.member_center") }}
      </el-menu-item>

      <!-- 会员中心菜单 -->
      <MenuSub :menus="systemStore.site.member_menu" :show-icon="showIcon" @menu-click="$emit('menu-click')" />

      <el-menu-item @click="$emit('menu-click'); memberStore.logout()" index="user-logout">
        <Icon
          v-if="showIcon"
          icon="ant-design:logout-outlined"
          color="var(--el-text-color-primary)"
        />
        {{ t("common.logout_login") }}
      </el-menu-item>
    </el-sub-menu>

    <!-- 未登录场景 -->
    <el-menu-item v-else @click="handleLoginClick" index="user">
      <Icon
        v-if="showIcon"
        icon="ant-design:user-outlined"
        color="var(--el-text-color-primary)"
      />
      {{ t("common.login") }}
    </el-menu-item>
  <LoadingDialog />

  </el-menu>
</template>
<script setup lang="ts">
import { computed, reactive, ref, nextTick, onMounted, onUnmounted, watch } from "vue";
import { navigateTo } from "nuxt/app";
import type { Menus } from "~/stores/interface";
import defaultAvatar from "~/assets/images/default_avatar.png";
import { fullUrl, getToken } from "~/utils/common";
import DarkToggle from "./dark-toggle.vue";
import DarkSwitch from "./dark-switch.vue";
import LoadingDialog from "@/components/login-dialog/index.vue";
import MenuSub from "./menu-sub.vue";
import { Icon } from '~/components/icon';
import { ElMessage } from "element-plus";
import { useMemberStore } from "~/stores/member";
import { useSystemStore } from "~/stores/system";
import { useConfigStore } from "~/stores/config";
import { t } from "~/composables/lang";
import { getDark, setDark } from "~/utils/dark";

const memberStore = useMemberStore();
const systemStore = useSystemStore();
const configStore = useConfigStore();

// 添加响应式的语言 key，用于强制组件重新渲染
const languageKey = ref(systemStore.lang);

// 监听语言变化，更新 languageKey
watch(() => systemStore.lang, (newLang, oldLang) => {
  if (newLang !== oldLang) {
    languageKey.value = newLang;
  }
}, { immediate: true });

const availableLanguages = computed(() => {
  const languages = systemStore.getLanguages;
  return languages;
});
const currentLanguage = computed(() => {
  // 从 systemStore 中获取语言设置，确保与状态保持同步
  return systemStore.lang;
});



interface Props {
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true,
});

const emit = defineEmits<{
  'menu-click': []
}>();

const state = reactive({
  activeMenu: "",
});
// 判断是否为移动端
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

/**
 * 获取用户头像URL
 * @param avatarUrl 用户头像URL，可为空、null或undefined
 * @returns 完整的头像URL，如果传入空值则返回默认头像
 */
const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
  if (!avatarUrl || avatarUrl.trim() === "") {
    // 返回默认头像
    return defaultAvatar;
  }

  return fullUrl(avatarUrl);
};

const handleLogin = () => {
  if (
    !getToken() &&
    !configStore.login.is_username &&
    !configStore.login.is_mobile &&
    !configStore.login.is_bind_mobile
  ) {
    ElMessage.error("商家未开启普通账号登录注册");
    return false;
  }
  memberStore.logOpen();
};

const handleLoginClick = () => {
  handleLogin();
  emit('menu-click');
};

/**
 * 处理语言切换
 * @param lang 语言代码
 */
const handleLanguageChange = (lang: string) => {
  const success = systemStore.setLanguage(lang);
  
  // 强制更新 languageKey，触发组件重新渲染
  languageKey.value = lang;
  
  // 不再刷新页面，语言切换应该立即生效
};

/**
 * 菜单被点击时额外对无需激活的菜单处理（外链、暗黑模式开关、语言切换等）
 * 检查菜单是否需要激活，如果否，还原 state.activeMenu
 */
const onSelect = (index: string) => {
  if (noNeedActive(systemStore.site.head_nav, index)) {
    const oldActiveMenu = state.activeMenu;
    state.activeMenu = "";
    nextTick(() => {
      state.activeMenu = oldActiveMenu;
    });
  }
};

/**
 * 检查一个菜单是否需要激活态
 * @param menus
 * @param index
 */
const noNeedActive = (menus: Menus[], index: string) => {
  if (index.indexOf("language-switch") === 0 || index == "theme-switch") {
    return true;
  }
  return isExternalLink(menus, index);
};

/**
 * 检查一个菜单是否是外站链接，如果是，不要激活
 * @param menus
 * @param index
 */
const isExternalLink = (menus: Menus[], index: string): boolean => {
  // 修复：添加空值检查
  if (!menus || !Array.isArray(menus)) {
    return false;
  }

  for (const key in menus) {
    // 修复：检查 menus[key] 是否存在
    if (!menus[key]) continue;

    const columnIndex = `column-${menus[key].id}`;
    if (columnIndex == index) {
      return menus[key].meta?.menu_type == "link";
    }
    // 修复：添加 children 存在性检查
    if (
      menus[key].children &&
      Array.isArray(menus[key].children) &&
      menus[key].children.length
    ) {
      const result = isExternalLink(menus[key].children, index);
      if (result) return true;
    }
  }
  return false;
};
const toggleDarkMode = () => {
  setDark(!getDark());
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>
<style scoped lang="scss">
.header-user-box {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  .header-user-avatar {
    width: 25px;
    height: 25px;
    margin-right: 4px;
    border-radius: 50%;
    background-color: black;
  }
  .icon-header-user-avatar {
    margin-left: 4px;
    margin-right: 6px;
  }
}
.el-sub-menu .icon,
.el-menu-item .icon {
  vertical-align: middle;
  margin-right: 2px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.is-active > .icon {
  color: var(--el-menu-active-color) !important;
}
.el-menu {
  border-bottom: none;
  border-right: none;
  .theme-switch.is-active,
  .language-switch.is-active {
    border-bottom: none;
    color: var(--el-menu-active-color) !important;
    font-weight: 500 !important;
    :deep(.el-sub-menu__title) {
      border-bottom: none;
    }
  }
}
.theme-switch {
  --el-menu-hover-bg-color: none;
  padding-right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vertical-theme-switch {
  .theme-toggle-content {
    padding: 0;
  }
}
.theme-toggle-content {
  padding-right: 0;
}

// 语言切换选中状态
.language-switch.is-active {
  color: var(--el-menu-active-color) !important;
  font-weight: 500;
}
</style>
