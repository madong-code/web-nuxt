<template>
  <div class="member-profile">
    <h2 class="page-title">{{ t('member.profile.page_title') }}</h2>
      <el-form
        :model="profileForm"
        :rules="rules"
        ref="profileFormRef"
        label-width="120px"
      >
        <el-form-item label-width="120px" class="avatar-form-item">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="handleAvatarUpload"
            :disabled="avatarUploading"
            accept="image/jpeg,image/png,image/gif,image/webp"
          >
            <el-avatar :size="96" :src="avatarPreview" class="avatar-uploader-avatar" />
            <div class="avatar-uploader-mask">
              <el-icon class="is-loading" v-if="avatarUploading"><Loading /></el-icon>
              <el-icon v-else><UploadFilled /></el-icon>
              <span>{{ avatarUploading ? t('member.profile.avatar_uploading') : t('member.profile.upload_avatar') }}</span>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item :label="t('member.profile.username')">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        <el-form-item :label="t('member.profile.email')" prop="email">
          <el-input
            v-model="profileForm.email"
            type="email"
            :placeholder="t('member.profile.email_placeholder')"
            disabled
          />
        </el-form-item>
        <el-form-item :label="t('member.profile.phone')">
          <el-input v-model="profileForm.phone" disabled />
        </el-form-item>
        <el-form-item :label="t('member.profile.nickname')" prop="nickname">
          <el-input v-model="profileForm.nickname" :placeholder="t('member.profile.nickname_placeholder')" />
        </el-form-item>
        <el-form-item :label="t('member.profile.gender')">
          <el-radio-group v-model="profileForm.gender">
            <el-radio label="male">{{ t('member.profile.gender_male') }}</el-radio>
            <el-radio label="female">{{ t('member.profile.gender_female') }}</el-radio>
            <el-radio label="other">{{ t('member.profile.gender_other') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('member.profile.birthday')">
          <el-date-picker
            v-model="profileForm.birthday"
            type="date"
            :placeholder="t('member.profile.birthday_placeholder')"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('member.profile.bio')">
          <el-input
            v-model="profileForm.bio"
            type="textarea"
            :rows="3"
            :placeholder="t('member.profile.bio_placeholder')"
          />
        </el-form-item>
        <el-form-item class="form-actions">
          <el-button type="primary" @click="submitProfileForm" class="submit-btn"
            >{{ t('member.profile.save_button') }}</el-button
          >
          <el-button @click="resetProfileForm" class="reset-btn">{{ t('member.profile.reset_button') }}</el-button>
        </el-form-item>
      </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import type { FormInstance, FormRules, UploadRawFile, UploadRequestOptions } from "element-plus";
import { ElMessage } from "element-plus";
import { UploadFilled, Loading } from "@element-plus/icons-vue";
import { updateMemberInfo, uploadAvatar } from "~/api/member";
import { useMemberStore } from "~/stores/member";
import { fullUrl } from "~/utils/common";
import defaultAvatar from "~/assets/images/default_avatar.png";

const memberStore = useMemberStore();
const profileFormRef = ref<FormInstance>();

const profileForm = reactive({
  username: "",
  nickname: "",
  email: "",
  phone: "",
  avatar: "",
  gender: "male",
  birthday: "",
  bio: "",
});

const avatarUploading = ref(false);
const avatarPreview = computed(() =>
  profileForm.avatar ? fullUrl(profileForm.avatar) : defaultAvatar
);

const rules = reactive<FormRules>({
  nickname: [{ required: true, message: t('member.profile.validation.nickname_required'), trigger: "blur" }],
  email: [{ type: "email", message: t('member.profile.validation.email_format'), trigger: "blur" }],
});

onMounted(async () => {
  await memberStore.getMemberInfo();
  initProfileForm();
});

const initProfileForm = () => {
  if (memberStore.info) {
    profileForm.username = memberStore.info.username || "";
    profileForm.nickname = memberStore.info.nickname || "";
    profileForm.email = memberStore.info.email || "";
    profileForm.phone = memberStore.info.phone || "";
    profileForm.avatar = memberStore.info.avatar || "";
    profileForm.gender = memberStore.info.gender === 1? "male": memberStore.info.gender === 2 ? "female": "other";
    profileForm.birthday = memberStore.info.birthday || "";
    profileForm.bio = memberStore.info.bio || "";
  }
};

/** 上传前校验（与后端 MemberService::uploadAvatar 规则一致：jpg/png/gif/webp，≤2MB） */
const beforeAvatarUpload = (rawFile: UploadRawFile) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error(t('member.profile.avatar_type_error'));
    return false;
  }
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error(t('member.profile.avatar_size_error'));
    return false;
  }
  return true;
};

/** 自定义上传：成功后后端已直接更新会员头像，前端刷新 store 同步全局展示 */
const handleAvatarUpload = async (options: UploadRequestOptions) => {
  try {
    avatarUploading.value = true;
    const result = await uploadAvatar(options.file);
    profileForm.avatar = result?.url || "";
    ElMessage.success(t('member.profile.avatar_upload_success'));
    await memberStore.getMemberInfo();
  } catch (error: any) {
    ElMessage.error(error?.message || t('member.profile.avatar_upload_failed'));
  } finally {
    avatarUploading.value = false;
  }
};

const submitProfileForm = async () => {
  if (!profileFormRef.value) return;
  await profileFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        const data = {
          nickname: profileForm.nickname,
          gender:
            profileForm.gender === "male" ? 1 : profileForm.gender === "female" ? 2 : 0,
          birthday: profileForm.birthday,
          bio: profileForm.bio,
        };
        await updateMemberInfo(data);
        ElMessage.success(t('member.profile.update_success'));
        await memberStore.getMemberInfo();
      } catch (error: any) {
        ElMessage.error(error.message || t('member.profile.update_failed'));
      }
    } else {
      console.log("验证失败", fields);
    }
  });
};

const resetProfileForm = () => {
  initProfileForm();
};
</script>

<style scoped>
.member-profile {
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

.avatar-uploader :deep(.el-upload) {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  display: block;
}

.avatar-uploader-avatar {
  display: block;
  transition: opacity 0.2s;
}

.avatar-uploader :deep(.el-upload:hover .avatar-uploader-avatar) {
  opacity: 0.4;
}

.avatar-uploader-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  line-height: 1.2;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-uploader-mask .el-icon {
  font-size: 18px;
}

.avatar-uploader :deep(.el-upload:hover) .avatar-uploader-mask {
  opacity: 1;
}

.profile-card {
  max-width: 600px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.submit-btn {
  flex: 1;
}

.reset-btn {
  flex: 1;
}
</style>
