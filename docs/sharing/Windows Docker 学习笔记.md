# Windows Docker 学习笔记

---

## 1. 安装 Docker Desktop

1. 下载 Docker Desktop（Windows 版本）并安装
2. 安装完成后打开 Docker Desktop，确保 Docker Engine 已启动
3. 打开终端（PowerShell 或 CMD），检查版本：
```bash
docker version
```

输出类似：

```bash
Docker version 29.3.1, build c2be9cc
```

---

## 2. 验证安装是否成功

1. 拉取并运行 `hello-world` 测试镜像：
   ```bash
   docker run hello-world
   ```
2. 输出 `Hello from Docker!` 即表示安装成功

## 3. 基础容器管理命令

|命令|功能|
|---|---|
|`docker ps`|查看正在运行的容器|
|`docker ps -a`|查看所有容器，包括已停止|
|`docker run <镜像>`|新建并启动容器|
|`docker stop <容器名或ID>`|停止容器|
|`docker start <容器名或ID>`|启动已存在容器|
|`docker rm <容器名或ID>`|删除容器|
|`docker exec -it <容器名或ID> bash`|进入容器终端|

---

## 4. 进入容器查看文件系统

1. 启动 Nginx 容器：
   ```bash
   docker run -d -p 8080:80 --name mynginx nginx
   ```
2. 进入容器：
   ```bash
   docker exec -it mynginx bash
   ```
3. 查看当前目录：
   ```bash
   pwd
   ls
   ```
4. 退出容器：

```bash
exit
```

容器有独立的 Linux 文件系统，默认路径 `/usr/share/nginx/html` 用于网页文件。

---

## 5. 挂载本地目录进行开发（开发模式）

1. 在 Windows 上创建本地网页目录：
   ```bash
   D:\docker-nginx-demo
   ```
2. 新建 `index.html` 文件：
   ```HTML
   <h1>Hello from my local folder</h1>
   ```
3. 在 Docker Desktop 中共享 D 盘：

   打开 Docker Desktop → Settings → Resources → File Sharing → 勾选 D 盘 → 应用并重启 Docker

4. 删除旧容器：

```bash
docker rm -f mynginx
```

5. 启动带挂载的 Nginx 容器：

```bash
docker run -d -p 8080:80 --name mynginx -v /d/docker-nginx-demo:/usr/share/nginx/html:ro nginx
```

6. 浏览器访问：在浏览器中打开 `http://localhost:8080`

关键点：

- `/d/docker-nginx-demo` 是 Linux 容器可识别的 Windows 路径
- `:ro` 表示只读挂载，防止容器覆盖本地文件
- 修改本地文件，容器里网页会实时更新

## 6. Dockerfile 构建镜像（复现模式）

1. 在本地目录 `D:\docker-nginx-demo` 创建 `Dockerfile`：
   ```dockerfile
   FROM nginx:latest
   COPY . /usr/share/nginx/html
   ```
2. 构建镜像：
   ```bash
   docker build -t my-webpage .
   ```
3. 运行镜像（不挂载本地目录）：
   ```bash
   docker run -d -p 8081:80 --name mynginx-prod my-webpage
   ```
4. 浏览器访问：
   ```
   http://localhost:8081
   ```
- 显示的是 Dockerfile 打包的内容，与本地文件无关

关键点：

- Dockerfile + 镜像 = 可复现环境
- 挂载卷 = 实时开发环境
- 可以同时运行开发容器（挂载本地文件）和生产容器（镜像自带文件）

## 7. 总结

|功能|方法|
|---|---|
|本地开发|挂载卷 `-v <本地路径>:<容器路径>`，修改本地文件实时生效|
|打包复现|Dockerfile + `docker build` → 镜像，`docker run` → 容器，环境可复现|
|容器管理|`ps`, `stop`, `start`, `rm`, `exec`|
|文件系统|容器内部独立 Linux 文件系统，路径 `/usr/share/nginx/html` 存网页文件|

