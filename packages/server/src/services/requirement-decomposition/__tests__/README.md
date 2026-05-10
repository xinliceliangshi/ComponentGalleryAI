# Requirement Decomposition Test Boundaries

本文档约束 `requirement-decomposition` 相关测试的职责边界，避免不同 suite 之间职责漂移、断言重叠，或把“分类通过”误当成“整条链路通过”。

## 测试分层

### 1. `page-type-classification.test.ts`

职责：

- 只验证 `input -> pageType`
- 只回答“这句话被识别成哪一类页面”

应该测：

- 页型样例总数是否符合预期
- 每条样例是否命中正确 `pageType`
- 大规模正例和反例是否稳定

不应该测：

- `subtasks`
- `modules`
- `constraints`
- 召回查询
- prompt 注入

一句话理解：

> 这是“路由层”测试，不是“拆分结果”测试。

### 2. `decompose-requirement.test.ts`

职责：

- 验证拆分结果结构是否正确
- 覆盖 `enabled / subtasks / modules / constraints` 的关键行为

应该测：

- 短需求是否不启用拆分
- 典型后台页型是否启用拆分
- 关键 `must/should` 子任务是否被识别
- `modules` 顺序、必选项、布局名是否正确
- 轻编辑/复杂编辑这类边界行为

不应该测：

- 海量页型样例分类
- 召回结果排序
- prompt 文本注入细节

一句话理解：

> 这是“拆分输出”测试，不是“分类样例池”测试。

### 3. `build-decomposition-queries.test.ts`

职责：

- 验证拆分结果如何转成召回查询

应该测：

- 是否包含原始需求
- 是否包含子任务关键词
- 是否包含模块级查询提示
- 是否按不同页型生成特有查询

不应该测：

- 知识库召回结果本身
- LLM prompt 是否正确

一句话理解：

> 这是“拆分到召回”的桥接层测试。

### 4. `page-profiles/__tests__/match-profile.test.ts`

职责：

- 验证 profile 匹配逻辑本身
- 覆盖更底层的命中顺序或 `match(...)` 边界

应该测：

- profile 顺序是否影响分类结果
- `admin-create / admin-edit / admin-detail / admin-management` 的底层边界

不应该测：

- 完整拆分结构
- prompt 注入

一句话理解：

> 这是“页型匹配实现”测试，比 classification 更底层。

### 5. `prompt.service.test.ts`

职责：

- 验证拆分结果是否正确注入 prompt

应该测：

- 指定 `pageType` 的专项要求是否出现
- 关键 `modules` 是否进入 prompt JSON
- 轻编辑和复杂编辑是否进入不同 prompt 分支

不应该测：

- 页型大规模分类
- 召回排序质量

一句话理解：

> 这是“拆分到 prompt”的桥接层测试。

### 6. `component-knowledge.service.test.ts`

职责：

- 验证拆分后的查询是否能帮助知识库召回

应该测：

- 指定页型是否优先召回对应结构组件
- 是否避免退化成无关组件

不应该测：

- page type 大规模分类正确性

### 7. `recall-regression.test.ts`

职责：

- 兜底验证整体召回回归
- 这是最接近真实结果稳定性的回归测试

应该测：

- `resources/*.jsonl` 用例保持零漏召回
- topN 稳定

不应该测：

- 单个页型分类边界的细节

一句话理解：

> 这是“结果守门员”，不是“规则定位器”。

## 推荐执行顺序

本地排查建议按这个顺序：

1. 先跑 `page type classification`
2. 再跑 `decompose-requirement`
3. 再跑 `build-decomposition-queries`
4. 再跑 `prompt.service` / `component-knowledge`
5. 最后跑全量测试和 `recall-regression`

原因：

- 前几层失败时，定位成本最低
- 越靠后越接近整条链路，排查成本也越高

## 这套方案的注意点

分层执行不等于分层通过就代表最终正确。

尤其要避免这两个误区：

1. `classification` 通过，就认为这次规则改动没问题
2. `decompose` 通过，就认为召回和 prompt 一定没问题

正确理解应该是：

- `classification` 只说明“路由大体正确”
- `decompose` 只说明“结构大体正确”
- `full test + recall regression` 才能说明“链路整体没有明显回归”

## 新增测试时的约定

- 只想补页型覆盖：加到 `fixtures/page-type-cases.ts`
- 只想补复杂编辑大样例：优先加到 `fixtures/admin-edit-page-type-cases.ts`
- 想验证某页型拆分出的 `subtasks/modules`：加到 `decompose-requirement.test.ts`
- 想验证召回查询：加到 `build-decomposition-queries.test.ts`
- 想验证 prompt 分支：加到 `prompt.service.test.ts`

如果一个变更同时影响多个层级，允许一处改动补多份测试；但每份测试都应只验证自己的那一层职责。
