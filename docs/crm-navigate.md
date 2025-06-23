# CRM 路由跳转统一接口设计与实现建议

## 1. 统一跳转方法

- 新增一个统一的跳转方法（如：`crmNavigate`），用于处理所有 CRM 路由跳转需求。
- 方法参数：`{ url, payload, desc }`
  - `url`：目标路由地址
  - `payload`：可选，跳转时需要传递的数据
  - `desc`：可选，跳转描述或用途说明
- 该方法作为唯一入口，便于后续维护和扩展。

## 2. Iframe 跳转实现

- 推荐将 CRM 跳转逻辑独立为一个 iframe 部署，便于与主应用解耦。
- 通过 postMessage 或其他通信机制，实现主应用与 iframe 之间的安全、可靠通信。
- iframe 内部实现对 `crmNavigate` 的调用，并根据参数完成实际路由跳转。

## 3. 其他建议

- 统一接口便于权限校验、埋点统计等后续功能扩展。
- 建议补充接口调用示例和异常处理说明，提升开发效率。

## 参数 TypeScript 定义

```ts
interface CrmNavigateParams {
  url: string;
  payload?: Record<string, any>;
  desc?: string;
}
```

## 参数示例

```json
{
  "url": "/crm/customer/detail",
  "payload": {
    "customerId": "123456",
    "tab": "profile"
  },
  "desc": "跳转到客户详情页并默认展示资料tab"
}
```

# AI 增强相关任务

## 1. MCP、RAG 应用原型开发

- 基于 MCP 协议，开发可扩展的 AI 工具接口原型。
- 集成 RAG（Retrieval-Augmented Generation）能力，实现知识检索与问答。
- 支持多数据源接入，便于后续扩展。
- 提供基础的 API 文档和使用示例。

## 2. 智能推荐与自动化流程

- 设计并实现基于用户行为和上下文的智能推荐功能。
- 支持自动化业务流程编排，如自动分配、智能提醒等。
- 预留接口，便于后续与 CRM 跳转、数据分析等模块集成。

# MCP-RAG 端到端原型任务拆解

【前端已完成部分】
- 交互逻辑、界面开发已完成
- openai sdk 对接已完成
- MCP 工具请求参数拼接已完成

【前端待办】
- MCP 工具链接口联调（query_url、term_match 等）
- 检索结果结构化展示与交互优化
- 多 collection 检索类型切换与参数配置
- 错误处理、loading、无结果等友好提示

【后端待办】
- MCP Server（main.py）：一键启动/关闭子服务，转发工具接口
- rag_server：/query、/term_query、/aggregate 实现，聚合元数据与向量检索
- vector_server：/vector_search 路由，支持 collection、id_list、top_k、query
- pg_server：多表 mock 查询，支持 where 条件筛选
- preprocess_data.py：mock 数据生成与扩展
- 各服务 API 文档与基础测试

【协作建议】
- 前后端接口严格按文档约定，优先联调 mock 流程，逐步扩展真实数据
