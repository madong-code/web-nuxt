<template>
  <div class="md-footer">
    <div class="footer-content">
      <!-- 友情链接区域 -->
      <div v-if="links.length > 0" class="footer-links-section">
        <span class="footer-links-title">友情链接</span>
        <div class="footer-links-container">
          <a
            v-for="link in links"
            :key="link.id"
            :href="link.url"
            :target="link.target || '_blank'"
            class="footer-link"
            rel="noopener noreferrer"
          >
            <img
              v-if="link.logo"
              :src="link.logo"
              :alt="link.name"
              class="footer-link-logo"
            />
            <span class="footer-link-text">{{ link.name }}</span>
            <span v-if="link.description" class="footer-link-desc">{{ link.description }}</span>
          </a>
        </div>
      </div>
      
      <!-- 版权区域 -->
      <div class="footer-copyright">
        <div class="copyright-text">
          {{ configStore.siteSetting?.site_copyright || `© ${new Date().getFullYear()} ${configStore.siteSetting?.site_name || 'madong'}` }}
        </div>
        <div 
          v-if="configStore.siteSetting?.site_record_no || configStore.siteSetting?.site_network_security" 
          class="copyright-links"
        >
          <a 
            v-if="configStore.siteSetting?.site_record_no" 
            :href="configStore.siteSetting?.site_icp_url || 'https://beian.miit.gov.cn/'" 
            target="_blank"
            rel="noopener noreferrer"
            class="copyright-link"
          >
            {{ configStore.siteSetting?.site_record_no }}
          </a>
          <a 
            v-if="configStore.siteSetting?.site_network_security" 
            :href="configStore.siteSetting?.site_network_security_url" 
            target="_blank"
            rel="noopener noreferrer"
            class="copyright-link"
          >
            {{ configStore.siteSetting?.site_network_security }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from '~/stores/config'
import { getLinks } from '~/api/site'

const configStore = useConfigStore()
const links = ref<any[]>([])

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
  width: 100%;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  text-align: left;
  color: var(--el-text-color-primary);
}

// 友情链接区域样式
.footer-links-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 20px;
  margin-bottom: 30px;

  .footer-links-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    flex-shrink: 0;
  }

  .footer-links-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0;
  }

  .footer-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0;
    margin-right: 20px;
    color: var(--el-text-color-regular);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s ease;

    &:hover {
      color: var(--el-color-primary);

      .footer-link-desc {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
    }
  }

  .footer-link-logo {
    height: 18px;
    width: auto;
    max-width: 100px;
    object-fit: contain;
    margin-right: 6px;
    flex-shrink: 0;
    vertical-align: middle;
  }

  .footer-link-text {
    font-size: 14px;
  }

  .footer-link-desc {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8px);
    transform: translateX(-50%) translateY(4px);
    padding: 6px 10px;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: var(--el-border-color-lighter);
    }
  }
}

// 版权区域样式
.footer-copyright {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  text-align: left;

  .copyright-text {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.8;
  }

  .copyright-links {
    display: flex;
    align-items: center;
    justify-content: flex-start;
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
    gap: 0;
  }

  .footer-link {
    font-size: 13px;
    margin-right: 12px;
  }

  .copyright-links {
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }
}
</style>
