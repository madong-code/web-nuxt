<template>
  <div class="forget-password-container" :class="{'dark-mode': isDarkMode}">
    <div class="forget-password-form-container">
      <!-- 第一步：邮箱验证 -->
      <div v-if="currentStep === 1">
        <div class="forget-password-title">{{ t('auth.forget.password.title') }}</div>

        <el-form
          :model="step1Data"
          ref="step1FormRef"
          :rules="step1Rules"
          :validate-on-rule-change="false"
          class="forget-password-form"
        >
          <el-form-item prop="email" class="form-item">
            <div class="input-container">
              <el-input
                v-model="step1Data.email"
                :placeholder="t('auth.forget.password.email_placeholder')"
                clearable
                class="forget-password-input"
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

          <el-form-item prop="captcha_code" class="form-item">
            <div class="input-container">
              <el-input
                v-model="step1Data.captcha_code"
                :placeholder="t('auth.forget.password.captcha_placeholder')"
                class="forget-password-input"
              >
                <template #prefix>
                  <Icon
                    icon="ant-design:safety-outlined"
                    :color="isDarkMode ? '#ffffff' : '#000000'"
                    class="input-prefix-icon"
                  />
                </template>
                <template #suffix>
                  <div class="captcha-image" @click="captcha.refresh()">
                    <img v-if="captcha.image.value" :src="captcha.image.value" :alt="t('auth.forget.password.captcha_alt')" />
                    <Icon v-else icon="ant-design:loading-outlined" :size="24" />
                  </div>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item class="form-item">
            <el-button
              type="primary"
              class="next-step-button"
              @click="handleNextStep"
            >
              {{ t('auth.forget.password.next_step') }}
            </el-button>
          </el-form-item>

          <div class="login-link">
            {{ t('auth.forget.password.back_to_login') }}
            <span class="login-button" @click="switchToLogin">
              {{ t('auth.forget.password.login') }}
            </span>
          </div>
        </el-form>
      </div>

      <!-- 第二步：设置新密码 -->
      <div v-else>
        <div class="forget-password-title">{{ t('auth.forget.password.reset_title') }}</div>
        
        <!-- 验证码发送提示 -->
        <div class="verification-tip" v-if="verificationSent">
          {{ t('auth.forget.password.verification_sent', { email: step1Data.email }) }}<br>
          {{ t('auth.forget.password.verification_instruction') }}
        </div>

        <el-form
          :model="step2Data"
          ref="step2FormRef"
          :rules="step2Rules"
          :validate-on-rule-change="false"
          class="forget-password-form"
        >
          <el-form-item prop="password" class="form-item">
            <div class="input-container">
              <el-input
                v-model="step2Data.password"
                :placeholder="t('auth.forget.password.password_placeholder')"
                type="password"
                show-password
                clearable
                class="forget-password-input"
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

          <el-form-item prop="confirm_password" class="form-item">
            <div class="input-container">
              <el-input
                v-model="step2Data.confirm_password"
                :placeholder="t('auth.forget.password.confirm_password_placeholder')"
                type="password"
                show-password
                clearable
                class="forget-password-input"
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

          <el-form-item prop="code" class="form-item">
            <div class="email-code-container">
              <div class="input-container">
                <el-input
                  v-model="step2Data.code"
                  :placeholder="t('auth.forget.password.verification_code_placeholder')"
                  class="forget-password-input"
                >
                  <template #prefix>
                    <Icon
                      icon="ant-design:key-outlined"
                      :color="isDarkMode ? '#ffffff' : '#000000'"
                      class="input-prefix-icon"
                    />
                  </template>
                </el-input>
              </div>
              <el-button
                type="primary"
                class="send-email-code-button"
                :disabled="emailCodeCountdown > 0"
                @click="handleSendEmailCode"
              >
                {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}s` : t('auth.forget.password.resend_code') }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item class="form-item">
            <el-button
              type="primary"
              class="reset-password-button"
              @click="handleResetPassword"
            >
              {{ t('auth.forget.password.reset_password') }}
            </el-button>
          </el-form-item>

          <div class="prev-step-container">
            <span class="prev-step" @click="handlePrevStep">
              <Icon icon="ant-design:arrow-left-outlined" />
              {{ t('auth.forget.password.prev_step') }}
            </span>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { forgetPassword, verifyEmail, sendEmailCode } from '~/api/auth'
import type { FormInstance } from 'element-plus'
import { Icon } from '~/components/icon'
import { t } from '~/composables/lang'
import { useCaptcha } from '~/composables/captcha'
import validate from '~/utils/validate'
import { ElMessage } from 'element-plus'

// 暗黑模式状态
const isDarkMode = computed(() => {
  const root = document.querySelector('html')
  return root?.classList.contains('dark') || false
})

// 当前步骤
const currentStep = ref(1)
const isLoading = ref(false)
const emailCodeCountdown = ref(0)
const verificationSent = ref(false)
let emailCodeTimer: any = null

// 第一步数据：邮箱 + 图片验证码
const step1Data = reactive({
  email: '',
  captcha_code: '',
  captcha_key: ''
})

// 第二步数据：新密码 + 确认密码 + 验证码
const step2Data = reactive({
  password: '',
  confirm_password: '',
  code: ''
})

// 存储邮箱，用于第二步
const savedEmail = ref('')

// 表单引用
const step1FormRef = ref<FormInstance>()
const step2FormRef = ref<FormInstance>()

// 使用验证码组合式函数
const captcha = useCaptcha(step1Data)

// 第一步验证规则
const step1Rules = computed(() => ({
  email: [
    {
      type: 'string',
      required: true,
      message: t('auth.forget.password.email_required'),
      trigger: ['blur', 'change']
    },
    {
      validator: (_rule: any, value: string) => {
        return validate.email(value)
      },
      message: t('auth.forget.password.email_invalid'),
      trigger: ['blur']
    }
  ],
  captcha_code: {
    type: 'string',
    required: true,
    message: t('auth.forget.password.captcha_required'),
    trigger: ['blur', 'change']
  }
}) as any)

// 第二步验证规则
const step2Rules = computed(() => ({
  password: {
    type: 'string',
    required: true,
    message: t('auth.forget.password.password_required'),
    trigger: ['blur', 'change']
  },
  confirm_password: [
    {
      type: 'string',
      required: true,
      message: t('auth.forget.password.confirm_password_required'),
      trigger: ['blur', 'change']
    },
    {
      validator: (_rule: any, value: string) => {
        return value === step2Data.password
      },
      message: t('auth.forget.password.password_mismatch'),
      trigger: ['blur', 'change']
    }
  ],
  code: {
    type: 'string',
    required: true,
    message: t('auth.forget.password.verification_code_required'),
    trigger: ['blur', 'change']
  }
}) as any)

// 发送邮箱验证码
const handleSendEmailCode = async () => {
  if (!step1Data.email || !validate.email(step1Data.email)) {
    ElMessage.error(t('auth.forget.password.email_invalid'))
    return
  }

  if (emailCodeCountdown.value > 0) return

  try {
    await sendEmailCode({
      email: step1Data.email,
      captcha_key: step1Data.captcha_key,
      captcha_code: step1Data.captcha_code
    })

    ElMessage.success(t('auth.forget.password.code_sent'))
    emailCodeCountdown.value = 60

    emailCodeTimer = setInterval(() => {
      emailCodeCountdown.value--
      if (emailCodeCountdown.value <= 0) {
        clearInterval(emailCodeTimer)
      }
    }, 1000)
  } catch (error) {
    captcha.refresh()
  }
}

// 组件挂载时加载验证码
onMounted(() => {
  captcha.refresh()
})

// 下一步：验证邮箱
const handleNextStep = async () => {
  await step1FormRef.value?.validate(async (valid) => {
    if (!valid) return

    if (isLoading.value) return
    isLoading.value = true

    try {
      // 发送验证码
      await sendEmailCode({
        email: step1Data.email,
        captcha_key: step1Data.captcha_key,
        captcha_code: step1Data.captcha_code
      })
      
      savedEmail.value = step1Data.email
      verificationSent.value = true
      currentStep.value = 2
      
      // 开始倒计时
      emailCodeCountdown.value = 60
      emailCodeTimer = setInterval(() => {
        emailCodeCountdown.value--
        if (emailCodeCountdown.value <= 0) {
          clearInterval(emailCodeTimer)
        }
      }, 1000)
      
      ElMessage.success(t('auth.forget.password.code_sent_check_email'))
    } catch (error) {
      captcha.refresh()
    } finally {
      isLoading.value = false
    }
  })
}

// 上一步
const handlePrevStep = () => {
  currentStep.value = 1
  verificationSent.value = false
  if (emailCodeTimer) {
    clearInterval(emailCodeTimer)
    emailCodeCountdown.value = 0
  }
}

// 重置密码
const handleResetPassword = async () => {
  await step2FormRef.value?.validate(async (valid) => {
    if (!valid) return

    if (isLoading.value) return
    isLoading.value = true

    try {
      await forgetPassword({
        email: savedEmail.value,
        code: step2Data.code,
        new_password: step2Data.password,
        confirm_password: step2Data.confirm_password
      })
      ElMessage.success(t('auth.forget.password.reset_success'))
      emit('typeChange', 'login')
    } catch (error) {
      captcha.refresh()
    } finally {
      isLoading.value = false
    }
  })
}

// 切换到登录
const emit = defineEmits(['typeChange'])
const switchToLogin = () => {
  emit('typeChange', 'login')
}
</script>

<style lang="scss" scoped>
.forget-password-container {
  width: 100%;

  &.dark-mode {
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
  }
}

.forget-password-form-container {
  background: var(--el-bg-color);
  width: 100%;
  padding: 60px 30px;
  border-radius: var(--rounded-big);
}

.forget-password-title {
  font-size: 24px;
  color: var(--el-text-color-primary);
  font-weight: 600;
  text-align: center;
  margin-bottom: 30px;
  font-family: 'OppoSans-R';
}

.forget-password-tip {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
  margin-bottom: 40px;
  line-height: 20px;
}

.verification-tip {
  background-color: #E8F5E8;
  color: #2E7D32;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: center;
  font-size: 14px;
  line-height: 1.4;
}

.forget-password-form {
  width: 100%;
}

.form-item {
  margin-bottom: 20px;
}

.captcha-image {
  height: 30px;
  cursor: pointer;

  img {
    height: 100%;
    object-fit: cover;
  }

  .iconify {
    font-size: 24px;
    color: var(--el-text-color-secondary);
  }
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

.forget-password-input {
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

  :deep(.el-input__suffix) {
    padding: 0;
    line-height: 1;
  }
}

.input-prefix-icon {
  margin-right: 14px;
}

.email-code-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.send-email-code-button {
  flex-shrink: 0;
  height: 50px;
  white-space: nowrap;
  border-radius: 8px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--el-text-color-secondary);

  .login-button {
    color: var(--el-color-primary);
    cursor: pointer;
    margin-left: 5px;

    &:hover {
      text-decoration: underline;
    }
  }
}

.next-step-button,
.reset-password-button {
  width: 100%;
  height: 50px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
}

.prev-step-container {
  text-align: center;
  margin-top: 20px;

  .prev-step {
    color: var(--el-color-primary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
