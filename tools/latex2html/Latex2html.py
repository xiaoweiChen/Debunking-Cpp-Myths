import os
import json

# 生成HTML页面框架
def create_html_template(title, content, headExtra = ''):
  mathjax_config = {
    "tex": {
      "inlineMath": [["$", "$"], ["\\(", "\\)"]],
      "displayMath": [["$$", "$$"], ["\\[", "\\]"]],
      "processEscapes": True,
      "tags": "ams"
    },
    "svg": {
      "fontCache": "global"
    }
  }

  content = f'''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
  <script>
    window.MathJax = {json.dumps(mathjax_config, indent=2, ensure_ascii=False)};
  </script>
  {headExtra}
</head>
<body>
  <div class="container">
    {content}
  </div>
''' 
  content += '''
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
'''
  return content

def generate_toc(chapters):
  if not chapters:
    return '<div class="toc"><h2>目录</h2><p>未找到章节内容</p></div>'

  toc_html = '<div class="toc"><h2>目录</h2><ul>'

  for chapter in chapters:
    filename = generate_filename(chapter)
    title = chapter['title']
    level = chapter.get('level', 1)

    if level == 0:
      # 部分标题
      toc_html += f'<li class="toc-part"><a href="{filename}">{title}</a></li>'
    elif level == 1:
      # 章节标题
      toc_html += f'<li class="toc-chapter"><a href="{filename}">{title}</a></li>'
    elif level == 2:
      # 小节标题
      toc_html += f'<li class="toc-section" style="margin-left: 20px;"><a href="{filename}">{title}</a></li>'

  toc_html += '</ul></div>'
  return toc_html

def generate_index(latex_content):
  pass

def latex_to_html(latex_content, input_dir, output_dir):
  relative_path = os.path.relpath(input_dir, output_dir)

