<template>
  <div class="register-container" :class="{'dark-mode': isDarkMode}">
    <div class="register-form-container">
      <div class="register-type-tabs">
        <div 
          v-for="(item, index) in registerTypes" 
          :key="item.type"
          class="register-type-tab"
          :class="{ 
            'register-type-tab--active': currentType === item.type,
            'register-type-tab--margin': index + 1 !== registerTypes.length 
          }"
          @click="currentType = item.type"
        >
          {{ item.title }}
        </div>
      </div>

      <el-form 
        :model="formData" 
        ref="formRef" 
        :rules="formRules" 
        :validate-on-rule-change="false"
        class="register-form"
      >
        <!-- 用户名注册 -->
        <div v-show="currentType === 'username'" class="register-form-section">
          <el-form-item prop="username" class="form-item">
            <div class="input-container">
              <el-input 
                v-model="formData.username" 
                :placeholder="t('username_placeholder')" 
                clearable 
                :inline-message="true"
                :readonly="realNameInput" 
                @click="realNameInput = false" 
                @blur="realNameInput = true"
                class="register-input"
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
                class="register-input"
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

          <el-form-item prop="confirmPassword" class="form-item">
            <div class="input-container">
              <el-input 
                v-model="formData.confirmPassword" 
                :placeholder="t('confirm_password_placeholder')" 
                type="password" 
                clearable 
                show-password
                class="register-input"
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

          <el-form-item prop="captchaCode" class="form-item">
            <div class="input-container">
              <el-input 
                v-model="formData.captchaCode" 
                :placeholder="t('captcha_placeholder')"
                class="register-input"
              >
                <template #prefix>
                 <Icon
                    name="local-verify"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
                <template #suffix>
                  <div class="captcha-image-container">
                    <el-image 
                      :src="captcha.image.value" 
                      class="captcha-image" 
                      @click="captcha.refresh()"
                    ></el-image>
                  </div>
                </template>
              </el-input>
            </div>
          </el-form-item>
        </div>

        <!-- 手机号注册 -->
        <div v-show="currentType === 'mobile' || configStore.login.is_bind_mobile" class="register-form-section">
          <el-form-item prop="mobile" class="form-item">
            <div class="input-container">
              <el-input 
                v-model="formData.mobile" 
                :placeholder="t('mobile_placeholder')" 
                clearable
                class="register-input"
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

          <el-form-item prop="mobileCode" class="form-item">
            <div class="input-container">
              <el-input 
                v-model="formData.mobileCode" 
                :placeholder="t('code_placeholder')"
                class="register-input"
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
                    v-model="formData.mobileKey" 
                    @click="sendSmsCode" 
                    ref="smsCodeRef"
                  ></sms-code>
                </template>
              </el-input>
            </div>
          </el-form-item>
        </div>

        <!-- 登录链接 -->
        <div class="form-actions">
          <el-button type="primary" link @click="switchToLogin" class="login-link">
            {{ t('have_account') }}，{{ t('to_login') }}
          </el-button>
        </div>

        <!-- 注册按钮 -->
        <div class="register-button-container">
          <el-button 
            type="primary" 
            class="register-button" 
            size="large" 
            @click="handleRegister" 
            :loading="isLoading"
          >
            {{ isLoading ? t('registering') : t('register') }}
          </el-button>
        </div>

        <!-- 协议同意 -->
        <div 
          v-if="configStore.login.agreement_show" 
          class="agreement-container"
        >
          <span 
            class="iconfont agreement-checkbox" 
            :class="isAgreeChecked ? 'icon-xuanze1' : 'icon-checkbox_nol'" 
            @click="toggleAgreement"
          ></span>
          {{ t('register_agree_tips') }}
          <NuxtLink :to="protocolUrls.service" target="_blank">
            <span class="agreement-link">{{ t('user_agreement') }}</span>
          </NuxtLink>
          {{ t('and') }}
          <NuxtLink :to="protocolUrls.privacy" target="_blank">
            <span class="agreement-link">{{ t('privacy_agreement') }}</span>
          </NuxtLink>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { registerUser, registerWithMobile } from '@/api/auth'
import useConfigStore from '@/stores/config'
import type { FormInstance } from 'element-plus'

// 状态管理
const memberStore = useMemberStore()
const configStore = useConfigStore()

// 暗黑模式状态
const isDarkMode = computed(() => {
  return configStore.isDarkMode
})

// 初始化配置
configStore.getLoginConfig()

