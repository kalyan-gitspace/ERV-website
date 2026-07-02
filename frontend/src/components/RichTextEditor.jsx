import React, { useEffect, useRef } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Palette,
  Pilcrow,
  Quote,
  Redo2,
  Type,
  Underline,
  Undo2,
} from 'lucide-react';

const fontSizeMap = {
  14: '3',
  16: '4',
  18: '5',
  22: '6',
  28: '7',
};

const blockSelector = 'p,h1,h2,h3,blockquote,li,div';

function ToolbarButton({ label, icon: Icon, onAction }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => {
        event.preventDefault();
        onAction();
      }}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder = 'Write a project description' }) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentNode;

    if (editor.contains(container)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const emitChange = () => {
    const editor = editorRef.current;
    if (editor) {
      onChange(editor.innerHTML);
    }
  };

  const runCommand = (command, commandValue = null) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    restoreSelection();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, commandValue);
    saveSelection();
    emitChange();
  };

  const replaceFontTags = (fontSize) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.querySelectorAll('font[size]').forEach((font) => {
      const span = document.createElement('span');
      span.style.fontSize = `${fontSize}px`;
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
  };

  const applyFontSize = (fontSize) => {
    runCommand('fontSize', fontSizeMap[fontSize] || '4');
    replaceFontTags(fontSize);
    emitChange();
  };

  const applyLineHeight = (lineHeight) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    restoreSelection();

    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const selectedBlocks = range
      ? Array.from(editor.querySelectorAll(blockSelector)).filter((block) => range.intersectsNode(block))
      : [];

    if (!selectedBlocks.length && selection?.anchorNode) {
      const anchorElement = selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? selection.anchorNode
        : selection.anchorNode.parentElement;
      const currentBlock = anchorElement?.closest(blockSelector);
      if (currentBlock && editor.contains(currentBlock)) {
        selectedBlocks.push(currentBlock);
      }
    }

    selectedBlocks.forEach((block) => {
      block.style.lineHeight = lineHeight;
    });

    saveSelection();
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt('URL');
    if (url) {
      runCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      runCommand('insertImage', url);
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    const nextValue = value || '';
    if (editor && editor.innerHTML !== nextValue) {
      editor.innerHTML = nextValue;
    }
  }, [value]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-1 rounded-t-xl border-b border-slate-800 bg-slate-950 p-2">
        <select
          aria-label="Text style"
          defaultValue="P"
          onMouseDown={saveSelection}
          onChange={(event) => runCommand('formatBlock', event.target.value)}
          className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-2 text-xs text-slate-300 outline-none"
        >
          <option value="P">Paragraph</option>
          <option value="H1">H1</option>
          <option value="H2">H2</option>
          <option value="H3">H3</option>
        </select>
        <select
          aria-label="Font size"
          defaultValue="16"
          onMouseDown={saveSelection}
          onChange={(event) => applyFontSize(event.target.value)}
          className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-2 text-xs text-slate-300 outline-none"
        >
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="22">22</option>
          <option value="28">28</option>
        </select>
        <select
          aria-label="Line spacing"
          defaultValue="1.6"
          onMouseDown={saveSelection}
          onChange={(event) => applyLineHeight(event.target.value)}
          className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-2 text-xs text-slate-300 outline-none"
        >
          <option value="1.4">1.4</option>
          <option value="1.6">1.6</option>
          <option value="1.8">1.8</option>
          <option value="2">2.0</option>
        </select>
        <ToolbarButton label="Paragraph" icon={Pilcrow} onAction={() => runCommand('formatBlock', 'P')} />
        <ToolbarButton label="Heading 1" icon={Heading1} onAction={() => runCommand('formatBlock', 'H1')} />
        <ToolbarButton label="Heading 2" icon={Heading2} onAction={() => runCommand('formatBlock', 'H2')} />
        <ToolbarButton label="Heading 3" icon={Heading3} onAction={() => runCommand('formatBlock', 'H3')} />
        <ToolbarButton label="Bold" icon={Bold} onAction={() => runCommand('bold')} />
        <ToolbarButton label="Italic" icon={Italic} onAction={() => runCommand('italic')} />
        <ToolbarButton label="Underline" icon={Underline} onAction={() => runCommand('underline')} />
        <ToolbarButton label="Bullet List" icon={List} onAction={() => runCommand('insertUnorderedList')} />
        <ToolbarButton label="Numbered List" icon={ListOrdered} onAction={() => runCommand('insertOrderedList')} />
        <ToolbarButton label="Quote" icon={Quote} onAction={() => runCommand('formatBlock', 'BLOCKQUOTE')} />
        <ToolbarButton label="Link" icon={Link} onAction={insertLink} />
        <ToolbarButton label="Align Left" icon={AlignLeft} onAction={() => runCommand('justifyLeft')} />
        <ToolbarButton label="Align Center" icon={AlignCenter} onAction={() => runCommand('justifyCenter')} />
        <ToolbarButton label="Align Right" icon={AlignRight} onAction={() => runCommand('justifyRight')} />
        <ToolbarButton label="Justify" icon={AlignJustify} onAction={() => runCommand('justifyFull')} />
        <label
          title="Text Color"
          aria-label="Text Color"
          onMouseDown={saveSelection}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
        >
          <Palette className="h-4 w-4" />
          <input type="color" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => runCommand('foreColor', event.target.value)} />
        </label>
        <label
          title="Highlight"
          aria-label="Highlight"
          onMouseDown={saveSelection}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
        >
          <Highlighter className="h-4 w-4" />
          <input type="color" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => runCommand('hiliteColor', event.target.value)} />
        </label>
        <ToolbarButton label="Horizontal Line" icon={Minus} onAction={() => runCommand('insertHorizontalRule')} />
        <ToolbarButton label="Image" icon={ImageIcon} onAction={insertImage} />
        <ToolbarButton label="Undo" icon={Undo2} onAction={() => runCommand('undo')} />
        <ToolbarButton label="Redo" icon={Redo2} onAction={() => runCommand('redo')} />
        <ToolbarButton label="Normal Size" icon={Type} onAction={() => applyFontSize('16')} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="rich-text-editor__content min-h-[260px] w-full overflow-y-auto px-3 py-3 text-slate-100 outline-none"
      />
    </div>
  );
}

export default RichTextEditor;
