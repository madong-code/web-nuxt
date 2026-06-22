import { ref } from 'vue'
import { getCaptchaImage } from '@/api/system'

interface CaptchaFormData {
    captcha_code: string
    captcha_key: string
}

interface CaptchaResponse {
    code: number
    msg: string
    data: {
        uuid: string
        base64: string
    }
}

export function useCaptcha(formData: CaptchaFormData) {
    const image = ref('')

    const refresh = async () => {
        try {
            const res = await getCaptchaImage() as CaptchaResponse
            if (res.code === 0 && res.data) {
                formData.captcha_key = res.data.uuid
                formData.captcha_code = ''
                image.value = res.data.base64.replace(/\r\n/g, '')
            }
        } catch (e) {
            console.error('获取验证码失败:', e)
        }
    }

    return {
        image,
        refresh
    }
}


