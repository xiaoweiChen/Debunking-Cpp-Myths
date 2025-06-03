# 消除对于C++的误解

*开启一段富有洞见的旅程，揭开流行的 C++ 迷思与误解背后的真相。*

<a href=""><img src="cover.png" height="256px" align="right"></a>

* 作者：Alexandru Bolboacă，Ferenc-Lajos Deák
* 译者：陈晓伟
* 出版于: 2024年12月

> [!IMPORTANT]
> 翻译是译者用自己的思想，换一种语言，对原作者想法的重新阐释。鉴于我的学识所限，误解和错译在所难免。如果你能买到本书的原版，且有能力阅读英文，请直接去读原文。因为与之相较，我的译文可能根本不值得一读。
>
> — 云风，程序员修炼之道第2版译者

## 本书概述

告别繁琐的任务！GitHub Actions 是一个强大的工作流引擎，可以自动化 GitHub 生态系统中的所有内容，让开发者专注于更重要的事。

**关于本书**

本书展示了如何使用社区驱动的GitHub Actions工作流平台，来自动化重复性的工程任务。

本书解释了GitHub Actions工作流语法、不同种类的动作，以及GitHub托管和自托管的工作流运行器是如何工作的。可以了解到如何使用Visual Studio Code (VS Code)编写和调试GitHub Actions和工作流的技巧，学习如何在本地运行，并借用GitHub Copilot的力量。书中通过动手实例，引导你完成实际应用案例，自动化整个发布过程。从自动生成发布说明到构建和测试软件，再到使用OpenID Connect (OIDC)、密钥、变量、环境和审批检查安全地部署到Azure、Amazon Web Services (AWS)或Google Cloud。

内容不仅限于CI/CD，还演示了使用GitHub CLI、GitHub API和SDK及GitHub Token执行IssueOp和其他重复性任务的解决方案。你将学习如何构建自己的动作和可重用的工作流，以与社区或组织内部共享构建模块。

阅读完这本关于GitHub的书籍后，读者们将掌握自动化任务所需的技能，并能够以卓越的效率和敏捷性开展工作。

**主要特点**

* 使用OpenID安全地自动化CI/CD工作流并部署到如Azure、AWS或GCP这样的云提供商
* 使用Docker、JavaScript编程或shell脚本创建自己的自定义动作并与他人分享
* 发现复杂场景的自动化方法，超越GitHub中已记录的基本示例

**内容包括**

* 使用VS Code和Copilot编写和调试GitHub Actions工作流
* 在GitHub提供的虚拟机(Linux、Windows和macOS)上运行工作流，或者在开发者的基础设施中托管运行器
* 学习如何通过GitHub Actions保护工作流
* 通过使用GitHub的强大工具(如CLI、API、SDK和访问令牌)自动化工作流以提高生产力
* 通过分阶段或环形部署，以安全可靠的方式部署至云和服务

**适读人群**

这本书适合学习GitHub Actions实用方法的人，无论经验水平如何，无论职业是软件开发者、DevOps工程师，还是已经尝试过Actions的人，亦或对于Jenkins或Azure Pipelines这样的CI/CD工具完全不了解的人，都能在这本书中找到自己所寻之物。不过，使用Git和命令行是必备的基础知识。


## 作者简介

Michael Kaufmann相信开发者和工程师能够在工作中感到快乐和高效。他热爱DevOps、GitHub、Azure和现代工作方式。Microsoft授予他Microsoft区域总监(RD)和Microsoft最有价值专家(MVP)称号 --- 后者属于DevOps和GitHub类别。Michael同时也是德国Xebia Microsoft服务公司的创始人兼总经理，这是一家咨询公司，通过支持客户进行云、DevOps和数字化转型来帮助他们成为数字领导者。Michael通过书籍、培训，以及经常在国际会议上进行分享。

## 本书相关

* Github翻译地址：https://github.com/xiaoweiChen/Debunking-Cpp-Myths

* 译文的LaTeX 环境配置：https://www.cnblogs.com/1625--H/p/11524968.html

  * 禁用拼写检查：https://blog.csdn.net/weixin_39278265/article/details/87931348

  * 使用xelatex编译时需要添加`-shell-escape`和`-8bit`选项，例如：

    `xelatex -synctex=1 -interaction=nonstopmode -shell-escape -8bit "book".tex`

  * 为了内容中表格和目录索引能正常生成，至少需要连续编译两次

  * Latex中的中文字体([思源宋体](https://github.com/notofonts/noto-cjk/releases))和英文字体([Hack](https://github.com/source-foundry/Hack-windows-installer/releases/tag/v1.6.0))，需要安装后自行配置。如何配置请参考主book/css.tex顶部关于字体的信息。

  * 本书的Latex编译生成，在Windows 11中文版下测试通过。若在其他平台或不同语言版本遇到了Latex的编译问题，请自行解决。

* vscode中配置LaTeX：https://blog.csdn.net/Ruins_LEE/article/details/123555016

