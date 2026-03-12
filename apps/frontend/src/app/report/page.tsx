'use client';

import { useYear } from '@/context/YearContext';
import AIReportPanel from '@/components/ai/AIReportPanel';
import { motion } from 'framer-motion';

export default function ReportPage() {
  const { year } = useYear();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">AI Аналитический отчёт</span>
        </h1>
        <p className="text-slate-400 mt-2">
          Генерация отчёта через LLM на основе результатов анализа за {year} год
        </p>
      </motion.div>

      <AIReportPanel year={year} />
    </div>
  );
}
