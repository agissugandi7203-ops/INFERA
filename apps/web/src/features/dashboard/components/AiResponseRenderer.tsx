import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Calculator,
  ShieldAlert,
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Scale,
  Info,
  Sparkles,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Preprocesses raw AI text from OpenRouter/GPT models:
 * 1. Extracts <think>...</think> reasoning blocks (DeepSeek, Qwen, Gemini Thinking).
 * 2. Unwraps accidental JSON wrappers ({ "text": "...", ... }).
 * 3. Normalizes HTML tags (<font>, <span style="color">, <mark>, <b>, <i>, <br>) into semantic tokens.
 * 4. Sanitizes dangerous scripts/iframes to guarantee XSS safety.
 */
export function preprocessAiResponse(raw: string): {
  reasoning: string | null;
  cleanContent: string;
} {
  if (!raw) return { reasoning: null, cleanContent: '' };

  let text = raw.trim();

  // 1. Extract <think> ... </think> reasoning blocks
  let reasoning: string | null = null;
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    text = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
  }

  // 2. Unpack accidental JSON wrappers
  const jsonBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]);
      if (parsed.text && typeof parsed.text === 'string') text = parsed.text;
      else if (parsed.reply && typeof parsed.reply === 'string') text = parsed.reply;
    } catch {
      // not json, keep
    }
  } else if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.text && typeof parsed.text === 'string') text = parsed.text;
      else if (parsed.reply && typeof parsed.reply === 'string') text = parsed.reply;
    } catch {
      // not json, keep
    }
  }

  // 3. Normalize HTML tags often emitted by GPT/OpenRouter models
  text = text.replace(/<font\s+color=["']?(red|#e\w+|#f\w+|rose)["']?>([\s\S]*?)<\/font>/gi, '**[KRITIS: $2]**');
  text = text.replace(/<font\s+color=["']?(green|#1\w+|#2\w+|emerald)["']?>([\s\S]*?)<\/font>/gi, '**[AMAN: $2]**');
  text = text.replace(/<font\s+color=["']?(amber|yellow|orange|#f5\w+|#eab\w+)["']?>([\s\S]*?)<\/font>/gi, '**[PERINGATAN: $2]**');
  text = text.replace(/<font\s+color=["']?(blue|cyan|#3\w+|#25\w+)["']?>([\s\S]*?)<\/font>/gi, '**[INFO: $2]**');
  text = text.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1');

  text = text.replace(/<span\s+style=["']color:\s*(red|#e\w+|#f\w+)["']?>([\s\S]*?)<\/span>/gi, '**[KRITIS: $2]**');
  text = text.replace(/<span\s+style=["']color:\s*(green|#1\w+|#2\w+)["']?>([\s\S]*?)<\/span>/gi, '**[AMAN: $2]**');
  text = text.replace(/<span\s+style=["']color:\s*(amber|yellow|orange)["']?>([\s\S]*?)<\/span>/gi, '**[PERINGATAN: $2]**');
  text = text.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');

  text = text.replace(/<mark>([\s\S]*?)<\/mark>/gi, '**$1**');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');

  // Strip dangerous tags (XSS guard)
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  return { reasoning, cleanContent: text };
}

/**
 * Specialized CodeBlock & Formula Card Component
 */
const CodeBlock: React.FC<{
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1].toLowerCase() : '';
  const codeString = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Special presentation for Mathematical Formulas (Haversine, DSI, PRB Overlap, etc.)
  const isFormula =
    language === 'math' ||
    language === 'formula' ||
    codeString.includes('Haversine') ||
    codeString.includes('DSI =') ||
    codeString.includes('Overlap =');

  if (isFormula) {
    return (
      <div className="my-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 to-slate-50 dark:from-slate-900 dark:to-indigo-950/30 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-100/50 dark:bg-indigo-950/50 border-b border-indigo-200/70 dark:border-indigo-900/50 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-300">
            <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Formulasi Matematika &amp; Logika Fraud</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors cursor-pointer"
            title="Salin Rumus"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Rumus'}</span>
          </button>
        </div>
        <div className="p-3.5 overflow-x-auto font-mono text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-semibold">
          <pre>{codeString}</pre>
        </div>
      </div>
    );
  }

  // Standard Syntax Code Box
  return (
    <div className="relative my-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-xs font-mono text-slate-400">
        <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-300">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer"
          title="Salin Kode"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed">
        <pre>{children}</pre>
      </div>
    </div>
  );
};

/**
 * Intelligent Table Cell Formatter:
 * Automatically detects risk labels, currency amounts, and codes to apply rich visual styles
 */
const TableCellRenderer: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const content = String(children || '').trim();

  // 1. Risk Level Badges
  if (/^(KRITIS|CRITICAL|FRAUD|ANOMALI BERAT)$/i.test(content)) {
    return (
      <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
          <ShieldAlert className="w-3 h-3" />
          {content}
        </span>
      </td>
    );
  }

  if (/^(TINGGI|HIGH|RISIKO TINGGI)$/i.test(content)) {
    return (
      <td className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
          <AlertTriangle className="w-3 h-3" />
          {content}
        </span>
      </td>
    );
  }

  if (/^(SEDANG|MEDIUM|PERINGATAN|WARNING|WASPADA)$/i.test(content)) {
    return (
      <td className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 text-sm">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
          <AlertTriangle className="w-3.5 h-3.5" />
          {content}
        </span>
      </td>
    );
  }

  if (/^(RENDAH|LOW|AMAN|VALID|PATUH|SESUAI)$/i.test(content)) {
    return (
      <td className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 text-sm">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
          <Check className="w-3.5 h-3.5" />
          {content}
        </span>
      </td>
    );
  }

  // 2. Currency Formatting (e.g. Rp 15.000.000)
  if (/^Rp\s*[\d.,]+/i.test(content)) {
    return (
      <td className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">
        {content}
      </td>
    );
  }

  // 3. Technical Identifier (SEP, Kartu, ICD, NIK)
  if (/^\b(000\d{10}|SEP-[\w-]+|33\d{14}|\d{4}R\w+)\b/i.test(content)) {
    return (
      <td className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 text-sm">
        <span className="px-2 py-0.5 rounded font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {content}
        </span>
      </td>
    );
  }

  // Default cell
  return (
    <td className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm">
      {children}
    </td>
  );
};

/**
 * Intelligent Paragraph & Inline Token Formatter:
 * Converts token badges like [KRITIS: ...], [PERINGATAN: ...], and legal citations into UI chips
 */
const ParagraphRenderer: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  // If children is plain string, search for bracketed tags
  if (typeof children === 'string') {
    const parts = children.split(/(\[KRITIS:[^\]]+\]|\[PERINGATAN:[^\]]+\]|\[AMAN:[^\]]+\]|\[INFO:[^\]]+\]|\[(?:Permenkes|UU|Perpres|KUHP|SE Menkes)[^\]]+\])/gi);

    if (parts.length > 1) {
      return (
        <div className="text-[15px] sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 my-2">
          {parts.map((part, idx) => {
            if (part.startsWith('[KRITIS:')) {
              const label = part.replace(/^\[KRITIS:\s*/, '').replace(/\]$/, '');
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-md font-bold text-xs sm:text-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 align-baseline"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {label}
                </span>
              );
            }
            if (part.startsWith('[PERINGATAN:')) {
              const label = part.replace(/^\[PERINGATAN:\s*/, '').replace(/\]$/, '');
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-md font-bold text-xs sm:text-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 align-baseline"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {label}
                </span>
              );
            }
            if (part.startsWith('[AMAN:')) {
              const label = part.replace(/^\[AMAN:\s*/, '').replace(/\]$/, '');
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-md font-bold text-xs sm:text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 align-baseline"
                >
                  <Check className="w-3.5 h-3.5" />
                  {label}
                </span>
              );
            }
            if (part.startsWith('[INFO:')) {
              const label = part.replace(/^\[INFO:\s*/, '').replace(/\]$/, '');
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-md font-bold text-xs sm:text-sm bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/60 align-baseline"
                >
                  <Info className="w-3.5 h-3.5" />
                  {label}
                </span>
              );
            }
            // Legal Citation Token (e.g. [Permenkes 16/2019 Pasal 6])
            if (/^\[(?:Permenkes|UU|Perpres|KUHP|SE Menkes)/i.test(part)) {
              const citationText = part.replace(/^\[/, '').replace(/\]$/, '');
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => navigate('/dashboard/regulations')}
                  className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-md font-semibold text-xs sm:text-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                  title="Lihat Referensi Regulasi JKN Resmi"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{citationText}</span>
                </button>
              );
            }
            return part;
          })}
        </div>
      );
    }
  }

  return (
    <div className="text-[15px] sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 my-2">
      {children}
    </div>
  );
};

