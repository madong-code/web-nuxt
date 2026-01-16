<template>
    <div>
        <el-config-provider :value-on-clear="() => null" :locale="locale">
            <NuxtLayout>
                <NuxtPage />
            </NuxtLayout>
        </el-config-provider>
    </div>
</template>

<script setup lang="ts">
//@ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
//@ts-ignore
import en from 'element-plus/dist/locale/en.mjs'
import type { Language } from 'element-plus/es/locale'


// modules import mark, Please do not remove.
const systemStore = useSystemStore()
const locale = computed(() => (systemStore.lang === 'zh-cn' ? zhCn : en))




</script>
