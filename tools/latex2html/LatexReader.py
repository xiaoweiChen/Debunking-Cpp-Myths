import re, os, json
from pathlib import Path
from typing import List, Dict

def safe_extract_path(text: str) -> str | None:
  if not text:
    return None

  # 移除非法字符：<>:"\|?* 以及控制字符（ASCII 0-31）
  cleaned = re.sub(r'[<>:"\\|?*\x00-\x1F]', '', text)

  # 拒绝路径穿越
  if '..' in cleaned:
    return None

  return cleaned

def read_file_sync(path):
  with open(path, mode='r', encoding='utf-8') as f:
    return f.read()
  
def parse_book_info(center_text: str, relative_path:Path) -> dict:
  result = {}

  # 提取图片路径
  img_match = re.search(r'\\includegraphics\[.*?\]\{(.+?)\}', center_text)
  if img_match:
    # 保证 relative_path 是 Path 类型，且拼接后转为 POSIX
    rel_path = Path(relative_path) if not isinstance(relative_path, Path) else relative_path
    result['cover_image'] = str(rel_path.joinpath(img_match.group(1).strip()).as_posix())

  # 提取标题（\textbf{} + 下一行）
  title_match = re.search(r'\\textbf\{(.+?)\}\s*\\\\\[\d+pt\]\s*\\normalsize\s*(.+?)\s*\\\\', center_text, re.DOTALL)
  if title_match:
    result['title'] = title_match.group(1).strip()
    result['subtitle'] = title_match.group(2).strip()

  # 作者
  author_match = re.search(r'作者:\s*(.+)', center_text)
  if author_match:
    result['authors'] = author_match.group(1).strip()

  # 译者（包含 \href）
  translator_match = re.search(r'译者：\\href\{(.+?)\}\{(.+?)\}', center_text)
  if translator_match:
    result['translator'] = {
      'name': translator_match.group(2).strip(),
      'link': translator_match.group(1).strip()
    }

  return result

def process_tex(file_path, input_dir, output_dir, is_root: bool = False):
  relative_path = os.path.relpath(input_dir, output_dir)

  try:
    print(f"Processing {file_path}...")
    content = read_file_sync(file_path)
    processed_content = content

    if is_root:
      # 处理 \subfile 命令
      subfile_regex = re.compile(r'\\subfile\{([^{}]+)\}')
      for match in subfile_regex.finditer(processed_content):
        subfile_path = safe_extract_path(match.group(1))
        if not subfile_path:
          continue

        resolved_path = input_dir / subfile_path
        if resolved_path.exists():
          try:
            print(f"Including subfile: {resolved_path.resolve()}")
            processed_content = read_file_sync(resolved_path.resolve())
          except Exception as err:
            print(f"Error including subfile {resolved_path.resolve()}: {err}")
        else:
          print(f"Warning: Could not find file for {resolved_path.resolve()}")

      book_dir_name = resolved_path.parent.name

      # 提取 \begin{document} ... \end{document} 中的内容（若为根）
      document_match = re.search(r'\\begin\{document\}([\s\S]*?)\\end\{document\}', processed_content)
      if document_match:
        processed_content = document_match.group(1)

      def extract_center_block(latex_text: str) -> str | None:
        match = re.search(r'\\begin\{center\}([\s\S]*?)\\end\{center\}', latex_text)
        if match:
          return match.group(1).strip()
        return None
      
      latex_reader_result = {}

      center_block = extract_center_block(processed_content)
      if center_block:
        info = parse_book_info(center_block, relative_path)
        latex_reader_result['book_info'] = info

      if 'index.tex' in subfile_path:
        def get_toc(latex_text: str) -> List[Dict[str, str | int]]:
          toc = []
          chapter_counters = {}  # 如 {"chapter1": 0}

          pattern = re.compile(
            r'\\my(Chapter|ChapterNoContents|Subsection|Part|PartGray)\{(.*?)\}\{(.*?)\}\{(.*?)\}'
          )

          for match in pattern.finditer(latex_text):
            command_type, arg1, arg2, file_path = match.groups()
            file_path = str(Path(book_dir_name).joinpath(file_path).as_posix())

             # 提取章节编号基准，例如 "chapter1"
            chapter_match = re.search(r'chapter(\d+)/(\d+|0)\.tex$', file_path)
            if chapter_match:
              chapter_id = f"chapter{chapter_match.group(1)}"
              sub_index = int(chapter_match.group(2))
            else:
              chapter_id = None
              sub_index = None

            # 构建标题和层级
            if command_type in ('Part', 'PartGray'):
              title = f"{arg1}: {arg2}".strip()
              level = 0
              parts = Path(file_path).parts
              section_number = parts[-2]
            elif command_type in ('Chapter', 'ChapterNoContents'):
              title = arg1.strip()
              level = 1
              if chapter_id:
                chapter_number = chapter_id.replace("chapter", "")
                section_number = f"{chapter_number}.0."
              else:
                section_number = ""
            elif 'Subsection' in command_type:
              title = f"{arg1} {arg2}".strip()
              level = 2
              if chapter_id:
                chapter_number = chapter_id.replace("chapter", "")
                section_number = f"{chapter_number}.{sub_index}."
              else:
                section_number = ""
            else:
              continue  # skip unknown

            rel_path = Path(relative_path) if not isinstance(relative_path, Path) else relative_path
            final_file_path = str(rel_path.joinpath(file_path.strip()).as_posix())

            toc.append({
              "type": command_type,
              "title": title,
              "index": section_number,
              "re_input_dir_path": file_path,
              "re_output_dir_path": final_file_path,
              "level": level
            })

          return toc
        
        toc = get_toc(processed_content)
        latex_reader_result['catalogue'] = toc

      if 'catalogue' in latex_reader_result:
        for items in latex_reader_result['catalogue']:
          print(items['re_input_dir_path'])
          latex_reader_result[items["index"]] = \
            process_tex(items['re_input_dir_path'], input_dir, output_dir)

      processed_content = json.dumps(latex_reader_result, indent=2, ensure_ascii=False)

      print(f"processed_content {processed_content}")
    else:
      pass

    # 处理自定义命令
    #result = await process_custom_commands(processed_content)
    #final_content = result["processedContent"]
    #chapter_contents = result["chapterContents"]

    return {
      "content": "",#final_content,
      "chapters": []#chapter_contents
    }

  except Exception as err:
    print(f"Error processing {file_path}: {err}")
    return {
      "content": '',
      "chapters": []
    }