// 协议链接配置
const protocolUrls = computed(() => {
  const basePath = location.pathname.includes('web') ? '/web' : ''
  return {
    service: `${basePath}/auth/agreement?key=service`,
    privacy: `${basePath}/auth/agreement?key=privacy`
  }
})

// 注册类型配置
const currentType = ref('')
const registerTypes = computed(() => {
  const types = []
  if (configStore.login.is_username) {
    types.push({ type: 'username', title: t('username_register') })
  }
  if (configStore.login.is_mobile && !configStore.login.is_bind_mobile) {
    types.push({ type: 'mobile', title: t('mobile_register') })
  }
  currentType.value = types[0]?.type || ''
  return types
})

// 表单数据
const isLoading = ref(false)
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  mobile: '',
  mobileCode: '',
  mobileKey: '',
  captchaKey: '',
  captchaCode: ''
})

// 表单验证规则
const formRef = ref<FormInstance>()
const formRules = computed(() => ({
  username: {
    type: 'string',
    required: currentType.value === 'username',
    message: t('username_placeholder'),
    trigger: ['blur', 'change'],
  },
  password: {
    type: 'string',
    required: currentType.value === 'username',
    message: t('password_placeholder'),
    trigger: ['blur', 'change']
  },
  confirmPassword: [
    {
      type: 'string',
      required: currentType.value === 'username',
      message: t('confirm_password_placeholder'),
      trigger: ['blur', 'change']
    },
    {
      validator(rule: any, value: string, callback: any) {
        return value === formData.password
      },
      message: t('confirm_password_error'),
      trigger: ['change', 'blur'],
    }
  ],
  mobile: [
    {
      type: 'string',
      required: currentType.value === 'mobile' || configStore.login.is_bind_mobile,
      message: t('mobile_placeholder'),
      trigger: ['blur', 'change'],
    },
    {
      validator(rule: any, value: string, callback: any) {
        if (currentType.value !== 'mobile' && !configStore.login.is_bind_mobile) return true
        return validate.mobile(value)
      },
      message: t('mobile_error'),
      trigger: ['change', 'blur'],
    }
  ],
  mobileCode: {
    type: 'string',
    required: currentType.value === 'mobile' || configStore.login.is_bind_mobile,
    message: t('code_placeholder'),
    trigger: ['blur', 'change']
  },
  captchaCode: {
    type: 'string',
    required: currentType.value === 'username',
    message: t('captcha_placeholder'),
    trigger: ['blur', 'change'],
  }
}))

// 协议同意状态
const isAgreeChecked = ref(false)
const toggleAgreement = () => {
  isAgreeChecked.value = !isAgreeChecked.value
}

// 注册处理
const handleRegister = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return

    // 检查协议同意
    if (configStore.login.agreement_show && !isAgreeChecked.value) {
      ElMessage.error(t('is_agree_tips'))
      return
    }

    if (isLoading.value) return
    isLoading.value = true

    try {
      const registerApi = currentType.value === 'username' ? registerUser : registerWithMobile
      const res = await registerApi(formData)
      memberStore.setToken(res.data.token)
      memberStore.logClose()
    } catch (error) {
      isLoading.value = false
      captcha.refresh()
    }
  })
}

// 验证码功能
const captcha = useCaptcha(formData)
captcha.refresh()

// 短信验证码
const smsCodeRef = ref<AnyObject | null>(null)
const sendSmsCode = async () => {
  await formRef.value?.validateField('mobile', (valid) => {
    if (valid) {
      smsCodeRef.value?.send()
    }
  })
}

// 切换到登录
const emit = defineEmits(['typeChange'])
const switchToLogin = () => {
  emit('typeChange', 'login')
}

// 输入框状态
const realNameInput = ref(true)
</script>

<style lang="scss" scoped>
.register-container {
  width: 100%;
  
  &.dark-mode {
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
  }
}

.register-form-container {
  background: var(--el-bg-color);
  width: 100%;
  padding: 60px 30px;
  border-radius: var(--rounded-big);
}

.register-type-tabs {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 30px;
}

.register-type-tab {
  font-size: 18px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  line-height: 24px;
  font-family: 'OppoSans-R';
  
  &--active {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
  
  &--margin {
    margin-right: 70px;
  }
}

.register-form {
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

.register-input {
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

.captcha-image-container {
  padding: 0;
  line-height: 1;
}

.captcha-image {
  height: 30px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.login-link {
  font-size: 12px;
}

.register-button-container {
  margin-top: 20px;
}

.register-button {
  width: 100%;
  height: 50px;
  border-radius: 8px;
  font-family: 'OppoSans-M';
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
</style>