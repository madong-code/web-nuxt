<template>
  <div class="member-password">
    <h2 class="page-title">{{ t('member.password.page_title') }}</h2>
    <el-card class="password-card">
      <el-form :model="passwordForm" :rules="rules" ref="passwordFormRef" label-width="120px">
        <el-form-item :label="t('member.password.current_password')" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" :placeholder="t('member.password.current_password_placeholder')" />
        </el-form-item>
        <el-form-item :label="t('member.password.new_password')" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" :placeholder="t('member.password.new_password_placeholder')" />
        </el-form-item>
        <el-form-item :label="t('member.password.confirm_password')" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" :placeholder="t('member.password.confirm_password_placeholder')" />
        </el-form-item>
        <el-form-item class="form-actions">
          <el-button type="primary" @click="submitForm" class="submit-btn" :loading="loading">{{ t('member.password.submit_button') }}</el-button>
          <el-button @click="resetForm" class="reset-btn">{{ t('member.password.reset_button') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { changePassword } from '~/api/member'

const passwordFormRef = ref<FormInstance>()
const loading = ref(false)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = reactive<FormRules>({
  oldPassword: [
    { required: true, message: t('member.password.validation.current_password_required'), trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: t('member.password.validation.new_password_required'), trigger: 'blur' },
    { min: 6, message: t('member.password.validation.new_password_min_length'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('member.password.validation.confirm_password_required'), trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error(t('member.password.validation.confirm_password_mismatch')))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

const submitForm = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      loading.value = true
      try {
        await changePassword({
          old_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword
        })
        ElMessage.success(t('member.password.success'))
        resetForm()
      }finally {
        loading.value = false
      }
    } else {
      console.log('验证失败', fields)
    }
  })
}

const resetForm = () => {
  passwordFormRef.value?.resetFields()
}
</script>

<style scoped>
.member-password {
  padding: 20px;
  /* min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column; */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.password-card {
  max-width: 600px;
  border-radius: 4px;
  box-shadow: none;
  border: none;
  overflow: hidden;
  /* background-color: #ffffff; */
  padding: 30px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.submit-btn {
  flex: 1;
  height: 40px;
}

.reset-btn {
  flex: 1;
  height: 40px;
}

/* 优化表单标签样式 */
:deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* 优化输入框样式 - 移除边框 */
:deep(.el-input__wrapper) {
  border-radius: 4px;
  transition: all 0.3s ease;
}



/* 优化按钮样式 */
:deep(.el-button) {
  border-radius: 4px;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

:deep(.el-button--default) {
  border-color: #dcdfe6;
  color: #606266;
}

:deep(.el-button--default:hover) {
  border-color: #c0c4cc;
  color: #303133;
}
</style>
