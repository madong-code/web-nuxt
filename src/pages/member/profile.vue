<template>
  <div class="user-views">
    <el-card class="user-views-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>个人资料</span>
        </div>
      </template>
      <div class="profile-content">
        <ProfileComponent />
      </div>
    </el-card>

    <el-card class="user-views-card" shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>用户设置</span>
        </div>
      </template>
      <div class="settings-content">
        <SettingsComponent />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ProfileComponent from './components/profile/index.vue'
import SettingsComponent from './components/settings/index.vue'
</script>

<style scoped lang="scss">
.user-views {
  padding: 20px;
}

.user-views-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-content {
  padding: 10px 0;
}

.settings-content {
  padding: 10px 0;
}
</style>
