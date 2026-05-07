<script setup lang="ts">
import { computed, ref } from "vue";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-markup";
import "./prism-theme.css";

const props = defineProps<{
  title?: string;
  language?: "vue" | "tsx" | "ts" | "js" | "json" | "html" | "css";
  code: string;
}>();

const collapsed = ref(false);
const copied = ref(false);

const lang = computed(() => {
  if (!props.language) return "tsx";
  if (props.language === "vue") return "markup";
  return props.language;
});

const highlighted = computed(() => {
  const grammar = (Prism.languages as any)[lang.value] || Prism.languages.markup;
  return Prism.highlight(props.code, grammar, lang.value);
});

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 900);
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="bg-#0a0d13">
    <div class="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10">
      <div class="flex items-center gap-3 min-w-0">
        <div class="h-8 w-8 grid place-items-center rounded-xl border border-white/10 bg-white/6 text-white/75">
          <span class="i-carbon:code" />
        </div>
        <div class="min-w-0">
          <div class="text-sm font-650 tracking-tight truncate">
            {{ title || "Code" }}
          </div>
          <div class="text-xs text-white/55">
            VSCode-like · Copy · Collapse
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost h-9 px-3" type="button" @click="collapsed = !collapsed">
          <span :class="collapsed ? 'i-carbon:chevron-down' : 'i-carbon:chevron-up'" />
          {{ collapsed ? "Expand" : "Collapse" }}
        </button>
        <button class="btn-primary h-9 px-3" type="button" @click="copy">
          <span :class="copied ? 'i-carbon:checkmark' : 'i-carbon:copy'" />
          {{ copied ? "Copied" : "Copy" }}
        </button>
      </div>
    </div>

    <div v-show="!collapsed" class="relative">
      <div class="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/3 to-transparent pointer-events-none" />
      <pre class="m-0 px-4 md:px-5 py-4 overflow-auto text-[12.5px] leading-5">
<code :class="`language-${lang}`" v-html="highlighted" />
      </pre>
    </div>
  </div>
</template>
