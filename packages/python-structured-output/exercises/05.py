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


class GenerateResultV5(BaseModel):
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

class RetryStep(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attempt: int
    payload: dict[str, Any]
    valid: bool
    issues: list[RepairIssue] = Field(default_factory=list)
    retry_prompt: str | None = None

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



def validate_attempt(attempt: int, payload: dict[str, Any]) -> RetryStep:
    try:
        result = GenerateResultV5.model_validate(payload)
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

        retry_prompt = "\n".join(
            [
                "你上一次返回的 JSON 未通过校验，请按以下问题完整修复后重新输出：",
                *[
                    f"{index}. {issue.repair_hint}"
                    for index, issue in enumerate(issues, start=1)
                ],
                "只返回完整合法 JSON，不要输出 markdown。",
            ]
        )

        return RetryStep(
            attempt=attempt,
            payload=payload,
            valid=False,
            issues=issues,
            retry_prompt=retry_prompt,
        )

    return RetryStep(
        attempt=attempt,
        payload=result.model_dump(mode="json"),
        valid=True,
        issues=[],
        retry_prompt=None,
    )

def run_retry_loop() -> list[RetryStep]:
    steps: list[RetryStep] = []

    first = validate_attempt(1, FIRST_ATTEMPT_PAYLOAD)
    steps.append(first)

    if first.valid:
        return steps

    second = validate_attempt(2, SECOND_ATTEMPT_PAYLOAD)
    steps.append(second)
    return steps



def main() -> None:
    print("训练题 05：最终输出约束方案 / Retry Loop")
    print("目标：模拟一次真实的 structured-output 修复闭环。")

    steps = run_retry_loop()

    for step in steps:
        print(f"\n== ATTEMPT {step.attempt} ==")
        print(json.dumps(step.model_dump(mode='json'), ensure_ascii=False, indent=2))

    final_valid = steps[-1].valid if steps else False
    print("\n== SUMMARY ==")
    print(
        json.dumps(
            {
                "attempt_count": len(steps),
                "final_valid": final_valid,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
