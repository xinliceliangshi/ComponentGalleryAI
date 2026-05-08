<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps<{
  busy?: boolean;
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "submit": [value: string];
  "example": [];
}>();

const value = ref(props.modelValue);
const el = ref<HTMLTextAreaElement | null>(null);

const placeholder = `例如：\n- 一个“Settings”面板：分组表单、切换开关、保存按钮\n- 需要暗色主题 + 卡片布局 + 轻微动画\n- 输出可复用组件与完整 Vue 示例代码`;

const disabled = computed(() => props.busy === true);

function autoGrow() {
  const t = el.value;
  if (!t)
    return;
  t.style.height = "0px";
  const next = Math.min(240, Math.max(120, t.scrollHeight));
  t.style.height = `${next}px`;
}

function submit() {
  emit("submit", value.value);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== "Enter")
    return;
  if (e.shiftKey)
    return;
  e.preventDefault();
  submit();
}

watch(value, () => autoGrow());
watch(
  () => props.modelValue,
  (v) => {
    if (v !== value.value)
      value.value = v;
  },
);
watch(value, v => emit("update:modelValue", v));
onMounted(() => autoGrow());
</script>

<template>
  <div class="card p-4 md:p-5">
    <div class="flex items-start gap-3">
      <div class="mt-1 h-9 w-9 grid place-items-center rounded-xl border border-white/10 bg-white/6 text-white/75">
        <span class="i-carbon:prompt-template" />
      </div>

      <div class="flex-1">
        <textarea
          ref="el"
          v-model="value"
          class="w-full resize-none rounded-xl border border-white/10 bg-#0b0e14/30 px-4 py-3 text-sm leading-relaxed text-white/90 outline-none placeholder:text-white/35 focus:border-white/18 focus:bg-#0b0e14/40 transition-colors"
          :placeholder="placeholder"
          :disabled="disabled"
          rows="5"
          @keydown="onKeydown"
        />

        <div class="mt-3 flex items-center justify-between gap-3">
          <div class="text-xs muted">
            Enter 提交 · Shift+Enter 换行
          </div>

          <div class="flex items-center gap-2">
            <button class="btn-ghost" type="button" :disabled="disabled" @click="emit('example')">
              <span class="i-carbon:bookmark" />
              Example Prompt
            </button>
            <button class="btn-primary" type="button" :disabled="disabled" @click="submit">
              <span class="i-carbon:flash" :class="disabled ? 'animate-pulse' : ''" />
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
