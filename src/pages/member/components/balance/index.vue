<template>
  <div class="member-balance">
    <h2 class="page-title">{{ t('member.balance.page_title') }}</h2>
    <el-card class="balance-card">
      <div class="balance-summary">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="balance-item">
              <div class="balance-label">{{ t('member.balance.current_balance') }}</div>
              <div class="balance-value">{{ currentBalance }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="balance-item">
              <div class="balance-label">{{ t('member.balance.total_transaction') }}</div>
              <div class="balance-value">{{ total }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="balance-list">
        <el-table :data="balanceRecords" style="width: 100%" v-loading="loading" height="200">
          <el-table-column prop="type_text" :label="t('member.balance.type')" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.type === 1 ? 'success' : 'danger'">
                {{ scope.row.type_text || (scope.row.type === 1 ? t('member.balance.type_income') : t('member.balance.type_expense')) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" :label="t('member.balance.amount')" width="120">
            <template #default="scope">
              <span :class="scope.row.type === 1 ? 'text-success' : 'text-danger'">
                {{ scope.row.type === 1 ? '+' : '-' }}{{ scope.row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="description" :label="t('member.balance.description')" />
          <el-table-column prop="created_at" :label="t('member.balance.time')" width="180">
            <template #default="scope">
              {{ timeFormat(scope.row.created_at, 'yyyy-mm-dd hh:MM:ss') }}
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getBalanceTransactions, getMemberProfile } from '~/api/member'
import { timeFormat } from '~/utils/common'
import { t } from '~/composables/lang'

const currentBalance = ref(0)
const loading = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const balanceRecords = ref([])

const fetchMemberBalance = async () => {
  try {
    const profile: any = await getMemberProfile()
    currentBalance.value = profile?.balance ?? 0
  } catch {
    // 获取余额失败，使用默认值
  }
}

const fetchBalanceRecords = async () => {
  loading.value = true
  try {
    const res: any = await getBalanceTransactions({
      page: currentPage.value,
      limit: pageSize.value
    })
    if (res) {
      balanceRecords.value = res.items || []
      total.value = res.total || 0
    }
  } catch {
    // 业务异常已由请求层统一拦截提示
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchBalanceRecords()
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  fetchBalanceRecords()
}

onMounted(() => {
  fetchMemberBalance()
  fetchBalanceRecords()
})
</script>

<style scoped>
.member-balance {
  padding: 20px;
  color: var(--el-text-color-primary);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.balance-card {
  margin-bottom: 20px;
  border: none !important;
  box-shadow: none !important;
  padding: 30px;
  border-radius: 4px;
}

.balance-summary {
  margin-bottom: 30px;
  padding: 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

.balance-item {
  text-align: center;
}

.balance-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.balance-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.balance-list {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
