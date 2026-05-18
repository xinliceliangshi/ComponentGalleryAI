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


