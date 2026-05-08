<script setup lang="ts">
defineProps<{
  message: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="card p-8 md:p-10">
    <div class="mx-auto max-w-760 text-center">
      <div class="mx-auto h-12 w-12 grid place-items-center rounded-2xl border border-white/10 bg-white/6 text-rose-200">
        <span class="i-carbon:warning-alt" />
      </div>
      <div class="mt-4 text-sm font-650 tracking-tight">
        Generate failed
      </div>
      <p class="mt-2 text-sm text-white/62 leading-relaxed">
        {{ message }}
      </p>
      <div class="mt-5 flex justify-center">
        <button class="btn-primary" type="button" @click="$emit('retry')">
          <span class="i-carbon:rotate" />
          Retry
        </button>
      </div>
    </div>
  </div>
</template>
