<script setup lang="ts">
const githubUrl = (import.meta as any).env?.VITE_GITHUB_URL || "https://github.com/";
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-20 border-b border-white/8 bg-#0b0e14/72 backdrop-blur-xl">
    <div class="mx-auto max-w-1120 px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 grid place-items-center rounded-xl border border-white/10 bg-white/6">
          <span class="i-carbon:code" />
        </div>
        <div class="leading-tight">
          <div class="text-sm font-600 tracking-tight">
            Frontend AI Builder
          </div>
          <div class="text-xs text-white/55">
            Professional UI generator
          </div>
        </div>
      </div>

      <a
        class="btn-ghost"
        :href="githubUrl"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
      >
        <span class="i-carbon:logo-github" />
        GitHub
      </a>
    </div>
  </header>
</template>
