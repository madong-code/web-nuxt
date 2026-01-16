<template>
  <div class="login-container" :class="{'dark-mode': isDarkMode}">
    <!-- 登录方式切换图标 -->
    <div class="login-mode-toggle">
      <Icon
        v-if="isAccountLoginActive"
        @click="toggleLoginMode"
        name="local-qr"
        :color="isDarkMode ? '#ffffff' : '#000000'"
        size="50px"
        class="login-toggle-icon"
      />
      <Icon
        v-else
        @click="toggleLoginMode"
        name="local-pc"
        :color="isDarkMode ? '#ffffff' : '#000000'"
        size="50px"
        class="login-toggle-icon"
      />
    </div>

    <!-- 账号密码登录表单 -->
    <div v-if="isAccountLoginActive" class="login-form-container">
      <div class="login-type-tabs">
        <div
          v-for="(item, index) in availableLoginTypes"
          :key="item.type"
          class="login-type-tab"
          :class="{
            'login-type-tab--active': currentLoginType === item.type,
            'login-type-tab--margin': index + 1 !== availableLoginTypes.length,
          }"
          @click="currentLoginType = item.type"
        >
          {{ item.title }}
        </div>
      </div>

      <el-form
        :model="formData"
        ref="formRef"
        :rules="formRules"
        :validate-on-rule-change="false"
        class="login-form"
      >
        <!-- 用户名密码登录 -->
        <div v-show="currentLoginType === 'username'" class="login-form-section">
          <el-form-item prop="username" class="form-item">
            <div class="input-container">
              <el-input
                v-model="formData.username"
                :placeholder="t('username_placeholder')"
                clearable
                :inline-message="true"
                :readonly="isUsernameInputReadonly"
                @click="isUsernameInputReadonly = false"
                @blur="isUsernameInputReadonly = true"
                class="login-input"
              >
                <template #prefix>
                  <Icon
                    name="el-icon-User"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="password" class="form-item">
            <div class="input-container">
              <el-input
                v-model="formData.password"
                :placeholder="t('password_placeholder')"
                type="password"
                clearable
                show-password
                class="login-input"
              >
                <template #prefix>
                  <Icon
                    name="el-icon-Lock"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
              </el-input>
            </div>
          </el-form-item>
        </div>

        <!-- 手机号登录 -->
        <div v-show="currentLoginType === 'mobile'" class="login-form-section">
          <el-form-item prop="mobile" class="form-item">
            <div class="input-container">
              <el-input
                v-model="formData.mobile"
                :placeholder="t('mobile_placeholder')"
                clearable
                class="login-input"
              >
                <template #prefix>
                  <Icon
                    name="el-icon-Phone"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="mobile_code" class="form-item">
            <div class="input-container">
              <el-input
                v-model="formData.mobile_code"
                :placeholder="t('code_placeholder')"
                class="login-input"
              >
                <template #prefix>
                  <Icon
                    name="el-icon-Key"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
                <template #suffix>
                  <sms-code
                    :mobile="formData.mobile"
                    type="login"
                    v-model="formData.mobile_key"
                    @click="handleSendSmsCode"
                    ref="smsCodeRef"
                  ></sms-code>
                </template>
              </el-input>
            </div>
          </el-form-item>
        </div>

        <!-- 注册链接 -->
        <div class="form-actions">
          <el-button type="primary" link @click="switchToRegister" class="register-link">
            {{ t("no_account") }}，{{ t("to_register") }}
          </el-button>
        </div>

        <!-- 登录按钮 -->
        <div class="login-button-container">
          <el-button
            type="primary"
            class="login-button"
            size="large"
            @click="handleLoginSubmit"
            :loading="isLoading"
          >
            {{ isLoading ? t("logining") : t("login") }}
          </el-button>
        </div>

        <!-- 协议同意 -->
        <div v-if="configStore.login.agreement_show" class="agreement-container">
          <span
            class="iconfont agreement-checkbox"
            :class="isAgreeProtocol ? 'icon-xuanze1' : 'icon-checkbox_nol'"
            @click="isAgreeProtocol = !isAgreeProtocol"
          ></span>
          {{ t("agree_tips") }}
          <NuxtLink :to="protocolUrls.serviceUrl" target="_blank">
            <span class="agreement-link">{{ t("user_agreement") }}</span>
          </NuxtLink>
          {{ t("and") }}
          <NuxtLink :to="protocolUrls.privacyUrl" target="_blank">
            <span class="agreement-link">{{ t("privacy_agreement") }}</span>
          </NuxtLink>
        </div>
      </el-form>
    </div>

    <!-- 微信扫码登录 -->
    <div v-else class="wechat-login-container">
      <div class="wechat-login-title">{{ t("wechat_scan_login") }}</div>
      <div class="qrcode-container">
        <div class="qrcode-wrapper">
          <el-image v-if="wechatQrCode.url" :src="wechatQrCode.url" class="qrcode-image" />
          <div v-else class="qrcode-placeholder"></div>
          <div v-if="wechatQrCode.isExpired" class="qrcode-overlay">
            <span class="qrcode-error-text">{{ wechatQrCode.expiredMessage }}</span>
            <span @click="handleGenerateWechatQrCode" class="qrcode-refresh-link">{{ t("click_refresh") }}</span>
          </div>
        </div>
        <div class="wechat-tip">
          <span class="iconfont icon-weixin1 wechat-icon"></span>
          <span class="wechat-text">{{ t("wechat_scan_tip") }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onUnmounted } from "vue";
