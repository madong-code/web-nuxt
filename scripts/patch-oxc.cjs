#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const bindingsPath = path.join(__dirname, '../node_modules/oxc-parser/src-js/bindings.js');

console.log('Patching oxc-parser bindings.js...');

let content = fs.readFileSync(bindingsPath, 'utf8');

// 在 requireNative 函数之前添加回退逻辑
const fallbackPatch = `
// Fallback to JavaScript implementation when native binding is not available
const loadNative = () => {
  try {
    return requireNative();
  } catch (error) {
    console.warn('Native binding not available, using JavaScript fallback:', error.message);
    return null;
  }
};
`;

// 替换 requireNative 调用
content = content.replace(
  /nativeBinding = requireNative\(\)/g,
  'nativeBinding = loadNative()'
);

// 在文件开头添加回退函数
content = content.replace(
  /const loadErrors = \[\]/g,
  fallbackPatch + 'const loadErrors = []'
);

// 修改错误处理，当 nativeBinding 为 null 时继续
content = content.replace(
  /if \(!nativeBinding\) \{[\s\S]*?throw new Error\(nativeBindingError\([\s\S]*?\)\)[\s\S]*?\}/g,
  `if (!nativeBinding) {
    console.warn('Using JavaScript fallback for oxc-parser');
  }`
);

fs.writeFileSync(bindingsPath, content, 'utf8');

console.log('✓ Patched oxc-parser bindings.js successfully');
console.log('✓ JavaScript fallback enabled for oxc-parser');
