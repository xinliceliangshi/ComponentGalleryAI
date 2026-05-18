from __future__ import annotations

import json
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError


PageType = Literal[
    "admin-home-dashboard",
    "admin-detail",
    "admin-create",
    "admin-edit",
    "admin-management",
]


class ComponentRec(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1)
    usage: str = Field(min_length=1)


class GenerateResultV4(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    components: list[ComponentRec] = Field(min_length=1)
    explanation: str = Field(min_length=1)
    code: str = Field(min_length=1)
    tips: list[str] = Field(default_factory=list)
    page_type: PageType
    used_components: list[str] = Field(min_length=1)


class RepairIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    loc: list[str | int]
    error_type: str
    message: str
    bad_value: Any
    repair_hint: str


class RepairReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    valid: bool
    issue_count: int
    issues: list[RepairIssue] = Field(default_factory=list)
    retry_prompt: str


BAD_PAYLOAD: dict[str, Any] = {
    "components": [
        {"name": "ZhDescriptions", "usage": "  "},
        {"name": "", "usage": "承载操作按钮"},
    ],
    "explanation": "",
    "code": "   ",
    "tips": "把状态映射抽成配置",
    "page_type": "detail-page",
    "used_components": [],
    "extra_field": True,
}


def build_repair_hint(error_type: str, loc: list[str | int]) -> str:
    path = ".".join(str(item) for item in loc) if loc else "root"
    if error_type == "string_too_short":
        return f"`{path}` 不能为空，也不能只包含空格。"
    if error_type == "literal_error":
        return f"`{path}` 必须改成项目允许的枚举值。"
    if error_type == "list_type":
        return f"`{path}` 必须是数组。"
    if error_type == "too_short":
        return f"`{path}` 长度不足，至少补齐 1 项。"
    if error_type == "extra_forbidden":
        return f"`{path}` 不是协议字段，请删除。"
    return f"请修复 `{path}` 对应字段，使其满足 schema 要求。"


def build_repair_report(payload: dict[str, Any]) -> RepairReport:
    try:
        GenerateResultV4.model_validate(payload)
    except ValidationError as exc:
        issues: list[RepairIssue] = []
        for err in exc.errors():
            loc = list(err["loc"])
            error_type = err["type"]
            issues.append(
                RepairIssue(
                    loc=loc,
                    error_type=error_type,
                    message=err["msg"],
                    bad_value=err.get("input"),
                    repair_hint=build_repair_hint(error_type, loc),
                )
            )

        retry_lines = [
            "你上一次返回的 JSON 未通过校验，请严格修复以下问题后重新输出完整 JSON：",
            *[
                f"{index}. {issue.repair_hint}"
                for index, issue in enumerate(issues, start=1)
            ],
            "只返回修复后的合法 JSON，不要输出解释文本。",
        ]

        return RepairReport(
            valid=False,
            issue_count=len(issues),
            issues=issues,
            retry_prompt="\n".join(retry_lines),
        )

    return RepairReport(
        valid=True,
        issue_count=0,
        issues=[],
        retry_prompt="当前 JSON 已合法，无需重试。",
    )


def main() -> None:
    print("训练题 04：最终输出约束方案 / Repair Report")
    print("目标：把 ValidationError 转成适合 LLM 重试修复的结构化报告。")
    print("\n== BAD_PAYLOAD ==")
    print(json.dumps(BAD_PAYLOAD, ensure_ascii=False, indent=2))

    report = build_repair_report(BAD_PAYLOAD)

    print("\n== REPAIR_REPORT ==")
    print(json.dumps(report.model_dump(mode="json"), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
