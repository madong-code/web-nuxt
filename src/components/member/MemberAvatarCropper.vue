<template>
  <!-- 文件选择器置于弹窗外部：支持弹窗未开启时由外部（如公共头部头像）直接唤起 -->
  <input
    ref="inputRef"
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
    class="mc-file-input"
    @change="onFileChange"
  >

  <el-dialog
    v-model="visible"
    :title="t('member.profile.avatar_crop_title')"
    width="min(420px, calc(100vw - 32px))"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    append-to-body
    class="member-avatar-cropper"
    @closed="resetState"
  >
    <!-- 步骤一：选择图片（点击 / 拖拽） -->
    <div
      v-if="!imgUrl"
      class="mc-drop"
      :class="{ 'is-dragover': dragover }"
      tabindex="0"
      role="button"
      :aria-label="t('member.profile.avatar_drop_tip')"
      @click="pick"
      @keydown.enter="pick"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      @drop.prevent="onDrop"
    >
      <ImagePlus class="mc-drop-icon" aria-hidden="true" />
      <p class="mc-drop-text">{{ t('member.profile.avatar_drop_tip') }}</p>
      <p class="mc-drop-hint">{{ t('member.profile.avatar_type_error') }} · ≤ 2MB</p>
    </div>

    <!-- 步骤二：预览 + 裁剪（拖动平移 / 滚轮或滑块缩放） -->
    <template v-else>
      <div
        ref="viewportRef"
        class="mc-viewport"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <img
          class="mc-img"
          :src="imgUrl"
          alt=""
          draggable="false"
          :style="{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }"
        >
        <!-- 圆形裁剪遮罩：中心 1px 透明十字对齐参考 -->
        <div class="mc-mask" aria-hidden="true" />

        <!-- 上传中遮罩（进度反馈：提交期间禁止交互与关闭） -->
        <div v-if="uploading" class="mc-uploading">
          <LoaderCircle class="mc-uploading-icon" aria-hidden="true" />
          <span>{{ t('member.profile.avatar_uploading') }}</span>
        </div>
      </div>

      <div class="mc-zoom">
        <ZoomOut class="mc-zoom-icon" aria-hidden="true" />
        <el-slider
          v-model="zoomPercent"
          :min="100"
          :max="800"
          :step="1"
          class="mc-zoom-slider"
          :aria-label="t('member.profile.avatar_crop_title')"
        />
        <ZoomIn class="mc-zoom-icon" aria-hidden="true" />
      </div>

      <p class="mc-tip">{{ t('member.profile.avatar_crop_tip') }}</p>
    </template>

    <template #footer>
      <div class="mc-footer">
        <el-button v-if="imgUrl" text :disabled="uploading" @click="reselectFile">
          {{ t('member.profile.avatar_reselect') }}
        </el-button>
        <el-button :disabled="uploading" @click="visible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :disabled="!imgUrl"
          :loading="uploading"
          @click="confirmCrop"
        >
          {{ uploading ? t('member.profile.avatar_uploading') : t('member.profile.avatar_crop_confirm') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 会员头像裁剪上传（框架层组件，个人中心核心依赖，不依赖任何第三方插件）：
 * - 完整流程：图片选择（点击/拖拽/外部唤起）→ 预览 → 裁剪（拖动平移 + 滚轮/滑块缩放）
 *   → 上传提交（按钮 loading + 视口遮罩反馈，上传中禁止关闭弹窗）→ 成功/失败 ElMessage
 * - 裁剪为原生 Canvas 实现（零新增依赖）：输出 512×512 PNG，圆形预览遮罩仅为视觉参考
 * - 上传默认走 ~/api/member 的 uploadAvatar（multipart 直传，后端同步更新会员头像）；
 *   可经 upload prop 替换为自定义上传函数
 * - pick() 暴露给宿主：未开弹窗即可唤起系统文件选择器，选中后自动进入预览
 * - 成功后 emit('success', result) 交宿主刷新会员状态，本组件不直接改全局 store
 */
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { ImagePlus, LoaderCircle, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { uploadAvatar, type AvatarUploadResult } from '~/api/member'

defineOptions({ name: 'MemberAvatarCropper' })

const props = withDefaults(
    defineProps<{
        /** 上传函数（缺省使用框架 uploadAvatar 接口） */
        upload?: (file: File) => Promise<AvatarUploadResult>
    }>(),
    { upload: undefined },
)

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    /** 上传成功，返回接口结果（url/filename） */
    (e: 'success', result: AvatarUploadResult): void
}>()

const visible = defineModel<boolean>({ default: false })

/* ===== 状态 ===== */
const inputRef = ref<HTMLInputElement>()
const viewportRef = ref<HTMLElement>()
const imgUrl = ref('')
const dragover = ref(false)
const uploading = ref(false)

/** 原图尺寸 */
const imgWidth = ref(0)
const imgHeight = ref(0)
/** 缩放基准（cover 适配视口的最小缩放） */
const baseScale = ref(1)
/** 当前缩放（绝对值） */
const scale = ref(1)
/** 图片左上角相对视口的偏移（px） */
const offset = ref({ x: 0, y: 0 })

/** 缩放滑块（百分比，100 = cover 基准） */
const zoomPercent = computed({
    get: () => Math.round((scale.value / baseScale.value) * 100),
    set: (v: number) => applyZoom((v / 100) * baseScale.value),
})

let sourceFile: File | null = null
let objectUrl: string | null = null
let panStart: { x: number; y: number; ox: number; oy: number } | null = null

/* ===== 选择图片 ===== */
/** 供外部（公共头部头像等）直接唤起系统文件选择器，选中后自动打开裁剪弹窗 */
const pick = () => inputRef.value?.click()
const reselectFile = () => {
    clearImage()
    pick()
}

defineExpose({ pick })

/** 上传中禁止关闭（右上角 X / ESC / 遮罩均拦截），避免提交过程被打断 */
const handleBeforeClose = (done: () => void) => {
    if (!uploading.value) done()
}

const onFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) loadImage(file)
}

