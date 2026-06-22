<template>
  <el-footer class="md-footer">
    <div class="footer-content">
      <!-- 友情链接区域 -->
      <div v-if="links.length > 0" class="footer-links-section">
        <h3 class="footer-links-title">友情链接</h3>
        <div class="footer-links-container">
          <a
            v-for="link in links"
            :key="link.id"
            :href="link.url"
            :target="link.target || '_blank'"
            :title="link.name"
            class="footer-link"
            rel="noopener noreferrer"
          >
            <img
              v-if="link.logo"
              :src="link.logo"
              :alt="link.name"
              class="footer-link-logo"
            />
            <span v-else class="footer-link-text">{{ link.name }}</span>
          </a>
        </div>
      </div>
      
      <!-- 版权区域 -->
      <div class="footer-copyright">
        <div class="copyright-text">{{ configStore.siteSetting?.copyright }}</div>
        <div 
          v-if="configStore.siteSetting?.icp || configStore.siteSetting?.network_security" 
          class="copyright-links"
        >
          <a 
            v-if="configStore.siteSetting?.icp" 
            :href="configStore.siteSetting?.icp_url || 'https://beian.miit.gov.cn/'" 
            target="_blank"
            rel="noopener noreferrer"
            class="copyright-link"
          >
            {{ configStore.siteSetting?.icp }}
          </a>
          <a 
            v-if="configStore.siteSetting?.network_security" 
            :href="configStore.siteSetting?.network_security_url" 
            target="_blank"
            rel="noopener noreferrer"
            class="copyright-link"
          >
            {{ configStore.siteSetting?.network_security }}
          </a>
        </div>
      </div>
    </div>
  </el-footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from '~/stores/config'
import { getLinks } from '~/api/site'

const configStore = useConfigStore()
const links = ref([])

// 初始化加载友情链接
onMounted(async () => {
  try {
    const response = await getLinks({ type: 'footer' })
    links.value = response || []
  } catch (error) {
    console.error('获取页脚链接失败:', error)
  }
})
</script>

<script lang="ts">
export default {
  name: 'LayoutFooter'
}
</script>

<style lang="scss" scoped>
.md-footer {
  padding: 40px 0;
}

.footer-content {
  max-width: 1450px;
  width: 100%;
  margin: 0 auto;
}

// 友情链接区域样式
.footer-links-section {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 20px;
  margin-bottom: 30px;

  .footer-links-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 15px;
    margin-top: 0;
  }

  .footer-links-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .footer-link {
    display: inline-flex;
    align-items: center;
    padding: 5px 15px;
    color: var(--el-text-color-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s ease;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .footer-link-logo {
    max-width: 120px;
    max-height: 120px;
    object-fit: contain;
    margin-right: 8px;
  }

  .footer-link-text {
    font-size: 13px;
  }
}

// 版权区域样式
.footer-copyright {
  text-align: left;

  .copyright-text {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.8;
    padding-bottom: 15px;
  }

  .copyright-links {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;

    .copyright-link {
      color: var(--el-text-color-secondary);
      text-decoration: none;
      font-size: 12px;
      transition: color 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

// 响应式设计
@media screen and (max-width: 768px) {
  .footer-links-section {
    margin-bottom: 15px;
    padding-bottom: 15px;
  }

  .footer-links-container {
    gap: 8px;
  }

  .footer-link {
    font-size: 13px;
    padding: 4px 10px;
  }

  .copyright-links {
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }
}
</style>
