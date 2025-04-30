# 塔罗牌抽取应用

这是一个基于 Next.js 开发的塔罗牌抽取应用，支持移动端和桌面端。

## 功能特点

- 支持随机抽取和手动选择塔罗牌
- 移动端优化的扇形布局展示
- 支持正逆位显示
- 响应式设计，适配不同设备

## 技术栈

- Next.js 14
- React
- TypeScript
- Tailwind CSS

## 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd my-nextjs-app
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 运行开发服务器
```bash
npm run dev
# 或
yarn dev
```

4. 构建生产版本
```bash
npm run build
# 或
yarn build
```

## 项目结构

```
my-nextjs-app/
├── app/                # 应用主目录
│   ├── page.tsx       # 桌面端主页面
│   ├── mobile/        # 移动端页面
│   └── globals.css    # 全局样式
├── public/            # 静态资源
└── package.json       # 项目配置
```

## 环境变量

项目需要以下环境变量：

```env
NEXT_PUBLIC_API_URL=你的API地址
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License 