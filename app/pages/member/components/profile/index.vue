<template>
  <div class="member-profile">
    <h2 class="page-title">{{ t('member.profile.page_title') }}</h2>
      <el-form
        :model="profileForm"
        :rules="rules"
        ref="profileFormRef"
        label-width="120px"
      >
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
import { ref, reactive, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { updateMemberInfo } from "~/api/member";
import { useMemberStore } from "~/stores/member";

const memberStore = useMemberStore();
const profileFormRef = ref<FormInstance>();

const profileForm = reactive({
  username: "",
  nickname: "",
  email: "",
  phone: "",
  gender: "male",
  birthday: "",
  bio: "",
});

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
    profileForm.gender = memberStore.info.gender === 1? "male": memberStore.info.gender === 2 ? "female": "other";
    profileForm.birthday = memberStore.info.birthday || "";
    profileForm.bio = memberStore.info.bio || "";
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
