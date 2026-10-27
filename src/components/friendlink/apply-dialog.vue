<template>
    <el-dialog
        v-model="visible"
        :title="t('common.friendlinkApplyDialog.title')"
        width="460px"
        :close-on-click-modal="false"
        :close-on-press-escape="!submitting"
        :show-close="!submitting"
    >
        <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90px"
            @submit.prevent="submit"
        >
            <el-form-item :label="t('common.friendlinkApplyDialog.name')" prop="name">
                <el-input
                    v-model="form.name"
                    :placeholder="t('common.friendlinkApplyDialog.namePlaceholder')"
                    maxlength="64"
                    show-word-limit
                />
            </el-form-item>
            <el-form-item :label="t('common.friendlinkApplyDialog.url')" prop="url">
                <el-input
                    v-model="form.url"
                    :placeholder="t('common.friendlinkApplyDialog.urlPlaceholder')"
                    maxlength="512"
                />
            </el-form-item>
            <el-collapse class="border-t border-[color:var(--md-border)]">
                <el-collapse-item :title="t('common.friendlinkApplyDialog.more')" name="extra">
                    <el-form-item :label="t('common.friendlinkApplyDialog.logo')" prop="logo">
                        <el-input
                            v-model="form.logo"
                            :placeholder="t('common.friendlinkApplyDialog.logoPlaceholder')"
                            maxlength="512"
                        />
                    </el-form-item>
                    <el-form-item :label="t('common.friendlinkApplyDialog.description')" prop="description">
                        <el-input
                            v-model="form.description"
                            type="textarea"
                            :rows="2"
                            :placeholder="t('common.friendlinkApplyDialog.descriptionPlaceholder')"
                            maxlength="255"
                            show-word-limit
                        />
                    </el-form-item>
                    <el-form-item :label="t('common.friendlinkApplyDialog.contact')" prop="contact">
                        <el-input
                            v-model="form.contact"
                            :placeholder="t('common.friendlinkApplyDialog.contactPlaceholder')"
                            maxlength="128"
                        />
                    </el-form-item>
                </el-collapse-item>
            </el-collapse>
        </el-form>
        <template #footer>
            <el-button :disabled="submitting" @click="handleClose">
                {{ t('common.cancel') }}
            </el-button>
            <el-button type="primary" :loading="submitting" @click="submit">
                {{ t('common.confirm') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
/**
 * 页脚申请友链弹窗（框架层；提交写 web_link 待审核，后台「网站设置→友情链接」启用后展示）。
 * 与 portal DIY 模块的申请弹窗（PortalFriendlinkApplyDialog → portal_friendlink）是两套独立链路。
 */
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { t } from '~/composables/lang'
import { applyFriendlink } from '~/api/site'

const visible = defineModel<boolean>({ default: false })

const formRef = ref<FormInstance>()
const submitting = ref(false)
const initialForm = () => ({ name: '', url: '', logo: '', description: '', contact: '' })
const form = reactive(initialForm())

/** 无协议自动补 https://；仅允许 http(s) 协议 */
function normalizeUrl(raw: string): string {
    const value = raw.trim()
    if (!value) return ''
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`
    try {
        const parsed = new URL(withScheme)
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return ''
        return withScheme
    } catch {
        return ''
    }
}

const rules = computed<FormRules>(() => ({
    name: [
        { required: true, message: t('common.friendlinkApplyDialog.nameRequired'), trigger: 'blur' },
        { max: 64, message: t('common.friendlinkApplyDialog.nameMax'), trigger: 'blur' },
    ],
    url: [
        { required: true, message: t('common.friendlinkApplyDialog.urlRequired'), trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (!value || normalizeUrl(String(value))) callback()
                else callback(new Error(t('common.friendlinkApplyDialog.urlInvalid')))
            },
            trigger: 'blur',
        },
    ],
}))

function resetForm() {
    Object.assign(form, initialForm())
    formRef.value?.clearValidate()
}

function handleClose() {
    if (submitting.value) return
    visible.value = false
}

watch(visible, (next) => {
    if (!next) resetForm()
})

async function submit() {
    if (submitting.value) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    const url = normalizeUrl(form.url)
    if (!url) {
        ElMessage.error(t('common.friendlinkApplyDialog.urlInvalid'))
        return
    }

    submitting.value = true
    try {
        await applyFriendlink({
            name: form.name.trim(),
            url,
            logo: form.logo.trim() || undefined,
            description: form.description.trim() || undefined,
            contact: form.contact.trim() || undefined,
        })
        ElMessage.success(t('common.friendlinkApplyDialog.success'))
        visible.value = false
        resetForm()
    } catch (error: any) {
        ElMessage.error(error?.message || t('common.friendlinkApplyDialog.failed'))
    } finally {
        submitting.value = false
    }
}
</script>
