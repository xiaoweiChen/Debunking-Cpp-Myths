#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
import sys
import re
import shutil
from pathlib import Path

def read_file(path):
  try:
    return Path(path).read_text(encoding='utf-8')
  except Exception as e:
    print(f"读取文件失败: {path} - {e}")
    return ""

def write_file(path, content):
  try:
    Path(path).write_text(content, encoding='utf-8')
  except Exception as e:
    print(f"写入文件失败: {path} - {e}")

def copy_static_file(src, dst):
  try:
    shutil.copy2(src, dst)
  except Exception as e:
    print(f"复制静态文件失败: {src} -> {dst} - {e}")

def main(args):
  
  input_path = Path(args.input)
  output_dir = Path(args.output)

  relative_path = os.path.relpath(input_path, output_dir)
  print(f"输出目录相对于输入目录的相对路径: {relative_path}")

  main_tex_file = input_path / "book.tex"
  import LatexReader
  result = LatexReader.process_tex(main_tex_file, input_path, output_dir, is_root=True)
  print(f"处理 LaTeX 文件完成，内容长度: {len(result['content'])}, 章节数: {len(result['chapters'])}")

  print(f"从 {input_path} 转换 LaTeX 项目为 HTML 到 {output_dir}")

if __name__ == "__main__":

  def parse_args():
    parser = argparse.ArgumentParser(description="Convert LaTeX book to HTML")
    parser.add_argument("-i", "--input", required=True, help="输入 LaTeX 项目根目录路径")
    parser.add_argument("-o", "--output", required=True, help="输出 HTML 文件目录")
    return parser.parse_args()

  args = parse_args()
  print(f"解析参数:{args}")

  input_path = Path(args.input).resolve()
  output_dir = Path(args.output).resolve()
  print(f"输入文件: {input_path}, 输出目录: {output_dir}")

  if not input_path.is_dir():
    print(f"输入 {input_path} 不是目录！")
    sys.exit(1)
  
  main_tex_file = input_path / "book.tex"
  if not main_tex_file.is_file():
    print(f"输入 {input_path} 不包含 book.tex 文件！")
    sys.exit(1)
  print(f"找到主 LaTeX 文件: {main_tex_file}")

  Path(output_dir).mkdir(parents=True, exist_ok=True)

  main(args)
