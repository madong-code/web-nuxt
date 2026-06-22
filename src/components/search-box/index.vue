<template>
  <div v-if="configStore.search.keyword_enabled" class="search-box">
    <form
      :action="getSearchUrl()"
      method="get"
      target="_blank"
      class="search-form"
      @submit="handleSubmit"
    >
      <input
        v-model="searchKeyword"
        type="text"
        :name="getInputName()"
        :placeholder="placeholder"
        class="search-input"
        @input="handleInput"
      />
      <button type="submit" class="search-button">
        <Icon icon="ant-design:search-outlined" />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '~/components/icon'
import { useConfigStore } from '~/stores/config'

interface Props {
  placeholder?: string
  defaultValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索...',
  defaultValue: ''
})

const emit = defineEmits<{
  search: [keyword: string]
  input: [keyword: string]
}>()

const configStore = useConfigStore()
const searchKeyword = ref(props.defaultValue)

// 获取搜索URL
const getSearchUrl = (): string => {
  if (configStore.search.keyword) {
    // 如果配置了关键字，使用关键字搜索
    return 'https://www.baidu.com/s'
  }
  return '#'
}

// 获取输入框name属性
const getInputName = (): string => {
  if (configStore.search.keyword) {
    return 'wd'  // 百度搜索使用wd参数
  }
  return 'q'
}

// 处理输入事件
const handleInput = () => {
  emit('input', searchKeyword.value)
}

// 处理提交事件
const handleSubmit = (e: Event) => {
  e.preventDefault()
  emit('search', searchKeyword.value)

  // 如果没有配置关键字，阻止默认提交行为
  if (!configStore.search.keyword) {
    e.preventDefault()
  }
}

// 初始化
onMounted(() => {
  // 配置已在 app.vue 或系统初始化时加载
  // 这里不需要额外调用
})
</script>

<style scoped lang="scss">
.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-form {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.search-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-border-color-hover);
  }

  &:focus {
    border-color: var(--el-color-primary);
  }

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.search-button {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background-color: var(--el-color-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--el-color-primary-light-3);
  }

  &:active {
    background-color: var(--el-color-primary-dark-2);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}
</style>
