<template>
  <div class="member-settings">
    <h2 class="page-title">{{ t('member.settings.page_title') }}</h2>

    <div class="card-header">{{ t('member.settings.account_info') }}</div>
    <el-form :model="accountForm" label-width="120px" class="account-form">
      <!-- 手机号码修改 -->
      <el-form-item :label="t('member.settings.login_phone')">
        <div class="account-item">
          <el-input v-model="accountForm.phone" disabled />
          <el-button type="primary" @click="showPhoneDialog = true">{{ t('member.settings.change_phone') }}</el-button>
        </div>
      </el-form-item>

      <!-- 邮箱修改 -->
      <el-form-item :label="t('member.settings.email')">
        <div class="account-item">
          <el-input v-model="accountForm.email" disabled />
          <el-button type="primary" @click="showEmailDialog = true">{{ t('member.settings.change_email') }}</el-button>
        </div>
      </el-form-item>

      <!-- 登录密码 -->
      <el-form-item :label="t('member.settings.login_password')">
        <div class="account-item">
          <el-input
            type="password"
            v-model="passwordPlaceholder"
            disabled
            placeholder="******"
          />
          <el-button type="primary" @click="navigateToPassword">{{ t('member.settings.change_password') }}</el-button>
        </div>
      </el-form-item>
    </el-form>

    <!-- 手机号修改弹窗 -->
    <el-dialog v-model="showPhoneDialog" :title="t('member.settings.phone_bind_dialog')" width="400px">
      <el-form
        :model="phoneForm"
        :rules="phoneRules"
        ref="phoneFormRef"
        label-width="100px"
      >
        <el-form-item :label="t('member.settings.old_phone')" prop="oldMobile">
          <el-input v-model="phoneForm.oldMobile" :placeholder="t('member.settings.old_phone_placeholder')" />
        </el-form-item>
        <el-form-item :label="t('member.settings.new_phone')" prop="newMobile">
          <el-input v-model="phoneForm.newMobile" :placeholder="t('member.settings.new_phone_placeholder')">
            <template #append>
              <el-button @click="sendSmsCode('phone')" :disabled="smsCountdown > 0">
                {{ smsCountdown > 0 ? `${smsCountdown}s` : t('member.settings.get_code') }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('member.settings.verification_code')" prop="code">
          <el-input v-model="phoneForm.code" :placeholder="t('member.settings.verification_code_placeholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPhoneDialog = false">{{ t('member.settings.cancel') }}</el-button>
          <el-button type="primary" @click="updatePhone">{{ t('member.settings.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 邮箱修改弹窗 -->
    <el-dialog v-model="showEmailDialog" :title="t('member.settings.email_bind_dialog')" width="400px">
      <el-form
        :model="emailForm"
        :rules="emailRules"
        ref="emailFormRef"
        label-width="100px"
      >
        <el-form-item :label="t('member.settings.new_email')" prop="email">
          <el-input v-model="emailForm.email" type="email" :placeholder="t('member.settings.new_email_placeholder')" />
        </el-form-item>
        <el-form-item :label="t('member.settings.verification_code')" prop="code">
          <el-input v-model="emailForm.code" :placeholder="t('member.settings.verification_code_placeholder')">
            <template #append>
              <el-button @click="sendSmsCode('email')" :disabled="emailCountdown > 0">
                {{ emailCountdown > 0 ? `${emailCountdown}s` : t('member.settings.get_code') }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEmailDialog = false">{{ t('member.settings.cancel') }}</el-button>
          <el-button type="primary" @click="updateEmail">{{ t('member.settings.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { sendVerificationCode, updateMemberMobile, updateMemberEmail } from "~/api/member";
import { useMemberStore } from "~/stores/member";

const router = useRouter();
const memberStore = useMemberStore();

// 账户表单
const accountForm = reactive({
  phone: "",
  email: "",
  password: "",
});

const passwordPlaceholder = ref("");

// 手机号修改
const showPhoneDialog = ref(false);
const phoneForm = reactive({
  oldMobile: "",
  newMobile: "",
  code: "",
});

const phoneRules = reactive({
  oldMobile: [{ required: true, message: t('member.settings.validation.old_phone_required'), trigger: "blur" }],
  newMobile: [{ required: true, message: t('member.settings.validation.new_phone_required'), trigger: "blur" }],
  code: [{ required: true, message: t('member.settings.validation.code_required'), trigger: "blur" }],
});

const phoneFormRef = ref();

// 邮箱修改
const showEmailDialog = ref(false);
const emailForm = reactive({
  email: "",
  code: "",
});

const emailRules = reactive({
  email: [{ required: true, message: t('member.settings.validation.email_required'), trigger: "blur" }],
  code: [{ required: true, message: t('member.settings.validation.new_email_code_required'), trigger: "blur" }],
});

const emailFormRef = ref();

// 验证码倒计时
const smsCountdown = ref(0);
const emailCountdown = ref(0);

// 加载会员信息
const loadMemberInfo = async () => {
  try {
    await memberStore.getMemberInfo();
    if (memberStore.info) {
      accountForm.phone = memberStore.info.phone || "";
      accountForm.email = memberStore.info.email || "";
    }
  } catch (error) {
    console.error("加载会员信息失败", error);
  }
};

onMounted(async () => {
  await loadMemberInfo();
});

// 发送验证码
const sendSmsCode = async (type: string) => {
  try {
    let data: any = {};

    if (type === "phone") {
      if (!phoneForm.newMobile) {
        ElMessage.warning(t('member.settings.please_enter_phone'));
        return;
      }
      data = {
        mobile: phoneForm.newMobile,
        type: "update_phone",
      };
    } else if (type === "email") {
      if (!emailForm.email) {
        ElMessage.warning(t('member.settings.please_enter_email'));
        return;
      }
      data = {
        email: emailForm.email,
        type: "update_email",
      };
    }

    await sendVerificationCode(data);
    ElMessage.success(t('member.settings.code_send_success'));

    // 开始倒计时
    if (type === "phone") {
      smsCountdown.value = 60;
      const timer = setInterval(() => {
        smsCountdown.value--;
        if (smsCountdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    } else if (type === "email") {
      emailCountdown.value = 60;
      const timer = setInterval(() => {
        emailCountdown.value--;
        if (emailCountdown.value <= 0) {
          clearInterval(timer);
        }
      }, 1000);
    }
  } catch {
    // 业务异常已由请求层统一拦截提示，此处无需重复弹出
  }
};

// 更新手机号
const updatePhone = async () => {
  if (!phoneFormRef.value) return;

  try {
    await updateMemberMobile(phoneForm);
    ElMessage.success(t('member.settings.phone_update_success'));
    showPhoneDialog.value = false;
    await loadMemberInfo();
  } catch {
    // 业务异常已由请求层统一拦截提示，此处无需重复弹出
  }
};

// 更新邮箱
const updateEmail = async () => {
  if (!emailFormRef.value) return;

  try {
    await updateMemberEmail(emailForm);
    ElMessage.success(t('member.settings.email_update_success'));
    showEmailDialog.value = false;
    await loadMemberInfo();
  } catch {
    // 业务异常已由请求层统一拦截提示，此处无需重复弹出
  }
};

// 跳转到修改密码页面
const navigateToPassword = () => {
  router.push("/member/password");
};
</script>

<style scoped>
.member-settings {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.settings-card {
  max-width: 800px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.account-form {
  max-width: 600px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.account-item .el-input {
  flex: 1;
  min-width: 200px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