const onDrop = (e: DragEvent) => {
    dragover.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) loadImage(file)
}

/** 校验并加载图片（与后端 MemberService::uploadAvatar 规则一致：jpg/png/gif/webp，≤2MB） */
const loadImage = (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
        ElMessage.error(t('member.profile.avatar_type_error'))
        return
    }
    if (file.size / 1024 / 1024 > 2) {
        ElMessage.error(t('member.profile.avatar_size_error'))
        return
    }
    clearImage()
    sourceFile = file
    objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
        imgWidth.value = img.naturalWidth
        imgHeight.value = img.naturalHeight
        imgUrl.value = objectUrl!
        // 等待视口渲染后按 cover 初始化；外部唤起（弹窗未开）时自动进入预览
        requestAnimationFrame(initView)
        visible.value = true
    }
    img.onerror = () => {
        ElMessage.error(t('member.profile.avatar_crop_failed'))
        clearImage()
    }
    img.src = objectUrl
}

/** cover 适配：缩放至铺满视口并居中 */
const initView = () => {
    const v = viewportRect()
    baseScale.value = Math.max(v / imgWidth.value, v / imgHeight.value) || 1
    scale.value = baseScale.value
    offset.value = {
        x: (v - imgWidth.value * scale.value) / 2,
        y: (v - imgHeight.value * scale.value) / 2,
    }
}

const viewportRect = () => viewportRef.value?.getBoundingClientRect().width || 280

/* ===== 平移 / 缩放 ===== */
const clampOffset = () => {
    const v = viewportRect()
    const w = imgWidth.value * scale.value
    const h = imgHeight.value * scale.value
    offset.value = {
        x: Math.min(0, Math.max(v - w, offset.value.x)),
        y: Math.min(0, Math.max(v - h, offset.value.y)),
    }
}

const applyZoom = (next: number) => {
    const v = viewportRect()
    const min = baseScale.value
    const target = Math.min(Math.max(next, min), min * 8)
    // 以视口中心为锚点缩放：缩放前后中心指向的图像点保持一致
    const cx = v / 2
    offset.value = {
        x: cx - ((cx - offset.value.x) / scale.value) * target,
        y: cx - ((cx - offset.value.y) / scale.value) * target,
    }
    scale.value = target
    clampOffset()
}

