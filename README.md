# AI Trending

GitHub 热门 AI 项目追踪 · 每日自动更新

📱 **移动端优先**的极简黑白风格页面，按 **昨日 / 本周 / 本月 / 半年** 四个维度展示 GitHub 上最热门的 AI 开源项目。

## 特性

- 极简黑白设计，支持暗色模式
- 移动端优先，触控友好
- 四个时间维度切换
- 点击项目卡片查看详细介绍
- GitHub Actions 每日自动更新数据
- 零外部依赖，纯静态站点

## 本地运行

```bash
# 安装依赖
pip install requests

# 设置 Token（可选，不设置也能用但频率受限）
export GITHUB_TOKEN="your_token"

# 拉取数据
python fetch_trending.py

# 启动本地服务器
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 部署

项目已配置 GitHub Pages + GitHub Actions：

1. Fork 或克隆此仓库
2. 在 Settings → Pages 中启用 GitHub Pages（Source: `main` branch, `/ (root)`）
3. GitHub Actions 将每日自动更新 `data/` 目录下的数据
4. 站点地址：`https://<username>.github.io/ai-trending/`
