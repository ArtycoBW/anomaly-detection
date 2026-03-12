'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface AIReportPanelProps {
  year?: number;
}

function markdownToStyledHtml(md: string, year: number): string {
  let html = md
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^> (.*)/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\- (.*)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\|(.+)\|/g, (match) => {
      if (match.includes('---')) return '';
      const cells = match.split('|').filter(Boolean).map((c) => c.trim());
      return '<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>';
    });

  // Wrap consecutive list items and table rows
  html = html.split('\n').join('\n');
  html = html.replace(/(?:<li>[^]*?<\/li>\s*)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/(?:<tr>[^]*?<\/tr>\s*)+/g, (m) => `<table>${m}</table>`);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>iData — Аналитический отчёт ${year}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #1e293b; line-height: 1.8; font-size: 14px; }
  h1 { font-size: 1.8em; color: #312e81; border-bottom: 3px solid #6366f1; padding-bottom: 10px; margin-top: 0; }
  h2 { font-size: 1.4em; color: #3730a3; margin-top: 2em; border-left: 4px solid #6366f1; padding-left: 12px; }
  h3 { font-size: 1.1em; color: #4338ca; margin-top: 1.5em; }
  strong { color: #0f172a; }
  blockquote { border-left: 4px solid #6366f1; background: #f1f5f9; margin: 1em 0; padding: 8px 16px; border-radius: 0 8px 8px 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  hr { border: none; border-top: 2px solid #e2e8f0; margin: 2em 0; }
  ul { padding-left: 1.5em; }
  li { margin: 4px 0; }
  .footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.85em; text-align: center; }
</style>
</head>
<body>
<p>${html}</p>
<div class="footer">Сгенерировано платформой iData Anomaly Detection</div>
</body>
</html>`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPdf(content: string, year: number) {
  const { default: jsPDF } = await import('jspdf');

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;padding:32px;background:white;color:#1e293b;font-family:sans-serif;font-size:13px;line-height:1.7;';
  container.innerHTML = markdownToStyledHtml(content, year);
  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    let heightLeft = imgHeight;
    let position = margin;
    let page = 0;

    while (heightLeft > 0) {
      if (page > 0) doc.addPage();
      const yOffset = margin - page * (pageHeight - margin * 2);
      doc.addImage(imgData, 'PNG', margin, yOffset, contentWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);
      page++;
    }

    doc.save(`idata-report-${year}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function downloadWord(content: string, year: number) {
  const html = markdownToStyledHtml(content, year);
  const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>iData Report ${year}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
${html.match(/<style>[\s\S]*?<\/style>/)?.[0] || ''}
</head>
<body>${html.match(/<body>([\s\S]*)<\/body>/)?.[1] || html}</body>
</html>`;
  downloadFile(wordHtml, `idata-report-${year}.doc`, 'application/msword;charset=utf-8');
}

export default function AIReportPanel({ year = 2023 }: AIReportPanelProps) {
  const [content, setContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadExisting = async () => {
      setIsLoadingExisting(true);
      try {
        const result = await api.report.getLatest(year);
        if (!cancelled && result?.content) setContent(result.content);
      } catch {
        // No existing report
      } finally {
        if (!cancelled) setIsLoadingExisting(false);
      }
    };
    loadExisting();
    return () => { cancelled = true; };
  }, [year]);

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
      const response = await fetch(api.report.streamUrl(year), { signal: abortRef.current.signal });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Не удалось получить поток данных');
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setContent((prev) => prev + decoder.decode(value));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [year]);

  const stopStream = useCallback(() => { abortRef.current?.abort(); }, []);

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await downloadPdf(content, year);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-700/40',
        'bg-slate-900/60 backdrop-blur-xl',
        'shadow-lg shadow-black/20',
        'overflow-hidden flex flex-col',
        'h-[calc(100vh-200px)]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40 bg-slate-900/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-indigo-500/20">
            <svg className="w-4.5 h-4.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI-аналитика</h3>
            <p className="text-xs text-slate-400">Анализ аномалий за {year} год</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {content && !isStreaming && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/40 transition-all disabled:opacity-50"
                title="Скачать в PDF"
              >
                {isExporting ? '...' : '.pdf'}
              </button>
              <button
                onClick={() => downloadWord(content, year)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/40 transition-all"
                title="Скачать для Word (.doc)"
              >
                .doc
              </button>
              <button
                onClick={() => downloadFile(content, `idata-report-${year}.md`, 'text/markdown;charset=utf-8')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-700/40 transition-all"
                title="Скачать в Markdown"
              >
                .md
              </button>
            </div>
          )}

          {isStreaming ? (
            <button
              onClick={stopStream}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
              Остановить
            </button>
          ) : (
            <button
              onClick={startStream}
              disabled={isLoadingExisting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {isLoadingExisting ? 'Загрузка...' : 'Сгенерировать отчёт'}
            </button>
          )}
        </div>
      </div>

      {/* Content — scrolls inside the block */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {error && (
          <div className="px-8 py-4">
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {isLoadingExisting && (
          <div className="px-8 py-6 space-y-4">
            <div className="skeleton h-7 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-7 w-1/2 mt-8" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        )}

        {isStreaming && !content && (
          <div className="px-8 py-6">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
              </div>
              <span className="text-sm animate-pulse">Генерация отчёта через LLM...</span>
            </div>
          </div>
        )}

        {content ? (
          <article className="px-8 py-6">
            <div className="report-prose max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-indigo-400 animate-pulse ml-0.5 rounded-sm" />
              )}
            </div>
          </article>
        ) : (
          !isStreaming && !isLoadingExisting && !error && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4 border border-slate-700/30">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Нажмите кнопку для генерации AI-отчёта</p>
              <p className="text-xs text-slate-600 mt-1">Анализ будет сгенерирован на основе данных ML пайплайна</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
