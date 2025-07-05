#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 解析命令行参数
const args = process.argv.slice(2);
let inputDir = null;
let outputDir = null;

// 遍历命令行参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-i' && i + 1 < args.length) {
    inputDir = args[i + 1];
    i++; // 跳过下一个参数，因为它是输入目录路径
  } else if (args[i] === '-o' && i + 1 < args.length) {
    outputDir = args[i + 1];
    i++; // 跳过下一个参数，因为它是输出目录路径
  }
}

// 如果未提供参数，显示使用说明并退出
if (!inputDir || !outputDir) {
  console.log('用法: LatexRender -i <输入目录> -o <输出目录>');
  console.log('  -i <目录>  指定包含LaTeX文件的输入目录');
  console.log('  -o <目录>  指定HTML输出目录');
  process.exit(1);
}

// 确保输入路径是绝对路径
inputDir = path.resolve(process.cwd(), inputDir);
outputDir = path.resolve(process.cwd(), outputDir);

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = inputDir;
const bookDir = path.join(rootDir, 'book');
const contentDir = path.join(bookDir, 'content');
const distDir = outputDir;

// 记录已处理的文件，避免重复处理
const processedFiles = new Set();

// MathJax
const mathjaxConfig = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    tags: 'ams'
  },
  svg: {
    fontCache: 'global'
  }
};

// CSS for the HTML output
const cssContent = `
:root {
  --background-color: #ffffff;
  --text-color: #333333;
  --code-bg-color: #f5f5f5;
  --link-color: #0366d6;
  --highlight-color: #0366d6;
  --border-color: #eee;
  --table-border-color: #ddd;
  --table-header-bg: #f2f2f2;
  --blockquote-color: #666;
  --blockquote-border: #ddd;
  --part-header-bg: #f8f8f8;
  --footer-text-color: #666;
  --filename-bg: #f5f5f5;
  --nav-bg: #f5f5f5;
  --nav-hover-bg: #e6e6e6;
  --toc-bg: #f8f8f8;
  --highlight-section-bg: #f8f8f8;
  --highlight-section-border: #0366d6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #1a1a1a;
    --text-color: #e6e6e6;
    --code-bg-color: #2d2d2d;
    --link-color: #58a6ff;
    --highlight-color: #58a6ff;
    --border-color: #333;
    --table-border-color: #444;
    --table-header-bg: #2d2d2d;
    --blockquote-color: #aaa;
    --blockquote-border: #444;
    --part-header-bg: #222;
    --footer-text-color: #aaa;
    --filename-bg: #2d2d2d;
    --nav-bg: #2d2d2d;
    --nav-hover-bg: #444;
    --toc-bg: #222;
    --highlight-section-bg: #2d2d2d;
    --highlight-section-border: #58a6ff;
  }
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: "Noto Serif CJK SC", "Source Han Serif SC", "Source Han Serif CN", serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.language-shell {
  background-color: #1e1e1e;
  color: #f8f8f8;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

a {
  color: var(--link-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

th, td {
  border: 1px solid var(--table-border-color);
  padding: 8px;
  text-align: left;
}

th {
  background-color: var(--table-header-bg);
}

blockquote {
  border-left: 4px solid var(--blockquote-border);
  padding-left: 1em;
  margin-left: 0;
  color: var(--blockquote-color);
}

.part-header {
  background-color: var(--part-header-bg);
  padding: 15px;
  margin: 30px 0;
  border-left: 5px solid var(--highlight-color);
}

.chapter-title {
  font-size: 1.8em;
  margin-top: 2em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5em;
}

.section-title {
  color: var(--highlight-color);
}

.toc {
  background-color: var(--toc-bg);
  padding: 15px;
  margin: 20px 0;
  border-radius: 5px;
}

.toc ul {
  list-style-type: none;
  padding-left: 20px;
}

.toc li {
  margin: 5px 0;
}

.toc a {
  text-decoration: none;
}

.book-cover {
  max-width: 300px;
  display: block;
  margin: 20px auto;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.subtitle {
  font-size: 1.2em;
  color: var(--footer-text-color);
  font-style: italic;
  text-align: center;
  margin: 10px 0;
}

.author-info {
  text-align: center;
  margin: 20px 0;
}

.author-info p {
  margin: 8px 0;
  font-size: 1.1em;
}

.author-info a {
  color: var(--link-color);
  text-decoration: none;
}

.author-info a:hover {
  text-decoration: underline;
}

.tikz-figure {
  display: none;
}

.filename {
  font-weight: bold;
  margin: 15px 0 5px 0;
  background-color: var(--filename-bg);
  padding: 8px;
  border-left: 3px solid var(--highlight-color);
  font-family: "Hack", Consolas, Monaco, "Andale Mono", monospace;
}

.footnote-text {
  font-size: 0.85em;
  color: var(--footer-text-color);
  margin: 10px 0;
}

.list-item {
  margin: 5px 0;
  padding-left: 20px;
  position: relative;
}

code {
  font-family: "Hack", Consolas, Monaco, "Andale Mono", monospace;
  background-color: var(--code-bg-color);
  border-radius: 3px;
}

.code-marker {
  display: inline-block;
  background-color: #ffeb3b;
  color: #000;
  margin: 0 2px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.9em;
}

.language-cpp {
  color: var(--text-color);
  font-family: "Hack", Consolas, Monaco, "Andale Mono", monospace;
}

.language-rust {
  color: var(--text-color);
  font-family: "Hack", Consolas, Monaco, "Andale Mono", monospace;
}

.footnote {
  font-size: 0.85em;
  vertical-align: super;
  color: var(--link-color);
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin: 30px 0;
  padding: 15px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.navigation a {
  text-decoration: none;
  padding: 8px 15px;
  background-color: var(--nav-bg);
  border-radius: 4px;
  color: var(--link-color);
}

.navigation a:hover {
  background-color: var(--nav-hover-bg);
}

.back-to-toc {
  text-align: center;
  margin: 20px 0;
}

.highlight-section {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-size: 1.2em;
  font-weight: bold;
  color: var(--highlight-color);
  padding-left: 10px;
  border-left: 3px solid var(--highlight-section-border);
  background-color: var(--highlight-section-bg);
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: var(--code-bg-color);
  color: var(--text-color);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1000;
}

.theme-toggle:hover {
  background-color: var(--nav-hover-bg);
}

footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
  color: var(--footer-text-color);
  text-align: center;
}

.tip-box.note {
  border-left: 4px solid #007acc; /* 蓝色左边框 */
  background-color: #e7f3ff;       /* 浅蓝背景 */
  color: #004080;
  padding: 12px 20px;
  margin: 15px 0;
  border-radius: 4px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.5;
  position: relative;
}

.tip-box.tip {
  border-left: 4px solid #28a745; /* 绿色左边框 */
  background-color: #e6f4ea;      /* 淡绿色背景 */
  color: #215c2a;                 /* 深绿色文本 */
  padding: 12px 20px;
  margin: 15px 0;
  border-radius: 4px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.5;
  position: relative;
}

.tip-box.note strong {
  display: block;
  font-size: 1.1em;
  margin-bottom: 10px;
}

.image-block {
  text-align: center;
  margin: 1em 0;
}

.image-block img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.image-block .caption {
  display: block;
  margin-top: 8px;
  font-size: 0.95em;
  color: #555;
}
`;

