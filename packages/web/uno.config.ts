import { defineConfig, presetIcons, presetUno } from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.05,
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle"
      }
    })
  ],
  shortcuts: {
    "btn": "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-500 transition-all select-none",
    "btn-primary": "btn bg-white/9 hover:bg-white/13 border border-white/10 hover:border-white/16 shadow-sm",
    "btn-ghost": "btn bg-transparent hover:bg-white/6 border border-white/10 hover:border-white/14",
    "card": "rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm",
    "muted": "text-white/60",
    "title": "text-[28px] md:text-[40px] font-700 tracking-tight",
    "subtitle": "text-[14px] md:text-[16px] text-white/65 leading-relaxed"
  },
  theme: {
    fontFamily: {
      sans: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
    }
  }
});

