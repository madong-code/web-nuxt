/**
 * 文件上传模块相关类型定义
 */

/** 上传响应 */
export interface UploadResponse {
    url: string
    path: string
    name: string
    size: number
    mime_type: string
    /** 扩展字段，上传成功的标识 */
    success: boolean
}

/** 图片上传参数 */
export interface ImageUploadParams {
    file: File
    /** 图片压缩质量 (0-100)，默认 80 */
    quality?: number
}

/** 视频上传参数 */
export interface VideoUploadParams {
    file: File
}

/** 文件上传参数 */
export interface FileUploadParams {
    file: File
}
