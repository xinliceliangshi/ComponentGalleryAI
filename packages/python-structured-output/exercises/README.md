# Pydantic Exercises

这里放按步骤拆开的 `Pydantic` 训练题。整套练习围绕一个目标展开：

`让 LLM 最终输出从“看起来像 JSON”进化成“可校验、可修复、可重试的正式协议”。`

建议严格按编号顺序做，不要跳题。

## 学习路线

1. 先学“字段约束”
2. 再学“协议扩展”
3. 再学“跨字段一致性”
4. 再学“错误结构化”
5. 最后学“重试闭环”

## 题目总览

| 题号 | 主题 | 关键词 | 当前目标 |
| --- | --- | --- | --- |
| 01 | 最小输出模型 | `BaseModel` `Field` `ConfigDict` | 学会定义最基础的输出边界 |
| 02 | 扩展真实字段 | `Literal` `default_factory` | 学会让 schema 更接近真实项目 |
| 03 | 字段一致性 | `field_validator` `model_validator` | 学会跨字段规则 |
| 04 | 错误报告 | `ValidationError` `errors()` | 学会把报错转成修复清单 |
| 05 | 重试闭环 | retry loop | 学会把 schema 接入 LLM 修复流程 |

## 01. BasicGenerateResult

文件：

- [`01_basic_generate_result.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/01_basic_generate_result.py)

你会学到：

- `BaseModel`
- `Field(min_length=1)`
- `ConfigDict(extra="forbid")`
- `ConfigDict(str_strip_whitespace=True)`
- `ValidationError`

训练目标：

- 学会用最小模型约束 `components / explanation / code`
- 明白“空字符串”和“多余字段”为什么会失败

运行：

```bash
python3 packages/python-structured-output/exercises/01_basic_generate_result.py
```

看输出时重点关注：

- 为什么 `components=[]` 会失败
- 为什么 `"   "` 会失败
- 为什么 `tips` 会因为 `extra="forbid"` 被拒绝

建议课后练习：

1. 把 `components` 里的某个 `usage` 改成空字符串，观察报错。
2. 给 `GOOD_PAYLOAD` 加一个 `tips` 字段，观察为什么会失败。
3. 把 `components` 改成字符串数组，观察嵌套模型错误长什么样。

## 02. GenerateResultV2

文件：

- [`02_generate_result_v2.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/02_generate_result_v2.py)

你会学到：

- `Literal`
- `Field(default_factory=list)`
- `exc.errors()`

训练目标：

- 在基础版结果上加入 `tips`
- 用 `Literal` 限制 `page_type`
- 理解“字段可选但协议仍严格”是什么意思

运行：

```bash
python3 packages/python-structured-output/exercises/02_generate_result_v2.py
```

你会看到三组输入：

- `GOOD_PAYLOAD`：完整通过
- `GOOD_WITHOUT_TIPS`：不传 `tips` 也通过，并自动补成空列表
- `BAD_PAYLOAD`：同时触发空字符串、错误枚举、列表元素类型错误和额外字段错误

看输出时重点关注：

- 为什么没传 `tips` 仍能通过
- 为什么 `page_type="detail-page"` 会失败
- 为什么 `tips[1]=123` 能被精确定位

## 03. GenerateResultV3 Consistency

文件：

- [`03_generate_result_v3_consistency.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/03_generate_result_v3_consistency.py)

你会学到：

- `field_validator`
- `model_validator`
- 数值范围约束 `ge / le`

训练目标：

- 加入 `used_components`
- 加入 `confidence`
- 开始约束“字段之间的关系”，不再只做单字段校验

运行：

```bash
python3 packages/python-structured-output/exercises/03_generate_result_v3_consistency.py
```

你会看到三组输入：

- `GOOD_PAYLOAD`：通过，并把重复的 `used_components` 自动去重
- `BAD_PAYLOAD`：触发 `confidence` 越界
- `BAD_CONSISTENCY_PAYLOAD`：专门触发 `used_components` 引用了未在 `components` 中声明的组件

看输出时重点关注：

- `field_validator` 为什么能自动去重
- `model_validator` 为什么适合做“引用关系校验”
- 为什么字段级错误和模型级错误有时不会同时出现

## 04. GenerateResult Repair Report

文件：

- [`04_generate_result_repair_report.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/04_generate_result_repair_report.py)

你会学到：

- `ValidationError.errors()`
- 结构化错误封装
- 基于错误生成修复提示

训练目标：

- 把 `ValidationError` 转成结构化错误清单
- 学会保留 `loc / type / msg / input`
- 基于错误清单生成一份适合 LLM 重试的 `retry_prompt`

运行：

```bash
python3 packages/python-structured-output/exercises/04_generate_result_repair_report.py
```

你会看到两部分输出：

- `BAD_PAYLOAD`：故意构造的非法 JSON
- `REPAIR_REPORT`：面向修复链路的结构化报告

看输出时重点关注：

- `loc` 如何描述错误位置
- `repair_hint` 怎么把底层错误翻译成更适合模型理解的话
- `retry_prompt` 为什么要“列问题”，而不是抽象说“请修复”

## 05. GenerateResult Retry Loop

文件：

- [`05_generate_result_retry_loop.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/05_generate_result_retry_loop.py)

你会学到：

- retry loop
- 同一 schema 的多轮复用
- 从失败走到成功的最小闭环

训练目标：

- 把校验失败转换成下一轮修复提示
- 模拟“第一次失败、第二次修复成功”的闭环
- 理解 schema 在 retry loop 里的位置

运行：

```bash
python3 packages/python-structured-output/exercises/05_generate_result_retry_loop.py
```

你会看到：

- `ATTEMPT 1`：失败，带结构化 `issues` 和 `retry_prompt`
- `ATTEMPT 2`：修复后通过
- `SUMMARY`：整个闭环的最终状态

看输出时重点关注：

- schema 并不是只校验一次，而是贯穿整条修复链路
- 为什么 retry loop 里最重要的不是“报错”，而是“下一轮怎么修”

## 已学知识点

做完前 5 题后，你已经接触了这些 `Pydantic` 核心能力：

- `BaseModel`
- `ConfigDict`
- `Field`
- `Literal`
- `default_factory`
- `ValidationError`
- `errors()`
- `field_validator`
- `model_validator`
- 结构化错误报告
- retry loop

## 推荐学习节奏

- 第一天：01 + 02
- 第二天：03
- 第三天：04
- 第四天：05

如果你是边学边改项目，推荐每做完一题，就回头对照一次：

- [packages/server/src/schemas/generate.schema.ts](/Users/wangying/Desktop/ComponentGalleryAI/packages/server/src/schemas/generate.schema.ts:1)
- [packages/server/src/services/generate.service.ts](/Users/wangying/Desktop/ComponentGalleryAI/packages/server/src/services/generate.service.ts:1)

这样你会更容易理解“练习题”和真实工程之间的映射关系。

## 下一步预告

前 5 题都还是“输入已经是 Python dict”。

下一阶段更接近真实 LLM 链路的题目会开始练：

1. 从原始字符串响应开始
2. 先做 JSON parse
3. 再做 Pydantic validate
4. 区分“解析失败”和“schema 失败”

这会更接近你项目里现有的：

`callLLM -> safeJsonParse -> schema.parse`
