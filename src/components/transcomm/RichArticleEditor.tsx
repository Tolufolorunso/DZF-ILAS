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
import { MaximizeIcon, MinimizeIcon } from '@/components/ui/DZFIcons';

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
  const [isZenMode, setIsZenMode] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Listen for Escape key to exit Zen Mode
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isZenMode]);

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
   * Reverts current line from heading, blockquote, or list item back to a standard paragraph.
   */
  const convertToParagraph = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const lastNewline = content.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = content.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? content.length : nextNewline;

    const lineText = content.substring(lineStart, lineEnd);
    // Strip markdown prefixes: '# ', '## ', '### ', '> ', '- ', '* ', '1. ', etc.
    const cleanedLine = lineText.replace(/^(\s*)(#{1,6}\s+|>\s*|[-*]\s+|\d+\.\s+)/, '$1');

    if (cleanedLine !== lineText) {
      const nextContent =
        content.substring(0, lineStart) + cleanedLine + content.substring(lineEnd);
      onChange(nextContent);
      const diff = lineText.length - cleanedLine.length;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          Math.max(lineStart, start - diff),
          Math.max(lineStart, end - diff)
        );
      }, 10);
    }
  };

  /**
   * Inserts markdown hyperlink with selection awareness.
   */
  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end);

    if (selection) {
      const replacement = `[${selection}](https://)`;
      const nextContent =
        content.substring(0, start) + replacement + content.substring(end);
      onChange(nextContent);
      setTimeout(() => {
        textarea.focus();
        const urlPos = start + selection.length + 11;
        textarea.setSelectionRange(urlPos, urlPos);
      }, 10);
    } else {
      insertFormatting('[', '](https://)', 'Link text');
    }
  };

  /**
   * Smart list auto-continuation and clean list termination on Enter key.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;
      const value = content;

      // Find the start of the current line
      const lastNewline = value.lastIndexOf('\n', cursor - 1);
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const currentLine = value.substring(lineStart, cursor);

      // 1. Unordered list: e.g. "- ", "* ", "  - "
      const ulMatch = currentLine.match(/^(\s*[-*]\s+)(.*)$/);
      if (ulMatch) {
        e.preventDefault();
        const prefix = ulMatch[1];
        const textAfterPrefix = ulMatch[2].trim();

        if (!textAfterPrefix) {
          // Empty list item: double-enter / exit list mode by clearing bullet
          const beforeLine = value.substring(0, lineStart);
          const afterCursor = value.substring(cursor);
          const nextContent = beforeLine + afterCursor;
          onChange(nextContent);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          // Continue list with same bullet/indent
          const beforeCursor = value.substring(0, cursor);
          const afterCursor = value.substring(cursor);
          const insertion = `\n${prefix}`;
          const nextContent = beforeCursor + insertion + afterCursor;
          onChange(nextContent);
          setTimeout(() => {
            textarea.focus();
            const nextPos = cursor + insertion.length;
            textarea.setSelectionRange(nextPos, nextPos);
          }, 0);
        }
        return;
      }

      // 2. Ordered list: e.g. "1. ", "  2. "
      const olMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (olMatch) {
        e.preventDefault();
        const indent = olMatch[1];
        const num = parseInt(olMatch[2], 10);
        const textAfterPrefix = olMatch[3].trim();

        if (!textAfterPrefix) {
          // Empty ordered list item: double-enter / exit list mode
          const beforeLine = value.substring(0, lineStart);
          const afterCursor = value.substring(cursor);
          const nextContent = beforeLine + afterCursor;
          onChange(nextContent);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(lineStart, lineStart);
          }, 0);
        } else {
          // Continue list with incremented number
          const beforeCursor = value.substring(0, cursor);
          const afterCursor = value.substring(cursor);
          const nextNum = num + 1;
          const insertion = `\n${indent}${nextNum}. `;
          const nextContent = beforeCursor + insertion + afterCursor;
          onChange(nextContent);
          setTimeout(() => {
            textarea.focus();
            const nextPos = cursor + insertion.length;
            textarea.setSelectionRange(nextPos, nextPos);
          }, 0);
        }
        return;
      }
    }
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
        .replace(/<ins>(.*?)<\/ins>/gi, '<ins style="text-decoration: underline;">$1</ins>')
        .replace(/<u>(.*?)<\/u>/gi, '<ins style="text-decoration: underline;">$1</ins>')
        .replace(
          /<mark>(.*?)<\/mark>/gi,
          '<mark style="background-color: #fef08a; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-weight: 500;">$1</mark>'
        )
        .replace(
          /==(.*?)==/g,
          '<mark style="background-color: #fef08a; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-weight: 500;">$1</mark>'
        )
        .replace(
          /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #800020; text-decoration: underline; font-weight: 600;">$1</a>'
        )
        .replace(
          /`(.*?)`/g,
          '<code style="background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 4px; font-family: monospace;">$1</code>'
        );
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
    <Box
      sx={
        isZenMode
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 1350,
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 1.5, sm: 2.5, md: 3 },
              boxSizing: 'border-box',
              overflow: 'hidden',
            }
          : {
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }
      }
    >
      {/* Editor Header Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          p: 1.5,
          backgroundColor: isZenMode ? '#ffffff' : dzfColors.surfaces.canvas,
          border: `1px solid ${dzfColors.surfaces.border}`,
          borderRadius: isZenMode ? '8px' : '8px 8px 0 0',
          boxShadow: isZenMode ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        {/* Formatting Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <ButtonGroup size="small" variant="outlined" sx={{ flexWrap: 'wrap' }}>
            <Tooltip title="Heading 1 (# Title)">
              <Button onClick={() => insertFormatting('# ', '\n', 'Major Section Title')}>
                H1
              </Button>
            </Tooltip>
            <Tooltip title="Heading 2 (## Title)">
              <Button onClick={() => insertFormatting('## ', '\n', 'Section Title')}>
                H2
              </Button>
            </Tooltip>
            <Tooltip title="Heading 3 (### Title)">
              <Button onClick={() => insertFormatting('### ', '\n', 'Subsection Title')}>
                H3
              </Button>
            </Tooltip>
            <Tooltip title="Normal Paragraph (Removes Heading/List/Quote)">
              <Button onClick={convertToParagraph} sx={{ fontWeight: 600 }}>
                P
              </Button>
            </Tooltip>
          </ButtonGroup>

          <ButtonGroup size="small" variant="outlined" sx={{ flexWrap: 'wrap' }}>
            <Tooltip title="Bold (**text**)">
              <Button
                sx={{ fontWeight: 'bold' }}
                onClick={() => insertFormatting('**', '**', 'bold text')}
              >
                B
              </Button>
            </Tooltip>
            <Tooltip title="Italic (*text*)">
              <Button
                sx={{ fontStyle: 'italic' }}
                onClick={() => insertFormatting('*', '*', 'italic text')}
              >
                I
              </Button>
            </Tooltip>
            <Tooltip title="Underline (<ins>text</ins>)">
              <Button
                sx={{ textDecoration: 'underline' }}
                onClick={() => insertFormatting('<ins>', '</ins>', 'underlined text')}
              >
                U
              </Button>
            </Tooltip>
            <Tooltip title="Highlight (<mark>text</mark>)">
              <Button
                sx={{ backgroundColor: 'rgba(254, 240, 138, 0.4)' }}
                onClick={() => insertFormatting('<mark>', '</mark>', 'highlighted text')}
              >
                HL
              </Button>
            </Tooltip>
            <Tooltip title="Hyperlink ([text](url))">
              <Button onClick={insertLink}>
                Link
              </Button>
            </Tooltip>
          </ButtonGroup>

          <ButtonGroup size="small" variant="outlined" sx={{ flexWrap: 'wrap' }}>
            <Tooltip title="Bullet List (- item)">
              <Button onClick={() => insertFormatting('- ', '\n', 'List item')}>
                • List
              </Button>
            </Tooltip>
            <Tooltip title="Numbered List (1. item)">
              <Button onClick={() => insertFormatting('1. ', '\n', 'First item')}>
                1. List
              </Button>
            </Tooltip>
            <Tooltip title="Blockquote (> insight)">
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
        </Box>

        {/* View Mode & Zen Mode Toggles */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{ minHeight: 32 }}
          >
            <Tab value="write" label="Write" sx={{ minHeight: 32, py: 0.5, fontSize: '0.78rem' }} />
            <Tab value="preview" label="Preview" sx={{ minHeight: 32, py: 0.5, fontSize: '0.78rem' }} />
            <Tab value="split" label="Side-by-Side" sx={{ minHeight: 32, py: 0.5, fontSize: '0.78rem' }} />
          </Tabs>

          {isZenMode ? (
            <Tooltip title="Exit Zen Mode (or press Escape)">
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsZenMode(false)}
                startIcon={<MinimizeIcon size={15} />}
                sx={{
                  borderColor: dzfColors.maroon[600],
                  color: dzfColors.maroon[700],
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  '&:hover': {
                    borderColor: dzfColors.maroon[800],
                    backgroundColor: 'rgba(128, 0, 32, 0.04)',
                  },
                }}
              >
                Exit Zen (Esc)
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Distraction-Free Zen Writing Mode">
              <Button
                variant="contained"
                size="small"
                onClick={() => setIsZenMode(true)}
                startIcon={<MaximizeIcon size={14} />}
                sx={{
                  backgroundColor: dzfColors.navy[900],
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  '&:hover': { backgroundColor: dzfColors.navy[950] },
                }}
              >
                Zen Mode
              </Button>
            </Tooltip>
          )}
        </Box>
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
          minHeight: isZenMode ? 'calc(100vh - 170px)' : 420,
          flex: isZenMode ? 1 : 'unset',
          overflow: isZenMode ? 'hidden' : 'visible',
          mt: isZenMode ? 2 : 0,
        }}
      >
        {/* Textarea Area */}
        {(activeTab === 'write' || activeTab === 'split') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box
              component="textarea"
              ref={textareaRef}
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Draft your values, leadership insights, or character study here using Markdown formatting (H1, H2, H3, lists, quotes, highlights)..."
              sx={{
                width: '100%',
                height: '100%',
                minHeight: isZenMode ? '100%' : 400,
                p: isZenMode ? 3 : 2,
                fontFamily: 'monospace',
                fontSize: isZenMode ? '0.98rem' : '0.9rem',
                lineHeight: 1.7,
                borderRadius: isZenMode ? '8px' : '0 0 8px 8px',
                border: `1px solid ${dzfColors.surfaces.border}`,
                backgroundColor: '#ffffff',
                outline: 'none',
                resize: isZenMode ? 'none' : 'vertical',
                boxSizing: 'border-box',
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
              p: isZenMode ? 4 : 3,
              borderRadius: isZenMode ? '8px' : '0 0 8px 8px',
              backgroundColor: '#ffffff',
              borderColor: dzfColors.surfaces.border,
              overflowY: 'auto',
              maxHeight: isZenMode ? '100%' : 520,
              height: isZenMode ? '100%' : 'auto',
              boxSizing: 'border-box',
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
                ~{readTimeEst} min read ({wordCount} words)
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
          px: 1.5,
          py: 0.75,
          fontSize: '0.78rem',
          color: dzfColors.surfaces.textMuted,
          backgroundColor: isZenMode ? '#ffffff' : 'transparent',
          borderRadius: isZenMode ? '8px' : 0,
          border: isZenMode ? `1px solid ${dzfColors.surfaces.border}` : 'none',
          mt: isZenMode ? 1.5 : 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
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
