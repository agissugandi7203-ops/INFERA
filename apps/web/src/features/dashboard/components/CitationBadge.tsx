import React from 'react';
import { Globe, FileText, ExternalLink } from 'lucide-react';

export interface CitationItem {
  type: 'url_citation' | 'file_citation';
  title?: string;
  url?: string;
  filename?: string;
  clause?: string;
  page?: number;
}

interface CitationBadgeProps {
  citation: CitationItem;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation }) => {
  if (citation.type === 'url_citation' && citation.url) {
    let hostname = citation.url;
    try {
      hostname = new URL(citation.url).hostname;
    } catch {
      // Use raw string if not valid URL format
    }

    return (
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-sm group"
        title={citation.title || citation.url}
      >
        <Globe className="w-3 h-3 text-emerald-400 flex-shrink-0" />
        <span className="truncate max-w-[200px]">{citation.title || hostname}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shadow-sm"
      title={citation.clause || citation.filename}
    >
      <FileText className="w-3 h-3 text-cyan-400 flex-shrink-0" />
      <span className="truncate max-w-[220px]">
        {citation.filename || 'Regulasi JKN'} {citation.clause ? `(${citation.clause})` : ''}
      </span>
    </span>
  );
};
