# 提交自动生成摘要

每次本地提交后，若已启用自定义 hooks，会在本目录生成一份 **`YYYY-MM-DD-<short-hash>.md`**，内容为该提交的标题、作者、时间与变更统计（可选补丁节选）。

## 启用方式（仓库内只需配置一次）

```bash
git config core.hooksPath .githooks
```

确认 hook 可执行：

```bash
chmod +x .githooks/post-commit scripts/gen-commit-summary.sh
```

之后正常 `git commit` 即可在提交完成后写入 `doc/commits/`（文件默认处于未暂存状态，请按需 `git add doc/commits` 并再次提交或 `git commit --amend`）。

跳过某次生成：

```bash
SKIP_COMMIT_DOC=1 git commit ...
```

## 手动补生成

针对任意提交（含当前 HEAD）：

```bash
pnpm doc:commit-summary
pnpm doc:commit-summary abc1234
```

附带截断后的完整补丁节选：

```bash
COMMIT_DOC_INCLUDE_DIFF=1 pnpm doc:commit-summary HEAD
```

## 与早期手写总结的关系

仓库根下 `doc/` 中若另有手写说明（例如专题改动解读），可与本目录的机器摘要并存；需要更深入的文字归纳时，可在 Chat 里说明提交范围，由助手基于 `git show` 补充润色。