import { authenticateUser, authenticateWithMobile, authenticateWithWechat,generateWechatQrCode, checkWechatScanStatus } from "@/api/auth";
import useConfigStore from "@/stores/config";
import QRCode from "qrcode";
import type { FormInstance } from "element-plus";

// Store 实例
const memberStore = useMemberStore();
const configStore = useConfigStore();

// 暗黑模式状态
const isDarkMode = computed(() => {
  return configStore.isDarkMode;
});

// 协议链接配置
const protocolUrls = computed(() => {
  const basePath = location.pathname.includes("web") ? "/web/auth/agreement" : "/auth/agreement";
  return {
    serviceUrl: `${basePath}?key=service`,
    privacyUrl: `${basePath}?key=privacy`,
  };
})as any;

// 登录模式状态
const isAccountLoginActive = ref(true);
const currentLoginType = ref("");
let qrCodeTimer: any = null;

// 微信扫码登录状态
const wechatQrCode = ref({
  url: "",
  key: "",
  isExpired: false,
  expiredMessage: t("qrcode_generate_failed"),
});

// 表单数据
const isLoading = ref(false);
const isAgreeProtocol = ref(false);
const isUsernameInputReadonly = ref(true);

const formData = reactive({
  username: "",
  password: "",
  mobile: "",
  mobile_code: "",
  mobile_key: "",
});

// 表单引用
const formRef = ref<FormInstance>();
const smsCodeRef = ref<AnyObject | null>(null);

// 计算属性
const availableLoginTypes = computed(() => {
  const types = [];
  if (configStore.login.is_username) {
    types.push({ type: "username", title: t("username_login") });
  }
  if (configStore.login.is_mobile) {
    types.push({ type: "mobile", title: t("mobile_login") });
  }
  currentLoginType.value = types[0] ? types[0].type : "";
  return types;
});

const formRules = computed(() => ({
  username: {
    required: currentLoginType.value === "username",
    message: t("username_placeholder"),
    trigger: ["blur", "change"],
  },
  password: {
    required: currentLoginType.value === "username",
    message: t("password_placeholder"),
    trigger: ["blur", "change"],
  },
  mobile: [
    {
      required: currentLoginType.value === "mobile",
      message: t("mobile_placeholder"),
      trigger: ["blur", "change"],
    },
    {
      validator(rule: any, value: string, callback: any) {
        if (currentLoginType.value !== "mobile") return true;
        return validate.mobile(value);
      },
      message: t("mobile_error"),
      trigger: ["blur"],
    },
  ],
  mobile_code: {
    required: currentLoginType.value === "mobile",
    message: t("code_placeholder"),
    trigger: ["change"],
  },
}));

// 生命周期
onUnmounted(() => {
  clearTimeout(qrCodeTimer);
});

// 初始化配置
configStore.getLoginConfig();

// 登录模式切换
const toggleLoginMode = () => {
  isAccountLoginActive.value = !isAccountLoginActive.value;
  if (!isAccountLoginActive.value) {
    handleGenerateWechatQrCode();
  } else {
    clearTimeout(qrCodeTimer);
  }
};

// 微信扫码登录相关方法
const handleGenerateWechatQrCode = async () => {
  try {
    const response = await generateWechatQrCode() as any;   
    const data = response.data;
    
    wechatQrCode.value.key = data.key;
    
    if (data.url) {
      const qrCodeUrl = await QRCode.toDataURL(data.url, {
        errorCorrectionLevel: "L",
        margin: 0,
        width: 100,
      });
      
      wechatQrCode.value.url = qrCodeUrl;
      wechatQrCode.value.isExpired = false;
      
      setTimeout(() => {
        checkScan(wechatQrCode.value.key);
      }, 1000);
    }
  } catch (error) {
    wechatQrCode.value.isExpired = true;
    wechatQrCode.value.expiredMessage = t("qrcode_generate_failed");
  }
};

