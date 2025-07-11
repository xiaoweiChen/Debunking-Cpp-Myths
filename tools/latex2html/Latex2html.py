import os, re
import json
from pathlib import Path

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

  toc_html += '\n    </ul></div>\n'
  return toc_html

def create_navigation(chapters, current_index):
  prev_link = ''
  next_link = ''
  toc_link = '<div class="back-to-toc" style="text-align:left"><a href="index.html">返回目录</a></div>'

  if current_index > 0:
    prev_chapter = chapters[current_index - 1]
    prev_filename = prev_chapter["section_name"]+ '.html'
    prev_link = f'<a href="{prev_filename}" class="prev-link">« 上一章：{prev_chapter["section_title"]}</a>'
  else:
    prev_link = '<span></span>'

  if current_index < len(chapters) - 1:
    next_chapter = chapters[current_index + 1]
    next_filename = next_chapter["section_name"] + '.html'
    next_link = f'<a href="{next_filename}" class="next-link">下一章：{next_chapter["section_title"]} »</a>'
  else:
    next_link = '<span></span>'

  return f'''
<div class="navigation">
  {prev_link}
  {next_link}
</div>
''', toc_link

def convert_itemize_to_html(latex_text):
  # 替换 \begin{itemize} 和 \end{itemize}
  text = latex_text.replace(r'\begin{itemize}', '<ul>')
  text = text.replace(r'\end{itemize}', '</ul>')

  # 处理 \item
  def item_replacer(match):
    content = match.group(1).strip()
    return f'  <li>{content}</li>' if content else '  <li></li>'

  text = re.sub(r'\\item\s*\n?(.*?)(?=\\item|\\begin|\\end|$)', item_replacer, text, flags=re.DOTALL)

  # 美化输出：添加缩进
  lines = text.split('\n')
  indent_level = 0
  result = []
  for line in lines:
    if not line.strip():
      continue
    if '</ul>' in line:
      indent_level -= 1
    indent = '  ' * indent_level
    result.append(indent + line)
    if '<ul>' in line:
      indent_level += 1
  return '\n'.join(result)

def convert_enumerate_to_html(latex_text):
  # 替换 \begin{enumerate} 和 \end{enumerate}
  text = latex_text.replace(r'\begin{enumerate}', '<ol>')
  text = text.replace(r'\end{enumerate}', '</ol>')

  # 处理 \item
  def item_replacer(match):
    content = match.group(1).strip()
    return f'  <li>{content}</li>' if content else '  <li></li>'

  text = re.sub(r'\\item\s*\n?(.*?)(?=\\item|\\begin|\\end|$)', item_replacer, text, flags=re.DOTALL)

  # 美化输出：添加缩进
  lines = text.split('\n')
  indent_level = 0
  result = []
  for line in lines:
    if not line.strip():
      continue
    if '</ol>' in line:
      indent_level -= 1
    indent = '  ' * indent_level
    result.append(indent + line)
    if '<ol>' in line:
      indent_level += 1
  return '\n'.join(result)

import re

def convert_longtable_to_html(html):
  def table_replacer(match):
    raw_content = match.group(1)
    # 清理辅助结构和注释
    content = re.sub(r'\\endfirsthead[\s\S]*?\\endhead', '', raw_content)
    content = re.sub(r'\\multicolumn\{.*?\}\{.*?\}\{.*?\}\s*\\\\', '', content)
    content = re.sub(r'\\hline', '', content)

    # 保护百分号，去注释
    content = content.replace(r'\%', 'TEMP_ESCAPED_PERCENT')
    content = re.sub(r'%.*$', '', content, flags=re.MULTILINE)
    content = content.replace('TEMP_ESCAPED_PERCENT', r'\%').strip()

    # 清理表格列格式声明
    content = re.sub(r'^\s*\{[|lcr\s]*\}\s*', '', content, flags=re.MULTILINE)

    # 保护 AT\&T
    content = re.sub(r'AT\\&T', 'TEMP_ATT_MARKER', content)

    # 保护行内 \\（非行尾）
    lines = content.split('\n')
    processed_lines = [re.sub(r'\\\\(?!\s*$)', 'TEMP_LINEBREAK_MARKER', line) for line in lines]
    content = '\n'.join(processed_lines)

    # 拆分为行
    rows = [row.strip() for row in re.split(r'\\\\\s*', content) if row.strip()]

    html_table = '<table border=\"1\">\n'
    header_parsed = False

    for row in rows:
      temp_row = row.replace(r'\&', 'TEMP_ESCAPED_AMP')
      columns = [col.replace('TEMP_ESCAPED_AMP', r'\&').strip() for col in temp_row.split('&')]

      if not header_parsed:
        html_table += '  <thead>\n    <tr>\n'
        for col in columns:
          content = re.sub(r'\\textbf\{(.*?)\}', r'<strong>\1</strong>', col)
          content = content.replace('TEMP_ATT_MARKER', 'AT&T')
          content = content.replace('TEMP_LINEBREAK_MARKER', '<br>')
          content = re.sub(r'AT\\&T', 'AT&T', content)
          content = re.sub(r'\bATT\b', 'AT&T', content)
          content = re.sub(r'\\begin\{tabular\}\[c\]\{@\{\}l@\{\}\}', '', content)
          content = re.sub(r'\\end\{tabular\}', '', content)
          content = content.replace(r'\$', '&#36;')
          content = content.replace(r'\%', '&#37;')
          content = content.replace(r'\_', '&#95;')
          content = content.replace(r'\{', '&#123;')
          content = content.replace(r'\}', '&#125;')
          html_table += f'      <th>{content}</th>\n'
        html_table += '    </tr>\n  </thead>\n  <tbody>\n'
        header_parsed = True
      else:
        html_table += '    <tr>\n'
        for col in columns:
          content = col
          content = content.replace('TEMP_ATT_MARKER', 'AT&T')
          content = content.replace('TEMP_LINEBREAK_MARKER', '<br>')
          content = re.sub(r'AT\\&T', 'AT&T', content)
          content = re.sub(r'\bATT\b', 'AT&T', content)
          content = re.sub(r'\\begin\{tabular\}\[c\]\{@\{\}l@\{\}\}', '', content)
          content = re.sub(r'\\end\{tabular\}', '', content)
          content = content.replace(r'\$', '&#36;')
          content = content.replace(r'\%', '&#37;')
          content = content.replace(r'\_', '&#95;')
          content = content.replace(r'\{', '&#123;')
          content = content.replace(r'\}', '&#125;')
          html_table += f'      <td>{content}</td>\n'
        html_table += '    </tr>\n'
    html_table += '  </tbody>\n</table>\n'
    return html_table

  html = re.sub(r'\\begin\{longtable\}\s*([\s\S]*?)\\end\{longtable\}', table_replacer, html)
  return html