/**
 * Intelligent Blockquote / GitHub Alert Renderer:
 * Translates > [!NOTE], > [!WARNING], > [!CRITICAL], etc. into styled alert callouts with icons
 */
const BlockquoteRenderer: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const textContent = React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (React.isValidElement(child) && (child.props as any)?.children) {
        return String((child.props as any).children);
      }
      return '';
    })
    .join(' ')
    .trim();

  if (textContent.includes('[!NOTE]') || textContent.includes('[!INFO]')) {
    return (
      <div className="my-3 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 p-3.5 text-xs sm:text-sm text-sky-900 dark:text-sky-200 flex items-start gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">{children}</div>
      </div>
    );
  }

  if (textContent.includes('[!TIP]') || textContent.includes('[!SARAN]')) {
    return (
      <div className="my-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5 shadow-2xs">
        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">{children}</div>
      </div>
    );
  }

  if (textContent.includes('[!IMPORTANT]') || textContent.includes('[!PENTING]')) {
    return (
      <div className="my-3 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 shadow-2xs">
        <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">{children}</div>
      </div>
    );
  }

  if (textContent.includes('[!WARNING]') || textContent.includes('[!PERINGATAN]')) {
    return (
      <div className="my-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">{children}</div>
      </div>
    );
  }

  if (textContent.includes('[!CAUTION]') || textContent.includes('[!CRITICAL]') || textContent.includes('[!KRITIS]')) {
    return (
      <div className="my-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 p-3.5 text-xs sm:text-sm text-rose-900 dark:text-rose-200 flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">{children}</div>
      </div>
    );
  }

  // Standard Quote
  return (
    <blockquote className="border-l-4 border-emerald-500 pl-3.5 py-1.5 my-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-r-lg text-xs sm:text-sm italic">
      {children}
    </blockquote>
  );
};

