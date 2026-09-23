/**
 * 文件上传模块 API
 *
 * 对应后端：upload/UploadController
 *
 * 后端支持以下接口：
 *   POST /file/image       - 图片上传
 *   POST /file/video       - 视频上传
 *   POST /file             - 文件上传
 *   POST /file/fetch-image - 远程图片拉取
 *   POST /file/base64-image - Base64 图片上传
 *   POST /file/access-urls  - 按资源 key 批量换取可访问地址
 */
import request from '~/api/request'
import type { UploadResponse } from './types'

/**
 * 上传图片
 */
export function uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/file/image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 上传视频
 */
export function uploadVideo(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/file/video', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 上传文件（通用）
 */
export function uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/file', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 拉取远程图片到本地
 */
export function fetchRemoteImage(data: { url: string }): Promise<string> {
    return request.post('/file/fetch-image', data)
}

/**
 * Base64 图片上传
 */
export function uploadBase64Image(data: { base64: string; filename?: string }): Promise<UploadResponse> {
    return request.post('/file/base64-image', data)
}

/**
 * 按资源 key 批量换取可访问地址
 *
 * 对应后端：POST /api/file/access-urls
 * 公开空间返回访问域名拼接结果；私有空间（非公开读）返回带签名的临时直链。
 *
 * @param keys 资源地址集合（相对路径或本空间域名下的绝对地址）
 */
export function getAccessUrls(keys: string[]): Promise<{ key: string; url: string }[]> {
    return request.post('/file/access-urls', { keys })
}