def process_latex_env(paragraph_content):
  begin_match = re.search(r'\\begin\{([^\}]+)\}', paragraph_content)

  if not begin_match:
    return paragraph_content
  
  env_name = begin_match.group(1)

  match env_name:
    case 'flushright':
      paragraph_content = re.sub(r'\\begin\{flushright\}([\s\S]*?)\\end\{flushright\}', r'<div style="text-align:right">\1</div>', paragraph_content)
    case 'itemize':
      paragraph_content = convert_itemize_to_html(paragraph_content)
    case 'enumerate':
      paragraph_content = convert_enumerate_to_html(paragraph_content)
    case 'longtable':
      paragraph_content = convert_longtable_to_html(paragraph_content)
    case '_':
      print("unkown environment:", env_name)
      exit(-10)

  return paragraph_content

def process_special_paragraph(paragraph_content):
  # 替换特殊字符
  paragraph_content = paragraph_content.replace('---', '——')
  paragraph_content = re.sub(r'\\hspace\*{\\fill}', '<br>', paragraph_content)
  paragraph_content = re.sub(r'\\mySubsubsection\{(.*?)\}\{(.*?)\}', r'<h4 class="filename">\1 \2</h4>', paragraph_content)
  paragraph_content = re.sub(r'\\mySubsection\{(.*?)\}\{(.*?)\}', r'<h3 class="filename">\1 \2</h3>', paragraph_content)
  paragraph_content = re.sub(r'\\mySubsectionNoFile\{(.*?)\}\{(.*?)\}', r'<h3 class="filename">\1\2</h3>', paragraph_content)
  paragraph_content = re.sub(r'\\textbf\{(.*?)\}', r'<strong>\1</strong>', paragraph_content)
  paragraph_content = re.sub(r'\\textit\{(.*?)\}', r'<em>\1</em>', paragraph_content)
  paragraph_content = re.sub(r'\\href\{(.*?)\}\{(.*?)\}', r'<a href="\1">\2</a>', paragraph_content)
  paragraph_content = re.sub(r'\\url\{(https?://[^\}]+)\}', r'<a href="\1" target="_blank" rel="noopener noreferrer">\1</a>', paragraph_content)
  paragraph_content = re.sub(r'^\\begin\{longtable\}.*$', r'\\begin{longtable}', paragraph_content, flags=re.MULTILINE)
  paragraph_content = re.sub(r'\$\s*\\sim\s*\$', '~', paragraph_content)
  paragraph_content = re.sub(r'\\verb(.)(.+?)\1', r'<code>\2</code>', paragraph_content)
  paragraph_content = paragraph_content.replace(r'\#', '#')

  process_paragraph_content = process_latex_env(paragraph_content)
  return process_paragraph_content

def generate_content(latex_content, relative_path, output_dir):
  content_info = latex_content['content_info']
  book_info = latex_content['book_info']

  index_tex_path = latex_content['index_tex_path']
  book_dir_name = Path(index_tex_path).parent.name

  for section_index, section_info in enumerate(content_info):
    output_path = output_dir / f"{section_info['section_name']}.html"

    content_lines = []
    for paragraph_line in section_info['section_content']:
      processed_line = process_special_paragraph(paragraph_line)
      if len(processed_line) > 0:
        content_lines.append(f"<p>{processed_line}</p>")

    if len(content_lines) > 0:
      navigation, toc_link = create_navigation(content_info, section_index)
      title =  section_info['section_title'] + ' - ' + book_info['title']
      content = '\n'.join(content_lines)
      content_final = f'''
<div class="chapter-container">
  {navigation}{toc_link}
  {content}
  {toc_link}{navigation}
</div>
'''
      
      final_html = create_html_template(title, content_final)

      with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_html)

def latex_to_html(latex_content, input_dir, output_dir):
  relative_path = os.path.relpath(input_dir, output_dir)
  generate_index(latex_content, output_dir)
  generate_content(latex_content, relative_path, output_dir)

