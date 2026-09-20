<template>
  <div class="member-third-party">
    <h2 class="page-title">{{ t('member.settings.third_party_bind') }}</h2>

    <el-card class="content-card">
      <!-- 绑定列表 -->
      <el-table :data="thirdPartyList" style="width: 100%">
        <el-table-column prop="id" label="序号" width="80" />
        <el-table-column :label="t('member.settings.bind')" width="150" align="left">
          <template #default="scope">
            <div class="platform-info">
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
    </el-card>

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
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Loading, Warning, SuccessFilled } from "@element-plus/icons-vue";
import {
  getThirdPartyList,
  unbindThirdParty,
  generateBindQrCode,
  checkBindQrStatus,
} from "~/api/auth";

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

// 加载第三方绑定列表
const loadThirdPartyList = async () => {
  try {
    const res = await getThirdPartyList();

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
  await loadThirdPartyList();
});

// 处理绑定
const handleBind = async (item: any) => {
  if (item.binded) {
    await handleUnbind(item);
  } else {
    if (item.scan) {
      currentBindItem.value = item;
      qrDialogTitle.value = t('member.settings.qr_bind_title', { name: item.name });
      generateQrCode();
    } else {
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
  if (!currentBindItem.value) {
    return;
  }

  qrDialogVisible.value = true;
  qrLoading.value = true;
  qrExpired.value = false;
  qrSuccess.value = false;
  qrCode.value = "";
  qrProgress.value = 0;

  try {
    const res = await generateBindQrCode(currentBindItem.value.platform);

    if (res) {
      currentSceneId.value = res.scene_id;
      qrCode.value = res.qr_code;
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

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.member-third-party {
  padding: 20px;
  color: var(--el-text-color-primary);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.content-card {
  border: none !important;
  box-shadow: none !important;
  padding: 30px;
  border-radius: 4px;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-name {
  font-size: 14px;
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
</style>