/**
 * Defensive Error Boundary around Markdown Parsing
 */
class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode; rawContent: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[AiResponseRenderer] Gagal merender Markdown AST, beralih ke fallback teks polos:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs sm:text-sm whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 leading-relaxed">
          {this.props.rawContent}
        </div>
      );
    }
    return this.props.children;
  }
}

export interface AiResponseRendererProps {
  content: string;
  className?: string;
  enableReasoningDrawer?: boolean;
}

/**
 * Enterprise AI Response Renderer & Paraphrasing Component
 */
export const AiResponseRenderer: React.FC<AiResponseRendererProps> = ({
  content,
  className = '',
  enableReasoningDrawer = false,
}) => {
  const navigate = useNavigate();
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  // 1. Preprocess raw AI content
  const { reasoning, cleanContent } = preprocessAiResponse(content);

  return (
    <div className={`ai-response-rendered font-sans ${className}`}>
      {/* Optional Collapsible AI Reasoning Drawer */}
      {enableReasoningDrawer && reasoning && (
        <div className="mb-3 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 overflow-hidden text-xs transition-all shadow-2xs">
          <button
            type="button"
            onClick={() => setIsReasoningOpen((prev) => !prev)}
            className="w-full px-3.5 py-2 select-none font-medium text-indigo-900 dark:text-indigo-300 flex items-center justify-between hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">Alur Penalaran AI (Reasoning Chain)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-indigo-600/70 dark:text-indigo-400/70">
              <span>{isReasoningOpen ? 'Sembunyikan' : 'Buka Alur'}</span>
              {isReasoningOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          {isReasoningOpen && (
            <div className="p-3.5 border-t border-indigo-200/60 dark:border-indigo-900/50 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white/60 dark:bg-slate-950/50">
              {reasoning}
            </div>
          )}
        </div>
      )}

      {/* Main Markdown & UI Paraphrasing Body */}
      <MarkdownErrorBoundary rawContent={cleanContent}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-800"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2.5"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2"
                {...props}
              />
            ),
            p: ParagraphRenderer,
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-5 space-y-1.5 my-2.5 text-[15px] sm:text-base text-slate-800 dark:text-slate-200" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-5 space-y-1.5 my-2.5 text-[15px] sm:text-base text-slate-800 dark:text-slate-200" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="leading-relaxed pl-1" {...props} />
            ),
            blockquote: BlockquoteRenderer,
            table: ({ node, ...props }) => (
              <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <table className="min-w-full text-sm text-left divide-y divide-slate-200 dark:divide-slate-800" {...props} />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-slate-100 dark:bg-slate-800/90" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider whitespace-nowrap" {...props} />
            ),
            td: TableCellRenderer as any,
            code: CodeBlock as any,
            a: ({ node, href, ...props }) => {
              const safeHref = href && /^(https?:|mailto:|\/|#)/i.test(href.trim()) ? href.trim() : '#';
              const isInternal = safeHref.startsWith('/') || safeHref.startsWith('#');

              if (isInternal && safeHref !== '#') {
                return (
                  <a
                    href={safeHref}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = safeHref.startsWith('/dashboard')
                        ? safeHref
                        : `/dashboard${safeHref.startsWith('/') ? '' : '/'}${safeHref}`;
                      navigate(target);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                    {...props}
                  >
                    <span>{props.children}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                );
              }

              return (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-0.5"
                  {...props}
                />
              );
            },
            hr: () => <hr className="my-4 border-slate-200 dark:border-slate-800" />,
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </MarkdownErrorBoundary>
    </div>
  );
};
