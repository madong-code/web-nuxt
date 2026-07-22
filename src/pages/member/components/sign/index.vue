<template>
<el-card class="sign-in" shadow="never">
  <!-- 标题和操作区 -->
  <div class="sign-in__header flex justify-between items-center mb-2">
    <h3 class="text-base font-semibold" style="color: var(--el-text-color-primary)">
      {{ t('member.sign.page_title') }}
    </h3>
    <div class="sign-in__actions flex gap-2">
      <el-button text size="small" @click="showRules">{{ t('member.sign.sign_rules') }}</el-button>
      <el-button
        type="primary"
        :disabled="isSignedToday || isLoading"
        @click="signInAction"
        size="small"
      >
        <el-icon v-if="isLoading"><Loading /></el-icon>
        {{ isSignedToday ? t('member.sign.signed') : t('member.sign.sign_button') }}
      </el-button>
    </div>
  </div>

  <!-- 签到提示 -->
  <div
    v-if="showTip"
    class="sign-in__tip"
    :style="{
      backgroundColor: 'var(--el-color-success-light-9)',
      border: '1px solid var(--el-color-success-light-5)',
      color: 'var(--el-color-success-dark-2)',
    }"
  >
    <div class="flex justify-between items-center">
      <span class="text-sm">{{ t('member.sign.tomorrow_points', { points: tomorrowPoints }) }}</span>
      <el-button text size="small" @click="closeTip">×</el-button>
    </div>
  </div>

  <!-- 分隔线 -->
  <div class="sign-in__divider" :style="{ borderTop: '1px solid var(--el-border-color-light)' }" />

  <!-- 日历导航 -->
  <div class="sign-in__calendar-header flex justify-between items-center mb-2">
    <div class="flex items-center gap-2">
      <el-button text size="small" @click="prevMonth">‹</el-button>
      <span class="text-sm" style="color: var(--el-text-color-regular)">
        {{ currentYear }}年{{ currentMonth }}月
      </span>
      <el-button text size="small" @click="nextMonth">›</el-button>
    </div>
    <span class="text-sm" style="color: var(--el-color-primary)">
      {{ t('member.sign.consecutive_days') }} {{ consecutiveDays }} {{ t('member.sign.days') }}
    </span>
  </div>

  <!-- 日历 -->
  <div class="sign-in__calendar">
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th
            v-for="day in weekdays"
            :key="day"
            class="w-10 h-8 text-center text-xs"
            style="color: var(--el-text-color-secondary)"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(week, index) in calendarWeeks" :key="index">
          <td v-for="(date, dayIndex) in week" :key="dayIndex" class="h-14 text-center">
            <div
              v-if="date"
              class="sign-in__day"
              :class="dayClass(date)"
              :title="dayTitle(date)"
              @click="handleDayClick(date)"
            >
              {{ date.getDate() }}
            </div>
            <div v-else class="w-10 h-10 mx-auto" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 补签确认弹窗 -->
  <el-dialog
    v-model="reSignDialogVisible"
    :title="t('member.sign.re_sign_title')"
    width="360px"
    :close-on-click-modal="false"
  >
    <div class="text-center">
      <p style="color: var(--el-text-color-regular); margin-bottom: 16px">
        {{ t('member.sign.re_sign_confirm', { date: reSignDateText }) }}
      </p>
      <p class="text-sm" style="color: var(--el-text-color-secondary)">
        {{ t('member.sign.re_sign_hint') }}
      </p>
    </div>
    <template #footer>
      <el-button @click="reSignDialogVisible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="isReSignLoading" @click="doReSign">
        {{ t('member.sign.re_sign_button') }}
      </el-button>
    </template>
  </el-dialog>
</el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { signIn, getSignStatus, getSignCalendar, reSign } from '~/api/member'
import { t } from '~/composables/lang'

// ---- 响应式数据 ----
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const isSignedToday = ref(false)
const consecutiveDays = ref(0)
const showTip = ref(true)
const isLoading = ref(false)
const signedDates = ref<Set<string>>(new Set())

// 补签相关
const reSignDialogVisible = ref(false)
const isReSignLoading = ref(false)
const reSignTargetDate = ref<string>('')

// ---- 常量 ----
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// ---- 计算属性 ----
const tomorrowPoints = computed(() => {
  if (consecutiveDays.value >= 7) return 5
  if (consecutiveDays.value >= 3) return 3
  return 2
})

const reSignDateText = computed(() => reSignTargetDate.value || '')

// 本月最大可补签日期（上月同一天之前不可补签，即只能补签本月）
const maxReSignDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

// 生成日历数据（按周分组）
const calendarWeeks = computed(() => {
  const weeks: (Date | null)[][] = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)

  let firstDayWeekday = firstDay.getDay()
  firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday

  let week: (Date | null)[] = []

  for (let i = 0; i < firstDayWeekday - 1; i++) {
    week.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(currentYear.value, currentMonth.value - 1, day)
    currentDate.setHours(0, 0, 0, 0)
    week.push(currentDate)

    if (week.length === 7) {
      weeks.push([...week])
      week = []
    }
  }

  while (week.length > 0 && week.length < 7) {
    week.push(null)
  }
  if (week.length === 7) {
    weeks.push(week)
  }

  return weeks
})

