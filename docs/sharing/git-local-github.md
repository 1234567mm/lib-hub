---
id: git-local-github
title: "Git 本地项目管理与上传 GitHub 全流程开发笔记"
---

# Git 本地项目管理与上传 GitHub 全流程开发笔记

> 适用对象：
> - 编程新手 / 开发入门
> - 想用 Git 管理自己本地项目的人
> - 想把本地项目上传到 GitHub 的人
> - 想学习分支、合并、回滚等真实开发流程的人

---

# 一、Git 是什么？

Git 是一个 **版本控制工具**。

你可以把它理解成：

- 给项目做“时间存档”
- 记录每次代码改动
- 出问题时可以回退
- 支持多人协作开发
- 能把本地项目同步到 GitHub

---

# 二、Git / GitHub / 仓库 的关系

## 1. Git
本地版本管理工具，运行在你的电脑上。

## 2. GitHub
远程代码托管平台，用来保存仓库、备份代码、协作开发。

## 3. 仓库（Repository）
就是一个“被 Git 管理的项目文件夹”。

例如：

```bash
my-project/
```

如果它被 Git 管理了，那么它就是一个 Git 仓库。

---

# 三、建议你先建立的标准项目结构

```bash
my-project/
├─ src/                # 源代码
├─ docs/               # 文档
├─ data/               # 数据（可选）
├─ tests/              # 测试代码
├─ .gitignore          # Git 忽略规则
├─ README.md           # 项目说明
├─ requirements.txt    # Python 依赖（如果是 Python 项目）
└─ main.py             # 主程序入口
```

---

# 四、安装 Git

## Windows 安装
官网下载：
```bash
🔗https://git-scm.com/
```



安装完成后使用以下工具打开均可：

- CMD
- PowerShell
- Windows Terminal
- VS Code 终端

输入：

```bash
git --version
```

如果显示类似：

```bash
git version 2.xx.x
```

说明安装成功。

---

# 五、Git 首次配置（只需要做一次）

## 1. 配置用户名

```bash
git config --global user.name "你的名字"
```

例如：

```bash
git config --global user.name "shfkjsa"
```

## 2. 配置邮箱

```bash
git config --global user.email "你的邮箱"
```

例如：

```bash
git config --global user.email "sfasfsas@qq.com"
```

## 3. 查看配置

```bash
git config --global --list
```

---

# 六、创建并初始化本地 Git 仓库

## 场景：你已经有一个本地项目文件夹

例如你的项目路径：

```bash
D:\Projects\my-project
```

进入项目目录：

```bash
cd D:\Projects\my-project
```

初始化 Git：

```bash
git init
```

执行后会生成一个隐藏目录：

```bash
.git
```

它就是 Git 的“版本数据库”。

> 说明：  
> 从这一刻起，这个文件夹就被 Git 管理了。

---

# 七、Git 最基础的工作流

Git 最核心的流程只有这 4 步：

```bash
工作区 → 暂存区 → 本地仓库 → 远程仓库
```

对应命令：

```bash
git add
git commit
git push
```

---

# 八、第一次提交本地代码

## 1. 查看当前文件状态

```bash
git status
```

如果你刚初始化，会看到很多“未跟踪文件”。

---

## 2. 把所有文件加入暂存区

```bash
git add .
```

说明：

- `.` 表示当前目录下所有文件
- 也可以只添加某个文件：

```bash
git add main.py
```

---

## 3. 提交到本地仓库

```bash
git commit -m "初始化项目"
```

这里的提交信息建议写清楚改动内容**是开发流程全过程可追踪的依据**
 
例如：

```bash
git commit -m "完成项目初始化结构"
git commit -m "新增登录功能"
git commit -m "修复首页按钮点击异常"
```

---

## 4. 查看提交记录

```bash
git log
```

简洁一点：

```bash
git log --oneline
```

示例输出：

```bash
a1b2c3d 初始化项目
d4e5f6g 新增登录功能
```

---

# 九、`.gitignore` 必须会写（非常重要）

`.gitignore` 用来告诉 Git：

-> 哪些文件不要提交到仓库<span style={{color: 'red'}}>（比如个人配置信息，敏感文件）</span>

---

## 1. 创建 `.gitignore`

在项目根目录创建文件：

```bash
.gitignore
```

---

## 2. 常见 Python 项目 `.gitignore` 示例

```gitignore
# Python 缓存
__pycache__/
*.pyc

# 虚拟环境
venv/
.env/

# IDE
.vscode/
.idea/

# 系统文件
.DS_Store
Thumbs.db

# 日志文件
*.log

# 数据库文件
*.sqlite3

# 临时文件
temp/
tmp/

# Obsidian
.obsidian/
```

---

## 3. 为什么要忽略这些？

因为这些文件通常：

- 体积大
- 自动生成
- 每个人本地都不同
- 上传后反而会污染仓库

---

# 十、写一个README.md（项目说明文件）

项目根目录建议创建：

```bash
README.md
```

示例：

```md
# My Project

这是一个用于学习 Git 和 GitHub 的项目。

## 功能
- Git 本地版本管理
- 上传 GitHub
- 分支开发
- 回滚恢复

## 运行方式

```bash
python main.py
```
```


