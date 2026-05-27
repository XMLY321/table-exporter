# Home Assistant + DeepSeek 部署实战总结

> 时间：2026-05-27 | 服务器：阿里云 ECS 2核2G 40G Ubuntu 22.04 | 公网 IP：47.98.187.156

## 项目概述

在阿里云 ECS 上部署 Home Assistant，集成 DeepSeek V4 Pro 对话代理和米家智能设备，实现语音/文字控制智能家居。

## 最终成果

| 服务 | 地址 | 部署方式 |
|------|------|---------|
| Home Assistant | http://47.98.187.156:8080 | Docker host 网络 |
| DeepSeek 对话代理 | 集成在 HA 中 | core.config_entries 手动配置 |
| Xiaomi Miot Auto | 集成在 HA 中 | custom_components 手动安装 |
| Halo 博客 | 已停 | Docker /opt/halo |
| 兰空图床 | 已停 | Docker /opt/lsky |
| 监控告警 | 每天 9:00 → 微信 | cron + Server酱 |

---

## 问题与解决方案

### 问题 1：Docker Hub 无法拉取镜像

**现象：** `docker pull` 全部超时

**原因：** GFW 封锁 Docker Hub

**解决：**
```
# /etc/docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.1panel.live",
    "https://hub.rat.dev",
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
```
使用 `docker.1panel.live` 代理拉取镜像，DaoCloud 镜像某些包返回 403 不能用。

**教训：** 国内服务器必须先配置 Docker 镜像加速。

---

### 问题 2：UFW 防火墙阻挡外部访问

**现象：** 服务器本地能访问端口，外部无法连接

**原因：** 阿里云有**两层防火墙**：
1. 云平台安全组（控制台管理）
2. UFW 系统防火墙（服务器上）

两层都需要放行。

**解决：**
```bash
ufw allow 8080/tcp         # 系统层
# 阿里云控制台 → 安全组 → 入方向 → 添加 8080/8080
```

**教训：** 每开一个新端口，两层防火墙都要配置。

---

### 问题 3：Home Assistant "Invalid client id"（核心难题，耗时最长）

**现象：** 浏览器打开 HA 页面后，登录时总是报 "Invalid client id"

**根因分析：**
- HA 的 OAuth 登录流程需要 `client_id` 与请求的 `Host` 头匹配
- HTTP 默认端口 80 被浏览器省略（`window.location.origin` = `http://47.98.187.156`）
- 但 HA 内部验证需要 `http://47.98.187.156:80/`（带端口）
- 如果在 8080 端口：浏览器 origin 是 `http://47.98.187.156:8080`，能正常匹配

**尝试过的方案（均失败）：**
1. Docker bridge 网络 + 端口映射（80→8123）— Host 头丢失
2. Docker host 网络 + HA 监听 80 端口 — 默认端口歧义
3. Nginx 反向代理 — 同样端口歧义
4. iptables 端口转发 — 同上
5. 手动修改 OAuth 客户端注册 — HA 2026.5 不认
6. 配置 `trusted_networks` 认证 — HA 2026.5 不支持 YAML 配置
7. 配置 `external_url` 带/不带端口 — 无效

**最终解决：**
- HA 监听**非标准端口 8080**
- 用户访问 `http://47.98.187.156:8080`（浏览器保留 :8080 在 origin 中）
- `client_id` 匹配一致

**教训：** Web 应用部署在非标准端口上，OAuth 的 origin/client_id 匹配更可靠。尽量避免在 80/443 上直接跑带 OAuth 的服务。

---

### 问题 4：配置 DeepSeek 对话代理

**现象：** HA 的 OpenAI Conversation 集成无法通过 API 配置

**原因：**
- 集成只支持 UI 配置（不支持 configuration.yaml）
- API 配置流程第一步验证 API key 时连接 OpenAI 默认端点（被墙），导致流程卡住
- 形成死循环：需要先连上才能改 base_url，但改不了 base_url 就永远连不上

**解决：**
直接修改 HA 存储文件 `core.config_entries`，手动写入配置：
```json
{
  "domain": "openai_conversation",
  "data": {
    "api_key": "sk-xxx",
    "base_url": "https://api.deepseek.com",
    "model": "deepseek-v4-pro",
    "max_tokens": 4096,
    "temperature": 0.7,
    "llm_hass_api": true
  }
}
```

**教训：** 国内服务器上配置国外 API 服务时，经常需要绕过在线验证流程，直接操作配置文件。

---

### 问题 5：HA 反复进入 Recovery Mode

**现象：** 修改 configuration.yaml 后 HA 进入恢复模式

**原因：**
1. `session_lifetime` 配置格式不兼容当前版本
2. `openai_conversation` 不支持 YAML 配置（残留配置导致报错）
3. 配置文件缩进或格式错误

**解决：**
- 回退到最简配置
- 删除不支持的 YAML 配置项
- 每次改配置前备份

**教训：** HA 配置项在不同版本间变化大，不熟悉的配置不要盲加。出问题先回退最小配置。

---

### 问题 6：安装 HACS / 自定义组件

**现象：** GitHub 下载超时，apt 安装 unzip 失败

**原因：**
- GitHub Releases 在国内服务器上下载超时
- Aliyun apt 镜像某些包 404

**解决：**
- 本地下载 → SCP 上传到服务器
- 用 Python `zipfile` 模块替代 `unzip` 命令

```python
import zipfile
with zipfile.ZipFile('/tmp/hacs.zip', 'r') as z:
    z.extractall('/opt/homeassistant/config/custom_components/hacs')
```

**教训：** 国内服务器环境缺工具时，Python 是万能兜底方案。

---

### 问题 7：Swap 缺失

**现象：** `free -h` 显示 `Swap: 0B`

**原因：** 阿里云 ECS 默认不创建 swap

**影响：** 内存耗尽时直接 OOM kill 进程，没有缓冲

**解决：**
```bash
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**教训：** 新服务器应第一时间检查并配置 swap。

---

### 问题 8：Xiaomi Home 集成无法登录

**现象：** HA 原生 Xiaomi Home 集成凭据验证失败

**解决：** 换用第三方 **Xiaomi Miot Auto** 集成（HACS 安装），支持更多设备且登录更稳定。

---

## 关键架构决策

1. **Docker host 网络模式** — 省去端口映射的复杂性，性能更好
2. **8080 非标准端口** — 解决 OAuth client_id 匹配问题
3. **手动操作存储文件** — 绕过 HA 在线验证流程的限制
4. **Server酱 + cron** — 简单的监控告警，不依赖 SMTP
5. **Python 兜底** — 当 apt/unzip 等工具缺失时的替代方案

## 安全提醒

- 阿里云免费试用 3 个月，到期前（约 2026-08-27）需决定续费或释放
- 按使用流量计费，每月 20GB 免费额度
- 当前 Swap 1G，内存总计 2.6G（1.6G 物理 + 1G swap）
- 密码 `admin123` 建议改成强密码
