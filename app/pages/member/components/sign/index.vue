<template>
<el-card class="sign-in">
 <!-- 标题和操作区 -->
    <div class="sign-in__header flex justify-between items-center mb-2">
      <h3 class="text-base font-semibold text-gray-800">{{ t('member.sign.page_title') }}</h3>
      <div class="sign-in__actions flex gap-2">
        <el-button type="text" @click="showRules" size="small">{{ t('member.sign.sign_rules') }}</el-button>
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
    <div v-if="showTip" class="sign-in__tip bg-green-50 border border-green-200 rounded-md p-2 flex justify-between items-center mb-3">
      <span class="text-green-700 text-sm">{{ t('member.sign.tomorrow_points', { points: tomorrowPoints }) }}</span>
      <el-button type="text" size="small" @click="closeTip">×</el-button>
    </div>

    <!-- 分隔线 -->
    <div class="sign-in__divider border-t border-gray-200 my-3"></div>

    <!-- 日历导航 -->
    <div class="sign-in__calendar-header flex justify-between items-center mb-2">
      <div class="flex items-center gap-2">
        <el-button type="text" @click="prevMonth" size="small">‹</el-button>
        <span class="text-gray-700 text-sm">{{ currentYear }}年{{ currentMonth }}月</span>
        <el-button type="text" @click="nextMonth" size="small">›</el-button>
      </div>
      <span class="sign-in__consecutive text-primary text-sm">{{ t('member.sign.consecutive_days') }} {{ consecutiveDays }} {{ t('member.sign.days') }}</span>
    </div>

    <!-- 日历 -->
    <div class="sign-in__calendar">
      <!-- 星期标题和日期表格 -->
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th v-for="day in weekdays" :key="day" class="w-10 h-8 text-center text-gray-500 text-xs">
              {{ day }}
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- 日期行 -->
          <tr v-for="(week, index) in calendarWeeks" :key="index">
            <td v-for="(date, dayIndex) in week" :key="dayIndex" class="h-14 text-center">
              <div 
                v-if="date"
                class="w-10 h-10 mx-auto flex items-center justify-center text-sm rounded-full cursor-pointer transition-colors duration-200"
                :class="{
                    'bg-[#67c23a] text-white font-medium': isSigned(date),
                    'bg-blue-50 text-blue-600': isToday(date) && !isSigned(date),
                    'text-gray-800': !isToday(date) && !isSigned(date)
                  }"
                @mouseenter="!isSigned(date) && $event.target.classList.add('bg-blue-50', 'text-blue-600')"
                @mouseleave="!isSigned(date) && $event.target.classList.remove('bg-blue-50', 'text-blue-600')"
              >
                {{ date.getDate() }}
              </div>
              <div v-else class="w-10 h-10 mx-auto"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
</el-card>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMemberStore } from '~/stores/member'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { signIn, getSignStatus, getSignCalendar } from '~/api/member'

const memberStore = useMemberStore()

// 响应式数据
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const isSignedToday = ref(false)
const consecutiveDays = ref(0)
const showTip = ref(true)
const isLoading = ref(false)
const signedDates = ref<Set<string>>(new Set())

// 计算属性
const weekdays = ['一', '二', '三', '四', '五', '六', '日'] // 以星期一为起始

const tomorrowPoints = computed(() => {
  // 根据连续签到天数计算明天可获得的积分
  if (consecutiveDays.value >= 7) return 5
  if (consecutiveDays.value >= 3) return 3
  return 2
})

// 生成日历数据（按周分组）
const calendarWeeks = computed(() => {
  const weeks = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)  
  // 计算当月第一天是星期几（1-7，1=星期一）
  let firstDayWeekday = firstDay.getDay()
  firstDayWeekday = firstDayWeekday === 0 ? 7 : firstDayWeekday
  
  // 生成日期数组
  let week: (Date | null)[] = []
  
  // 填充月初空白
  for (let i = 0; i < firstDayWeekday - 1; i++) {
    week.push(null)
  }
  
  // 填充当月日期
  for (let day = 1; day <= lastDay.getDate(); day++) {
    // 确保创建日期时设置为当天的开始时间
    const currentDate = new Date(currentYear.value, currentMonth.value - 1, day)
    currentDate.setHours(0, 0, 0, 0)
    week.push(currentDate)
    
    // 每周结束，开始新周
    if (week.length === 7) {
      weeks.push([...week])
      week = []
    }
  }
  
  // 填充月末空白
  while (week.length > 0 && week.length < 7) {
    week.push(null)
  }
  
  // 添加最后一周
  if (week.length === 7) {
    weeks.push(week)
  }
  
  return weeks
})

// 检查日期是否是今天
const isToday = (date: Date) => {
  // 使用固定的日期格式化方法，确保不受时区影响
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`  
  const checkYear = date.getFullYear()
  const checkMonth = String(date.getMonth() + 1).padStart(2, '0')
  const checkDay = String(date.getDate()).padStart(2, '0')
  const checkDateStr = `${checkYear}-${checkMonth}-${checkDay}`  
  console.log('Checking if today:', {
    today: todayStr,
    checkDate: checkDateStr,
    isEqual: todayStr === checkDateStr
  })  
  return todayStr === checkDateStr
}

// 检查日期是否已签到
const isSigned = (date: Date) => {
  // 使用固定的日期格式化方法，确保不受时区影响
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`  
  console.log('Checking if signed:', {
    date: dateStr,
    isSigned: signedDates.value.has(dateStr),
    signedDates: Array.from(signedDates.value)
  })  
  return signedDates.value.has(dateStr)
}

// API 调用
const fetchSignStatus = async () => {
  try {
    const data = await getSignStatus() as any
    isSignedToday.value = data.is_signed_today
    consecutiveDays.value = data.continuous_days
  } catch (error: any) {
    console.error('获取签到状态失败:', error)
    ElMessage.error(error.message || t('member.sign.get_sign_status_failed'))
  }
}

const fetchSignCalendar = async () => {
  try {
    const result = await getSignCalendar(currentYear.value, currentMonth.value) as any
    signedDates.value.clear()
    result.calendar.forEach((date: string) => {
      signedDates.value.add(date)
    })
  } catch (error: any) {
    console.error('获取签到日历失败:', error)
    ElMessage.error(error.message || t('member.sign.get_sign_calendar_failed'))
  }
}

// 方法
const showRules = () => {
  // 显示签到规则
  ElMessage.info(t('member.sign.rules_content'))
}

const signInAction = async () => {
  try {
    isLoading.value = true
    
    const data = await signIn()
    isSignedToday.value = true
    consecutiveDays.value = data.continuous_days
    ElMessage.success(t('member.sign.sign_success', { points: data.points }))
    
    // 更新签到日历
    await fetchSignCalendar()
  } catch (error: any) {
    console.error('签到失败:', error)
    ElMessage.error(error.message || t('member.sign.sign_failed'))
  } finally {
    isLoading.value = false
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
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  await fetchSignCalendar()
}

// 生命周期
onMounted(async () => {
  // 初始化签到状态
  await fetchSignStatus()
  await fetchSignCalendar()
})
</script>
