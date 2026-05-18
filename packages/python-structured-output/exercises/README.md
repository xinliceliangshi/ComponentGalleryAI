# Pydantic Exercises

这里放按步骤拆开的 `Pydantic` 训练题。建议按编号顺序做，不要一开始就做大而全的模型。

## 01. BasicGenerateResult

文件：

- [`01_basic_generate_result.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/01_basic_generate_result.py)

训练目标：

- 学会用 `BaseModel` 描述最小版最终输出
- 学会用 `Field(min_length=1)` 做基础约束
- 学会用 `extra="forbid"` 禁止多余字段
- 学会读 `ValidationError`

运行：

```bash
python3 packages/python-structured-output/exercises/01_basic_generate_result.py
```

你会看到两组输入：

- `GOOD_PAYLOAD`：应该校验通过
- `BAD_PAYLOAD`：应该校验失败

建议自己继续做 3 个小练习：

1. 把 `components` 里的某个 `usage` 改成空字符串，观察报错。
2. 给 `GOOD_PAYLOAD` 加一个 `tips` 字段，观察为什么会失败。
3. 把 `components` 改成字符串数组，观察嵌套模型错误长什么样。

## 02. GenerateResultV2

文件：

- [`02_generate_result_v2.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/02_generate_result_v2.py)

训练目标：

- 在第一题基础上加入 `tips`
- 用 `Literal` 限制 `page_type`
- 观察 `default_factory=list` 的效果
- 开始读取 `exc.errors()` 的结构化报错

运行：

```bash
python3 packages/python-structured-output/exercises/02_generate_result_v2.py
```

你会看到三组输入：

- `GOOD_PAYLOAD`：完整通过
- `GOOD_WITHOUT_TIPS`：不传 `tips` 也通过，并自动补成空列表
- `BAD_PAYLOAD`：同时触发空字符串、错误枚举、列表元素类型错误和额外字段错误

## 03. GenerateResultV3 Consistency

文件：

- [`03_generate_result_v3_consistency.py`](/Users/wangying/Desktop/ComponentGalleryAI/packages/python-structured-output/exercises/03_generate_result_v3_consistency.py)

训练目标：

- 加入 `used_components`
- 加入 `confidence`
- 学会用 `field_validator` 做去重
- 学会用 `model_validator` 做跨字段一致性校验

运行：

```bash
python3 packages/python-structured-output/exercises/03_generate_result_v3_consistency.py
```

你会看到两组输入：

- `GOOD_PAYLOAD`：通过，并把重复的 `used_components` 自动去重
- `BAD_PAYLOAD`：触发 `confidence` 越界
- `BAD_CONSISTENCY_PAYLOAD`：专门触发 `used_components` 引用了未在 `components` 中声明的组件
