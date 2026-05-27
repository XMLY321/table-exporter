# Linux 基础入门课程

10 节课，从零学会操作 Linux 服务器。

**学习环境：** 阿里云 ECS，Ubuntu 22.04，2核2G

**学习方式：** 每节课我会连上服务器演示所有命令，你跟着看结果就行。不用自己装任何东西。

## 课程目录

| 课时 | 内容 | 学完能做什么 |
|------|------|-------------|
| [第1课](1-服务器初探.md) | 服务器初探 | 查看系统信息、磁盘、内存 |
| [第2课](2-文件操作.md) | 文件操作 | 创建、移动、删除文件 |
| [第3课](3-文件权限.md) | 文件权限 | 理解读写执行权限 |
| [第4课](4-用户管理.md) | 用户管理 | 新增用户、切换身份 |
| [第5课](5-进程管理.md) | 进程管理 | 查看、杀死进程 |
| [第6课](6-软件包管理.md) | 软件包管理 | 安装/卸载软件 |
| [第7课](7-网络基础.md) | 网络基础 | 端口、域名、下载 |
| [第8课](8-服务管理.md) | 服务管理 | 启停服务、查看日志 |
| [第9课](9-Shell脚本.md) | Shell 脚本 | 写自动化脚本 |
| [第10课](10-实战部署.md) | 实战：部署网站 | 把 HTML 页面放上线 |

## 命令速查表

学完 10 课后你常用的命令：

```
# 系统状态
whoami          # 我是谁
hostname        # 主机名
uname -a        # 系统版本
uptime          # 运行时间
df -h           # 磁盘空间
free -h         # 内存使用

# 文件
ls -la          # 列出文件
mkdir -p a/b    # 创建多层目录
cp -r a b       # 复制目录
mv a b          # 移动/重命名
rm -rf a        # 删除目录
cat file.txt    # 查看文件
nano file.txt   # 编辑文件

# 权限
chmod 755 file  # 改权限
chown user file # 改所有者

# 进程
ps aux          # 所有进程
top             # 实时监控
kill -9 PID     # 强制杀进程

# 软件
apt update      # 更新源
apt install xx  # 安装
apt remove xx   # 卸载

# 网络
ping ip         # 测试连通性
curl url        # 请求网页
ss -tlnp        # 查看监听端口

# 服务
systemctl status xx    # 查看状态
systemctl start xx     # 启动
systemctl stop xx      # 停止
journalctl -u xx -f    # 查看日志
```
