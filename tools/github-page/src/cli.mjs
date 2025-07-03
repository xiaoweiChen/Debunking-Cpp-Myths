// 导入所需模块
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 解析命令行参数
const args = process.argv.slice(2);
let scriptType = null;
const remainingArgs = [];

// 遍历命令行参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-s' && i + 1 < args.length) {
    scriptType = args[i + 1];
    i++; // 跳过下一个参数
  } else {
    remainingArgs.push(args[i]);
  }
}

// 如果未提供脚本类型，显示使用说明并退出
if (!scriptType) {
  console.log('用法: scripts -s <脚本类型> [脚本特定参数]');
  console.log('');
  console.log('可用的脚本类型:');
  console.log('  latex-render    LaTeX 渲染器，将 LaTeX 文件转换为 HTML');
  console.log('');
  console.log('例如:');
  console.log('  scripts -s latex-render -i /path/to/input -o /path/to/output');
  process.exit(1);
}

// 根据脚本类型执行相应的脚本
async function runScript() {
  try {
    switch (scriptType.toLowerCase()) {
      case 'latex-render':
        // 设置正确的参数，然后动态导入并执行 LatexRender 模块
        process.argv = [process.argv[0], process.argv[1], ...remainingArgs];
        await import('./LatexRender/index.mjs');
        break;
        
      default:
        console.error(`错误: 未知的脚本类型 "${scriptType}"`);
        console.log('可用的脚本类型: latex-render');
        process.exit(1);
    }
  } catch (err) {
    console.error('执行脚本时发生错误:', err);
    process.exit(1);
  }
}

runScript().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
}); 