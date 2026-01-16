<template>
    <div class="page-container">
        <!-- 轮播图区域 -->
        <section class="hero-section">
            <el-carousel height="500px" arrow="never" indicator-position="none">
                <el-carousel-item>
                    <div class="hero-background"></div>
                </el-carousel-item>
            </el-carousel>
        </section>
        
        <!-- 主要内容区域  -->
        <section class="content-section">
            <div class="content-container">
                <!-- 标题区域 -->
                <div class="section-header">
                    <h1 class="section-title">文档管理</h1>
                    <p class="section-subtitle">无论是快速上手，还是深入了解框架，这里都是最好的地点</p>
                </div>
                
                <!-- 功能卡片区域 -->
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-header">
                            <div class="feature-icon">
                                <img src="@/assets/images/index/course.jpg" alt="官方教程" />
                            </div>
                            <h3 class="feature-title">官方教程</h3>
                        </div>
                        <p class="feature-description">详尽细致的逐步官方教程，帮助您系统全面地接触Madong，建议在使用前阅读。</p>
                        <NuxtLink to="https://doc.niucloud.com/v6" target="_blank" class="feature-link">
                            <el-button type="primary" class="w-full">
                                <span>前往教程</span>
                                <el-icon class="ml-2"><ArrowRight /></el-icon>
                            </el-button>
                        </NuxtLink>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-header">
                            <div class="feature-icon">
                                <img src="@/assets/images/index/api.jpg" alt="API文档" />
                            </div>
                            <h3 class="feature-title">API文档</h3>
                        </div>
                        <p class="feature-description">通过API文档了解niucloud的正确使用方法，深入理解其运行逻辑和接口规范。</p>
                        <div class="feature-link">
                            <el-button type="primary" class="w-full" disabled>
                                <span>前往API文档</span>
                                <el-icon class="ml-2"><ArrowRight /></el-icon>
                            </el-button>
                        </div>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-header">
                            <div class="feature-icon">
                                <img src="@/assets/images/index/community.jpg" alt="问答社区" />
                            </div>
                            <h3 class="feature-title">问答社区</h3>
                        </div>
                        <p class="feature-description">浏览其他用户的问题和解答，获取使用技巧，遇到问题也可以随时提问交流。</p>
                        <NuxtLink to="https://www.niushop.com/bbs.html" target="_blank" class="feature-link">
                            <el-button type="primary" class="w-full">
                                <span>前往问答社区</span>
                                <el-icon class="ml-2"><ArrowRight /></el-icon>
                            </el-button>
                        </NuxtLink>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-header">
                            <div class="feature-icon">
                                <img src="@/assets/images/index/wx.jpg" alt="关注公众号" />
                            </div>
                            <h3 class="feature-title">关注公众号</h3>
                        </div>
                        <p class="feature-description">您可以扫描页面底部的二维码来关注我们的官方公众号，获得一手咨询及使用技巧。</p>
                        <div class="feature-link">
                            <el-button type="info" class="w-full" plain>
                                <span>查看二维码</span>
                                <el-icon class="ml-2"><ChatDotRound /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script lang="ts" setup>
import { ArrowRight, ChatDotRound } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.page-container {
    min-height: 100vh;
    background: #ffffff;
}

.hero-section {
    width: 100%;
    
    .el-carousel {
        border-radius: 0;
    }
    
    .hero-background {
        height: 500px;
        background-image: url('@/assets/images/index/index_carousel.jpeg');
        background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
    }
}

.content-section {
    background-image: url('@/assets/images/index/section.png');
    background-size: 100%;
    background-repeat: no-repeat;
    padding: 60px 0 200px;
}

.content-container {
    max-width: 1400px; // 增加整体宽度以容纳4个容器
    margin: 0 auto;
    padding: 0 40px; // 增加边距以适应更宽的内容
}

.section-header {
    text-align: center;
    margin-bottom: 100px;
    
    .section-title {
        font-size: 40px;
        font-weight: bold;
        color: #666666;
        margin-bottom: 20px;
        line-height: 1.2;
    }
    
    .section-subtitle {
        font-size: 16px;
        color: #666666;
        line-height: 1.5;
    }
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr); // PC端固定4列
    gap: 30px; // 调整间距以适应4列布局
    justify-content: center;
}

.feature-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 25px; // 调整内边距以适应更小的容器
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
    
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }
}

.feature-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px; // 调整间距
    
    .feature-icon {
        width: 28px; // 稍微缩小图标
        height: 28px;
        margin-right: 10px;
        
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
        }
    }
    
    .feature-title {
        font-size: 18px; // 稍微缩小标题字体
        font-weight: bold;
        color: #666666;
        margin: 0;
    }
}

.feature-description {
    font-size: 13px; // 稍微缩小描述字体
    color: #666666;
    line-height: 20px;
    margin-bottom: 25px;
    min-height: 80px; // 调整最小高度
}

.feature-link {
    display: block;
    
    .el-button {
        border-radius: 6px;
        height: 36px; // 调整按钮高度
        font-size: 13px; // 调整按钮字体
        
        :deep(.el-icon) {
            font-size: 14px; // 调整图标大小
        }
    }
}

// 平板端适配 (768px - 1024px)
@media (max-width: 1024px) and (min-width: 769px) {
    .content-container {
        max-width: 100%;
        padding: 0 30px;
    }
    
    .features-grid {
        grid-template-columns: repeat(2, 1fr); // 平板端显示2列
        gap: 25px;
    }
    
    .section-header {
        margin-bottom: 80px;
        
        .section-title {
            font-size: 36px;
        }
    }
}

// 移动端适配 (768px以下)
@media (max-width: 768px) {
    .content-container {
        max-width: 100%;
        padding: 0 20px;
    }
    
    .section-header {
        margin-bottom: 60px;
        
        .section-title {
            font-size: 32px;
        }
    }
    
    .features-grid {
        grid-template-columns: 1fr; // 移动端显示1列
        gap: 20px;
    }
    
    .feature-card {
        padding: 20px;
    }
    
    .hero-section .hero-background {
        height: 300px;
    }
    
    .content-section {
        padding: 40px 0 120px;
    }
    
    .feature-header {
        .feature-icon {
            width: 30px;
            height: 30px;
        }
        
        .feature-title {
            font-size: 18px;
        }
    }
    
    .feature-description {
        font-size: 14px;
        min-height: auto; // 移动端取消固定高度
    }
}

// 超大屏幕适配 (1400px以上)
@media (min-width: 1400px) {
    .content-container {
        max-width: 1400px;
    }
}

// 小屏幕手机适配 (480px以下)
@media (max-width: 480px) {
    .content-container {
        padding: 0 16px;
    }
    
    .section-header {
        margin-bottom: 40px;
        
        .section-title {
            font-size: 28px;
        }
        
        .section-subtitle {
            font-size: 14px;
        }
    }
    
    .features-grid {
        gap: 16px;
    }
    
    .feature-card {
        padding: 16px;
    }
}
</style>