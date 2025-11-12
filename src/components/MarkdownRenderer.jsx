import React from 'react';

// Lightweight Markdown renderer tailored for our AI output
// - Supports headings (#, ##, ###)
// - Bold/italic inline formatting
// - Properly structured ordered/unordered lists with nesting via leading spaces
// - Graceful handling of plain text
export default function MarkdownRenderer({ content, enableInline = true }) {
  if (!content || typeof content !== 'string') return <span>{content || ''}</span>;

  const applyInlineFormatting = (text) => {
    if (!text) return '';
    if (!enableInline) {
      // Strip emphasis markers entirely
      let plain = text.replace(/\*\*([^*\n]+?)\*\*/g, '$1');
      plain = plain.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1');
      return plain;
    }
    // Bold first to avoid conflicts with italic
    let out = text.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
    return out;
  };

  const lines = content.split(/\r?\n/);

  const html = [];
  const listStack = []; // { type: 'ul' | 'ol', indent: number }

  const openList = (type, indent) => {
    listStack.push({ type, indent });
    if (type === 'ul') {
      html.push('<ul style="list-style-type: disc; padding-left: 1.25rem; margin: 0.25rem 0;">');
    } else {
      html.push('<ol style="list-style-type: decimal; padding-left: 1.25rem; margin: 0.25rem 0;">');
    }
  };

  const closeOneList = () => {
    const last = listStack.pop();
    if (last) html.push(`</${last.type}>`);
  };

  const closeListsToIndent = (indent) => {
    while (listStack.length && listStack[listStack.length - 1].indent >= indent) {
      closeOneList();
    }
  };

  const getIndent = (line) => {
    const m = line.match(/^(\s*)/);
    const spaces = m ? m[1].length : 0;
    return Math.floor(spaces / 2); // 2 spaces per level
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      // Blank line: end any paragraph but keep list context
      html.push('<div class="h-3"></div>');
      continue;
    }

    // Headings -> In plain mode render as paragraph, otherwise semantic heading
    if (/^###\s+/.test(trimmed)) {
      closeListsToIndent(0);
      const text = applyInlineFormatting(trimmed.replace(/^###\s+/, ''));
      html.push(enableInline ? `<h3 class="text-lg mb-2">${text}</h3>` : `<p class="mb-2">${text}</p>`);
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      closeListsToIndent(0);
      const text = applyInlineFormatting(trimmed.replace(/^##\s+/, ''));
      html.push(enableInline ? `<h2 class="text-xl mb-2">${text}</h2>` : `<p class="mb-2">${text}</p>`);
      continue;
    }
    if (/^#\s+/.test(trimmed)) {
      closeListsToIndent(0);
      const text = applyInlineFormatting(trimmed.replace(/^#\s+/, ''));
      html.push(enableInline ? `<h1 class="text-2xl mb-3">${text}</h1>` : `<p class="mb-2">${text}</p>`);
      continue;
    }

    // Ordered list item
    let match = raw.match(/^(\s*)(\d+)\.\s*(.*)$/);
    if (match) {
      const indent = getIndent(match[1]);
      const type = 'ol';



      
      let itemText = match[3].trim();
if (!itemText && i + 1 < lines.length) {
  // If the list item is blank, merge with the next non-empty line
  itemText = lines[i + 1].trim();
  i++; // skip the next line since it's merged
}
const text = applyInlineFormatting(itemText);

      






      if (!enableInline) {
        // Plain mode: keep numbering as literal text lines
        closeListsToIndent(0);
        html.push(`<p class="mb-2">${match[2]}. ${text}</p>`);
      } else {
        if (!listStack.length || indent > listStack[listStack.length - 1].indent) {
          openList(type, indent);
        } else {
          // Close lists or switch type at same level
          while (listStack.length && listStack[listStack.length - 1].indent > indent) closeOneList();
          if (listStack.length && listStack[listStack.length - 1].type !== type) {
            closeOneList();
            openList(type, indent);
          }
        }
        html.push(`<li style="margin: 0.25rem 0;">${text}</li>`);
      }
      continue;
    }

    // Unordered list item (supports •, -, *)
    match = raw.match(/^(\s*)[•\-*]\s+(.*)$/);
    if (match) {
      const indent = getIndent(match[1]);
      const type = 'ul';
      const text = applyInlineFormatting(match[2]);
      if (!enableInline) {
        // Plain mode: keep bullets as literal text lines
        closeListsToIndent(0);
        html.push(`<p class="mb-2">• ${text}</p>`);
      } else {
        if (!listStack.length || indent > listStack[listStack.length - 1].indent) {
          openList(type, indent);
        } else {
          while (listStack.length && listStack[listStack.length - 1].indent > indent) closeOneList();
          if (listStack.length && listStack[listStack.length - 1].type !== type) {
            closeOneList();
            openList(type, indent);
          }
        }
        html.push(`<li style="margin: 0.25rem 0;">${text}</li>`);
      }
      continue;
    }

    // Any non-list text ends current lists
    closeListsToIndent(0);
    html.push(`<p class="mb-2">${applyInlineFormatting(trimmed)}</p>`);
  }

  // Close any remaining lists
  closeListsToIndent(0);

  const htmlContent = html.join('');

  return (
    <div
      className="markdown-content"
      style={{
        lineHeight: '1.4',
        fontSize: '16px'
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}


