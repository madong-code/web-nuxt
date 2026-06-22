<template>
  <div class="member-points">
    <h2 class="page-title">{{ t('member.points.page_title') }}</h2>
    <el-card class="points-card">
      <div class="points-summary">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="points-item">
              <div class="points-label">{{ t('member.points.current_points') }}</div>
              <div class="points-value">{{ pointsTotal.current_points }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="points-item">
              <div class="points-label">{{ t('member.points.monthly_points') }}</div>
              <div class="points-value">{{ pointsTotal.monthly_points }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="points-item">
              <div class="points-label">{{ t('member.points.total_points') }}</div>
              <div class="points-value">{{ pointsTotal.total_points }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div class="points-list">
        <el-table :data="pointsRecords" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" :label="t('member.points.record_id')" width="200" />
          <el-table-column prop="type" :label="t('member.points.type')" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.type === 1 ? 'success' : 'danger'">
                {{ scope.row.type === 1 ? t('member.points.type_earn') : t('member.points.type_deduct') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="points" :label="t('member.points.points')" width="100">
            <template #default="scope">
              <span :class="scope.row.type === 1 ? 'text-success' : 'text-danger'">
                {{ scope.row.type === 1 ? '+' : '-' }}{{ scope.row.points }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" :label="t('member.points.reason')" />
          <el-table-column prop="created_at" :label="t('member.points.time')" width="180">
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
import { ref, reactive, onMounted } from 'vue'
import { getPointTransactions, getMemberPointsTotal } from '~/api/member'
import { timeFormat } from '~/utils/common'

// 积分概览数据
const pointsTotal = reactive({
  current_points: 0,
  monthly_points: 0,
  total_points: 0
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

// 积分记录数据
const pointsRecords = ref([])

// 获取积分总额
const fetchPointsTotal = async () => {
  try {
    const res: any = await getMemberPointsTotal()
    if (res) {
      pointsTotal.current_points = res.current_points || 0
      pointsTotal.monthly_points = res.monthly_points || 0
      pointsTotal.total_points = res.total_points || 0
    }
  } catch (error) {
    console.error('获取积分总额失败', error)
  }
}

// 获取积分记录
const fetchPointsRecords = async () => {
  loading.value = true
  try {
    const res: any = await getPointTransactions({
      page: currentPage.value,
      limit: pageSize.value
    })
    if (res) {
      pointsRecords.value = res.items || []
      total.value = res.total || 0
    }
  } catch (error) {
    console.error('获取积分记录失败', error)
  } finally {
    loading.value = false
  }
}

// 分页方法
const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchPointsRecords()
}

const handleCurrentChange = (current: number) => {
  currentPage.value = current
  fetchPointsRecords()
}

// 初始化
onMounted(() => {
  fetchPointsTotal()
  fetchPointsRecords()
})
</script>

<style scoped>
.member-points {
  padding: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.points-card {
  margin-bottom: 20px;
  border: none !important;
  box-shadow: none !important;
  padding: 30px;
  border-radius: 4px;
  /* background-color: #ffffff; */
}

.points-summary {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.points-item {
  text-align: center;
}

.points-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.points-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.points-list {
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
