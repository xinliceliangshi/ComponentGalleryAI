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


def main() -> None:
    schemas = {
        "RequirementDecomposition": RequirementDecomposition.model_json_schema(),
        "GenerationPlan": GenerationPlan.model_json_schema(),
        "GenerateResult": GenerateResult.model_json_schema(),
    }
    print(json.dumps(schemas, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
