import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// 单一入口配置，cli.mjs 作为唯一入口点
export default {
  input: 'src/cli.mjs',
  output: {
    file: './dist/scripts.mjs',
    format: 'esm',
    banner: '#!/usr/bin/env node', // 确保脚本可执行
    inlineDynamicImports: true, // 内联动态导入
  },
  plugins: [
    nodeResolve({ preferBuiltins: true }), // 解析第三方模块
    commonjs(), // 将 CommonJS 模块转换为 ES 模块
  ],
};