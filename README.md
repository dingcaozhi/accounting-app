# 记账助手 - Accounting App

一个简洁美观的个人记账H5应用，支持收支记录、分类管理和数据导出。

## 功能特点

- 用户注册/登录系统
- 收入/支出分类记录
- 自定义收支分类
- 月度统计概览
- 数据导出/导入（JSON备份）
- 响应式设计，支持手机和桌面
- 本地存储，数据安全

## 技术栈

- 纯前端：HTML5 + CSS3 + JavaScript
- 数据存储：LocalStorage
- 部署：Netlify

## 部署指南

### 方式一：Netlify Drop（最简单）

1. 将整个项目文件夹压缩为ZIP
2. 访问 https://app.netlify.com/drop
3. 拖拽ZIP文件到网页
4. 完成部署！

### 方式二：GitHub + Netlify

1. 推送代码到GitHub
2. 登录 https://app.netlify.com
3. Import project → 选择GitHub仓库
4. 构建设置：Publish directory: `.`
5. Deploy

## 使用说明

1. **注册/登录**：首次使用需要创建账户
2. **记一笔**：点击"记支出"或"记收入"
3. **管理分类**：分类弹窗中可添加/删除分类
4. **查看统计**：首页显示本月收支结余
5. **数据备份**：设置中导出JSON文件

## License

MIT License
