<template>
  <button class="inline-flex justify-center items-center" @click="toggleDark">
    <div class="i-ri-sun-line dark:i-ri-moon-line" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getDark, setDark } from '~/utils/dark'

const isDark = computed(() => getDark())

function toggleDark() {
  setDark(!isDark.value)
}
</script>
