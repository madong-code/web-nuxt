<template>
  <div class="icon-selector">
    <div
      class="select"
      @click="handleClick"
      :style="{ width: props.width }"
      :class="[size, { 'is-disabled': disabled }, { 'has-icon': selectValue }]"
    >
      <div class="icon">
        <Icon v-show="selectValue" :icon="selectValue" />
      </div>
      <div class="text">{{ props.text }}</div>
      <div class="arrow">
        <Icon icon="ant-design:down-outlined" class="arrow-icon" />
        <Icon icon="ant-design:close-outlined" @click.stop="clearIcon" class="clear-icon" />
      </div>
    </div>

    <el-dialog title="选择图标" width="40%" v-model="visible" align-center>
      <el-tabs v-model="activeTab">
        <el-tab-pane v-for="prefix in iconifyPrefixs" :key="prefix" :label="prefix" :name="prefix">
          <el-scrollbar height="400px">
            <el-input v-model="searchText" placeholder="请输入图标名称"></el-input>
            <ul class="icons-list" style="margin-top: 10px">
              <li
                v-for="icon in paginatedIconifyList"
                :key="icon"
                @click="selectorIconifyIcon(icon)"
              >
                <i class="iconfont-sys">
                  <Icon :icon="icon" />
                </i>
              </li>
            </ul>
            <el-pagination
              v-if="filteredIconifyList.length > iconifyPageSize"
              layout="prev, pager, next"
              :total="filteredIconifyList.length"
              :page-size="iconifyPageSize"
              v-model:current-page="iconifyCurrentPage"
              size="small"
              style="margin-top: 10px; justify-content: center"
            />
          </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="Svg图标" name="svg">
          <el-scrollbar height="400px">
            <ul class="icons-list">
              <li v-for="icon in svgList" :key="icon" @click="selectorIconifyIcon(icon)">
                <i class="iconfont-sys">
                  <Icon :icon="icon" />
                </i>
              </li>
            </ul>
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="visible = false">取 消</el-button>
          <el-button type="primary" @click="visible = false">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { listIcons } from '@iconify/vue'
import { fetchIconsData } from '~/utils/icon-utils'
import Icon from './iconify.vue'

defineOptions({ name: 'ArtIconSelector' })

const searchText = ref('')
const activeTab = ref('ant-design')
const iconifyCurrentPage = ref(1)
const iconifyPageSize = ref(60)

const svgList = computed(() => {
  return listIcons('', 'svg')
})

const iconifyMap = reactive<any>({})
const iconifyPrefixs = ['ant-design', 'carbon', 'ic', 'lucide', 'ep', 'ri']

const iconifyList = computed(() => {
  return iconifyMap[activeTab.value]
})

onMounted(() => {
  iconifyPrefixs.forEach((prefix: any) => {
    fetchIconsData(prefix).then((icons) => {
      iconifyMap[prefix] = icons
    })
  })
})

watchDebounced(
  () => activeTab.value,
  () => {
    if (iconifyPrefixs.includes(activeTab.value)) {
      fetchIconsData(activeTab.value).then((icons) => {
        iconifyMap[activeTab.value] = icons
      })
    }
  }
)

const filteredIconifyList = computed<string[]>(() => {
  if (!searchText.value) {
    return iconifyList.value || []
  }
  return (iconifyList.value || []).filter((icon: any) => icon.includes(searchText.value))
})

const paginatedIconifyList = computed<string[]>(() => {
  const start = (iconifyCurrentPage.value - 1) * iconifyPageSize.value
  const end = start + iconifyPageSize.value
  return filteredIconifyList.value.slice(start, end)
})

type ComponentSize = 'large' | 'default' | 'small'

interface Props {
  iconType?: any
  modelValue?: string
  text?: string
  width?: string
  size?: ComponentSize
  disabled?: boolean
}

interface Emits {
  'update:modelValue': [value: string]
  getIcon: [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  iconType: '',
  modelValue: '',
  text: '图标选择器',
  width: '200px',
  size: 'default',
  disabled: false
})

const emits = defineEmits<Emits>()

const selectValue = ref<string>(props.modelValue)
const visible = ref<boolean>(false)

watch(
  () => props.modelValue,
  (newVal: string) => {
    selectValue.value = newVal
  },
  { immediate: true }
)

watch(searchText, () => {
  iconifyCurrentPage.value = 1
})

const selectorIconifyIcon = (icon: string): void => {
  selectValue.value = icon
  visible.value = false
  emits('update:modelValue', icon)
  emits('getIcon', icon)
}

const handleClick = () => {
  if (!props.disabled) {
    visible.value = true
  }
}

const clearIcon = () => {
  selectValue.value = ''
  emits('update:modelValue', '')
  emits('getIcon', '')
}
</script>

<style lang="scss" scoped>
.icon-selector {
  display: inline-block;
}

.select {
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--el-fill-color-blank);

  &:hover {
    border-color: var(--el-color-primary);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      border-color: var(--el-border-color);
    }
  }

  &.has-icon {
    .text {
      display: none;
    }
  }

  &.large {
    height: 40px;
  }

  &.default {
    height: 32px;
  }

  &.small {
    height: 24px;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
  }

  .text {
    flex: 1;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .arrow {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--el-text-color-placeholder);

    .arrow-icon {
      font-size: 12px;
    }

    .clear-icon {
      font-size: 12px;
      cursor: pointer;

      &:hover {
        color: var(--el-color-danger);
      }
    }
  }
}

.icons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    .iconfont-sys {
      font-size: 24px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
