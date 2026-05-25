# Copsidian 下一步优化与重构计划

在完成了第一阶段的核心架构问题（JSON-RPC 流解析性能、请求超时机制、SyncEngine 与视图层的并发冲突等）修复后，项目在稳定性和底层架构上已经有了显著提升。

根据《Copsidian 项目架构审查与问题分析报告》遗留的问题，接下来的工作重点将转移到 **UI 视图层的解耦** 和 **i18n 国际化机制的重构**。

## 阶段一：重构臃肿的 `CopsidianView` (消除单体化风险)

~~目前 `CopsidianView.ts` 文件体积庞大（约 1250 行）~~（**已将拖拽逻辑抽离，文件体积已减少到约 1150 行**）。但该类仍承担了过多的 UI 渲染职责，我们将继续把独立的功能块剥离出去。

### 核心任务：抽象剩余的独立 UI 组件

1. **拖拽与文件上传模块 (`DragDropManager`) - ✅ 已完成**
   - **现状**：成功抽离为 `src/view/dragDropManager.ts`，事件绑定与 Base64 解析已完全解耦。

2. **行内差异对比面板 (`InlineEditPanel`)**
   - **目标**：将 `showInlineEditDiff`、`applyInlineEdit`、`clearInlineEditState` 及其 DOM 渲染逻辑抽离为独立的 Component 类。
   - **好处**：此部分逻辑独立性强，抽出后可以极大地减少主类的体积，且未来可以复用于其他非侧边栏视图。

3. **权限审批面板 (`PermissionBanner`)**
   - **目标**：将 `showPermissionBanner` 及其关联的 Promise 决议逻辑抽离。
   - **好处**：UI 代码与 Agent 通信层做一定程度的解耦。

4. **欢迎页面 (`WelcomeView` 或 `WelcomePanel`)**
   - **目标**：抽离 `showWelcome` 及空状态处理的纯展示逻辑。

## 阶段二：重构脆弱的 i18n 国际化更新机制

目前的国际化更新依赖于在 `refreshLocale` 方法中手动查询 DOM 节点并修改 `textContent`（例如 `refreshInlineEditLocale` 中大量使用了 `querySelector`）。这种“命令式 DOM 查询”非常脆弱，任何 CSS 类名的改变都可能导致语言切换失败。

### 核心任务：引入简单的 Pub/Sub 事件总线或响应式绑定

1. **构建事件发射器 (Event Emitter)**
   - 在 `src/i18n/index.ts` 或独立的工具类中，建立一个全局的语言变更订阅中心。
   - `setLocale()` 调用时触发广播。

2. **组件级别的自我管理**
   - 之前分离出的独立 UI 组件（如 `InputToolbar`, `ChatInput`, `InlineEditPanel`）将在自己的 `onOpen`/`constructor` 中订阅语言变更事件。
   - 当收到变更事件时，组件自行调用其内部局部的更新逻辑，或者清空 DOM 重绘，而不是由 `CopsidianView` 这个超级类统一去指挥。
   - 对于纯文本按钮或简单的 DOM 元素，可以设计一个帮助函数（例如 `bindLocale(el, () => t().someKey)`），在底层自动处理订阅和更新。

## 阶段三：测试与验证机制完善

1. **单元测试补全**
   - 针对剥离出来的独立模块（如 `DragDropManager`），编写隔离的单元测试。
   - 确保重构不引入新的 UI 回归错误。

2. **代码规范审查**
   - 重新运行 `npm run check` 确保 TypeScript 严格类型不被破坏。
   - 通过所有重构后组件的 `npm test`。

---

**预期结果**：
通过执行上述计划，`CopsidianView.ts` 的代码量将显著减少，功能职责分明，测试覆盖率提升，从而为未来引入多窗口、多 Agent 协同等复杂交互打下坚实的框架基础。
