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
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True) # 禁止多余字段，去除空格
    components: list[ComponentRec] = Field(min_length=1) # 至少包含一个组件推荐
    explanation: str = Field(min_length=1) # 实现思路说明
    code: str = Field(min_length=1) # 最终生成的代码字符串
    tips: list[str] = Field(default_factory=list) # 可选建议列表
    page_type: PageType # 页面类型，必须命中项目约定枚举
    used_components: list[str] = Field(min_length=1) # 最终代码里实际使用的组件名列表，必须来自 components.name

class RepairIssue(BaseModel):
    model_config = ConfigDict(extra="forbid") # 禁止多余字段
    loc: list[str | int] # 错误位置
    error_type: str # 错误类型
    message: str # 错误消息
    bad_value: Any # 错误值
    repair_hint: str # 修复提示

class RepairReport(BaseModel):
    model_config = ConfigDict(extra="forbid") # 禁止多余字段
    valid: bool # 是否有效
    issue_count: int # 错误数量
    issues: list[RepairIssue] = Field(default_factory=list) # 错误列表
    retry_prompt: str # 重试提示



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

def build_repair_hint(error_type: str, loc: list[str | int]) -> str: # 构建修复提示
    path = ".".join(str(item) for item in loc) if loc else "root"
    if error_type == "string_too_short": # 字符串太短
        return f"`{path}` 不能为空，也不能只包含空格。"
    if error_type == "literal_error": # 字面量错误
        return f"`{path}` 必须改成项目允许的枚举值。"
    if error_type == "list_type": # 列表类型错误
        return f"`{path}` 必须是数组。"
    if error_type == "too_short": # 太短
        return f"`{path}` 长度不足，至少补齐 1 项。"
    if error_type == "extra_forbidden": # 多余字段
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