const onWheel = (e: WheelEvent) => {
    if (!imgUrl.value) return
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    applyZoom(scale.value * factor)
}

const onPointerDown = (e: PointerEvent) => {
    if (!imgUrl.value) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    panStart = { x: e.clientX, y: e.clientY, ox: offset.value.x, oy: offset.value.y }
}

const onPointerMove = (e: PointerEvent) => {
    if (!panStart) return
    offset.value = {
        x: panStart.ox + (e.clientX - panStart.x),
        y: panStart.oy + (e.clientY - panStart.y),
    }
    clampOffset()
}

const onPointerUp = (e: PointerEvent) => {
    if (panStart) (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    panStart = null
}

/* ===== 裁剪 + 上传 ===== */
const confirmCrop = async () => {
    if (!imgUrl.value || !sourceFile || uploading.value) return
    uploading.value = true
    try {
        const v = viewportRect()
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error('decode failed'))
            img.src = imgUrl.value
        })

        // 视口中心对应的源图方形裁剪区（与预览遮罩一致）
        const cropSize = Math.min(
            v / scale.value,
            img.naturalWidth,
            img.naturalHeight,
        )
        const sx = Math.min(
            Math.max((v / 2 - offset.value.x) / scale.value - cropSize / 2, 0),
            img.naturalWidth - cropSize,
        )
        const sy = Math.min(
            Math.max((v / 2 - offset.value.y) / scale.value - cropSize / 2, 0),
            img.naturalHeight - cropSize,
        )

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('canvas unavailable')
        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 512, 512)

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png'),
        )
        if (!blob) throw new Error('encode failed')

        const base = sourceFile.name.replace(/\.[^.]+$/, '') || 'avatar'
        const file = new File([blob], `${base}.png`, { type: 'image/png' })

        const result = await (props.upload ?? uploadAvatar)(file)
        ElMessage.success(t('member.profile.avatar_upload_success'))
        emit('success', result)
        visible.value = false
    } catch (error: any) {
        ElMessage.error(error?.message || t('member.profile.avatar_upload_failed'))
    } finally {
        uploading.value = false
    }
}

/* ===== 清理 ===== */
const clearImage = () => {
    if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
    }
    imgUrl.value = ''
    sourceFile = null
    panStart = null
}

const resetState = () => {
    clearImage()
    dragover.value = false
    uploading.value = false
}

onBeforeUnmount(clearImage)

// 打开时聚焦文件选择由用户主动点击触发（浏览器手势链限制不做自动弹出）
watch(visible, (v) => {
    if (!v) return
    if (!imgUrl.value) {
        scale.value = 1
        offset.value = { x: 0, y: 0 }
    }
})
</script>

<style lang="scss" scoped>
.mc-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 240px;
  padding: 24px;
  border: 1.5px dashed var(--el-border-color);
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  outline: none;

  &:hover,
  &:focus-visible,
  &.is-dragover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
}

.mc-drop-icon {
  width: 36px;
  height: 36px;
}

.mc-drop-text {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.mc-drop-hint {
  margin: 0;
  font-size: 12px;
  opacity: 0.75;
}

.mc-viewport {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-darker);
  cursor: grab;
  touch-action: none;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.mc-img {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
  pointer-events: none;
}

/* 圆形裁剪参考遮罩：closest-side 渐变 = 内切圆（视口恒为正方形） */
.mc-mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle closest-side at center,
    transparent 0 calc(100% - 1.5px),
    rgba(0, 0, 0, 0.45) 100%
  );
}

/* 上传中遮罩：覆盖视口，阻断交互并给出进行中反馈 */
.mc-uploading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 13px;
}

.mc-uploading-icon {
  width: 22px;
  height: 22px;
  animation: mc-spin 0.9s linear infinite;
}

@keyframes mc-spin {
  to {
    transform: rotate(360deg);
  }
}

.mc-zoom {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 0 8px;
}

.mc-zoom-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--el-text-color-secondary);
}

.mc-zoom-slider {
  flex: 1;
}

.mc-tip {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.mc-file-input {
  display: none;
}

.mc-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
