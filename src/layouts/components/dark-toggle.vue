<template>
  <button class="inline-flex justify-center items-center" @click="toggleDark">
    <div class="i-ri-sun-line dark:i-ri-moon-line" />
  </button>
</template>

<script setup lang="ts">
import { toggleDarkWithTransition } from '~/utils/dark'

function toggleDark(e: MouseEvent) {
  toggleDarkWithTransition(e)
}
</script>
