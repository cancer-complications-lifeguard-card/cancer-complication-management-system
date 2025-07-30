# 癌症并发症智能管理系统 (Cancer Complication Management System)

🏥 为癌症患者及家属提供全周期并发症管理支持的智能系统

## 📋 项目概述

本系统是一个专为癌症患者及其家属设计的智能化并发症管理平台，覆盖日常预防、症状响应、紧急救治全流程。通过AI智能分诊、多模态交互和三重安全防护，为用户提供专业、便捷、安全的医疗支持服务。

## 🌟 核心特性

### 🔄 用户分层与阶段管理
- **三阶段管理**: 日常/查询/发病阶段，动态权限调整
- **多角色支持**: 患者、家属、护理人员差异化服务
- **智能状态切换**: 根据症状严重程度自动调整权限

### 🧠 知识图谱中心
- **可视化风险树**: 直观展示并发症关联性
- **医疗术语百科**: 全面的医疗知识库
- **NCCN指南集成**: 权威医疗指导

### 📊 个人健康档案
- **数字化病历管理**: 结构化医疗记录存储
- **智能用药提醒**: AI驱动的用药管理
- **症状跟踪**: 实时症状监测和记录

### 📈 生命体征监测
- **可穿戴设备接入**: 支持多种健康监测设备
- **AI预警系统**: 智能识别异常指标
- **实时数据分析**: 连续健康状态评估

### 🔍 智能分诊引擎
- **多模态症状分析**: 文本+语音+图片综合分析
- **分级预警机制**: 4层严重程度分级
- **专科推荐**: 智能匹配合适的医疗专科

### 🗺️ 医疗资源导航
- **急诊地图**: 实时定位最近医疗设施
- **专家门诊**: 专科医生资源查询
- **医疗机构评级**: 基于距离和评价的智能推荐

### 🆘 小红卡急救系统
- **急救卡生成**: 包含关键医疗信息的应急卡片
- **一键120呼叫**: 紧急情况快速求助
- **QR码医疗信息**: 扫码获取患者关键信息

## 🛠️ 技术栈

### 前端技术
- **Next.js 15**: React全栈框架
- **React 19**: 现代UI组件库
- **Tailwind CSS V3**: 原子化CSS框架
- **TypeScript**: 类型安全的JavaScript

### 后端技术
- **Next.js API Routes**: 服务端API
- **Drizzle ORM**: 类型安全的数据库ORM
- **PostgreSQL**: 关系型数据库
- **JWT**: 安全认证

### AI和多媒体
- **Web Speech API**: 语音识别
- **Canvas API**: 图像处理
- **机器学习**: 症状分析和预警

### 安全和合规
- **AES-256-GCM加密**: 医疗数据加密
- **RBAC权限控制**: 基于角色的访问控制
- **审计日志**: 完整的操作记录

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/cancer-complications-lifeguard-card/cancer-complication-management-system.git
cd cancer-complication-management-system
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
npm run db:setup
```

4. **数据库初始化**
```bash
npm run db:migrate
npm run db:seed
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
打开 [http://localhost:3000](http://localhost:3000)

### 默认测试账户
- **邮箱**: `test@test.com`
- **密码**: `admin123`

## 📱 系统架构

### 三阶段实施计划

#### 🏗️ 阶段一：基础功能 (已完成)
- ✅ 用户管理与权限系统
- ✅ 知识图谱和医疗百科
- ✅ 个人健康档案管理
- ✅ 生命体征监测平台
- ✅ 智能分诊引擎
- ✅ 医疗资源导航
- ✅ 急救卡系统
- ✅ 三重安全防护

#### 📱 阶段二：移动端整合 (进行中)
- ✅ 移动响应式设计
- ✅ PWA离线功能
- ✅ 多模态交互界面 (文本+语音+图片)
- 🔄 实时数据监测和预警
- 📋 移动端测试优化

#### 🏥 阶段三：医院系统对接 (计划中)
- 📋 医院API集成
- 📋 电子病历系统对接
- 📋 医疗AI标准合规
- 📋 端到端系统测试
- 📋 生产环境部署

## 🔒 安全特性

### 三重安全防护
1. **数据加密层**: AES-256-GCM军用级加密
2. **访问控制层**: 基于角色和阶段的权限管理
3. **合规监控层**: 全面审计日志和异常检测

### 医疗数据保护
- 端到端加密传输
- 定期密钥轮换
- 数据完整性验证
- 符合医疗隐私法规

## 🧪 开发工具

### 代码质量
```bash
npm run lint          # ESLint代码检查
npm run type-check     # TypeScript类型检查
```

### 环境测试
```bash
npm run test:env       # 环境检测
npm run test:mobile    # 移动端测试
npm run test:pwa       # PWA功能测试
```

### 数据库管理
```bash
npm run db:generate    # 生成数据库迁移
npm run db:migrate     # 执行数据库迁移
npm run db:studio      # 打开数据库管理界面
```

## 📖 文档

- [安全文档](./docs/SECURITY.md) - 详细的安全架构和使用指南
- [合并说明](./PACKAGE_MERGE_SUMMARY.md) - 包配置合并记录

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目使用 MIT 许可证 - 请查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 团队

本项目由 Cancer Complications Lifeguard Card 团队开发和维护。

## 📞 支持

如果您有任何问题或需要支持，请：

- 📧 提交 [GitHub Issue](https://github.com/cancer-complications-lifeguard-card/cancer-complication-management-system/issues)
- 💬 参与 [Discussions](https://github.com/cancer-complications-lifeguard-card/cancer-complication-management-system/discussions)

## 🌟 致谢

感谢所有为改善癌症患者生活质量而努力的医疗工作者和开发者。

---

**🎯 愿景**: 通过技术创新，为每一位癌症患者及其家属提供更好的医疗支持和生活质量保障。

**💝 使命**: 让先进的医疗AI技术真正服务于患者，让复杂的医疗信息变得简单易懂，让紧急救助更加及时有效。