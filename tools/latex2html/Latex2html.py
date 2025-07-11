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
    window.MathJax = {mathjax_config};
  </script>
  {headExtra}
</head>

<body>
  <div class="container">
    {content}
  </div>
''' 
  
  html_template_path = os.path.join(os.path.dirname(__file__), "template.html.in")
  with open(html_template_path, mode='r', encoding='utf-8-sig') as f:
    content += f.read()

  return content

def generate_index(latex_content, output_dir):
  book_info = latex_content['book_info']

  header_part = f'''
    <header>
      <h1 style="text-align: center;" style="font-size:40px;">{book_info["title"]}</h1>
      <p class="subtitle">{book_info["subtitle"]}</p>
      <div class="author-info">
        <p>作者：{book_info["authors"]}</p>
        <p>译者：<a href="{book_info["translator"]["link"]}">{book_info["translator"]["name"]}</a></p>
      </div>
      <img src="{book_info["cover_image"]}" alt="Book Cover" class="book-cover">
    </header>
'''
  
  header_part += generate_toc(latex_content['catalogue_info'])
  
  index_html = create_html_template(book_info["title"], header_part, headExtra='')

  with open(output_dir / "index.html", "w", encoding="utf-8") as f:
    f.write(index_html)

  # 复制 styles.css 到输出目录
  import shutil
  src_css = os.path.join(os.path.dirname(__file__), "styles.css")
  dst_css = os.path.join(output_dir, "styles.css")
  try:
    shutil.copy2(src_css, dst_css)
  except Exception as e:
    print(f"复制 styles.css 失败: {e}")

def generate_toc(catalogue_info):
  if not catalogue_info:
    return '<div class="toc"><h2>目录</h2><p>未找到章节内容</p></div>'

  toc_html = '\n    <div class="toc"><h2 style="text-align: center;">目录</h2><ul>\n'

  for chapter in catalogue_info:
    filename = chapter['index'] + '.html'
    title = chapter['title']
    level = chapter.get('level', 1)

    match level:
      case 0:
        # 部分标题
        toc_html += f'\n      <li class="toc-part"><a href="{filename}" style="font-size:20px;">{title}</a></li>\n'
      case 1:
        # 章节标题
        toc_html += f'\n      <li class="toc-chapter"><a href="{filename}" style="font-size:18px;">{title}</a></li>\n'
      case 2:
        # 小节标题
        toc_html += f'      <li class="toc-section" style="margin-left: 20px;" style="font-size:16px;"><a href="{filename}">{title}</a></li>\n'

  toc_html += '    </ul></div>\n\n'
  return toc_html

def latex_to_html(latex_content, input_dir, output_dir):
  relative_path = os.path.relpath(input_dir, output_dir)
  generate_index(latex_content, output_dir)

