'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface AIReportPanelProps {
  year?: number;
}

export default function AIReportPanel({ year = 2023 }: AIReportPanelProps) {
  const [content, setContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load existing report on mount or year change
  useEffect(() => {
    let cancelled = false;

    const loadExisting = async () => {
      setIsLoadingExisting(true);
      try {
        const result = await api.report.getLatest(year);
        if (!cancelled && result?.content) {
          setContent(result.content);
        }
      } catch {
        // No existing report, that's fine
      } finally {
        if (!cancelled) setIsLoadingExisting(false);
      }
    };

    loadExisting();
    return () => { cancelled = true; };
  }, [year]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  const startStream = useCallback(async () => {
    setIsStreaming(true);
    setContent('');
    setError(null);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(api.report.streamUrl(year), {
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Не удалось получить поток данных');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setContent((prev) => prev + text);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Cancelled by user
      } else {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [year]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-700/60',
        'bg-slate-800/40 backdrop-blur-md',
        'shadow-xl shadow-slate-900/30',
        'overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              AI-аналитика
            </h3>
            <p className="text-xs text-slate-400">
              Анализ аномалий за {year} год
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              onClick={stopStream}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-red-500/20 text-red-300 border border-red-500/40',
                'hover:bg-red-500/30 transition-colors',
                'flex items-center gap-2'
              )}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Остановить
            </button>
          ) : (
            <button
              onClick={startStream}
              disabled={isLoadingExisting}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-indigo-600 text-white',
                'hover:bg-indigo-500 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center gap-2'
              )}
            >
              {isLoadingExisting ? (
                <>
                  <Spinner />
                  Загрузка...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Сгенерировать отчёт
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className={cn(
          'px-5 py-4 min-h-50 max-h-150 overflow-y-auto',
          'scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600'
        )}
      >
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {isStreaming && !content && (
          <div className="flex items-center gap-3 text-slate-400">
            <Spinner />
            <span className="text-sm">Генерация отчёта...</span>
          </div>
        )}

        {content ? (
          <div
            className={cn(
              'prose prose-invert prose-sm max-w-none',
              'prose-headings:text-white prose-headings:font-semibold',
              'prose-p:text-slate-300 prose-p:leading-relaxed',
              'prose-strong:text-white',
              'prose-li:text-slate-300',
              'prose-code:text-indigo-300 prose-code:bg-slate-700/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
              'prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline'
            )}
          >
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-0.5" />
            )}
          </div>
        ) : (
          !isStreaming && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <svg
                className="w-12 h-12 mb-3 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-sm">Нажмите кнопку для генерации AI-отчёта</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