> README 是别人打开你项目后最先看到的说明文档。

---

## 11. 把本地项目上传到 GitHub（完整流程）


### 1️⃣ 创建 GitHub 仓库

1. 打开 GitHub 官网：[GitHub](https://github.com/)
2. 登录后点击右上角 **"+" → New repository**。
3. 填写仓库名称，例如 `my-project`。
4. 建议勾选：
   - **Add a README file**（如果想让仓库有初始化说明）
   - ** Add .gitignore** (上边有介绍)
   - ** Add license**(可以问豆包等自行了解，这里不管)
1. 点击 **Create repository**。

---

### 2️⃣ 关联本地项目到远程仓库

假设你的 GitHub 仓库 URL 为：

```
https://github.com/yourusername/my-project.git
```

在本地项目目录执行：

```bash
# 查看当前远程仓库（如果已有远程可选）
git remote -v

# 添加远程仓库
git remote add origin https://github.com/yourusername/my-project.git

# 验证远程仓库是否添加成功
git remote -v
```

附：

你可以把 Git 的关系想成这样：

本地电脑上

```bash
main
dev
feature/login
```

GitHub上
```bash
origin/main
origin/dev
origin/feature/login
```

**`origin` 就像“GitHub 仓库的代号”**


修改地址就是改GitHub存储位置：  
  
```bash  
git remote set-url origin 新仓库地址  
```  
  
或者删除重加：  
  
```bash  
git remote remove origin  
git remote add origin 新仓库地址  
```


### 3️⃣ 上传本地分支到远程

#### 3.1 推送主分支（通常为 main）

```bash
git push -u origin main
```

- `-u`：设置上游分支，后续可以直接 `git push`。
- 如果你的默认分支是 `master`，请替换 `main` → `master`。


## 初级学到这停!
  
只要掌握了以下五个命令，后边就不用学了，后边是管理大型项目的，直接跳过

1-克隆仓库（示例）：
```bash
git clone https://github.com/CherryHQ/cherry-studio.git
```
2-添加修改：
```bash
git add .
```
3-提交修改并且说明修改内容：
```bash
git commit -m "添加新功能"
```
4-提交仓库到远程：
```bash
git push
```
这个地方没有使用 `git push -u origin main` 而是采取了简化指令，意思是每个项目只需要指定一次，后边正常开发就行

5-拉取远程仓库合并到本地（远程仓库有更新）：
```bash
git pull
```

---

#### 3.2 推送其他分支（可选）

```bash
# 创建并切换到新分支（faeture-branch）
git checkout -b feature-branch

# 添加并提交修改
git add .
git commit -m "添加新功能"

# 推送到远程
git push -u origin feature-branch
```

---

### 4️⃣ 合并远程分支（Pull + Merge）

假设你在本地 main 分支，需要合并远程更新：

```bash
# 拉取远程 main 分支并合并
git pull origin main
```

- 如果有冲突，按照 Git 提示修改冲突文件，再提交：

```bash
git add .
git commit -m "解决冲突"
```

---

### 5️⃣ 回滚操作技巧

#### 5.1 回滚到某个提交（本地）

```bash
# 查看提交历史
git log --oneline

# 回滚到指定提交（不会丢失后续修改，可用 --soft）
git reset --soft <commit_id>

# 回滚并丢弃后续修改
git reset --hard <commit_id>
```

#### 5.2 撤销已经推送的提交（谨慎使用）

```bash
# 强制推送到远程（覆盖远程历史）
git push origin main --force
```

> ⚠️ 强制推送可能导致团队其他成员仓库冲突，仅在个人项目或确认安全时使用。

---

### 6️⃣ 删除分支（本地和远程）

```bash
# 删除本地分支
git branch -d feature-branch

# 删除远程分支
git push origin --delete feature-branch
```

---

### 7️⃣ 常用高级技巧

| 技巧 | 命令 | 说明 |
|------|------|------|
| 查看远程仓库 | `git remote -v` | 显示远程仓库 URL |
| 暂存部分文件 | `git add <file>` | 只暂存指定文件 |
| 查看修改内容 | `git diff` | 查看未暂存的改动 |
| 查看提交历史 | `git log --oneline --graph --all` | 图形化查看历史 |
| 创建标签 | `git tag v1.0` | 给特定提交打标签 |
| 推送标签 | `git push origin v1.0` | 推送标签到远程 |
| 合并指定分支 | `git merge feature-branch` | 将 feature-branch 合并到当前分支 |
| 放弃工作区改动 | `git checkout -- <file>` | 放弃未提交的修改 |
| 暂存区回退 | `git reset HEAD <file>` | 从暂存区撤回修改 |

---

### 8️⃣  参考资料

- Git 官方文档：[Git 官网](https://git-scm.com/)
- GitHub 官方文档：[GitHub Docs](https://docs.github.com/)
- SSH 配置教程：[GitHub SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- 微雪电子Git操作演示：[微雪电子](https://www.bilibili.com/video/BV18hAnzYEk6/?share_source=copy_web&vd_source=60195daca539d0db3d14ee26efa4fac1)
---




