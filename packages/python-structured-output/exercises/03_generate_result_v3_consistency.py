from __future__ import annotations

import json
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator


PageType = Literal[
    "admin-home-dashboard",
    "admin-detail",
    "admin-create",
    "admin-edit",
    "admin-management",
]


class ComponentRec(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, description="组件名，不能为空")
    usage: str = Field(min_length=1, description="组件用途说明，不能为空")


class GenerateResultV3(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    components: list[ComponentRec] = Field(min_length=1, description="至少包含一个组件推荐")
    explanation: str = Field(min_length=1, description="实现思路说明")
    code: str = Field(min_length=1, description="最终生成的代码字符串")
    tips: list[str] = Field(default_factory=list, description="可选建议列表")
    page_type: PageType = Field(description="页面类型，必须命中项目约定枚举")
    used_components: list[str] = Field(
        min_length=1,
        description="最终代码里实际使用的组件名列表，必须来自 components.name"
    )
    risks: list[str] = Field(default_factory=list, description="当前结果仍然存在的风险")
    confidence: float = Field(ge=0, le=1, description="结果置信度，范围 0 到 1")

    @field_validator("used_components")
    @classmethod
    def dedupe_used_components(cls, value: list[str]) -> list[str]:
        deduped: list[str] = []
        for item in value:
            if item not in deduped:
                deduped.append(item)
        return deduped

    @model_validator(mode="after")
    def ensure_used_components_are_declared(self) -> "GenerateResultV3":
        declared = {component.name for component in self.components}
        missing = [name for name in self.used_components if name not in declared]
        if missing:
            raise ValueError(
                f"used_components 必须来自 components.name；未声明组件: {', '.join(missing)}"
            )
        return self


GOOD_PAYLOAD: dict[str, Any] = {
    "components": [
        {"name": "ZhDescriptions", "usage": "展示基础信息"},
        {"name": "ZhButtonGroup", "usage": "承载状态操作按钮"},
    ],
    "explanation": "页面由头部、详情信息和审核操作区组成。",
    "code": "export default { name: 'GoodsAuditDetailPage' };",
    "tips": ["把状态映射抽成 statusConfig"],
    "page_type": "admin-detail",
    "used_components": ["ZhDescriptions", "ZhButtonGroup", "ZhDescriptions"],
    "risks": ["示例代码未包含真实接口请求"],
    "confidence": 0.86,
}

BAD_PAYLOAD: dict[str, Any] = {
    "components": [
        {"name": "ZhDescriptions", "usage": "展示基础信息"},
    ],
    "explanation": "页面由头部和详情区组成。",
    "code": "export default { name: 'BrokenDetailPage' };",
    "tips": [],
    "page_type": "admin-detail",
    "used_components": ["ZhDescriptions", "ZhButtonGroup"],
    "risks": ["组件声明和实际使用不一致"],
    "confidence": 1.2,
}

BAD_CONSISTENCY_PAYLOAD: dict[str, Any] = {
    "components": [
        {"name": "ZhDescriptions", "usage": "展示基础信息"},
    ],
    "explanation": "页面由头部和详情区组成。",
    "code": "export default { name: 'BrokenDetailPage' };",
    "tips": [],
    "page_type": "admin-detail",
    "used_components": ["ZhDescriptions", "ZhButtonGroup"],
    "risks": ["组件声明和实际使用不一致"],
    "confidence": 0.72,
}


def print_error_details(exc: ValidationError) -> None:
    print("\nValidation failed:")
    print(exc)
    print("\nStructured errors:")
    for index, err in enumerate(exc.errors(), start=1):
        print(
            json.dumps(
                {
                    "index": index,
                    "loc": err["loc"],
                    "msg": err["msg"],
                    "type": err["type"],
                    "input": err.get("input"),
                },
                ensure_ascii=False,
                indent=2,
                default=str,
            )
        )


def validate_payload(label: str, payload: dict[str, Any]) -> None:
    print(f"\n== {label} ==")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    try:
        result = GenerateResultV3.model_validate(payload)
    except ValidationError as exc:
        print_error_details(exc)
        return

    print("\nValidation passed:")
    print(json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2))


def main() -> None:
    print("训练题 03：最终输出约束方案 / GenerateResultV3 Consistency")
    print("目标：开始校验字段之间的一致性，而不只是单字段非空。")
    validate_payload("GOOD_PAYLOAD", GOOD_PAYLOAD)
    validate_payload("BAD_PAYLOAD", BAD_PAYLOAD)
    validate_payload("BAD_CONSISTENCY_PAYLOAD", BAD_CONSISTENCY_PAYLOAD)


if __name__ == "__main__":
    main()