// ---- 日期格式化工具 ----
const toDateStr = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getTodayStr = (): string => {
  const now = new Date()
  return toDateStr(now)
}

// ---- 日期判定方法 ----
const isToday = (date: Date): boolean => toDateStr(date) === getTodayStr()

const isSigned = (date: Date): boolean => signedDates.value.has(toDateStr(date))

const canReSign = (date: Date): boolean => {
  const dateStr = toDateStr(date)
  const todayStr = getTodayStr()
  // 只能补签本月、今天之前、未签到的日期，且非当月模式不能跨月补签
  if (currentYear.value !== new Date().getFullYear() || currentMonth.value !== new Date().getMonth() + 1) return false
  if (dateStr >= todayStr) return false
  if (isSigned(date)) return false
  // 补签日期必须与已签到日期相邻
  const prevDay = formatAdjacentDate(dateStr, -1)
  const nextDay = formatAdjacentDate(dateStr, 1)
  if (!signedDates.value.has(prevDay) && !signedDates.value.has(nextDay)) return false
  return true
}

// 计算相邻日期字符串
const formatAdjacentDate = (dateStr: string, offset: number): string => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + offset)
  return toDateStr(d)
}

// ---- 样式计算 ----
const dayClass = (date: Date) => {
  const signed = isSigned(date)
  const today = isToday(date)
  const resignable = canReSign(date)

  return {
    'sign-in__day--signed': signed,
    'sign-in__day--today': today && !signed,
    'sign-in__day--normal': !today && !signed,
    'sign-in__day--resignable': resignable,
  }
}

const dayTitle = (date: Date): string => {
  const dateStr = toDateStr(date)
  if (isSigned(date)) return t('member.sign.signed_hint', { date: dateStr })
  if (canReSign(date)) return t('member.sign.re_sign_hint_day', { date: dateStr })
  return dateStr
}

// ---- 事件处理 ----
const handleDayClick = (date: Date) => {
  if (isLoading.value || reSignDialogVisible.value) return
  if (!canReSign(date)) return

  reSignTargetDate.value = toDateStr(date)
  reSignDialogVisible.value = true
}

const showRules = () => {
  ElMessage.info(t('member.sign.rules_content'))
}

const signInAction = async () => {
  try {
    isLoading.value = true
    const data: any = await signIn()
    isSignedToday.value = true
    consecutiveDays.value = data.continuous_days || data.continuousDays || 0
    ElMessage.success(t('member.sign.sign_success', { points: data.points || 0 }))
    await fetchSignCalendar()
  } catch (_error: any) {
    // 错误消息已由 request 拦截器统一处理
  } finally {
    isLoading.value = false
  }
}

const doReSign = async () => {
  if (!reSignTargetDate.value) return
  try {
    isReSignLoading.value = true
    const data: any = await reSign({ sign_date: reSignTargetDate.value })
    ElMessage.success(t('member.sign.re_sign_success', { date: reSignTargetDate.value }))
    // 刷新日历和状态
    await fetchSignStatus()
    await fetchSignCalendar()
    reSignDialogVisible.value = false
  } catch (_error: any) {
    // 错误消息已由 request 拦截器统一处理
  } finally {
    isReSignLoading.value = false
  }
}

const closeTip = () => {
  showTip.value = false
}

const prevMonth = async () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  await fetchSignCalendar()
}

const nextMonth = async () => {
  const now = new Date()
  // 不能超过当前月份
  if (currentYear.value === now.getFullYear() && currentMonth.value >= now.getMonth() + 1) return
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  await fetchSignCalendar()
}

// ---- API 调用 ----
const fetchSignStatus = async () => {
  try {
    const data: any = await getSignStatus()
    isSignedToday.value = data.is_signed_today ?? data.todaySigned ?? false
    consecutiveDays.value = data.continuous_days ?? data.continuousDays ?? 0
  } catch (error: any) {
    console.error('获取签到状态失败:', error)
    ElMessage.error(error.message || t('member.sign.get_sign_status_failed'))
  }
}

const fetchSignCalendar = async () => {
  try {
    const result: any = await getSignCalendar(currentYear.value, currentMonth.value)
    signedDates.value.clear()
    const calendar = result?.calendar || result?.data || []
    calendar.forEach((date: string) => {
      signedDates.value.add(date)
    })
  } catch (error: any) {
    console.error('获取签到日历失败:', error)
    ElMessage.error(error.message || t('member.sign.get_sign_calendar_failed'))
  }
}

onMounted(async () => {
  await fetchSignStatus()
  await fetchSignCalendar()
})
</script>

<style scoped>
.sign-in__tip {
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
}

.sign-in__divider {
  margin: 12px 0;
}

/* ---- 日期样式（暗黑模式自适应） ---- */
.sign-in__day {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 50%;
  cursor: default;
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
}

/* 已签到 */
.sign-in__day--signed {
  background-color: var(--el-color-success);
  color: #fff;
  font-weight: 500;
  cursor: default;
}

/* 今天未签到 */
.sign-in__day--today {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 普通未签到 */
.sign-in__day--normal {
  color: var(--el-text-color-primary);
}

/* 可补签（悬停样式） */
.sign-in__day--resignable {
  cursor: pointer;
}
.sign-in__day--resignable:hover {
  background-color: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  box-shadow: 0 0 0 1px var(--el-color-warning-light-5);
}
</style>
