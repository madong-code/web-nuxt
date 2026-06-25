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

    <div class="card-header">{{ t('member.settings.third_party_bind') }}</div>

    <!-- 绑定列表 -->
    <el-table :data="thirdPartyList" style="width: 100%">
      <el-table-column prop="id" label="序号" width="80" />
      <el-table-column :label="t('member.settings.bind')" width="150" align="left">
        <template #default="scope">
          <div class="platform-info">
            <!-- <Icon :icon="getPlatformIcon(scope.row.platform)" class="platform-icon" /> -->
            <span class="platform-name">{{ scope.row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('member.settings.bind')" min-width="150">
        <template #default="scope">
          <div class="platform-detail">
            <img
              v-if="scope.row.info?.avatar"
              :src="scope.row.info.avatar"
              class="avatar"
              alt=""
            />
            <span>{{ scope.row.info?.account || "-" }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="bind_time" :label="t('member.settings.bind_time')" width="180" />
      <el-table-column prop="status" :label="t('member.settings.status')" width="100">
        <template #default="scope">
          <el-tag size="small" type="success" v-if="scope.row.binded">{{ t('member.settings.using') }}</el-tag>
          <el-tag size="small" type="danger" v-else>{{ t('member.settings.not_bound') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('member.settings.options')" width="120" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            type="danger"
            @click="handleUnbind(scope.row)"
            v-if="scope.row.binded"
          >
            {{ t('member.settings.unbind') }}
          </el-button>
          <el-button size="small" type="primary" @click="handleBind(scope.row)" v-else>
            {{ t('member.settings.bind') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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

    <el-dialog v-model="qrDialogVisible" :title="qrDialogTitle" width="400px" center>
      <div class="qr-dialog-content">
        <div v-if="qrLoading" class="qr-loading">
          <el-icon class="is-loading"><loading /></el-icon>
          <p>{{ t('member.settings.qr_generating') }}</p>
        </div>
        <div v-else-if="qrExpired" class="qr-expired">
          <el-icon><warning /></el-icon>
          <p>{{ t('member.settings.qr_expired') }}</p>
          <el-button type="primary" @click="generateQrCode">{{ t('member.settings.qr_regenerate') }}</el-button>
        </div>
        <div v-else-if="qrSuccess" class="qr-success">
          <el-icon><success-filled /></el-icon>
          <p>{{ t('member.settings.qr_success') }}</p>
          <el-button type="primary" @click="closeQrDialog">{{ t('member.settings.confirm') }}</el-button>
        </div>
        <div v-else class="qr-code-container">
          <img v-if="qrCode" :src="qrCode" alt="绑定二维码" class="qr-code" />
          <p class="qr-tip">{{ t('member.settings.qr_tip', { name: currentBindItem?.name }) }}</p>
          <el-progress
            :percentage="qrProgress"
            :status="qrProgress === 100 ? 'success' : ''"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Loading, Warning, SuccessFilled } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import {
  getThirdPartyList,
  unbindThirdParty,
  generateBindQrCode,
  checkBindQrStatus,
} from "~/api/auth";
import { sendVerificationCode, updateMemberMobile, updateMemberEmail } from "~/api/member";
import { useMemberStore } from "~/stores/member";

const router = useRouter();
const memberStore = useMemberStore();

const getPlatformIcon = (platform: number): string => {
  const iconMap: Record<number, string> = {
    1: "ant-design:qq-circle-filled",
    2: "ant-design:wechat-filled",
    3: "ant-design:weibo-circle-filled",
    4: "ant-design:youtube-filled",
  };
  return iconMap[platform] || "ant-design:question-circle-filled";
};

// 账户表单
const accountForm = reactive({
  phone: "",
  email: "",
  password: "",
});

const passwordPlaceholder = ref("");

// 绑定列表
const bindList = reactive([
  {
    type: "qq",
    name: t('member.settings.qq'),
    platform: 1,
    binded: false,
    scan: true,
    info: null,
    bind_time: "-",
  },
  {
    type: "wechat",
    name: t('member.settings.wechat'),
    platform: 2,
    binded: false,
    scan: true,
    info: null,
    bind_time: "-",
  },
  {
    type: "douyin",
    name: t('member.settings.douyin'),
    platform: 4,
    binded: false,
    scan: false,
    info: null,
    bind_time: "-",
  },
  {
    type: "weibo",
    name: t('member.settings.weibo'),
    platform: 3,
    binded: false,
    scan: false,
    info: null,
    bind_time: "-",
  },
]);

// 第三方绑定列表
const thirdPartyList = ref<any[]>([]);

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

// 二维码绑定
const qrDialogVisible = ref(false);
const qrDialogTitle = ref("");
const qrLoading = ref(false);
const qrExpired = ref(false);
const qrSuccess = ref(false);
const qrCode = ref("");
const qrProgress = ref(0);
const currentBindItem = ref<any>(null);
const currentSceneId = ref("");
const qrTimer = ref<any>(null);

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

// 加载第三方绑定列表
const loadThirdPartyList = async () => {
  try {
    const res = await getThirdPartyList();
    console.log("获取第三方绑定列表结果:", res);

    if (res && Array.isArray(res)) {
      // 更新绑定状态
      res.forEach((item: any) => {
        const bindItem = bindList.find((b) => b.platform === item.platform);
        if (bindItem) {
          bindItem.binded = item.binded;
          bindItem.info = item.info;
          bindItem.bind_time = item.bind_time;
        }
      });

      // 显示所有平台（包括已绑定和未绑定）
      thirdPartyList.value = bindList.map((item: any, index: number) => ({
        id: index + 1,
        ...item,
        bind_time: item.bind_time || "-",
        status: item.binded ? t('member.settings.using') : t('member.settings.not_bound'),
      }));
    }
  } catch (error) {
    console.error("加载第三方绑定列表失败", error);
  }
};

onMounted(async () => {
  await loadMemberInfo();
  await loadThirdPartyList();
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
  } catch (error: any) {
    ElMessage.error(error.message || t('member.settings.code_send_failed'));
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
  } catch (error: any) {
    ElMessage.error(error.message || t('member.settings.phone_update_failed'));
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
  } catch (error: any) {
    ElMessage.error(error.message || t('member.settings.email_update_failed'));
  }
};

// 跳转到修改密码页面
const navigateToPassword = () => {
  router.push("/member/password");
};

// 处理绑定
const handleBind = async (item: any) => {
  console.log("handleBind 被调用", item);

  if (item.binded) {
    try {
      await ElMessageBox.confirm(t('member.settings.confirm_unbind', { name: item.name }), t('member.settings.confirm_unbind_title'), {
        confirmButtonText: t('member.settings.confirm'),
        cancelButtonText: t('member.settings.cancel'),
        type: "warning",
      });
      try {
        await unbindThirdParty(item.platform);
        ElMessage.success(t('member.settings.unbind_success'));
        await loadThirdPartyList();
      } catch (error: any) {
        ElMessage.error(error.message || t('member.settings.unbind_failed'));
      }
    } catch {
      ElMessage.info(t('member.settings.cancel_unbind'));
    }
  } else {
    console.log("开始绑定流程", item);

    if (item.scan) {
      console.log("使用扫码绑定");
      currentBindItem.value = item;
      qrDialogTitle.value = t('member.settings.qr_bind_title', { name: item.name });
      generateQrCode();
    } else {
      console.log("使用应用跳转绑定");
      const schemes: Record<string, string> = {
        douyin: "snssdk1128://",
        weibo: "sinaweibo://",
      };

      const scheme = schemes[item.type];
      if (scheme) {
        try {
          window.location.href = scheme;
          ElMessage.info(t('member.settings.opening_app', { name: item.name }));
        } catch (error) {
          ElMessage.error(t('member.settings.open_app_failed', { name: item.name }));
        }
      } else {
        ElMessage.info(t('member.settings.please_bind', { name: item.name }));
      }
    }
  }
};

// 处理解绑
const handleUnbind = async (item: any) => {
  try {
    await ElMessageBox.confirm(t('member.settings.confirm_unbind', { name: item.name }), t('member.settings.confirm_unbind_title'), {
      confirmButtonText: t('member.settings.confirm'),
      cancelButtonText: t('member.settings.cancel'),
      type: "warning",
    });
    try {
      await unbindThirdParty(item.platform);
      ElMessage.success(t('member.settings.unbind_success'));
      await loadThirdPartyList();
    } catch (error: any) {
      ElMessage.error(error.message || t('member.settings.unbind_failed'));
    }
  } catch {
    ElMessage.info(t('member.settings.cancel_unbind'));
  }
};

// 生成二维码
const generateQrCode = async () => {
  console.log("generateQrCode 被调用", currentBindItem.value);

  if (!currentBindItem.value) {
    console.log("currentBindItem 为空，返回");
    return;
  }

  qrDialogVisible.value = true;
  qrLoading.value = true;
  qrExpired.value = false;
  qrSuccess.value = false;
  qrCode.value = "";
  qrProgress.value = 0;

  try {
    console.log("开始生成二维码，platform:", currentBindItem.value.platform);
    const res = await generateBindQrCode(currentBindItem.value.platform);
    console.log("二维码生成结果:", res);
    console.log("qr_code URL:", res.qr_code);

    if (res) {
      currentSceneId.value = res.scene_id;
      qrCode.value = res.qr_code;
      console.log("qrCode URL:", qrCode.value);
      qrLoading.value = false;
      startPolling();
    }
  } catch (error: any) {
    console.error("生成二维码失败:", error);
    ElMessage.error(error.message || t('member.settings.qr_generate_failed'));
    qrDialogVisible.value = false;
  }
};

// 开始轮询
const startPolling = () => {
  if (!currentSceneId.value) return;

  qrTimer.value = setInterval(async () => {
    try {
      const res = await checkBindQrStatus(currentSceneId.value);
      if (res) {
        if (res.status === "success") {
          qrSuccess.value = true;
          qrProgress.value = 100;
          stopPolling();
          await loadThirdPartyList();
        } else if (res.status === "pending") {
          qrProgress.value = Math.min(qrProgress.value + 10, 90);
        }
      }
    } catch (error: any) {
      if (error.message?.includes("过期")) {
        qrExpired.value = true;
        stopPolling();
      }
    }
  }, 2000);
};

// 停止轮询
const stopPolling = () => {
  if (qrTimer.value) {
    clearInterval(qrTimer.value);
    qrTimer.value = null;
  }
};

// 关闭二维码弹窗
const closeQrDialog = () => {
  stopPolling();
  qrDialogVisible.value = false;
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

.empty-bind-list {
  padding: 40px 0;
  text-align: center;
}

.available-platforms {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
}

.platforms-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.platform-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 15px;
  border-radius: 8px;
}

.platform-item:hover {
  transform: translateY(-3px);
}

.platform-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.platform-icon.qq {
  background-color: #12b7f5;
  color: white;
}

.platform-icon.wechat {
  background-color: #07c160;
  color: white;
}

.platform-icon.douyin {
  background-color: #000000;
  color: white;
}

.platform-icon.weibo {
  background-color: #e6162d;
  color: white;
}

.platform-name {
  font-size: 12px;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-info .platform-icon {
  width: 24px;
  height: 24px;
  font-size: 24px;
}

.platform-detail {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-detail .avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.qr-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.qr-loading p {
  margin: 0;
}

.qr-expired {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.qr-expired p {
  margin: 0;
}

.qr-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.qr-success p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.qr-code {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
}

.qr-tip {
  margin: 0;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
