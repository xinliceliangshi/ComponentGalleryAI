from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from component_gallery_ai_structured.models import (  # noqa: E402
    GenerateResult,
    GenerationPlan,
    RequirementDecomposition,
)


def dump_model(name: str, model: object) -> None:
    print(f"== {name} ==")
    print(json.dumps(model, ensure_ascii=False, indent=2))
    print()


def main() -> None:
    decomposition = RequirementDecomposition.model_validate(
        {
            "enabled": True,
            "summary": "商品审核详情页，需要状态、操作按钮、审核记录和基础信息。",
            "page_type": "admin-detail",
            "user_goal": "生成一个后台商品审核详情页",
            "subtasks": [
                {
                    "id": "detail-header",
                    "title": "详情头部",
                    "intent": "header-status-actions",
                    "priority": "must",
                    "candidate_keywords": ["页头", "状态", "按钮"],
                }
            ],
            "sections": [
                {
                    "kind": "page-header",
                    "required": True,
                    "priority": "must",
                    "layout": "header-title-status-actions",
                },
                {
                    "kind": "audit-records",
                    "required": True,
                    "priority": "should",
                },
            ],
            "workflow": {
                "id": "audit-flow",
                "initial_state": "pending",
                "transitions": [
                    {
                        "from_state": "pending",
                        "to_state": "approved",
                        "action": {
                            "key": "approve",
                            "label": "通过",
                            "variant": "success",
                            "permissions": ["goods:audit"],
                        },
                    }
                ],
            },
            "constraints": ["Header 必须展示状态和操作"],
            "risks": ["直接生成代码容易遗漏审核历史"],
        }
    )

    plan = GenerationPlan.model_validate(
        {
            "page_type": "admin-detail",
            "summary": decomposition.summary,
            "user_goal": decomposition.user_goal,
            "sections": [
                {
                    "kind": "page-header",
                    "title": "页面头部",
                    "required": True,
                    "layout": "header-title-status-actions",
                    "goals": ["展示标题、状态和主要操作"],
                    "recommended_components": [
                        {
                            "name": "ZhDescriptions",
                            "reason": "适合详情信息与状态组合布局",
                            "priority": "high",
                            "usage": "用于基础信息的紧凑型详情展示",
                        }
                    ],
                    "reference_snippets": [
                        {
                            "component": "ZhButtonGroup",
                            "type": "example",
                            "title": "Header Actions",
                            "summary": "状态驱动按钮组，用于通过权限映射控制可见性。",
                        }
                    ],
                }
            ],
            "global_constraints": decomposition.constraints,
            "risks": decomposition.risks,
        }
    )

    result = GenerateResult.model_validate(
        {
            "components": [
                {"name": "ZhDescriptions", "usage": "展示基础信息"},
                {"name": "ZhButtonGroup", "usage": "承载审核操作"},
            ],
            "explanation": "页面由头部、基础信息、审核记录三部分组成。",
            "code": "export default { name: 'GoodsAuditDetailPage' };",
            "tips": ["把状态映射收敛到一个配置对象里"],
            "page_type": "admin-detail",
            "used_components": ["ZhDescriptions", "ZhButtonGroup"],
            "risks": ["示例代码仅展示结构化输出，不包含真实业务逻辑"],
        }
    )

    dump_model(
        "RequirementDecomposition",
        decomposition.model_dump(mode="json", by_alias=True),
    )
    dump_model("GenerationPlan", plan.model_dump(mode="json", by_alias=True))
    dump_model("GenerateResult", result.model_dump(mode="json", by_alias=True))


if __name__ == "__main__":
    main()
