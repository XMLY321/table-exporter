# 第 9 课：Shell 脚本基础

## 目标

学会写简单的 Shell 脚本，实现自动化。

## Hello World

```bash
#!/bin/bash
# 这是我的第一个脚本

echo "Hello World"
echo "当前时间: $(date)"
echo "当前用户: $(whoami)"
```

保存为 `hello.sh`，`chmod +x hello.sh`，`./hello.sh`。

`#!/bin/bash` 叫 shebang，告诉系统用哪个解释器。

## 变量

```bash
#!/bin/bash
# 定义变量（等号两边不能有空格！）
name="XMLY"
age=26
server_ip="47.98.187.156"

# 使用变量
echo "我叫 $name"
echo "年龄 ${age}岁"    # 用 {} 包裹变量，避免歧义
echo "服务器: $server_ip"

# 命令结果赋给变量
now=$(date)
files=$(ls | wc -l)
echo "现在时间: $now"
echo "当前目录有 $files 个文件"

# 只读变量
readonly PI=3.14
# PI=3.15  会报错
```

## 条件判断

### if 语句

```bash
#!/bin/bash
score=85

if [ $score -ge 90 ]; then
    echo "优秀"
elif [ $score -ge 60 ]; then
    echo "及格"
else
    echo "不及格"
fi
```

### 数字比较

| 运算符 | 含义 |
|--------|------|
| `-eq` | == |
| `-ne` | != |
| `-gt` | > |
| `-lt` | < |
| `-ge` | >= |
| `-le` | <= |

### 字符串比较

```bash
if [ "$name" = "XMLY" ]; then
    echo "同名"
fi

if [ -z "$var" ]; then   # 是否为空
    echo "变量为空"
fi

if [ -n "$var" ]; then   # 是否非空
    echo "变量有值"
fi
```

### 文件测试

```bash
if [ -f "$file" ]; then echo "是普通文件"; fi
if [ -d "$dir" ]; then echo "是目录"; fi
if [ -e "$path" ]; then echo "存在"; fi
if [ -r "$file" ]; then echo "可读"; fi
if [ -w "$file" ]; then echo "可写"; fi
if [ -x "$file" ]; then echo "可执行"; fi
```

## 循环

### for 循环

```bash
# 遍历列表
for name in Alice Bob Charlie; do
    echo "Hello, $name"
done

# 遍历数字
for i in {1..5}; do
    echo "第 $i 次"
done

# 遍历文件
for file in *.txt; do
    echo "处理: $file"
done
```

### while 循环

```bash
count=1
while [ $count -le 5 ]; do
    echo "第 $count 次"
    count=$((count + 1))
done
```

## 函数

```bash
#!/bin/bash

# 定义函数
greet() {
    echo "你好, $1!"
}

# 调用函数
greet "XMLY"
greet "World"

# 有返回值的函数
sum() {
    return $(($1 + $2))
}

sum 3 5
echo "3 + 5 = $?"    # $? = 上一条命令的返回值
```

`$1`, `$2` 是函数的参数。`$?` 取返回值（只能 0-255）。

## 常用特殊变量

| 变量 | 含义 |
|------|------|
| `$0` | 脚本名 |
| `$1` ~ `$9` | 第 1-9 个参数 |
| `$#` | 参数个数 |
| `$?` | 上一条命令的退出码 |
| `$$` | 当前脚本的 PID |
| `$@` | 所有参数（每个独立） |
| `$*` | 所有参数（合并为一个） |

## 实用示例

### 备份脚本

```bash
#!/bin/bash
# backup.sh - 备份指定目录

SOURCE=${1:-/opt/halo}              # 第一个参数，默认 /opt/halo
BACKUP_DIR=/root/backups
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${DATE}.tar.gz"

mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/$FILENAME" "$SOURCE"

echo "备份完成: $BACKUP_DIR/$FILENAME"
echo "大小: $(du -h $BACKUP_DIR/$FILENAME | cut -f1)"
```

### 健康检查脚本

```bash
#!/bin/bash
# check.sh - 检查服务状态

check_service() {
    if systemctl is-active --quiet $1; then
        echo "✅ $1 运行中"
    else
        echo "❌ $1 已停止"
    fi
}

check_url() {
    if curl -sI --connect-timeout 3 "$1" > /dev/null; then
        echo "✅ $1 可访问"
    else
        echo "❌ $1 无法访问"
    fi
}

echo "=== 服务器状态检查 ==="
echo "时间: $(date)"
echo "运行时间: $(uptime -p)"
echo "内存: $(free -h | awk '/^Mem/{print $3"/"$2}')"
echo "磁盘: $(df -h / | awk 'NR==2{print $3"/"$2}')"
echo ""
echo "=== 服务检查 ==="
check_service docker
check_service ssh
echo ""
echo "=== 网站检查 ==="
check_url http://47.98.187.156
check_url http://47.98.187.156:8080
```

## 实战演示

```bash
# 创建第一个脚本
cat > ~/hello.sh << 'EOF'
#!/bin/bash
echo "Hello from $(hostname)!"
echo "现在是 $(date)"
echo "已经运行了 $(uptime -p)"
EOF

chmod +x ~/hello.sh
./hello.sh

# 试试检查脚本
cat > ~/health-check.sh << 'EOF'
#!/bin/bash
echo "内存使用: $(free -h | awk '/^Mem/{print $3}')"
echo "磁盘剩余: $(df -h / | awk 'NR==2{print $4}')"
echo "Docker容器: $(docker ps -q | wc -l) 个在运行"
EOF

chmod +x ~/health-check.sh
./health-check.sh

# 清理
rm ~/hello.sh ~/health-check.sh
```

## 练习

1. 写一个 `info.sh`，输出主机名、当前用户、时间
2. 写一个脚本，接受一个 URL 参数，用 curl 访问并输出 HTTP 状态码
3. 写一个 for 循环，遍历 `/etc` 下所有 `.conf` 文件并统计数量
