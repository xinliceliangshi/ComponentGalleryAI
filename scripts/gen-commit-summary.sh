#!/usr/bin/env bash
# 根据指定提交（默认 HEAD）生成 doc/commits 下的 Markdown 摘要。
# 环境变量：
#   COMMIT_DOC_INCLUDE_DIFF=1  — 附带截断后的补丁正文（默认仅统计与文件列表）
#   COMMIT_DOC_MAX_DIFF_LINES=N — 补丁最多行数（默认 400）
set -euo pipefail

REV="${1:-HEAD}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

SHORT=$(git rev-parse --short "$REV")
FULL=$(git rev-parse "$REV")
AUTHOR=$(git log -1 "$REV" --pretty=%an)
DATE=$(git log -1 "$REV" --pretty=%cs)
ISO=$(git log -1 "$REV" --pretty=%cI)
SUBJECT=$(git log -1 "$REV" --pretty=%s)
BODY_RAW=$(git log -1 "$REV" --pretty=%b || true)
BODY_STRIPPED=$(echo -n "${BODY_RAW}" | tr -d '[:space:]')

mkdir -p "$ROOT/doc/commits"
FILE="$ROOT/doc/commits/${DATE}-${SHORT}.md"

STAT_BLOCK=$(git show "$REV" --stat --format="" || true)
NAME_STATUS=$(git show "$REV" --name-status --format="" | sed '/^$/d' || true)

INCLUDE_DIFF="${COMMIT_DOC_INCLUDE_DIFF:-0}"
MAX_LINES="${COMMIT_DOC_MAX_DIFF_LINES:-400}"

{
  echo "# 提交总结：${SUBJECT}"
  echo
  echo "| 字段 | 内容 |"
  echo "|------|------|"
  echo "| 提交 | \`${FULL}\` (\`${SHORT}\`) |"
  echo "| 作者 | ${AUTHOR} |"
  echo "| 日期 | ${DATE}（${ISO}） |"
  echo
  if [ -n "${BODY_STRIPPED}" ]; then
    echo "## 提交说明（原文）"
    echo
    echo '```text'
    echo "${BODY_RAW}"
    echo '```'
    echo
  fi
  echo "## 变更统计"
  echo
  echo '```text'
  echo "${STAT_BLOCK:-（无文件变更）}"
  echo '```'
  echo
  echo "## 涉及文件（name-status）"
  echo
  echo '```text'
  if [ -n "${NAME_STATUS}" ]; then
    echo "${NAME_STATUS}"
  else
    echo "（空）"
  fi
  echo '```'

  if [ "${INCLUDE_DIFF}" = "1" ]; then
    echo
    echo "## 补丁节选（前 ${MAX_LINES} 行）"
    echo
    echo '```diff'
    git show "$REV" -p --format="" | head -n "${MAX_LINES}" || true
    echo '```'
    TOTAL=$(git show "$REV" -p --format="" 2>/dev/null | wc -l | tr -d ' ')
    if [ "${TOTAL}" -gt "${MAX_LINES}" ] 2>/dev/null; then
      echo
      echo "_（全文共 ${TOTAL} 行，已截断；可提高 COMMIT_DOC_MAX_DIFF_LINES 或本地查看 \`git show ${SHORT}\`）_"
    fi
  fi

  echo
  echo "---"
  echo
  echo "_由 \`scripts/gen-commit-summary.sh\` 根据 Git 元数据自动生成。_"
} >"${FILE}"

echo "已写入 ${FILE}"
