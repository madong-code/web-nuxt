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
                :placeholder="t('auth.register.username_placeholder')" 
                clearable 
                :inline-message="true"
                :readonly="realNameInput" 
                @click="realNameInput = false" 
                @blur="realNameInput = true"
                class="register-input"
              >
                <template #prefix>
                 <Icon
                    icon="ant-design:user-outlined"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item prop="email" class="form-item">
            <div class="input-container">
              <el-input 
                v-model="formData.email" 
                :placeholder="t('auth.register.email_placeholder')" 
                clearable 
                class="register-input"
              >
                <template #prefix>
                 <Icon
                    icon="ant-design:mail-outlined"
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
                :placeholder="t('auth.register.password_placeholder')" 
                type="password" 
                clearable 
                show-password
                class="register-input"
              >
                <template #prefix>
                 <Icon
                    icon="ant-design:lock-outlined"
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
                v-model="formData.confirm_password" 
                :placeholder="t('auth.register.confirm_password_placeholder')" 
                type="password" 
                clearable 
                show-password
                class="register-input"
              >
                <template #prefix>
                 <Icon
                    icon="ant-design:lock-outlined"
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
                v-model="formData.captcha_code" 
                :placeholder="t('auth.register.captcha_placeholder')"
                class="register-input"
              >
                <template #prefix>
                 <Icon
                    icon="ant-design:safety-outlined"
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
                :placeholder="t('auth.register.mobile_placeholder')" 
                clearable
                class="register-input"
              >
                <template #prefix>
                  <Icon
                    icon="ant-design:phone-outlined"
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
                v-model="formData.mobile_code" 
                :placeholder="t('auth.register.code_placeholder')"
                class="register-input"
              >
                <template #prefix>
                  <Icon
                    icon="ant-design:key-outlined"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
                <template #suffix>
                  <sms-code 
                    :mobile="formData.mobile" 
                    type="login" 
                    v-model="formData.mobile_key" 
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
            {{ t('auth.register.have_account') }}，{{ t('auth.register.to_login') }}
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
            {{ isLoading ? t('auth.register.registering') : t('auth.register.register') }}
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
          {{ t('auth.register.register_agree_tips') }}
          <NuxtLink :to="protocolUrls.service" target="_blank">
            <span class="agreement-link">{{ t('auth.register.user_agreement') }}</span>
          </NuxtLink>
          {{ t('auth.register.and') }}
          <NuxtLink :to="protocolUrls.privacy" target="_blank">
            <span class="agreement-link">{{ t('auth.register.privacy_agreement') }}</span>
          </NuxtLink>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { registerUser, registerWithMobile } from '@/api/auth'
import { useConfigStore } from '@/stores/config'
import { useMemberStore } from '@/stores/member'
import { useCaptcha } from '~/composables/captcha'
import type { FormInstance } from 'element-plus'
import { Icon } from '~/components/icon'
import {t} from '~/composables/lang'
import validate from '~/utils/validate'
import { ElMessage } from 'element-plus'


// 状态管理
const memberStore = useMemberStore()
const configStore = useConfigStore()

// 暗黑模式状态
const isDarkMode = computed(() => {
  return configStore.isDarkMode
})

// 初始化配置
// 配置已在 app.vue 中统一加载，这里不再重复请求

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
    types.push({ type: 'username', title: t('auth.register.username_register') })
  }
  if (configStore.login.is_mobile && !configStore.login.is_bind_mobile) {
    types.push({ type: 'mobile', title: t('auth.register.mobile_register') })
  }
  currentType.value = types[0]?.type || ''
  return types
})

// 表单数据
const isLoading = ref(false)
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  mobile: '',
  mobile_code: '',
  mobile_key: '',
  captcha_key: '',
  captcha_code: ''
})

// 表单验证规则
const formRef = ref<FormInstance>()
const formRules = computed(() => ({
  username: {
    type: 'string',
    required: currentType.value === 'username',
    message: t('auth.register.username_placeholder'),
    trigger: ['blur', 'change'],
  },
  email: [
    {
      type: 'string',
      required: currentType.value === 'username',
      message: t('auth.register.email_required'),
      trigger: ['blur', 'change'],
    },
    {
      validator(rule: any, value: string, callback: any) {
        if (currentType.value !== 'username') return true
        return validate.email(value)
      },
      message: t('auth.register.email_error'),
      trigger: ['change', 'blur'],
    }
  ],
  password: {
    type: 'string',
    required: currentType.value === 'username',
    message: t('auth.register.password_placeholder'),
    trigger: ['blur', 'change']
  },
  confirm_password: [
    {
      type: 'string',
      required: currentType.value === 'username',
      message: t('auth.register.confirm_password_placeholder'),
      trigger: ['blur', 'change']
    },
    {
      validator(rule: any, value: string, callback: any) {
        return value === formData.password
      },
      message: t('auth.register.confirm_password_error'),
      trigger: ['change', 'blur'],
    }
  ],
  mobile: [
    {
      type: 'string',
      required: currentType.value === 'mobile' || configStore.login.is_bind_mobile,
      message: t('auth.register.mobile_placeholder'),
      trigger: ['blur', 'change'],
    },
    {
      validator(rule: any, value: string, callback: any) {
        if (currentType.value !== 'mobile' && !configStore.login.is_bind_mobile) return true
        return validate.mobile(value)
      },
      message: t('auth.register.mobile_error'),
      trigger: ['change', 'blur'],
    }
  ],
  mobile_code: {
    type: 'string',
    required: currentType.value === 'mobile' || configStore.login.is_bind_mobile,
    message: t('auth.register.code_placeholder'),
    trigger: ['blur', 'change']
  },
  captcha_code: {
    type: 'string',
    required: currentType.value === 'username',
    message: t('auth.register.captcha_placeholder'),
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
      ElMessage.error(t('auth.register.is_agree_tips'))
      return
    }

    if (isLoading.value) return
    isLoading.value = true

    try {
      const registerApi = currentType.value === 'username' ? registerUser : registerWithMobile
      const data = await registerApi(formData) as any
      memberStore.setToken(data.access_token, data.refresh_token || '')
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