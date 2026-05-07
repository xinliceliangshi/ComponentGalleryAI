<script setup lang="ts">
import HeaderBar from "./components/HeaderBar.vue";
import PromptInput from "./components/PromptInput.vue";
import ResultPanel from "./components/ResultPanel.vue";
import EmptyState from "./components/states/EmptyState.vue";
import ErrorState from "./components/states/ErrorState.vue";
import LoadingState from "./components/states/LoadingState.vue";
import { useGenerate } from "./composables/useGenerate";

const gen = useGenerate();
</script>

<template>
  <div class="min-h-100vh font-sans">
    <HeaderBar />

    <main class="mx-auto max-w-1120 px-6 pt-26 pb-18">
      <section class="pt-10 md:pt-16">
        <div class="mx-auto max-w-860 text-center">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span class="i-carbon:magic-wand" />
            AI-native frontend builder
          </div>

          <h1 class="mt-5 title">
            Build Frontend UI with AI
          </h1>
          <p class="mt-3 subtitle">
            Describe your UI需求，自动生成组件方案与代码。
          </p>
        </div>

        <div class="mx-auto mt-8 max-w-860">
          <PromptInput
            v-model="gen.input.value"
            :busy="gen.status.value === 'loading'"
            @submit="gen.generate"
            @example="gen.fillExample"
          />
        </div>
      </section>

      <section class="mx-auto mt-10 max-w-1120">
        <Transition name="fade-slide" mode="out-in">
          <LoadingState v-if="gen.status.value === 'loading'" key="loading" />
          <ErrorState
            v-else-if="gen.status.value === 'error'"
            key="error"
            :message="gen.error.value || 'Something went wrong.'"
            @retry="gen.retry"
          />
          <ResultPanel
            v-else-if="gen.status.value === 'success' && gen.result.value"
            key="success"
            :data="gen.result.value"
          />
          <EmptyState v-else key="empty" />
        </Transition>
      </section>
    </main>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 180ms ease, transform 220ms ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
