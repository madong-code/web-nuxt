/**
 * 向后兼容导出
 * 新的请求客户端实现在 ~/api/request.ts
 * 所有模块从 ~/api/request 导入以获得更好类型支持
 */
export { default } from '~/api/request'
export type { ConfigOption } from '~/api/request'
export { sse, requestSSE, postSSE } from '~/api/request'
export type { SseEventHandlers, SseConnection } from '~/api/request'
