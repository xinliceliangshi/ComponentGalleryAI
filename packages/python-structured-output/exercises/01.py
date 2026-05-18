from __future__ import annotations

import json 
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError
class ComponentRec(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, description="组件名，不能为空")
    usage: str = Field(min_length=1, description="组件用途说明，不能为空")

class BasicGenerateResult(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    components: list[ComponentRec] = Field(
        min_length=1,
        description="至少包含一个组件推荐"
    )
    explanation: str = Field(min_length=1, description="实现思路说明")
    code: str = Field(min_length=1, description="最终生成的代码字符串")

GOOD_PAYLOAD: dict[str, Any] = {
    "components": [
        {"name": "ZhTable", "usage": "承载商品列表数据"},
        {"name": "ZhButton", "usage": "触发新增与批量操作"},
    ],
    "explanation": "页面由筛选区、列表区、批量操作区组成。",
    "code": "export default { name: 'GoodsListPage' };",
}

BAD_PAYLOAD: dict[str, Any] = {
    "components": [],
    "explanation": "",
    "code": "   ",
    "tips": ["这个字段在第一题里不允许出现"],
}

# 验证 payload 是否符合 BasicGenerateResult 模型
def validate_payload(label: str, payload: dict[str, Any]) -> None:
    print(f"\n== {label} ==")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    try:
        result = BasicGenerateResult.model_validate(payload)
    except ValidationError as e:
        print("\nValidation failed:")
        print(e)
        return

    print("\nValidation passed:")
    print(json.dumps(result.model_dump(mode="json"), ensure_ascii=False, indent=2))

def main() -> None:
    print("训练题 01：最终输出约束方案 / BasicGenerateResult")
    print("目标：先把 LLM 最终输出严格收敛到 components / explanation / code 三个字段。")
    validate_payload("GOOD_PAYLOAD", GOOD_PAYLOAD)
    validate_payload("BAD_PAYLOAD", BAD_PAYLOAD)

if __name__ == "__main__":
    main()