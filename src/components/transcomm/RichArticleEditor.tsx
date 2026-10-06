'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import { dzfColors } from '@/theme/colors';

export interface RichArticleEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  minChars?: number;
}

export function RichArticleEditor({
  content,
  onChange,
  minChars = 200,
}: RichArticleEditorProps) {
  const [activeTab, setActiveTab] = React.useState<'write' | 'preview' | 'split'>('split');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const wordCount = React.useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const charCount = content ? content.length : 0;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));
  const isSatisfied = charCount >= minChars;

  const insertFormatting = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end) || placeholder;

    const replacement = `${prefix}${selection}${suffix}`;
    const nextContent =
      content.substring(0, start) + replacement + content.substring(end);

    onChange(nextContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selection.length
      );
    }, 10);
  };

  /**
   * Simple, reliable markdown-to-HTML parser for editorial preview
   * without heavy external dependencies.
   */
  const renderMarkdownPreview = (text: string) => {
    if (!text || !text.trim()) {
      return (
        <Typography sx={{ color: dzfColors.surfaces.textMuted, fontStyle: 'italic' }}>
          Live preview will appear here as you write...
        </Typography>
      );
    }

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let quoteBuffer: string[] = [];

    const flushList = () => {
      if (listBuffer.length > 0 && listType) {
        if (listType === 'ul') {
          elements.push(
            <Box
              component="ul"
              key={`ul-${elements.length}`}
              sx={{ pl: 3, my: 1.5, color: dzfColors.surfaces.textPrimary, lineHeight: 1.7 }}
            >
              {listBuffer.map((item, i) => (
                <li key={i}>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                </li>
              ))}
            </Box>
          );
        } else {
          elements.push(
            <Box
              component="ol"
              key={`ol-${elements.length}`}
              sx={{ pl: 3, my: 1.5, color: dzfColors.surfaces.textPrimary, lineHeight: 1.7 }}
            >
              {listBuffer.map((item, i) => (
                <li key={i}>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                </li>
              ))}
            </Box>
          );
        }
        listBuffer = [];
        listType = null;
      }
    };

    const flushQuote = () => {
      if (quoteBuffer.length > 0) {
        const rawQuote = quoteBuffer.join('\n');
        const isCallout = rawQuote.includes('[!NOTE]') || rawQuote.includes('[!TIP]');
        const cleanQuote = rawQuote.replace(/\[!(NOTE|TIP|IMPORTANT)\]\s*/g, '');

        elements.push(
          <Box
            key={`quote-${elements.length}`}
            sx={{
              pl: 2.5,
              py: 1.25,
              my: 2,
              borderLeft: `4px solid ${isCallout ? dzfColors.gold[500] : dzfColors.maroon[600]}`,
              backgroundColor: isCallout
                ? dzfColors.gold[50]
                : dzfColors.surfaces.canvas,
              borderRadius: '0 8px 8px 0',
              fontStyle: isCallout ? 'normal' : 'italic',
              color: dzfColors.navy[900],
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: formatInline(cleanQuote) }} />
          </Box>
        );
        quoteBuffer = [];
      }
    };

    const formatInline = (str: string) => {
      return str
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 4px; font-family: monospace;">$1</code>');
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        flushList();
        flushQuote();
        elements.push(
          <Typography
            key={index}
            variant="h4"
            sx={{ fontWeight: 800, color: dzfColors.navy[950], mt: 3, mb: 1.5 }}
          >
            {trimmed.substring(2)}
          </Typography>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        flushList();
        flushQuote();
        elements.push(
          <Typography
            key={index}
            variant="h5"
            sx={{
              fontWeight: 700,
              color: dzfColors.navy[900],
              mt: 2.5,
              mb: 1.2,
              borderBottom: `1px solid ${dzfColors.surfaces.border}`,
              pb: 0.5,
            }}
          >
            {trimmed.substring(3)}
          </Typography>
        );
        return;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        flushList();
        flushQuote();
        elements.push(
          <Typography
            key={index}
            variant="h6"
            sx={{ fontWeight: 600, color: dzfColors.maroon[800], mt: 2, mb: 1 }}
          >
            {trimmed.substring(4)}
          </Typography>
        );
        return;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushList();
        quoteBuffer.push(trimmed.substring(2));
        return;
      } else {
        flushQuote();
      }

      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushQuote();
        if (listType !== 'ul') flushList();
        listType = 'ul';
        listBuffer.push(trimmed.substring(2));
        return;
      }

      // Numbered List
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (olMatch) {
        flushQuote();
        if (listType !== 'ol') flushList();
        listType = 'ol';
        listBuffer.push(olMatch[2]);
        return;
      }

      // If we got here, flush list
      flushList();

      if (!trimmed) {
        return;
      }

      // Standard paragraph
      elements.push(
        <Typography
          key={index}
          variant="body1"
          sx={{ my: 1.25, color: dzfColors.surfaces.textPrimary, lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      );
    });

    flushList();
    flushQuote();

    return elements;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Editor Header Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          p: 1.5,
          backgroundColor: dzfColors.surfaces.canvas,
          border: `1px solid ${dzfColors.surfaces.border}`,
          borderRadius: '8px 8px 0 0',
        }}
      >
        {/* Formatting Buttons */}
        <ButtonGroup size="small" variant="outlined" sx={{ flexWrap: 'wrap' }}>
          <Tooltip title="Heading 2">
            <Button onClick={() => insertFormatting('## ', '\n', 'Section Title')}>
              H2
            </Button>
          </Tooltip>
          <Tooltip title="Heading 3">
            <Button onClick={() => insertFormatting('### ', '\n', 'Subsection Title')}>
              H3
            </Button>
          </Tooltip>
          <Tooltip title="Bold">
            <Button
              sx={{ fontWeight: 'bold' }}
              onClick={() => insertFormatting('**', '**', 'bold text')}
            >
              B
            </Button>
          </Tooltip>
          <Tooltip title="Italic">
            <Button
              sx={{ fontStyle: 'italic' }}
              onClick={() => insertFormatting('*', '*', 'italic text')}
            >
              I
            </Button>
          </Tooltip>
          <Tooltip title="Bullet List">
            <Button onClick={() => insertFormatting('- ', '\n', 'List item')}>
              • List
            </Button>
          </Tooltip>
          <Tooltip title="Numbered List">
            <Button onClick={() => insertFormatting('1. ', '\n', 'First item')}>
              1. List
            </Button>
          </Tooltip>
          <Tooltip title="Blockquote">
            <Button onClick={() => insertFormatting('> ', '\n', 'Quotable insight')}>
              ” Quote
            </Button>
          </Tooltip>
          <Tooltip title="Takeaway Callout">
            <Button onClick={() => insertFormatting('> [!NOTE]\n> ', '\n', 'Key leadership principle')}>
              Callout
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* View Mode Toggle */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ minHeight: 32 }}
        >
          <Tab value="write" label="Write" sx={{ minHeight: 32, py: 0.5, fontSize: '0.78rem' }} />
          <Tab value="preview" label="Preview" sx={{ minHeight: 32, py: 0.5, fontSize: '0.78rem' }} />
          <Tab value="split" label="Side-by-Side" sx={{ minHeight: 32, py: 0.5, fontSize: '0.78rem' }} />
        </Tabs>
      </Box>

      {/* Editor Canvas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns:
            activeTab === 'split'
              ? { xs: '1fr', md: '1fr 1fr' }
              : '1fr',
          gap: 2,
          minHeight: 420,
        }}
      >
        {/* Textarea Area */}
        {(activeTab === 'write' || activeTab === 'split') && (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box
              component="textarea"
              ref={textareaRef}
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
              placeholder="Draft your values, leadership insights, or character study here using Markdown formatting (H2, H3, lists, quotes)..."
              sx={{
                width: '100%',
                height: '100%',
                minHeight: 400,
                p: 2,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                borderRadius: '0 0 8px 8px',
                border: `1px solid ${dzfColors.surfaces.border}`,
                backgroundColor: '#ffffff',
                outline: 'none',
                resize: 'vertical',
                '&:focus': {
                  borderColor: dzfColors.navy[700],
                  boxShadow: `0 0 0 2px ${dzfColors.navy[100]}`,
                },
              }}
            />
          </Box>
        )}

        {/* Preview Area */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: '0 0 8px 8px',
              backgroundColor: dzfColors.surfaces.canvas,
              borderColor: dzfColors.surfaces.border,
              overflowY: 'auto',
              maxHeight: 520,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                pb: 1,
                borderBottom: `1px solid ${dzfColors.surfaces.border}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: dzfColors.navy[700] }}>
                READER PREVIEW
              </Typography>
              <Typography variant="caption" sx={{ color: dzfColors.surfaces.textMuted }}>
                ~{readTimeEst} min read
              </Typography>
            </Box>
            <Box sx={{ maxWidth: '100%' }}>{renderMarkdownPreview(content)}</Box>
          </Paper>
        )}
      </Box>

      {/* Editor Metrics Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 0.5,
          fontSize: '0.78rem',
          color: dzfColors.surfaces.textMuted,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span>
            Characters: <strong>{charCount}</strong> / min {minChars}
          </span>
          <span>
            Words: <strong>{wordCount}</strong>
          </span>
          <span>
            Read time: <strong>~{readTimeEst} min</strong>
          </span>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isSatisfied ? '#10b981' : '#ef4444',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: isSatisfied ? '#059669' : '#dc2626',
            }}
          >
            {isSatisfied
              ? 'Minimum length met'
              : `${minChars - charCount} more characters required`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default RichArticleEditor;