const themeToggleScript = `
  document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', '切换主题');
    themeToggle.innerHTML = '🌓';
    document.body.appendChild(themeToggle);
    
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 添加深色和浅色主题的样式
    const darkThemeStyle = document.createElement('style');
    const lightThemeStyle = document.createElement('style');
    
    darkThemeStyle.textContent = \`
      body.dark-theme {
        --background-color: #1a1a1a;
        --text-color: #e6e6e6;
        --code-bg-color: #2d2d2d;
        --link-color: #58a6ff;
        --highlight-color: #58a6ff;
        --border-color: #333;
        --table-border-color: #444;
        --table-header-bg: #2d2d2d;
        --blockquote-color: #aaa;
        --blockquote-border: #444;
        --part-header-bg: #222;
        --footer-text-color: #aaa;
        --filename-bg: #2d2d2d;
        --nav-bg: #2d2d2d;
        --nav-hover-bg: #444;
        --toc-bg: #222;
        --highlight-section-bg: #2d2d2d;
        --highlight-section-border: #58a6ff;
      }
    \`;
    
    lightThemeStyle.textContent = \`
      body.light-theme {
        --background-color: #ffffff;
        --text-color: #333333;
        --code-bg-color: #f5f5f5;
        --link-color: #0366d6;
        --highlight-color: #0366d6;
        --border-color: #eee;
        --table-border-color: #ddd;
        --table-header-bg: #f2f2f2;
        --blockquote-color: #666;
        --blockquote-border: #ddd;
        --part-header-bg: #f8f8f8;
        --footer-text-color: #666;
        --filename-bg: #f5f5f5;
        --nav-bg: #f5f5f5;
        --nav-hover-bg: #e6e6e6;
        --toc-bg: #f8f8f8;
        --highlight-section-bg: #f8f8f8;
        --highlight-section-border: #0366d6;
      }
    \`;
    
    document.head.appendChild(darkThemeStyle);
    document.head.appendChild(lightThemeStyle);
    
    // 检查本地存储中的设置
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
    } else if (currentTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      // 如果没有保存的偏好，跟随系统
      if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.add('light-theme');
      }
    }
    
    themeToggle.addEventListener('click', function() {
      if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
      }
    });
    
    // 确保代码高亮正确运行
    if (window.Prism) {
      window.Prism.highlightAll();
    } else {
      // 如果Prism还没加载，等待它加载完成
      const prismReady = setInterval(function() {
        if (window.Prism) {
          window.Prism.highlightAll();
          clearInterval(prismReady);
        }
      }, 100);
    }
  });
`;

/**
 * Simple LaTeX to HTML converter
 * This is a basic implementation - for complex documents, using a proper LaTeX to HTML
 * converter like LaTeXML or pandoc would be better
 */
