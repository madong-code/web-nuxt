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
              <div class="balance-value">{{ totalTransaction }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="balance-list">
        <el-table :data="balanceRecords" style="width: 100%">
          <el-table-column prop="id" :label="t('member.balance.record_id')" width="100" />
          <el-table-column prop="type" :label="t('member.balance.type')" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'income' ? 'success' : 'danger'">
                {{ scope.row.type === 'income' ? t('member.balance.type_income') : t('member.balance.type_expense') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" :label="t('member.balance.amount')" width="120">
            <template #default="scope">
              <span :class="scope.row.type === 'income' ? 'text-success' : 'text-danger'">
                {{ scope.row.type === 'income' ? '+' : '-' }}{{ scope.row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="description" :label="t('member.balance.description')" />
          <el-table-column prop="created_at" :label="t('member.balance.time')" width="180" />
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
import { ref, reactive } from 'vue'

// 余额概览数据
const currentBalance = ref(8888.88)
const totalTransaction = ref(128888.88)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(80)

// 余额记录数据
const balanceRecords = ref([
  {
    id: 1,
    type: 'income',
    amount: 1000.00,
    description: '充值',
    created_at: '2026-01-30 10:00:00'
  },
  {
    id: 2,
    type: 'expense',
    amount: 199.99,
    description: '购买商品',
    created_at: '2026-01-29 15:30:00'
  },
  {
    id: 3,
    type: 'income',
    amount: 500.00,
    description: '提现',
    created_at: '2026-01-28 09:15:00'
  },
  {
    id: 4,
    type: 'expense',
    amount: 99.00,
    description: '服务费用',
    created_at: '2026-01-27 14:20:00'
  },
  {
    id: 5,
    type: 'income',
    amount: 200.00,
    description: '退款',
    created_at: '2026-01-26 11:45:00'
  }
])

// 分页方法
const handleSizeChange = (size: number) => {
  pageSize.value = size
  // 这里应该重新获取数据
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  // 这里应该重新获取数据
}
</script>

<style scoped>
.member-balance {
  padding: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.balance-card {
  margin-bottom: 20px;
  border: none !important;
  box-shadow: none !important;
  padding: 30px;
  border-radius: 4px;
  background-color: #ffffff;
}

.balance-summary {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.balance-item {
  text-align: center;
}

.balance-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.balance-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.balance-list {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}
</style>
