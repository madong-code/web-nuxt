<template>
    <el-footer class="md-footer">
        <div>
            Copyright @ 2020~2026版权所有
             <a href="http://beian.miit.gov.cn/">189456784215</a>
        </div>
    </el-footer>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
.md-footer {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    background-color: var(--el-color-info-light-7);
    a {
        color: var(--el-text-color-secondary);
    }
    @media screen and (max-width: 768px) {
        a {
            display: block;
            text-align: center;
        }
    }
}
</style>