function convertLatexToHtml(latex) {
  // Replace LaTeX commands with HTML equivalents
  let html = latex || '';

  html = html.replace(/^\\begin\{longtable\}.*$/gm, '\\begin{longtable}');
  html = html.replace(/\\verb(.)(.+?)\1/g, '<code>$2</code>');
  html = html.replace(/\\#/g, '#')

  html = convertItemizeToHtml(html);
  html = convertEnumerateToHtml(html);

  html = html.replace(/\\myGraphic\{([\d.]+)\}\{(.*?)\}\{(.*?)\}/g, (match, scale, path, caption) => {
    const percentage = parseFloat(scale) * 100;

    return `
    <div class="image-block" style="text-align: center;">
      <div><img src="${path}" style="width: ${percentage}%;" alt="${caption}"></div>
      <div class="caption">${caption}</div>
    </div>`;
  });

  html = html.replace(/\\begin\{myNotic\}\{(.*?)\}([\s\S]*?)\\end\{myNotic\}/g, (match, title, content) => {
    // 处理内部的 itemize 转成 ul/li
    let innerHtml = content
      .replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (m, itemsContent) => {
        const items = itemsContent.match(/\\item\s+([^\n\\]+)/g)?.map(i => i.replace(/\\item\s+/, '').trim()) || [];
        return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      });
    
    // 其余换行转 <p>
    innerHtml = innerHtml
      .split(/\n{2,}/)  // 连续空行分段
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p}</p>`)
      .join('');

    return `<div class="tip-box note"><strong>${title}</strong>${innerHtml}</div>`;
  });

  html = html.replace(/\\begin\{myTip\}\{(.*?)\}([\s\S]*?)\\end\{myTip\}/g, (match, title, content) => {
    // 处理内部的 itemize 转成 ul/li
    let innerHtml = content
      .replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (m, itemsContent) => {
        const items = itemsContent.match(/\\item\s+([^\n\\]+)/g)?.map(i => i.replace(/\\item\s+/, '').trim()) || [];
        return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      });
    
    // 其余换行转 <p>
    innerHtml = innerHtml
      .split(/\n{2,}/)  // 连续空行分段
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p}</p>`)
      .join('');

    return `<div class="tip-box tip"><strong>${title}</strong>${innerHtml}</div>`;
  });

  // 步骤1：先保护转义的美元符号
  const protectedEscapedDollars = [];
  html = html.replace(/\\\$/g, (match) => {
    const placeholder = `__PROTECTED_ESCAPED_DOLLAR_${protectedEscapedDollars.length}__`;
    protectedEscapedDollars.push(match);
    return placeholder;
  });

  // 步骤2：保护转义的百分号
  const protectedPercents = [];
  html = html.replace(/\\%/g, (match) => {
    const placeholder = `__PROTECTED_PERCENT_${protectedPercents.length}__`;
    protectedPercents.push(match);
    return placeholder;
  });

  // 步骤3：Remove LaTeX comments (现在可以安全地移除 % 注释了)
  html = html.replace(/%.*$/gm, '');

  // Remove tikzpicture environments
  html = html.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, '<div class="tikz-figure"></div>');

  // 处理 \begin{longtable} 表格
  html = html.replace(/\\begin\{longtable\}\s*([\s\S]*?)\\end\{longtable\}/g, function (_, rawContent) {
    // 清理辅助结构和注释
    let content = rawContent
      .replace(/\\endfirsthead[\s\S]*?\\endhead/g, '')
      .replace(/\\multicolumn\{.*?\}\{.*?\}\{.*?\}\s*\\\\/g, '')
      .replace(/\\hline/g, '');
    
    // 先保护转义的百分号，然后删除注释，最后恢复
    content = content
      .replace(/\\%/g, 'TEMP_ESCAPED_PERCENT')
      .replace(/%.*$/gm, '')
      .replace(/TEMP_ESCAPED_PERCENT/g, '\\%')
      .trim();
    
    // 清理表格列格式声明（如 {|l|l|}, {l|r|c} 等）
    content = content.replace(/^\s*\{[|lcr\s]*\}\s*/gm, '');
    
    // 先处理特殊字符，避免在分割时造成问题
    // 临时标记 AT\&T，避免 \& 被当作分隔符处理
    content = content.replace(/AT\\&T/g, 'TEMP_ATT_MARKER');
    
    // 临时标记单元格内的 \\（换行符），先转换成特殊标记
    // 这里我们需要区分行尾的 \\ 和单元格内的 \\
    // 将不在行尾的 \\ 标记为换行符
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
      // 查找行内的 \\，但不包括行尾的 \\
      return line.replace(/\\\\(?!\s*$)/g, 'TEMP_LINEBREAK_MARKER');
    });
    content = processedLines.join('\n');

    // 拆分为行（按行尾的 \\ 分割）
    const rows = content
      .split(/\\\\\s*/)
      .map(row => row.trim())
      .filter(row => row.length > 0);

    // 构造 HTML 表格
    let htmlTable = '<table border="1">\n';
    let headerParsed = false;

    for (const row of rows) {
      // 分割单元格，临时替换 \& 避免误分割
      const tempRow = row.replace(/\\&/g, 'TEMP_ESCAPED_AMP');
      const columns = tempRow.split('&').map(col => {
        // 恢复 \&
        return col.replace(/TEMP_ESCAPED_AMP/g, '\\&').trim();
      });

      if (!headerParsed) {
        htmlTable += '  <thead>\n    <tr>\n';
        for (const col of columns) {
          let content = col.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
          
          // 恢复临时标记
          content = content.replace(/TEMP_ATT_MARKER/g, 'AT&T');
          content = content.replace(/TEMP_LINEBREAK_MARKER/g, '<br>');
          
          // 处理其他 AT&T 形式
          content = content.replace(/AT\\&T/g, 'AT&T');  // 处理剩余的 AT\&T
          content = content.replace(/\bATT\b/g, 'AT&T');   // 处理独立的 ATT
          
          // 删除 tabular 环境标签
          content = content.replace(/\\begin\{tabular\}\[c\]\{@\{\}l@\{\}\}/g, '');
          content = content.replace(/\\end\{tabular\}/g, '');
          
          // 处理特殊字符，但保留数学公式中的 $
          content = content.replace(/\\\$/g, '&#36;');
          content = content.replace(/\\%/g, '&#37;');
          content = content.replace(/\\_/g, '&#95;');
          content = content.replace(/\\{/g, '&#123;');
          content = content.replace(/\\}/g, '&#125;');
          
          htmlTable += `      <th>${content}</th>\n`;
        }
        htmlTable += '    </tr>\n  </thead>\n  <tbody>\n';
        headerParsed = true;
      } else {
        htmlTable += '    <tr>\n';
        for (const col of columns) {
          let content = col;
          
          // 恢复临时标记
          content = content.replace(/TEMP_ATT_MARKER/g, 'AT&T');
          content = content.replace(/TEMP_LINEBREAK_MARKER/g, '<br>');
          
          // 处理其他 AT&T 形式
          content = content.replace(/AT\\&T/g, 'AT&T');  // 处理剩余的 AT\&T
          content = content.replace(/\bATT\b/g, 'AT&T');   // 处理独立的 ATT
          
          // 删除 tabular 环境标签
          content = content.replace(/\\begin\{tabular\}\[c\]\{@\{\}l@\{\}\}/g, '');
          content = content.replace(/\\end\{tabular\}/g, '');
          
          // 处理特殊字符，但保留数学公式中的 $
          content = content.replace(/\\\$/g, '&#36;');
          content = content.replace(/\\%/g, '&#37;');
          content = content.replace(/\\_/g, '&#95;');
          content = content.replace(/\\{/g, '&#123;');
          content = content.replace(/\\}/g, '&#125;');
          
          htmlTable += `      <td>${content}</td>\n`;
        }
        htmlTable += '    </tr>\n';
      }
    }

    htmlTable += '  </tbody>\n</table>\n';
    return htmlTable;
  });

  // 处理自定义章节命令
  html = html.replace(/\\mySubsubsection\{(.*?)\}\{(.*?)\}/g, '<h4>$1 $2</h4>');
  html = html.replace(/\\mySubsection\{(.*?)\}\{(.*?)\}/g, '<h3>$1 $2</h3>');
  html = html.replace(/\\mySubsectionNoFile\{(.*?)\}\{(.*?)\}/g, '<h3>$1$2</h3>');

  // 处理文件名命令
  html = html.replace(/\\filename\{(.*?)\}/g, '<div class="filename">$1</div>');

  // 处理自定义小节命令
  html = html.replace(/\\mySamllsection\{(.*?)\}/g, '<h4 class="highlight-section">$1</h4>');

  // 处理花括号中的特殊标记
  html = html.replace(/\{(分析|解决|问题|建议)\}/g, '<h4 class="highlight-section">$1</h4>');

  // HTML转义函数
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
  }

  // 处理C++代码环境
  html = html.replace(/\\begin\{cpp\}([\s\S]*?)\\end\{cpp\}/g, (match, code) => {
    // 去掉每一行开头和结尾的空格，并删除空行
    const lines = code.split(/\r?\n/).map(line => line.trimEnd());

    // 过滤掉空行（全为空或仅包含空格）
    const nonEmptyLines = lines.filter(line => line.trim() !== '');

    // 合并为最终代码块字符串
    const cleanedCode = nonEmptyLines.join('\n');

    // 转义 HTML 特殊字符
    const escapedCode = escapeHtml(cleanedCode);

    return `<pre><code class="language-cpp">${escapedCode}</code></pre>`;
  });

  // 处理Rust代码环境
  html = html.replace(/\\begin\{rust\}([\s\S]*?)\\end\{rust\}/g, (match, code) => {
    // 去掉每一行开头和结尾的空格，并删除空行
    const lines = code.split(/\r?\n/).map(line => line.trimEnd());

    // 过滤掉空行（全为空或仅包含空格）
    const nonEmptyLines = lines.filter(line => line.trim() !== '');

    // 合并为最终代码块字符串
    const cleanedCode = nonEmptyLines.join('\n');

    // 转义 HTML 特殊字符
    const escapedCode = escapeHtml(cleanedCode);

    return `<pre><code class="language-rust">${escapedCode}</code></pre>`;
  });

  // 处理字体大小命令
  html = html.replace(/\{\\footnotesize\s+([\s\S]*?)\}/g, '<div class="footnote-text">$1</div>');
  html = html.replace(/\\footnotesize\s+([\s\S]*?)(?=\\|$)/g, '<div class="footnote-text">$1</div>');

  // 处理未在列表环境中的\item - 找出所有独立的item
  const items = [];
  let itemMatch;
  const itemRegex = /\\item\s+([\s\S]*?)(?=\\item|\\|$)/g;

  while ((itemMatch = itemRegex.exec(html)) !== null) {
    // 检查这个\item是否在<ul>或<ol>标签内
    const beforeItem = html.substring(0, itemMatch.index);
    const ulOpenCount = (beforeItem.match(/<ul[^>]*>/g) || []).length;
    const ulCloseCount = (beforeItem.match(/<\/ul>/g) || []).length;
    const olOpenCount = (beforeItem.match(/<ol[^>]*>/g) || []).length;
    const olCloseCount = (beforeItem.match(/<\/ol>/g) || []).length;

    // 如果开标签数量大于闭标签数量，说明\item在列表内
    const inList = (ulOpenCount > ulCloseCount) || (olOpenCount > olCloseCount);

    if (!inList) {
      items.push({
        start: itemMatch.index,
        end: itemMatch.index + itemMatch[0].length,
        content: itemMatch[1]
      });
    }
  }

  // 从后向前替换，这样不会影响前面item的位置
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const replacement = '<div class="list-item">• ' + item.content + '</div>';
    html = html.substring(0, item.start) + replacement + html.substring(item.end);
  }

  // Replace sections and subsections
  html = html.replace(/\\chapter\{(.*?)\}/g, '<h1 class="chapter-title">$1</h1>');
  html = html.replace(/\\section\{(.*?)\}/g, '<h2 class="section-title">$1</h2>');
  html = html.replace(/\\subsection\{(.*?)\}/g, '<h3>$1</h3>');
  html = html.replace(/\\subsubsection\{(.*?)\}/g, '<h4>$1</h4>');

  // Replace center environment
  html = html.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div style="text-align:center">$1</div>');

  // Replace flushright environment
  html = html.replace(/\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}/g, '<div style="text-align:right">$1</div>');

  // Remove sloppypar
  html = html.replace(/\\begin\{sloppypar\}([\s\S]*?)\\end\{sloppypar\}/g, '$1');

  // Replace LaTeX formatting
  html = html.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{(.*?)\}/g, '<em>$1</em>');
  html = html.replace(/\\emph\{(.*?)\}/g, '<em>$1</em>');
  html = html.replace(/\\underline\{(.*?)\}/g, '<u>$1</u>');
  html = html.replace(/\\texttt\{(.*?)\}/g, '<code>$1</code>');

  // 处理 \verb|...| 内联代码（使用管道符作为分隔符，并进行HTML转义）
  html = html.replace(/\\verb\|(.*?)\|/g, (match, content) => {
    // 对内容进行HTML转义
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return `<code>${escapedContent}</code>`;
  });

  // Replace hyperlinks
  html = html.replace(/---/g, '——');
  html = html.replace(/\\href\{(.*?)\}\{(.*?)\}/g, '<a href="$1">$2</a>');
  html = html.replace(/\\url\{(https?:\/\/[^\}]+)\}/g, (match, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
  html = html.replace(/\\hspace\*\{\\fill\}/g, '<br>');

  // Replace code listings
  html = html.replace(/\\begin\{lstlisting\}([\s\S]*?)\\end\{lstlisting\}/g, '<pre><code>$1</code></pre>');
  html = html.replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g, '<pre><code>$1</code></pre>');

  // 处理shell代码块
  html = html.replace(/\\begin\{shell\}([\s\S]*?)\\end\{shell\}/g, (match, content) => {
    // 对内容进行HTML转义，保留所有原始字符（包括尖括号标签）
    let cleanContent = content
      // HTML转义：将 < > & 等特殊字符转换为HTML实体
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // 清理首尾空白
      .trim();
    
    // 如果内容为空，显示注释提示
    if (!cleanContent) {
      cleanContent = '# (此处内容已省略)';
    }
    
    return `<pre><code class="language-shell">${cleanContent}</code></pre>`;
  });
  
  // 处理代码中的##数字标记（将它们转换为HTML注释或行内备注）
  html = html.replace(/(##\s*\d+)/g, '<span class="code-marker">$1</span>');

  // 步骤4：保护数学公式（在特殊字符处理之前）
  const protectedMath = [];
  html = html.replace(/\$([^$]+?)\$/g, (match, mathContent) => {
    const placeholder = `__PROTECTED_MATH_${protectedMath.length}__`;
    protectedMath.push(match);
    return placeholder;
  });

  // Replace LaTeX special characters (注意：不处理转义的$和%，它们已经被保护了)
  html = html.replace(/\\&/g, '&amp;');
  html = html.replace(/\\_/g, '&#95;');
  html = html.replace(/\\{/g, '&#123;');
  html = html.replace(/\\}/g, '&#125;');

  // Replace LaTeX quotation marks
  html = html.replace(/``(.*?)''/g, '&ldquo;$1&rdquo;');
  html = html.replace(/`(.*?)'/g, '&lsquo;$1&rsquo;');

  // Convert LaTeX citations and references
  html = html.replace(/\\cite\{(.*?)\}/g, '[<a href="#ref-$1">$1</a>]');
  html = html.replace(/\\ref\{(.*?)\}/g, '<a href="#$1">ref</a>');

  // Handle images with proper paths
  html = html.replace(/\\includegraphics(?:\[.*?\])?\{(.*?)\}/g, (match, p1) => {
    // 提取图片文件名
    const imgName = path.basename(p1);
    if (imgName === 'cover.png') {
      return `<img src="cover.png" alt="Cover" class="cover-image">`;
    } else {
      return `<img src="images/${imgName}" alt="Figure" class="content-image">`;
    }
  });

  // Handle footnotes
  html = html.replace(/\\footnote\{(.*?)\}/g, '<span class="footnote">$1</span>');

  // Replace LaTeX line breaks
  html = html.replace(/\\\\(\s*)/g, '<br>$1');
  html = html.replace(/\\newline\s*/g, '<br>');

  // Remove page styling commands
  html = html.replace(/\\thispagestyle\{.*?\}/g, '');
  html = html.replace(/\\pagestyle\{.*?\}/g, '');

  // Remove other LaTeX commands that we don't convert
  html = html.replace(/\\newpage/g, '');
  html = html.replace(/\\clearpage/g, '');
  html = html.replace(/\\pagebreak/g, '');
  html = html.replace(/\\setsecnumdepth\{.*?\}/g, '');
  html = html.replace(/\\tableofcontents/g, '');

  // 清理尚未转换的LaTeX命令（但不影响受保护的数学公式）
  html = html.replace(/\\[a-zA-Z]+/g, '');

  // 恢复受保护的数学公式
  protectedMath.forEach((math, index) => {
    html = html.replace(`__PROTECTED_MATH_${index}__`, math);
  });

  // 最后处理保护的特殊字符
  // 恢复转义的百分号
  protectedPercents.forEach((percent, index) => {
    html = html.replace(`__PROTECTED_PERCENT_${index}__`, '&#37;');
  });

  // 恢复转义的美元符号
  protectedEscapedDollars.forEach((dollar, index) => {
    html = html.replace(`__PROTECTED_ESCAPED_DOLLAR_${index}__`, '&#36;');
  });

  // 自动段落包裹处理（保持段落换行）
  html = html.replace(/<p>\s*(.*?)\s*<\/p>/g, '$1');  // 去除已有 <p> 避免重复包裹

  html = html
    .replace(/\r\n/g, '\n')  // 标准化换行符
    .split(/\n{2,}/)  // 按两个及以上换行切分段落
    .map(para => para.trim())
    .filter(para => para.length > 0)
    .map(para => {
      // 跳过本身是 block 标签开头的内容
      if (/^\s*<(h\d|ul|ol|pre|table|div|section|blockquote|img|code|figure|\/)/i.test(para)) {
        return para;
      }
      return `<p>${para}</p>`;
    })
    .join('\n\n');

  return html;
}


function convertEnumerateToHtml(latexText) {
   // 移除多余的空白行和空格
  let text = latexText;
  
  text = text.replace(/\\begin\{enumerate\}/g, '<ol>');
  
  text = text.replace(/\\end\{enumerate\}/g, '</ol>');
  
  text = text.replace(/\\item\s*\n?(.*?)(?=\\item|\\begin|\\end|$)/gs, (match, content) => {
    // 清理内容：移除首尾空白，但保留必要的换行
    const cleanContent = content;
    if (cleanContent) {
      return `  <li>${cleanContent}</li>`;
    } else {
      return '  <li></li>';
    }
  });
  
  // 美化输出：添加适当的缩进
  let lines = text.split('\n');
  let indentLevel = 0;
  let result = [];
  
  for (let line of lines) {
    if (!line) continue;
    
    if (line.includes('</ol>')) {
      indentLevel--;
    }
    
    const indent = '  '.repeat(indentLevel);
    result.push(indent + line);
    
    if (line.includes('<ol>')) {
      indentLevel++;
    }
  }
  
  return result.join('\n');
}

function convertItemizeToHtml(latexText) {
  // 移除多余的空白行和空格
  let text = latexText;
  
  // 替换 \begin{itemize} 为 <ul>
  text = text.replace(/\\begin\{itemize\}/g, '<ul>');
  
  // 替换 \end{itemize} 为 </ul>
  text = text.replace(/\\end\{itemize\}/g, '</ul>');
  
  // 处理 \item，将其后的内容包装在 <li> 标签中
  // 这个正则表达式会匹配 \item 后面的内容，直到下一个 \item、\begin、\end 或字符串结束
  text = text.replace(/\\item\s*\n?(.*?)(?=\\item|\\begin|\\end|$)/gs, (match, content) => {
    // 清理内容：移除首尾空白，但保留必要的换行
    const cleanContent = content;
    if (cleanContent) {
      return `  <li>${cleanContent}</li>`;
    } else {
      return '  <li></li>';
    }
  });
  
  // 美化输出：添加适当的缩进
  let lines = text.split('\n');
  let indentLevel = 0;
  let result = [];
  
  for (let line of lines) {
    if (!line) continue;
    
    if (line.includes('</ul>')) {
      indentLevel--;
    }
    
    const indent = '  '.repeat(indentLevel);
    result.push(indent + line);
    
    if (line.includes('<ul>')) {
      indentLevel++;
    }
  }
  
  return result.join('\n');
}

// Helper function to read a file using the promises API
async function readFileAsync(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return '';
  }
}

// Function to extract book information from README.md
async function extractBookInfoFromReadme() {
  try {
    const readmePath = path.join(rootDir, 'README.md');
    const readmeContent = await readFileAsync(readmePath);
    
    // 提取标题 (第一行的 # 标题)
    const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
    const title = titleMatch[1].trim();

    // 提取副标题 (斜体文本)
    const subtitleMatch = readmeContent.match(/^\*(.+)\*$/m);
    const subtitle = subtitleMatch[1].trim();

    // 提取作者信息
    const authorsMatch = readmeContent.match(/\*\s*作者：(.+)$/m);
    const authors = authorsMatch[1].trim();

    // 提取译者信息
    const translatorMatch = readmeContent.match(/\*\s*译者：(.+)$/m);
    const translator = translatorMatch[1].trim();

    return {
      title,
      subtitle,
      authors,
      translator
    };
  } catch (err) {
    console.error('Error extracting book info from README:', err);
    // 返回默认值
    return null;
  }
}

// 安全提取路径
function safeExtractPath(text) {
  if (!text) return null;

  // 移除可能导致非法路径的字符
  const cleaned = text.replace(/[<>:"\\|?*\x00-\x1F]/g, '');

  // 防止路径穿越
  if (cleaned.includes('..')) {
    return null;
  }

  return cleaned;
}

// 生成唯一的ID
function generateUniqueId(type, arg1, arg2, filePath) {
  // 从文件路径中提取信息
  let fileId = '';
  if (filePath) {
    // 提取文件名部分，比如从 content/part1/chapter2/0.tex 提取 chapter2-0
    const match = filePath.match(/([^\/]+)\/([^\/]+)\.tex$/);
    if (match) {
      fileId = `-${match[1]}-${match[2]}`;
    }
  }

  // 根据类型生成基础ID
  let baseId = '';

  if (type === 'Chapter' || type === 'ChapterNoContents') {
    baseId = arg1.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  } else if (type === 'Subsection') {
    baseId = `${arg1}-${arg2}`.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  } else if (type === 'Part' || type === 'PartGray') {
    baseId = `part-${arg1}-${arg2}`.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }

  return baseId + fileId;
}

// 查找正确的文件路径
async function findCorrectPath(basePath, relativePath) {
  // 尝试几种可能的路径组合
  const possiblePaths = [
    path.join(basePath, relativePath),
    path.join(rootDir, relativePath),
    path.join(bookDir, relativePath)
  ];

  for (const tryPath of possiblePaths) {
    try {
      await fs.access(tryPath);
      console.log(`Found file at: ${tryPath}`);
      return tryPath;
    } catch (err) {
      // 文件不存在，继续尝试下一个路径
    }
  }

  return null;
}

// 处理自定义命令加载章节内容
async function processCustomCommands(content) {
  let processedContent = content;
  let chapterContents = [];

  // 处理 myChapter、mySubsection 等自定义命令
  const commandRegex = /\\my(Chapter|ChapterNoContents|Subsection|Part|PartGray)\{(.*?)\}\{(.*?)\}\{(.*?)\}/g;
  let commandMatch;

  const commandPromises = [];
  const matches = [];

  while ((commandMatch = commandRegex.exec(content)) !== null) {
    const [fullMatch, commandType, arg1, arg2, filePath] = commandMatch;
    matches.push({ fullMatch, commandType, arg1, arg2, filePath });
  }

  for (const match of matches) {
    const { fullMatch, commandType, arg1, arg2, filePath } = match;

    // 安全提取文件路径
    const safePath = safeExtractPath(filePath);
    if (!safePath) continue;

    // 检查文件是否已处理过
    if (processedFiles.has(safePath)) {
      console.log(`Skipping already processed file: ${safePath}`);
      continue;
    }

    // 尝试找到正确的文件路径
    const resolvedPath = await findCorrectPath(bookDir, safePath);

    if (!resolvedPath) {
      console.warn(`Warning: Could not find file for ${safePath}`);
      continue;
    }

    try {
      console.log(`Loading content from: ${resolvedPath}`);
      const chapterContent = await readFileAsync(resolvedPath);

      // 记录此文件已处理
      processedFiles.add(safePath);

      // 生成唯一ID
      const uniqueId = generateUniqueId(commandType, arg1, arg2, safePath);

      // 根据命令类型生成不同的HTML
      let replacement = '';

      switch (commandType) {
        case 'Chapter':
          replacement = `<section id="${uniqueId}" class="chapter">
            <h1 class="chapter-title">${arg1} ${arg2}</h1>
            ${convertLatexToHtml(chapterContent)}
          </section>`;

          chapterContents.push({
            id: uniqueId,
            title: `${arg1} ${arg2}`,
            level: 1,
            content: replacement
          });
          break;

        case 'ChapterNoContents':
          replacement = `<section id="${uniqueId}" class="chapter">
            <h1 class="chapter-title">${arg1}</h1>
            ${convertLatexToHtml(chapterContent)}
          </section>`;

          chapterContents.push({
            id: uniqueId,
            title: arg1,
            level: 1,
            content: replacement
          });
          break;

        case 'Subsection':
          replacement = `<section id="${uniqueId}" class="section">
            <h2 class="section-title">${arg1} ${arg2}</h2>
            ${convertLatexToHtml(chapterContent)}
          </section>`;

          chapterContents.push({
            id: uniqueId,
            title: `${arg1} ${arg2}`,
            level: 2,
            content: replacement
          });
          break;

        case 'Part':
        case 'PartGray':
          replacement = `<div id="${uniqueId}" class="part-header">
            <h1>${arg1}: ${arg2}</h1>
            ${convertLatexToHtml(chapterContent)}
          </div>`;

          chapterContents.push({
            id: uniqueId,
            title: `${arg1}: ${arg2}`,
            level: 0,
            content: replacement
          });
          break;

        default:
          replacement = convertLatexToHtml(chapterContent);
      }

      // 替换原始命令
      processedContent = processedContent.replace(fullMatch, `<div class="placeholder" data-id="${uniqueId}"></div>`);
    } catch (err) {
      console.error(`Error processing custom command for ${resolvedPath}:`, err);
    }
  }

  return { processedContent, chapterContents };
}

async function processTex(filePath, isRoot = false) {
  try {
    console.log(`Processing ${filePath}...`);
    const content = await fs.readFile(filePath, 'utf-8');

    // 处理文件内容
    let processedContent = content;

    // 使用更安全的正则表达式匹配
    // 处理 \include 命令
    const includeRegex = /\\include\{([^{}]+)\}/g;
    let includeMatch;

    while ((includeMatch = includeRegex.exec(content)) !== null) {
      const includePath = safeExtractPath(includeMatch[1]);
      if (!includePath) continue;

      // 尝试找到正确的文件路径
      const resolvedPath = await findCorrectPath(rootDir, includePath);

      if (resolvedPath) {
        try {
          console.log(`Including file: ${resolvedPath}`);
          const includeContent = await readFileAsync(resolvedPath);
          processedContent = processedContent.replace(includeMatch[0], includeContent);
        } catch (err) {
          console.error(`Error including file ${resolvedPath}:`, err);
        }
      } else {
        console.warn(`Warning: Could not find file for ${includePath}`);
      }
    }

    // 处理 \subfile 命令
    const subfileRegex = /\\subfile\{([^{}]+)\}/g;
    let subfileMatch;

    while ((subfileMatch = subfileRegex.exec(processedContent)) !== null) {
      const subfilePath = safeExtractPath(subfileMatch[1]);
      if (!subfilePath) continue;

      // 尝试找到正确的文件路径
      const resolvedPath = await findCorrectPath(rootDir, subfilePath);

      if (resolvedPath) {
        try {
          console.log(`Including subfile: ${resolvedPath}`);
          const subfileContent = await readFileAsync(resolvedPath);
          processedContent = processedContent.replace(subfileMatch[0], subfileContent);
        } catch (err) {
          console.error(`Error including subfile ${resolvedPath}:`, err);
        }
      } else {
        console.warn(`Warning: Could not find file for ${subfilePath}`);
      }
    }

    if (isRoot) {
      // 从根文件中提取文档内容
      const documentMatch = processedContent.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      if (documentMatch) {
        processedContent = documentMatch[1];
      }
    }

    // 处理自定义命令
    const { processedContent: finalContent, chapterContents } = await processCustomCommands(processedContent);

    return { content: finalContent, chapters: chapterContents };
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return { content: '', chapters: [] };
  }
}

// 生成文件名
function generateFilename(chapter) {
  if (!chapter || !chapter.id) return 'unknown.html';
  return `${chapter.id}.html`;
}

// 构建目录
function generateTOC(chapters) {
  if (!chapters || chapters.length === 0) {
    return '<div class="toc"><h2>目录</h2><p>未找到章节内容</p></div>';
  }

  let tocHtml = '<div class="toc"><h2>目录</h2><ul>';

  for (const chapter of chapters) {
    const filename = generateFilename(chapter);

    if (chapter.level === 0) {
      // 部分标题
      tocHtml += `<li class="toc-part"><a href="${filename}">${chapter.title}</a></li>`;
    } else if (chapter.level === 1) {
      // 章节标题
      tocHtml += `<li class="toc-chapter"><a href="${filename}">${chapter.title}</a></li>`;
    } else if (chapter.level === 2) {
      // 小节标题
      tocHtml += `<li class="toc-section" style="margin-left: 20px;"><a href="${filename}">${chapter.title}</a></li>`;
    }
  }

  tocHtml += '</ul></div>';

  return tocHtml;
}

// 创建页面导航
function createNavigation(chapters, currentIndex) {
  let prevLink = '';
  let nextLink = '';
  let tocLink = '<div class="back-to-toc"><a href="index.html">返回目录</a></div>';

  if (currentIndex > 0) {
    const prevChapter = chapters[currentIndex - 1];
    const prevFilename = generateFilename(prevChapter);
    prevLink = `<a href="${prevFilename}" class="prev-link">« 上一章：${prevChapter.title}</a>`;
  } else {
    prevLink = '<span></span>';
  }

  if (currentIndex < chapters.length - 1) {
    const nextChapter = chapters[currentIndex + 1];
    const nextFilename = generateFilename(nextChapter);
    nextLink = `<a href="${nextFilename}" class="next-link">下一章：${nextChapter.title} »</a>`;
  } else {
    nextLink = '<span></span>';
  }

  return `
  <div class="navigation">
    ${prevLink}
    ${nextLink}
  </div>
  ${tocLink}
  `;
}

// 生成HTML页面框架
function createHtmlTemplate(title, content, headExtra = '') {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    <script>
      window.MathJax = ${JSON.stringify(mathjaxConfig)};
    </script>
    ${headExtra}
  </head>
  <body>
    <div class="container">
      ${content}
    </div>
    
    <!-- 先加载核心库 -->
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    
    <!-- 加载MathJax -->
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" id="MathJax-script" async></script>
    
    <!-- 主题切换脚本 -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
      // 创建主题切换按钮
      const themeToggle = document.createElement('button');
      themeToggle.className = 'theme-toggle';
      themeToggle.setAttribute('aria-label', '切换主题');
      themeToggle.innerHTML = '🌓';
      document.body.appendChild(themeToggle);
      
      // 添加深色和浅色主题的样式
      const darkThemeStyle = document.createElement('style');
      const lightThemeStyle = document.createElement('style');
      
      darkThemeStyle.textContent = \`
        body.dark-theme {
          --background-color: #1a1a1a;
          --text-color: #e6e6e6;
          --code-bg-color: #2d2d2d;
          --link-color: #58a6ff;
          --highlight-color: #58a6ff;
          --border-color: #333;
          --table-border-color: #444;
          --table-header-bg: #2d2d2d;
          --blockquote-color: #aaa;
          --blockquote-border: #444;
          --part-header-bg: #222;
          --footer-text-color: #aaa;
          --filename-bg: #2d2d2d;
          --nav-bg: #2d2d2d;
          --nav-hover-bg: #444;
          --toc-bg: #222;
          --highlight-section-bg: #2d2d2d;
          --highlight-section-border: #58a6ff;
        }
      \`;
      
      lightThemeStyle.textContent = \`
        body.light-theme {
          --background-color: #ffffff;
          --text-color: #333333;
          --code-bg-color: #f5f5f5;
          --link-color: #0366d6;
          --highlight-color: #0366d6;
          --border-color: #eee;
          --table-border-color: #ddd;
          --table-header-bg: #f2f2f2;
          --blockquote-color: #666;
          --blockquote-border: #ddd;
          --part-header-bg: #f8f8f8;
          --footer-text-color: #666;
          --filename-bg: #f5f5f5;
          --nav-bg: #f5f5f5;
          --nav-hover-bg: #e6e6e6;
          --toc-bg: #f8f8f8;
          --highlight-section-bg: #f8f8f8;
          --highlight-section-border: #0366d6;
        }
      \`;
      
      document.head.appendChild(darkThemeStyle);
      document.head.appendChild(lightThemeStyle);
      
      // 检查本地存储中的设置
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
      const currentTheme = localStorage.getItem('theme');
      
      if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
      } else if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        // 如果没有保存的偏好，跟随系统
        if (prefersDarkScheme.matches) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.add('light-theme');
        }
      }
      
      // 添加点击事件监听器
      themeToggle.addEventListener('click', function() {
        console.log('Theme toggle clicked');
        if (document.body.classList.contains('dark-theme')) {
          document.body.classList.remove('dark-theme');
          document.body.classList.add('light-theme');
          localStorage.setItem('theme', 'light');
        } else {
          document.body.classList.remove('light-theme');
          document.body.classList.add('dark-theme');
          localStorage.setItem('theme', 'dark');
        }
      });
      
      // 确保代码块有正确的类名
      document.querySelectorAll('pre code').forEach(function(block) {
        if (!block.className && block.parentNode.innerHTML.includes('cpp')) {
          block.className = 'language-cpp';
        } else if (!block.className && block.parentNode.innerHTML.includes('rust')) {
          block.className = 'language-rust';
        } else if (!block.className) {
          block.className = 'language-plaintext';
        }
      });
      
      // 延迟加载Prism高亮
      setTimeout(function() {
        if (window.Prism) {
          window.Prism.highlightAll();
        }
      }, 500);
    });
    </script>
  </body>
  </html>
  `;
}

async function generateHtml() {
  try {
    console.log('Starting HTML generation...');

    // 重置已处理文件集合
    processedFiles.clear();

    // Create dist directory if it doesn't exist
    await fs.mkdir(distDir, { recursive: true });

    // Process the main book file
    console.log('Processing main book file...');
    const { content: bookContent, chapters } = await processTex(path.join(rootDir, 'book.tex'), true);

    console.log('Converting LaTeX to HTML...');
    let htmlContent = convertLatexToHtml(bookContent);

    // 为每个章节内容创建占位符的映射
    const chapterMap = new Map();
    for (const chapter of chapters) {
      const placeholder = `<div class="placeholder" data-id="${chapter.id}"></div>`;
      if (htmlContent.includes(placeholder)) {
        htmlContent = htmlContent.replace(placeholder, chapter.content);
      }
      chapterMap.set(chapter.id, chapter);
    }

    // 从README.md中提取书籍信息
    console.log('Extracting book information from README.md...');
    const bookInfo = await extractBookInfoFromReadme();
    const { title: bookTitle, subtitle: bookSubtitle, authors, translator } = bookInfo;

    // 生成目录
    const tocHtml = generateTOC(chapters);

    // 创建首页HTML
    const indexHtml = createHtmlTemplate(bookTitle, `
      <header>
        <h1 style="text-align: center;">${bookTitle}</h1>
        <p class="subtitle">${bookSubtitle}</p>
        <div class="author-info">
          <p>作者：${authors}</p>
          <p>译者：${translator}</a></p>
        </div>
        <img src="cover.png" alt="Book Cover" class="book-cover">
      </header>
      
      ${tocHtml}
    `);

    // 复制图片到dist目录
    try {
      console.log('Copying images...');
      // 创建images目录
      await fs.mkdir(path.join(distDir, 'images'), { recursive: true });

      // 复制封面图片
      const coverPath = path.join(rootDir, 'cover.png');
      try {
        await fs.access(coverPath);
        await fs.copyFile(coverPath, path.join(distDir, 'cover.png'));
        console.log('Cover image copied.');
      } catch (err) {
        console.warn('Cover image not found or could not be copied:', err.message);
      }

      // 遍历整个content目录寻找图片文件
      async function copyImagesFromDir(dir, rootDir = dir) {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              await copyImagesFromDir(fullPath, rootDir); // 递归并保留 rootDir
            } else if (entry.isFile() && /\.(png|jpe?g|gif|svg)$/i.test(entry.name)) {
              const relativePath = path.relative(rootDir, fullPath); // 保留相对路径
              const destPath = path.join(distDir, 'content', relativePath);

              try {
                await fs.mkdir(path.dirname(destPath), { recursive: true });
                await fs.copyFile(fullPath, destPath);
                console.log(`Copied image: ${destPath}`);
              } catch (err) {
                console.warn(`Could not copy image ${relativePath}:`, err.message);
              }
            }
          }
        } catch (err) {
          console.warn(`Error reading directory ${dir}:`, err.message);
        }
      }

      await copyImagesFromDir(contentDir);

    } catch (err) {
      console.warn('Warning: Some images could not be copied', err);
    }

    // 写入索引页文件
    console.log('Writing index HTML file...');
    await fs.writeFile(path.join(distDir, 'index.html'), indexHtml);

    // 为每个章节创建单独的HTML文件
    console.log('Creating individual chapter HTML files...');
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const filename = generateFilename(chapter);
      const navigation = createNavigation(chapters, i);

      // 创建章节HTML内容
      const chapterHtml = createHtmlTemplate(
        `${chapter.title} - ${bookTitle}`,
        `
        <div class="chapter-container">
          ${navigation}
          ${chapter.content}
          ${navigation}
        </div>
        `
      );

      await fs.writeFile(path.join(distDir, filename), chapterHtml);
      console.log(`Created chapter file: ${filename}`);
    }

    // 创建CSS文件
    console.log('Writing CSS file...');
    await fs.writeFile(path.join(distDir, 'styles.css'), cssContent);

    console.log('HTML generation completed. Output is in the dist directory.');
  } catch (err) {
    console.error('Error generating HTML:', err);
  }
}

generateHtml().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

var index = /*#__PURE__*/Object.freeze({
  __proto__: null
});
