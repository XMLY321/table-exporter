# 表格导出助手 (Table Exporter)

一个轻量级浏览器扩展，检测网页中的 HTML 表格，一键导出为 CSV 文件。

## 功能

- 自动检测当前网页所有 `<table>` 元素
- 鼠标悬停高亮，点击标签选中/取消
- 工具栏弹窗列出所有表格（行数 × 列数）
- 多选导出，合并为单个 CSV 文件
- 纯本地处理，不收集任何数据

## 安装

### Chrome / Edge 开发模式

1. 克隆仓库或下载 ZIP
2. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）
3. 开启**开发者模式**
4. 点击**加载已解压的扩展程序**，选择项目文件夹
5. 完成

### 从商店安装（即将上线）

待上架 Chrome Web Store / Edge Add-ons。

## 使用

1. 打开任意包含表格的网页
2. 表格左上角会出现 `📊 导出` 标签
3. 点击标签选中表格（高亮变绿）
4. 点击工具栏图标，勾选要导出的表格
5. 点击**导出选中表格**，CSV 自动下载

## 项目结构

```
table-exporter/
├── manifest.json          # 扩展配置 (Manifest V3)
├── content/
│   ├── content.js         # 表格检测、高亮、数据提取
│   └── content.css        # 高亮样式
├── popup/
│   ├── popup.html         # 弹窗界面
│   ├── popup.css          # 弹窗样式
│   └── popup.js           # 表格列表、CSV 导出
└── icons/                 # 扩展图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 技术栈

纯原生 HTML / CSS / JavaScript，不依赖任何框架或构建工具。

- Manifest V3
- Content Script + Popup 通信
- CSV 生成（UTF-8 BOM 兼容 Excel）
- MutationObserver 监听动态加载表格

## 隐私

本扩展**不收集、不存储、不上传**任何数据。详见 [隐私政策](privacy.html)。

## 许可

MIT License
