# 实验室动物信息管理系统

## 🛠 技术栈
- Frontend: React 18 + TypeScript + Ant Design 5 + Vite
- Backend: NestJS + TypeORM + class-validator
- Database: MySQL 8.0

## 🚀 启动指南 (How to Run)
1. 确保 Docker Desktop 已启动。
2. 在根目录执行：`docker compose up --build`
3. 等待容器启动完成（首次构建约3-5分钟）...

## 🔗 服务地址 (Services)
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Database: localhost:3306 (user: root / pass: root123456)

## 🔑 测试账号
- 用户名: `admin`
- 密码: `admin123`
- 角色: 系统管理员

## 📋 功能模块
- **动物信息管理**: 添加、编辑、删除和查询动物记录
- **健康状况跟踪**: 记录动物体检信息、诊断和治疗方案
- **实验项目管理**: 管理实验项目及动物关联
- **饲养记录管理**: 记录每日喂养详情
- **数据统计分析**: 多维度数据可视化统计

## 🐳 Docker 配置
- MySQL: 3306
- Backend (NestJS): 8000
- Frontend (React): 3000

## 📦 项目结构
```
label-2326/
├── docker-compose.yml
├── frontend/          # React + Ant Design 前端
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── backend/           # NestJS 后端
│   ├── Dockerfile
│   └── src/
├── mysql/             # 数据库初始化脚本
│   └── init.sql
└── README.md
```
