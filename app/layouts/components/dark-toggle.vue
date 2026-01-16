<template>
  <button class="inline-flex justify-center items-center" @click="toggleDark">
    <div class="i-ri-sun-line dark:i-ri-moon-line" />
  </button>
</template>

<script setup lang="ts">
const color = useColorMode()


function toggleDark() {
  color.preference = color.value === 'dark' ? 'light' : 'dark'
}
</script>
