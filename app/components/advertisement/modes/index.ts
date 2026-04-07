import type { Component } from 'vue'

// 内置模式
import SimpleMode from './simple.vue'
import FloatMode from './float.vue'

// 动态加载自定义模式
const customModes: Record<string, Component> = {
  simple: SimpleMode,
  float: FloatMode
}

// 注册自定义模式
export const registerMode = (name: string, component: Component) => {
  customModes[name] = component
}

// 获取模式组件
export const getModeComponent = (modeName: string): Component | undefined => {
  return customModes[modeName]
}

// 获取所有可用模式
export const getAvailableModes = (): string[] => {
  return Object.keys(customModes)
}
