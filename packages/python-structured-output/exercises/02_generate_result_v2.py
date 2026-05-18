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

    name: str = Field(min_length=1, description="组件名，不能为空")
    usage: str = Field(min_length=1, description="组件用途说明，不能为空")


class GenerateResultV2(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    components: list[ComponentRec] = Field(
        min_length=1,
        description="至少包含一个组件推荐"
    )
    explanation: str = Field(min_length=1, description="实现思路说明")
    code: str = Field(min_length=1, description="最终生成的代码字符串")
    tips: list[str] = Field(
        default_factory=list,
        description="可选建议列表；不传时自动补成空列表"
    )
    page_type: PageType = Field(description="页面类型，必须命中项目约定枚举")


GOOD_PAYLOAD: dict[str, Any] = {
    "components": [
        {"name": "ZhDescriptions", "usage": "展示商品基础信息"},
        {"name": "ZhButtonGroup", "usage": "承载审核操作按钮"},
    ],
    "explanation": "页面由头部、基础信息和审核记录组成。",
    "code": "export default { name: 'GoodsAuditDetailPage' };",
    "tips": ["把状态映射收敛到一个配置对象中"],
    "page_type": "admin-detail",
}

GOOD_WITHOUT_TIPS: dict[str, Any] = {
    "components": [
        {"name": "ZhForm", "usage": "承载创建页表单"},
    ],
    "explanation": "页面主体是录入表单和底部操作区。",
    "code": "export default { name: 'GoodsCreatePage' };",
    "page_type": "admin-create",
}

BAD_PAYLOAD: dict[str, Any] = {
    "components": [
        {"name": "ZhDescriptions", "usage": "  "},
    ],
    "explanation": "",
    "code": "   ",
    "tips": ["先补状态映射", 123],
    "page_type": "detail-page",
    "risks": ["这个字段在第二小关里也不允许出现"],
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
        result = GenerateResultV2.model_validate(payload)
    except ValidationError as exc:
        print_error_details(exc)
        return

    print("\nValidation passed:")
    print(json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2))


def main() -> None:
    print("训练题 02：最终输出约束方案 / GenerateResultV2")
    print("目标：在基础版结果上加入 tips 和 page_type。")
    validate_payload("GOOD_PAYLOAD", GOOD_PAYLOAD)
    validate_payload("GOOD_WITHOUT_TIPS", GOOD_WITHOUT_TIPS)
    validate_payload("BAD_PAYLOAD", BAD_PAYLOAD)


if __name__ == "__main__":
    main()
