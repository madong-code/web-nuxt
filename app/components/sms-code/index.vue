<template>
    <div class="sms-code-container">
        <el-button 
            type="primary" 
            link 
            :disabled="!canSendCode" 
            @click="handleSendCode"
            class="sms-code-button"
        >
            {{ buttonText }}
        </el-button>
    </div>

    <el-dialog 
        v-model="showCaptchaDialog" 
        :title="t('captcha_title')" 
        width="350px" 
        :append-to-body="true" 
        :align-center="true"
        class="captcha-dialog"
    >
        <el-form 
            :model="captchaForm" 
            ref="captchaFormRef" 
            :rules="captchaRules"  
            @submit.native.prevent
            class="captcha-form"
        >
            <el-form-item prop="captcha_code" class="captcha-form-item">
                <el-input 
                    v-model="captchaForm.captcha_code" 
                    :placeholder="t('captcha_placeholder')"
                    class="captcha-input"
                >
                    <template #suffix>
                        <div class="captcha-image-wrapper">
                            <el-image 
                                :src="captchaImage" 
                                class="captcha-image" 
                                @click="refreshCaptcha"
                            ></el-image>
                        </div>
                    </template>
                </el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="closeCaptchaDialog" class="cancel-button">
                    {{ t('cancel') }}
                </el-button>
                <el-button 
                    type="primary" 
                    :loading="isLoading" 
                    @click="confirmSendCode"
                    class="confirm-button"
                >
                    {{ t('confirm') }}
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { sendSmsVerificationCode } from '@/api/system'
import type { FormInstance } from 'element-plus'

interface SmsCodeProps {
    mobile: string
    type: string
    modelValue: string
}

interface CaptchaFormData {
    mobile: string
    captcha_code: string
    captcha_key: string
    type: string
}

const props = defineProps<SmsCodeProps>()
const emit = defineEmits(['update:modelValue', 'click'])

// 响应式数据
const isLoading = ref(false)
const showCaptchaDialog = ref(false)
const canSendCode = ref(true)
const buttonText = ref('')
const seconds = ref(90)
let countdownTimer: number | undefined = undefined

// 验证码相关
const captchaForm = reactive<CaptchaFormData>({
    mobile: '',
    captcha_code: '',
    captcha_key: '',
    type: props.type
})

const captchaImage = ref('')
const captchaFormRef = ref<FormInstance>()

// 验证规则
const captchaRules = reactive({
    captcha_code: {
        required: true,
        message: '请输入验证码',
        trigger: ['blur', 'change']
    }
})

// 计算属性
const smsValue = computed({
    get() {
        return props.modelValue
    },
    set(value) {
        emit('update:modelValue', value)
    }
})

// 初始化按钮文本
buttonText.value = t('get_sms_code')

// 发送短信验证码
const sendSmsCode = async () => {
    captchaForm.mobile = props.mobile
    
    if (!canSendCode.value) return

    try {
        isLoading.value = true
        const response = await sendSmsVerificationCode(captchaForm) as any
        
        if (response?.code !== -1) {
            smsValue.value = response.data.key
            startCountdown()
            closeCaptchaDialog()
        } else {
            refreshCaptcha()
        }
    } catch (error) {
        refreshCaptcha()
    } finally {
        isLoading.value = false
    }
}

// 开始倒计时
const startCountdown = () => {
    canSendCode.value = false
    countdownTimer = setInterval(() => {
        if (seconds.value > 0) {
            seconds.value -= 1
            buttonText.value = `${seconds.value}${t('sms_code_change_text')}`
        } else {
            resetCountdown()
        }
    }, 1000) as any
}

// 重置倒计时
const resetCountdown = () => {
    clearInterval(countdownTimer)
    seconds.value = 90
    canSendCode.value = true
    buttonText.value = t('get_sms_code')
}

// 刷新验证码
const refreshCaptcha = async () => {
    try {
        // 这里需要调用验证码API，暂时使用空字符串
        captchaImage.value = ''
        captchaForm.captcha_code = ''
    } catch (error) {
        console.error('刷新验证码失败:', error)
    }
}

// 处理发送验证码点击
const handleSendCode = () => {
    emit('click')
    showCaptchaDialog.value = true
    refreshCaptcha()
}

// 确认发送验证码
const confirmSendCode = async () => {
    await captchaFormRef.value?.validate(async (valid) => {
        if (valid) {
            await sendSmsCode()
        }
    })
}

// 关闭验证码对话框
const closeCaptchaDialog = () => {
    showCaptchaDialog.value = false
    captchaForm.captcha_code = ''
}

// 暴露方法给父组件
defineExpose({
    send: sendSmsCode
})
</script>

<style lang="scss" scoped>
.sms-code-container {
    height: 30px;
    display: flex;
    align-items: center;
}

.sms-code-button {
    font-size: 12px;
    padding: 0;
    height: auto;
}

.captcha-dialog {
    :deep(.el-dialog__header) {
        padding: 20px 20px 10px;
    }
    
    :deep(.el-dialog__body) {
        padding: 10px 20px;
    }
}

.captcha-form {
    width: 100%;
}

.captcha-form-item {
    margin-bottom: 0;
}

.captcha-input {
    :deep(.el-input__wrapper) {
        padding-right: 0;
    }
}

.captcha-image-wrapper {
    padding: 5px 0;
    line-height: 1;
}

.captcha-image {
    height: 30px;
    cursor: pointer;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.cancel-button,
.confirm-button {
    min-width: 80px;
}
</style>