/**
 * 检查微信扫码登录状态
 * @param key - 扫码登录密钥
 */
const checkScan = (key: string) => {
  checkWechatScanStatus({ key })
    .then((res: any) => {
      const data = res.data;
      switch (data.status) {
        case "wait":
          qrCodeTimer = setTimeout(() => {
            checkScan(wechatQrCode?.value.key);
          }, 1000);
          break;
        case "success":
          handleWechatLoginSuccess(data.login_data);
          break;
        case "fail":
          wechatQrCode.value.expiredMessage = data.fail_reason;
          wechatQrCode.value.isExpired = true;
          break;
      }
    })
    .catch((error) => {
      wechatQrCode.value.isExpired = true;
      wechatQrCode.value.expiredMessage = error.msg || t("scan_check_failed");
    });
};

const handleWechatLoginSuccess = (loginData: any) => {
  if (!loginData.token) {
    useCookie("openId").value = loginData.openid;
    navigateTo("/auth/bind");
    memberStore.logClose();
  } else {
    memberStore.setToken(loginData.token);
    memberStore.logClose();
  }
};

// 表单处理方法
const handleLoginSubmit = async () => {
  const isValid = await formRef.value?.validate();
  if (!isValid) return;

  if (configStore.login.agreement_show && !isAgreeProtocol.value) {
    ElMessage.error(t("is_agree_tips"));
    return;
  }

  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const loginMethod = currentLoginType.value === "username" ? authenticateUser : authenticateWithMobile;
    const response = await loginMethod(formData) as any;
    
    await memberStore.setToken(response?.data?.token || "");
    memberStore.logClose();
  } catch (error) {
    isLoading.value = false;
  }
};

const handleSendSmsCode = async () => {
  const isValid = await formRef.value?.validateField("mobile");
  if (isValid) {
    smsCodeRef.value?.send();
  }
};

// 组件通信
const emit = defineEmits(["typeChange"]);
const switchToRegister = () => {
  emit("typeChange", "register");
};
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100%;
  
  &.dark-mode {
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
  }
}

.login-mode-toggle {
  position: absolute;
  top: 0;
  right: 0;
}

.login-toggle-icon {
  font-size: 50px;
  cursor: pointer;
}

.login-form-container {
  background: var(--el-bg-color);
  width: 100%;
  padding: 60px 30px;
  border-radius: var(--rounded-big);
}

.login-type-tabs {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 30px;
}

.login-type-tab {
  font-size: 18px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  line-height: 24px;
  font-family: "OppoSans-R";

  &--active {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  &--margin {
    margin-right: 70px;
  }
}

.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: 20px;
}

.input-container {
  flex: 1;
  height: 50px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  background: var(--el-bg-color);
}

.login-input {
  width: 100%;
  border: none;

  :deep(.el-input__wrapper) {
    box-shadow: none;
    background: transparent;
    
    .el-input__inner {
      color: var(--el-text-color-primary);
      
      &::placeholder {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}

.input-prefix-icon {
  margin-right: 14px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.register-link {
  font-size: 12px;
}

.login-button-container {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 8px;
  font-family: "OppoSans-M";
}

.agreement-container {
  font-size: 12px;
  line-height: 24px;
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 20px;
  color: var(--el-text-color-secondary);
}

.agreement-checkbox {
  color: var(--el-color-primary);
  margin-right: 5px;
  cursor: pointer;
}

.agreement-link {
  color: var(--el-color-primary);
  margin: 0 4px;
  
  &:hover {
    color: var(--el-color-primary-light-3);
  }
}

.wechat-login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 30px;
  background: var(--el-bg-color);
}

.wechat-login-title {
  font-size: 18px;
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 24px;
  font-family: "OppoSans-R";
}

.qrcode-container {
  margin-top: 30px;
}

.qrcode-wrapper {
  padding: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--rounded-small);
  position: relative;
  background: var(--el-bg-color);
}

.qrcode-image {
  width: 200px;
  height: 200px;
}

.qrcode-placeholder {
  width: 202px;
  height: 202px;
  background: var(--el-bg-color-page);
}

.qrcode-overlay {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: absolute;
  inset: 0;
  background: var(--el-bg-color-overlay);
}

.qrcode-error-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.qrcode-refresh-link {
  font-size: 12px;
  cursor: pointer;
  color: var(--el-color-primary);
  margin-top: 8px;
  
  &:hover {
    color: var(--el-color-primary-light-3);
  }
}

.wechat-tip {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wechat-icon {
  color: #00c22c;
  font-size: 16px;
}

.wechat-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}
</style>