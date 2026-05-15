"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  FileDown,
  Layers,
  Cpu,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

const FEATURES = [
  {
    icon: Cpu,
    title: "Gemini-powered generation",
    text: "Captions, threads, hashtags, carousels, reel scripts — all on-brand.",
  },
  {
    icon: Layers,
    title: "Brand workspaces",
    text: "Separate projects with brand voice, audience, and content history.",
  },
  {
    icon: Calendar,
    title: "Visual scheduler",
    text: "Calendar + list view to plan your content pipeline (UI-only).",
  },
  {
    icon: FileDown,
    title: "Export anywhere",
    text: "Download PDF, Markdown, or a ZIP of your whole workspace.",
  },
];

const CONTENT_TYPES = [
  "Instagram captions",
  "LinkedIn posts",
  "Twitter / X threads",
  "Hashtag packs",
  "Carousel slides",
  "Marketing copy",
  "Campaign ideas",
  "Reel scripts",
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh safe-x">
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 sm:py-6 max-w-[1600px] mx-auto safe-top">
        <Link
          href="/"
          className="group transition-transform hover:scale-[1.02]"
          aria-label="Zebvo home"
        >
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="px-4 sm:px-6 lg:px-10 pt-8 sm:pt-16 lg:pt-24 pb-16 sm:pb-24 max-w-[1600px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))]/70 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-medium text-[hsl(var(--muted-foreground))]"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-brand-400 animate-ping opacity-75" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-brand-500" />
          </span>
          Powered by Google Gemini
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display font-bold mt-5 sm:mt-6 leading-[1.02] tracking-tight text-balance text-[hsl(var(--foreground))] text-[2.5rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] 2xl:text-[7.5rem]"
        >
          The AI social studio
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          for{" "}
          <span className="text-aurora">modern</span>{" "}
          brands.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl lg:max-w-3xl mx-auto px-2"
        >
          Create captions, threads, carousels, and reel scripts — on-brand, on-platform, and on
          schedule. One workspace per brand, infinite content.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto"
        >
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4" />
              Start creating free
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              I have an account
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 sm:mt-14 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]"
        >
          {CONTENT_TYPES.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
              {c}
            </span>
          ))}
        </motion.div>
      </section>

      <section className="px-4 sm:px-6 lg:px-10 pb-16 sm:pb-24 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-4 sm:p-5 lg:p-6 backdrop-blur transition-all hover:border-brand-400/40 hover:shadow-[0_18px_50px_-20px_rgb(var(--grad-shadow-1))] hover:-translate-y-0.5"
            >
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-[linear-gradient(135deg,hsl(var(--aurora-cyan)/0.15),hsl(var(--aurora-violet)/0.15))] text-brand-500 flex items-center justify-center mb-3 sm:mb-4 ring-1 ring-brand-400/20">
                <f.icon className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div className="font-display font-semibold mb-1 text-sm sm:text-base lg:text-lg">
                {f.title}
              </div>
              <div className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {f.text}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-10 pb-20 sm:pb-28 max-w-[1600px] mx-auto">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/70 backdrop-blur-xl p-6 sm:p-10 lg:p-14 text-center">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[60%] rounded-full bg-[radial-gradient(ellipse,hsl(var(--aurora-cyan)/0.35),transparent_70%)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(var(--aurora-violet)/0.3),transparent_70%)] blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,var(--grad-from)_0%,var(--grad-via)_50%,var(--grad-to)_100%)] flex items-center justify-center shadow-[0_10px_30px_-10px_rgb(var(--grad-shadow-1))]">
              <Wand2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-tight">
              Ready to ship <span className="text-aurora">more</span> content?
            </h2>
            <p className="text-sm sm:text-base text-[hsl(var(--muted-foreground))] max-w-lg mx-auto mb-6">
              Spin up a workspace and generate your first AI-powered post in under a minute.
            </p>
            <Link href="/signup">
              <Button size="lg">
                <Sparkles className="h-4 w-4" /> Get started — it&apos;s free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 sm:px-6 py-8 sm:py-10 text-center text-[11px] sm:text-xs text-[hsl(var(--muted-foreground))] safe-bottom">
        Crafted for the Zebvo Full Stack Developer Task. Scheduling is UI-only as
        specified.
      </footer>
    </div>
  );
}
