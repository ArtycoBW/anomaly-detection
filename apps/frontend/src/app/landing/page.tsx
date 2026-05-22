'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FlowArt, FlowSection } from '@/components/ui/story-scroll';
import { DynamicIslandTOC } from '@/components/ui/dynamic-island-toc';
import { CurtainThemeToggle } from '@/components/ui/curtain-theme-toggle';
import dynamic from 'next/dynamic';

const RussiaGlobe3D = dynamic(() => import('@/components/charts/RussiaGlobe3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-2xl bg-[#030308] border border-cyan-500/10 flex items-center justify-center">
      <div className="text-cyan-500/40 font-mono text-sm animate-pulse">Загрузка карты...</div>
    </div>
  ),
});

// Animated stat counter
function StatCounter({ value, suffix = '', label }: { value: string; suffix?: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col"
    >
      <span className="font-display text-5xl lg:text-6xl font-bold text-white leading-none">
        {value}
        <span className="text-cyan-400">{suffix}</span>
      </span>
      <span className="text-sm text-slate-500 mt-2 font-mono uppercase tracking-[0.1em]">{label}</span>
    </motion.div>
  );
}

// Ticker strip
function Ticker() {
  const items = [
    'Z-SCORE', 'ISOLATION FOREST', 'MAHALANOBIS', 'ENSEMBLE', 'SHAP', 'STABILITY',
    'ЮФО', 'СКФО', 'КАЛМЫКИЯ', 'ДАГЕСТАН', 'АНОМАЛИЯ', 'ДЕТЕКЦИЯ',
  ];
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden py-3 border-y border-cyan-500/8">
      <div className="ticker-track flex gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="text-[11px] font-mono text-cyan-500/25 uppercase tracking-[0.3em] shrink-0">
            {item} <span className="text-cyan-500/15">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Feature card
function FeatureCard({
  icon, title, desc, delay = 0,
}: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-2xl border border-cyan-500/8 bg-[#0d0d1f]/60 hover:border-cyan-500/20 transition-all duration-300 group"
    >
      <div className="w-10 h-10 rounded-xl bg-cyan-500/8 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-500/15 transition-colors">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-white text-base mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// Top nav bar
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 h-14 transition-all duration-300 ${
        scrolled ? 'bg-[#030308]/90 backdrop-blur-xl border-b border-cyan-500/8' : ''
      }`}
    >
      <Link href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="text-[#030308] font-bold text-xs font-display">iD</span>
        </div>
        <span className="font-display font-bold text-white text-sm tracking-wide">iData</span>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-[13px] font-mono text-slate-400">
        <a href="#methods" className="hover:text-cyan-400 transition-colors">Методы</a>
        <a href="#map" className="hover:text-cyan-400 transition-colors">Карта</a>
        <a href="#about" className="hover:text-cyan-400 transition-colors">О платформе</a>
      </div>

      <div className="flex items-center gap-3">
        <CurtainThemeToggle />
        <Link
          href="/"
          className="px-4 py-1.5 rounded-full text-[12px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
        >
          Открыть дашборд →
        </Link>
      </div>
    </motion.nav>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#030308] text-white">
      <NavBar />
      <DynamicIslandTOC />

      {/* ═══ SECTION 1: HERO ═══ */}
      <section id="hero" className="toc-target min-h-screen flex flex-col justify-center px-6 lg:px-16 pt-20 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00FFD1] blink" />
            <span className="text-[11px] font-mono text-cyan-500/70 uppercase tracking-[0.25em]">
              Детекция аномалий · Росстат · ЮФО + СКФО
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display font-bold text-6xl lg:text-8xl xl:text-9xl leading-[0.9] tracking-tight mb-8"
          >
            <span className="text-white">Аномалии</span>
            <br />
            <span className="gradient-text">в данных</span>
            <br />
            <span className="text-white">регионов</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-slate-400 text-lg max-w-xl leading-relaxed mb-10"
          >
            Три статистических метода, SHAP-объяснимость и LLM-интерпретация выявляют
            социально-экономические отклонения в 8 регионах за 5 лет.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/"
              className="px-6 py-3 rounded-full bg-cyan-400 text-[#030308] font-display font-semibold text-sm hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95"
            >
              Открыть аналитику →
            </Link>
            <a
              href="#methods"
              className="px-6 py-3 rounded-full border border-cyan-500/20 text-slate-300 font-mono text-sm hover:border-cyan-500/40 hover:text-white transition-all"
            >
              Узнать больше
            </a>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="relative max-w-6xl mx-auto w-full mt-16 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 pb-16 border-t border-cyan-500/8 pt-10"
        >
          <StatCounter value="8" label="Регионов ЮФО / СКФО" />
          <StatCounter value="10" label="Ключевых показателей" />
          <StatCounter value="5" label="Лет данных (2020–2024)" />
          <StatCounter value="3" suffix="+" label="Метода детекции" />
        </motion.div>
      </section>

      <Ticker />

      {/* ═══ SECTION 2: METHODS (Story scroll) ═══ */}
      <section id="methods">
        <FlowArt aria-label="Методы анализа">
          {/* Z-Score */}
          <FlowSection
            aria-label="Z-Score метод"
            style={{ backgroundColor: '#050510', color: '#fff' }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyan-500/50">01 — Базовый уровень</p>
            <hr className="border-none border-t border-cyan-500/10" />
            <div>
              <h2 className="font-display text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.88] uppercase">
                Z-Score<br />Детекция
              </h2>
            </div>
            <hr className="border-none border-t border-cyan-500/10" />
            <div className="flex flex-wrap gap-[3vw]">
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-cyan-400 mb-2">Принцип</p>
                <p className="text-base leading-relaxed text-slate-400">
                  Стандартизация каждого показателя. Регионы с |z| &gt; 2.0 по любому индикатору — аномальные.
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-cyan-400 mb-2">Результат</p>
                <p className="text-base leading-relaxed text-slate-400">
                  Тепловая карта 8×10, таблица: Регион | Показатель | Z-score | Тип (лидер/отстающий).
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-cyan-400 mb-2">Пример</p>
                <p className="text-base leading-relaxed text-slate-400">
                  Калмыкия: z = −1.9 по ВРП, z = +2.1 по безработице → двойная аномалия.
                </p>
              </div>
            </div>
          </FlowSection>

          {/* Isolation Forest */}
          <FlowSection
            aria-label="Isolation Forest"
            style={{ backgroundColor: '#0a0818', color: '#fff' }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-500/60">02 — Продвинутый уровень</p>
            <hr className="border-none border-t border-amber-500/10" />
            <div>
              <h2 className="font-display text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.88] uppercase">
                Isolation<br />Forest
              </h2>
            </div>
            <hr className="border-none border-t border-amber-500/10" />
            <div className="flex flex-wrap gap-[3vw]">
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-amber-400 mb-2">n_estimators</p>
                <p className="text-base leading-relaxed text-slate-400">
                  100 деревьев, contamination=&apos;auto&apos;. Аномальные точки изолируются за меньшее число разбиений.
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-amber-400 mb-2">Преимущество</p>
                <p className="text-base leading-relaxed text-slate-400">
                  Многомерный анализ всех 10 показателей одновременно. Не предполагает распределение данных.
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-amber-400 mb-2">Venn-диаграмма</p>
                <p className="text-base leading-relaxed text-slate-400">
                  Пересечение с Z-Score и Mahalanobis показывает «истинные» многомерные аномалии.
                </p>
              </div>
            </div>
          </FlowSection>

          {/* Ensemble + Expert */}
          <FlowSection
            aria-label="Ensemble и SHAP"
            style={{ backgroundColor: '#080810', color: '#fff' }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-red-400/60">03 — Экспертный уровень</p>
            <hr className="border-none border-t border-red-500/10" />
            <div>
              <h2 className="font-display text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.88] uppercase">
                Ensemble<br />+ SHAP
              </h2>
            </div>
            <hr className="border-none border-t border-red-500/10" />
            <div className="flex flex-wrap gap-[3vw]">
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-red-400 mb-2">Веса</p>
                <p className="text-base leading-relaxed text-slate-400">
                  0.3×Z-score + 0.4×IF + 0.3×Mahalanobis. Аномалия: 2+ голоса или score &gt; 0.65.
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-red-400 mb-2">SHAP</p>
                <p className="text-base leading-relaxed text-slate-400">
                  TreeExplainer объясняет вклад каждого из 10 показателей в аномалию конкретного региона.
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-red-400 mb-2">Stability</p>
                <p className="text-base leading-relaxed text-slate-400">
                  Классификация 2020–2024: устойчивая / временная / норма. Основа для гипотез.
                </p>
              </div>
            </div>
          </FlowSection>
        </FlowArt>
      </section>

      {/* ═══ SECTION 3: 3D MAP ═══ */}
      <section id="map" className="toc-target px-6 lg:px-16 py-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-[11px] font-mono text-cyan-500/50 uppercase tracking-[0.2em] mb-3">
            Визуализация · 3D Карта регионов
          </p>
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white">
            Аномалии на карте
          </h2>
          <p className="text-slate-500 mt-3 max-w-lg">
            Высота колонки = ensemble score. Красный — устойчивая аномалия, оранжевый — временная, голубой — норма.
          </p>
        </motion.div>
        <RussiaGlobe3D />
      </section>

      {/* ═══ SECTION 4: FEATURES ═══ */}
      <section id="about" className="toc-target px-6 lg:px-16 py-24 bg-[#050510]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-[11px] font-mono text-cyan-500/50 uppercase tracking-[0.2em] mb-3">
              Возможности платформы
            </p>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-white">
              Полный стек анализа
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>}
              title="Тепловая карта Z-scores"
              desc="Матрица 8×10 с 2D и 3D режимами. Таблица аномалий по показателям: лидеры и отстающие."
              delay={0}
            />
            <FeatureCard
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="10" r="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="10" r="5" stroke="currentColor" strokeWidth="1.5"/></svg>}
              title="Venn-диаграмма методов"
              desc="Пересечение трёх методов детекции. Истинные аномалии — в центре диаграммы."
              delay={0.1}
            />
            <FeatureCard
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 15L6 10L10 12L14 6L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="6" r="1.5" fill="currentColor"/></svg>}
              title="Динамика 2020–2024"
              desc="Line chart ensemble scores по годам. Классификация устойчивости аномалий за 5 лет."
              delay={0.2}
            />
            <FeatureCard
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14h14M3 10h9M3 6h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              title="SHAP объяснимость"
              desc="Топ-5 показателей, определяющих аномальность каждого региона. Красный — усиливает, синий — снижает."
              delay={0.3}
            />
            <FeatureCard
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 2v4h4M6 10h8M6 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              title="AI Отчёт с LLM"
              desc="Ollama (gemma3:4b) генерирует структурированный отчёт с управленческими гипотезами. Стриминг + экспорт PDF/Word."
              delay={0.4}
            />
            <FeatureCard
              icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              title="Росстат данные"
              desc="8 регионов × 10 индикаторов × 5 лет. ВРП, зарплата, безработица, бедность, НИОКР, миграция и другие."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5: CTA ═══ */}
      <section className="px-6 lg:px-16 py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,255,209,0.05),transparent)]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-2xl mx-auto"
        >
          <h2 className="font-display font-bold text-5xl lg:text-6xl text-white mb-6 leading-tight">
            Начните анализ<br />
            <span className="gradient-text">прямо сейчас</span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Запустите ML пайплайн, изучите 3D карту аномалий и получите AI-сгенерированный отчёт за минуты.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-cyan-400 text-[#030308] font-display font-bold text-base hover:bg-cyan-300 transition-all shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95"
          >
            Открыть дашборд
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-16 py-8 border-t border-cyan-500/8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <span className="text-[#030308] font-bold text-[8px] font-display">iD</span>
          </div>
          <span className="font-mono text-xs text-slate-600">iData Anomaly Detection Platform</span>
        </div>
        <p className="font-mono text-[11px] text-slate-700">
          Марафон «Цифровой портрет региона» · Тема 14 · 2026
        </p>
      </footer>
    </div>
  );
}
