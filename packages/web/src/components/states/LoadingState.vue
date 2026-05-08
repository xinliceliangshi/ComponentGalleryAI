<template>
  <div class="card p-6 md:p-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 grid place-items-center rounded-2xl border border-white/10 bg-white/6 text-white/75">
          <span class="i-carbon:ai-status-complete animate-spin" />
        </div>
        <div>
          <div class="text-sm font-650 tracking-tight">
            Generating
          </div>
          <div class="mt-1 text-xs muted">
            Building components, explanation, and runnable code…
          </div>
        </div>
      </div>

      <div class="hidden md:flex items-center gap-2 text-xs text-white/55">
        <span class="i-carbon:time" />
        ~1s
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="rounded-2xl border border-white/10 bg-white/3 p-4">
        <div class="h-3 w-28 rounded-full bg-white/10 animate-pulse" />
        <div class="mt-3 space-y-2">
          <div class="h-2.5 w-full rounded-full bg-white/7 animate-pulse" />
          <div class="h-2.5 w-10/12 rounded-full bg-white/7 animate-pulse" />
          <div class="h-2.5 w-8/12 rounded-full bg-white/7 animate-pulse" />
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-2xl border border-white/10 bg-#0a0d13 p-4">
      <div class="h-3 w-20 rounded-full bg-white/10 animate-pulse" />
      <div class="mt-4 space-y-2">
        <div class="h-2.5 w-full rounded-full bg-white/7 animate-pulse" />
        <div class="h-2.5 w-11/12 rounded-full bg-white/7 animate-pulse" />
        <div class="h-2.5 w-10/12 rounded-full bg-white/7 animate-pulse" />
      </div>
    </div>
  </div>
</template>
