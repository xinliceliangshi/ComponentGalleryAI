import { computed, ref } from "vue";
import { postGenerate } from "@/lib/api";
import type { GenerateResponse, GenerateStatus } from "@/types/generate";

const EXAMPLE_PROMPT =
  "做一个“团队成员列表”模块：支持头像、姓名、角色标签、在线状态；卡片 hover 微动效；提供添加成员按钮；需要可复用组件设计。";

export function useGenerate() {
  const status = ref<GenerateStatus>("idle");
  const input = ref("");
  const result = ref<GenerateResponse | null>(null);
  const error = ref<string | null>(null);

  let abortController: AbortController | null = null;

  const canSubmit = computed(() => input.value.trim().length > 0 && status.value !== "loading");

  async function generate(value: string) {
    const next = value.trim();
    input.value = value;
    if (!next) {
      status.value = "error";
      error.value = "请输入你的 UI 需求。";
      result.value = null;
      return;
    }

    abortController?.abort();
    abortController = new AbortController();

    status.value = "loading";
    error.value = null;

    try {
      const data = await postGenerate(next, abortController.signal);
      result.value = data;
      status.value = "success";
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      status.value = "error";
      error.value = (err as Error).message || "请求失败";
      result.value = null;
    }
  }

  function retry() {
    if (input.value.trim()) generate(input.value);
  }

  function fillExample() {
    input.value = EXAMPLE_PROMPT;
  }

  return {
    status,
    input,
    result,
    error,
    canSubmit,
    generate,
    retry,
    fillExample
  };
}

