<script setup lang="ts">
import type { GenerateResponse } from "@/types/generate";
import CodeBlock from "./code/CodeBlock.vue";

defineProps<{
  data: GenerateResponse;
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-6 pb-6">
    <section class="card p-5 md:p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-650 tracking-tight">
            Components
          </div>
          <div class="mt-1 text-xs muted">
            推荐的可复用模块清单
          </div>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="c in data.components"
          :key="c.name"
          class="rounded-2xl border border-white/10 bg-white/3 px-4 py-4 hover:bg-white/5 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div class="mt-0.5 h-8 w-8 grid place-items-center rounded-xl border border-white/10 bg-white/6 text-white/75">
              <span class="i-carbon:cube" />
            </div>
            <div class="min-w-0">
              <div class="text-sm font-650">
                {{ c.name }}
              </div>
              <div class="mt-1 text-xs text-white/62 leading-relaxed">
                {{ c.usage }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="card p-5 md:p-6">
      <div class="text-sm font-650 tracking-tight">
        Explanation
      </div>
      <div class="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
        {{ data.explanation }}
      </div>
    </section>

    <section class="card p-0 overflow-hidden">
      <CodeBlock title="Code" language="vue" :code="data.code" />
    </section>
  </div>
</template>
