#!/usr/bin/env node
import { promises } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// 导入所需模块

// 获取当前目录
const __filename$1 = fileURLToPath(import.meta.url);
dirname(__filename$1);

// 解析命令行参数
const args$1 = process.argv.slice(2);
let scriptType = null;
const remainingArgs = [];

// 遍历命令行参数
for (let i = 0; i < args$1.length; i++) {
  if (args$1[i] === '-s' && i + 1 < args$1.length) {
    scriptType = args$1[i + 1];
    i++; // 跳过下一个参数
  } else {
    remainingArgs.push(args$1[i]);
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
        await Promise.resolve().then(function () { return index; });
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
dirname(__filename);
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

code {
  font-family: "Hack", Consolas, Monaco, "Andale Mono", monospace;
  background-color: var(--code-bg-color);
  padding: 2px 4px;
  border-radius: 3px;
}

pre {
  background-color: var(--code-bg-color);
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

.code-marker {
  display: inline-block;
  background-color: #ffeb3b;
  color: #000;
  padding: 0 5px;
  margin: 0 2px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.9em;
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

.author-info {
  text-align: center;
  margin: 20px 0;
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

.language-cpp {
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
`;

/**
 * Simple LaTeX to HTML converter
 * This is a basic implementation - for complex documents, using a proper LaTeX to HTML
 * converter like LaTeXML or pandoc would be better
 */
function convertLatexToHtml(latex) {
  // Replace LaTeX commands with HTML equivalents
  let html = latex || '';

  // Remove LaTeX comments
  html = html.replace(/%.*$/gm, '');

  // Remove tikzpicture environments
  html = html.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, '<div class="tikz-figure"></div>');

  // 处理自定义章节命令
  html = html.replace(/\\mySubsubsection\{(.*?)\}\{(.*?)\}/g, '<h4>$1 $2</h4>');
  html = html.replace(/\\mySubsection\{(.*?)\}\{(.*?)\}/g, '<h3>$1 $2</h3>');

  // 处理文件名命令
  html = html.replace(/\\filename\{(.*?)\}/g, '<div class="filename">$1</div>');

  // 处理自定义小节命令
  html = html.replace(/\\mySamllsection\{(.*?)\}/g, '<h4 class="highlight-section">$1</h4>');

  // 处理花括号中的特殊标记
  html = html.replace(/\{(分析|解决|问题|建议)\}/g, '<h4 class="highlight-section">$1</h4>');

  // 处理C++代码环境
  html = html.replace(/\\begin\{cpp\}([\s\S]*?)\\end\{cpp\}/g, '<pre><code class="language-cpp">$1</code></pre>');

  // 处理字体大小命令
  html = html.replace(/\{\\footnotesize\s+([\s\S]*?)\}/g, '<div class="footnote-text">$1</div>');
  html = html.replace(/\\footnotesize\s+([\s\S]*?)(?=\\|$)/g, '<div class="footnote-text">$1</div>');

  // 先处理列表环境 - 必须放在其他转换之前
  html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, function (match, content) {
    // 在列表环境内部处理\item
    const processedContent = content.replace(/\\item\s+([\s\S]*?)(?=\\item|$)/g, '<li>$1</li>');
    return '<ul>' + processedContent + '</ul>';
  });

  html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, function (match, content) {
    // 在列表环境内部处理\item
    const processedContent = content.replace(/\\item\s+([\s\S]*?)(?=\\item|$)/g, '<li>$1</li>');
    return '<ol>' + processedContent + '</ol>';
  });

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

  // Remove sloppypar
  html = html.replace(/\\begin\{sloppypar\}([\s\S]*?)\\end\{sloppypar\}/g, '$1');

  // Replace LaTeX formatting
  html = html.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{(.*?)\}/g, '<em>$1</em>');
  html = html.replace(/\\emph\{(.*?)\}/g, '<em>$1</em>');
  html = html.replace(/\\underline\{(.*?)\}/g, '<u>$1</u>');
  html = html.replace(/\\texttt\{(.*?)\}/g, '<code>$1</code>');

  // Replace hyperlinks
  html = html.replace(/\\href\{(.*?)\}\{(.*?)\}/g, '<a href="$1">$2</a>');

  // Replace code listings
  html = html.replace(/\\begin\{lstlisting\}([\s\S]*?)\\end\{lstlisting\}/g, '<pre><code>$1</code></pre>');
  html = html.replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g, '<pre><code>$1</code></pre>');

  // 处理shell代码块
  html = html.replace(/\{shell\}([\s\S]*?)\{shell\}/g, '<pre><code class="language-shell">$1</code></pre>');
  
  // 处理代码中的##数字标记（将它们转换为HTML注释或行内备注）
  html = html.replace(/(##\s*\d+)/g, '<span class="code-marker">$1</span>');

  // Replace LaTeX special characters
  html = html.replace(/\\&/g, '&amp;');
  html = html.replace(/\\\$/g, '&#36;');
  html = html.replace(/\\%/g, '&#37;');
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

  // 清理尚未转换的LaTeX命令
  html = html.replace(/\\[a-zA-Z]+/g, '');

  // Cleanup paragraph tags
  html = html.replace(/\n\s*\n/g, '</p><p>');

  // Remove empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

// Helper function to read a file using the promises API
async function readFileAsync(filePath) {
  try {
    return await promises.readFile(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return '';
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
      await promises.access(tryPath);
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
    const content = await promises.readFile(filePath, 'utf-8');

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
      
      <footer>
        <p>© 2025 Rich Yonts - 版权所有</p>
        <p>中文翻译由陈晓伟完成</p>
      </footer>
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
    await promises.mkdir(distDir, { recursive: true });

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

    // 生成目录
    const tocHtml = generateTOC(chapters);

    // 创建首页HTML
    const indexHtml = createHtmlTemplate('C++编程避坑指南：100个常见错误及解决方案', `
      <header>
        <h1>C++编程避坑指南：100个常见错误及解决方案</h1>
        <p><em>100 C++ Mistakes and How to Avoid Them</em></p>
        <div class="author-info">
          <p>作者：Rich Yonts</p>
          <p>译者：陈晓伟</p>
          <p>出版于: 2025年3月25日</p>
        </div>
        <img src="cover.png" alt="Book Cover" class="book-cover">
      </header>
      
      ${tocHtml}
    `);

    // 复制图片到dist目录
    try {
      console.log('Copying images...');
      // 创建images目录
      await promises.mkdir(path.join(distDir, 'images'), { recursive: true });

      // 复制封面图片
      const coverPath = path.join(rootDir, 'cover.png');
      try {
        await promises.access(coverPath);
        await promises.copyFile(coverPath, path.join(distDir, 'cover.png'));
        console.log('Cover image copied.');
      } catch (err) {
        console.warn('Cover image not found or could not be copied:', err.message);
      }

      // 遍历整个content目录寻找图片文件
      async function copyImagesFromDir(dir) {
        try {
          const entries = await promises.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
              // 递归处理子目录
              await copyImagesFromDir(fullPath);
            } else if (entry.isFile() && /\.(png|jpe?g|gif|svg)$/i.test(entry.name)) {
              // 是图片文件，复制到images目录
              const destPath = path.join(distDir, 'images', entry.name);
              try {
                await promises.copyFile(fullPath, destPath);
                console.log(`Copied image: ${entry.name}`);
              } catch (err) {
                console.warn(`Could not copy image ${entry.name}:`, err.message);
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
    await promises.writeFile(path.join(distDir, 'index.html'), indexHtml);

    // 为每个章节创建单独的HTML文件
    console.log('Creating individual chapter HTML files...');
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const filename = generateFilename(chapter);
      const navigation = createNavigation(chapters, i);

      // 创建章节HTML内容
      const chapterHtml = createHtmlTemplate(
        `${chapter.title} - C++编程避坑指南`,
        `
        <div class="chapter-container">
          ${navigation}
          ${chapter.content}
          ${navigation}
        </div>
        `
      );

      await promises.writeFile(path.join(distDir, filename), chapterHtml);
      console.log(`Created chapter file: ${filename}`);
    }

    // 创建CSS文件
    console.log('Writing CSS file...');
    await promises.writeFile(path.join(distDir, 'styles.css'), cssContent);

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
