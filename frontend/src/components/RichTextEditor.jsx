import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Columns2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';

const blockSelector = 'p,h1,h2,h3,blockquote,li,div';
const contentBoxSelector = '[data-erv-content-box="true"]';
const editorControlSelector = '[data-erv-editor-control="true"]';
const contentBoxEditorElementSelector = [
  '[data-erv-content-box="true"]',
  '[data-erv-content-layout="true"]',
  '[data-erv-content-media="true"]',
  '[data-erv-content-image="true"]',
  '[data-erv-content-text="true"]',
].join(',');

const imageSizeMap = {
  small: { width: '25%', min: '160px' },
  medium: { width: '43%', min: '260px' },
  large: { width: '58%', min: '320px' },
};

const fontSizeMap = {
  '14': '2',
  '16': '3',
  '18': '4',
  '22': '5',
  '28': '6',
};

const contentBoxButtonStyle =
  'border:1px solid rgba(148,163,184,0.55);background:#0f172a;color:#e2e8f0;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;line-height:1;cursor:pointer;';

const escapeAttribute = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const getContentBoxStyles = (align = 'left', size = 'medium') => {
  const imageSize = imageSizeMap[size] || imageSizeMap.medium;
  const imageOrder = align === 'right' ? 2 : 1;
  const textOrder = align === 'right' ? 1 : 2;

  return {
    box: 'position:relative;clear:both;margin:16px 0;padding:0;border:1px dotted #94a3b8;border-radius:12px;background:rgba(15,23,42,0.55);',
    layout: 'display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;',
    media: `order:${imageOrder};flex:0 1 ${imageSize.width};width:${imageSize.width};max-width:${imageSize.width};min-width:min(100%,${imageSize.min});margin:0;`,
    image: 'display:block;width:100%;height:auto;border-radius:10px;object-fit:cover;',
    text: `order:${textOrder};flex:1 1 260px;min-height:120px;padding:0 12px 10px;border:1px dashed rgba(148,163,184,0.35);border-radius:10px;color:inherit;outline:none;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;letter-spacing:normal;word-spacing:normal;`,
  };
};

const createDeleteButtonHtml = () =>
  `<button type="button" data-erv-delete-content-box="true" data-erv-editor-control="true" contenteditable="false" style="${contentBoxButtonStyle}position:absolute;right:8px;top:8px;z-index:2;">Delete Content Box</button>`;

const createChangeButtonHtml = () =>
  `<button type="button" data-erv-change-image="true" data-erv-editor-control="true" contenteditable="false" style="${contentBoxButtonStyle}display:block;margin-top:10px;width:100%;">Change Image</button>`;

const createContentBoxHtml = ({ imageUrl, align, size, id }) => {
  const styles = getContentBoxStyles(align, size);

  return `
    <div data-erv-content-box="true" data-erv-content-box-id="${escapeAttribute(id)}" data-align="${align}" data-size="${size}" contenteditable="false" style="${styles.box}">
      ${createDeleteButtonHtml()}
      <div data-erv-content-layout="true" style="${styles.layout}">
        <figure data-erv-content-media="true" contenteditable="false" style="${styles.media}">
          <img data-erv-content-image="true" src="${escapeAttribute(imageUrl)}" alt="" style="${styles.image}" />
          ${createChangeButtonHtml()}
        </figure>
        <div data-erv-content-text="true" class="rich-text-editor__content" contenteditable="true" style="${styles.text}"><p><br></p></div>
      </div>
    </div>
  `;
};

const sanitizeEditorHtml = (html = '') => {
  if (!html || typeof document === 'undefined') {
    return html;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  wrapper.querySelectorAll(editorControlSelector).forEach((control) => control.remove());
  wrapper.querySelectorAll(contentBoxSelector).forEach((box) => {
    box.removeAttribute('contenteditable');
    box.querySelectorAll('[contenteditable]').forEach((element) => {
      element.removeAttribute('contenteditable');
    });
  });
  wrapper.querySelectorAll(contentBoxEditorElementSelector).forEach((element) => {
    element.removeAttribute('style');
  });

  return wrapper.innerHTML;
};

const hydrateContentBox = (box) => {
  const align = box.dataset.align === 'right' ? 'right' : 'left';
  const size = Object.prototype.hasOwnProperty.call(imageSizeMap, box.dataset.size) ? box.dataset.size : 'medium';
  const styles = getContentBoxStyles(align, size);
  const media = box.querySelector('[data-erv-content-media="true"], figure');
  const image = box.querySelector('img');
  const text = box.querySelector('[data-erv-content-text="true"]');

  box.dataset.align = align;
  box.dataset.size = size;
  box.setAttribute('contenteditable', 'false');
  box.setAttribute('style', styles.box);
  box.querySelectorAll(editorControlSelector).forEach((control) => control.remove());
  box.insertAdjacentHTML('afterbegin', createDeleteButtonHtml());

  const layout = box.querySelector('[data-erv-content-layout="true"]');
  if (layout) {
    layout.setAttribute('style', styles.layout);
  }

  if (media) {
    media.setAttribute('contenteditable', 'false');
    media.setAttribute('style', styles.media);
    media.insertAdjacentHTML('beforeend', createChangeButtonHtml());
  }

  if (image) {
    image.dataset.ervContentImage = 'true';
    image.setAttribute('style', styles.image);
  }

  if (text) {
    text.dataset.ervContentText = 'true';
    text.setAttribute('contenteditable', 'true');
    text.setAttribute('style', styles.text);
    text.classList.add('rich-text-editor__content');
    if (!text.innerHTML.trim()) {
      text.innerHTML = '<p><br></p>';
    }
  }
};

const hydrateContentBoxes = (html = '') => {
  if (!html || typeof document === 'undefined') {
    return html;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  wrapper.querySelectorAll(contentBoxSelector).forEach(hydrateContentBox);
  return wrapper.innerHTML;
};

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

export function RichTextEditor({ value, onChange, placeholder = 'Write a project description', onUploadImage }) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const contentImageInputRef = useRef(null);
  const replacementImageInputRef = useRef(null);
  const replacementBoxRef = useRef(null);
  const replacementImageRef = useRef(null);
  const [contentSectionDraft, setContentSectionDraft] = useState(null);

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

  const captureViewport = () => {
    const editor = editorRef.current;
    if (!editor) {
      return null;
    }

    return {
      editor,
      editorScrollLeft: editor.scrollLeft,
      editorScrollTop: editor.scrollTop,
      windowScrollX: window.scrollX,
      windowScrollY: window.scrollY,
    };
  };

  const restoreViewport = (viewport) => {
    if (!viewport) {
      return;
    }

    const restore = () => {
      viewport.editor.scrollLeft = viewport.editorScrollLeft;
      viewport.editor.scrollTop = viewport.editorScrollTop;
      window.scrollTo(viewport.windowScrollX, viewport.windowScrollY);
    };

    restore();
    requestAnimationFrame(restore);
  };

  const focusEditor = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    try {
      editor.focus({ preventScroll: true });
    } catch {
      editor.focus();
    }
  };

  const placeCaretAtEnd = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) {
      return false;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    selectionRef.current = range.cloneRange();
    return true;
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
    return true;
  };

  const emitChange = () => {
    const editor = editorRef.current;
    if (editor) {
      onChange(sanitizeEditorHtml(editor.innerHTML));
    }
  };

  const escapeHtmlForInsert = (str = '') => {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  const handlePaste = (event) => {
    try {
      event.preventDefault();
      const clipboard = event.clipboardData || window.clipboardData;
      if (!clipboard) return;

      const text = clipboard.getData('text/plain') || '';
      if (!text) return;

      // Split into paragraphs on double newlines, keep single newlines as <br>
      const paragraphs = String(text)
        .split(/\r\n\r\n|\n\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const html = paragraphs
        .map((p) => escapeHtmlForInsert(p).replace(/\r\n|\n/g, '<br>'))
        .map((p) => `<p>${p}</p>`)
        .join('') || '<p><br></p>';

      document.execCommand('insertHTML', false, html);
      emitChange();
    } catch (err) {
      // fallback: allow default paste if something goes wrong
      console.error('Paste handling error', err);
    }
  };

  const runCommand = (command, commandValue = null, options = {}) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const viewport = captureViewport();
    focusEditor();
    if (!restoreSelection()) {
      placeCaretAtEnd();
    }
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, commandValue);
    saveSelection();
    if (options.emit !== false) {
      emitChange();
    }
    restoreViewport(viewport);
    return viewport;
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
    const viewport = runCommand('fontSize', fontSizeMap[fontSize] || '4', { emit: false });
    replaceFontTags(fontSize);
    saveSelection();
    emitChange();
    restoreViewport(viewport);
  };

  const applyLineHeight = (lineHeight) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const viewport = captureViewport();
    focusEditor();
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
    restoreViewport(viewport);
  };

  const insertLink = () => {
    const url = window.prompt('URL');
    if (url) {
      runCommand('createLink', url);
    }
  };

  const uploadContentImage = async (file) => {
    if (typeof onUploadImage === 'function') {
      return onUploadImage(file);
    }

    return URL.createObjectURL(file);
  };

  const beginContentSectionFlow = () => {
    saveSelection();
    contentImageInputRef.current?.click();
  };

  const handleContentImageSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      setContentSectionDraft(null);
      return;
    }

    const uploadPromise = uploadContentImage(file);
    setContentSectionDraft({
      mode: 'insert',
      step: 'align',
      align: null,
      uploadPromise,
      uploadedUrl: '',
      error: '',
    });

    uploadPromise
      .then((uploadedUrl) => {
        setContentSectionDraft((current) =>
          current?.uploadPromise === uploadPromise
            ? { ...current, uploadedUrl: uploadedUrl || '', error: uploadedUrl ? '' : 'Image upload failed. No content box was inserted.' }
            : current
        );
      })
      .catch(() => {
        setContentSectionDraft((current) =>
          current?.uploadPromise === uploadPromise
            ? { ...current, error: 'Image upload failed. No content box was inserted.' }
            : current
        );
      });
  };

  const placeCaretInside = (element) => {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    element.focus();
    const range = document.createRange();
    const target = element.querySelector('p,h1,h2,h3,blockquote,li,div') || element;
    range.selectNodeContents(target);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    selectionRef.current = range.cloneRange();
  };

  const insertContentBox = (imageUrl, align, size) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const id = `content-box-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const html = `${createContentBoxHtml({ imageUrl, align, size, id })}<p><br></p>`;

    editor.focus();
    if (!restoreSelection()) {
      placeCaretAtEnd();
    }

    document.execCommand('insertHTML', false, html);

    const insertedBox = editor.querySelector(`[data-erv-content-box-id="${id}"]`);
    const textArea = insertedBox?.querySelector('[data-erv-content-text="true"]');
    if (textArea) {
      placeCaretInside(textArea);
    } else {
      saveSelection();
    }

    emitChange();
  };

  const updateReplacementContentBox = (imageUrl, align, size) => {
    const box = replacementBoxRef.current;
    const image = replacementImageRef.current;

    if (!box || !image) {
      return;
    }

    box.dataset.align = align;
    box.dataset.size = size;
    image.setAttribute('src', imageUrl);
    hydrateContentBox(box);
    emitChange();
    replacementBoxRef.current = null;
    replacementImageRef.current = null;
  };

  const selectContentAlignment = (align) => {
    setContentSectionDraft((current) => current ? { ...current, align, step: 'size' } : current);
  };

  const selectContentSize = async (size) => {
    const draft = contentSectionDraft;
    if (!draft) {
      return;
    }

    setContentSectionDraft((current) => current ? { ...current, step: 'uploading' } : current);

    try {
      const uploadedUrl = draft.uploadedUrl || await draft.uploadPromise;
      if (!uploadedUrl) {
        throw new Error('Unable to upload image');
      }

      if (draft.mode === 'replace') {
        updateReplacementContentBox(uploadedUrl, draft.align || 'left', size);
      } else {
        insertContentBox(uploadedUrl, draft.align || 'left', size);
      }
      setContentSectionDraft(null);
    } catch {
      const error = draft.mode === 'replace'
        ? 'Image upload failed. No content box was updated.'
        : 'Image upload failed. No content box was inserted.';

      setContentSectionDraft({
        mode: draft.mode,
        step: 'error',
        align: draft.align,
        uploadPromise: draft.uploadPromise,
        uploadedUrl: '',
        error,
      });
    }
  };

  const closeContentSectionModal = () => {
    setContentSectionDraft(null);
    replacementBoxRef.current = null;
    replacementImageRef.current = null;
  };

  const handleEditorClick = (event) => {
    const deleteButton = event.target.closest('[data-erv-delete-content-box="true"]');
    if (deleteButton) {
      event.preventDefault();
      const box = deleteButton.closest(contentBoxSelector);
      if (box) {
        box.remove();
        emitChange();
        placeCaretAtEnd();
      }
      return;
    }

    const changeButton = event.target.closest('[data-erv-change-image="true"]');
    if (changeButton) {
      event.preventDefault();
      const box = changeButton.closest(contentBoxSelector);
      replacementBoxRef.current = box || null;
      replacementImageRef.current = box?.querySelector('img') || null;
      replacementImageInputRef.current?.click();
    }
  };

  const handleReplacementImageSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !replacementImageRef.current) {
      replacementBoxRef.current = null;
      replacementImageRef.current = null;
      return;
    }

    const uploadPromise = uploadContentImage(file);
    setContentSectionDraft({
      mode: 'replace',
      step: 'align',
      align: null,
      uploadPromise,
      uploadedUrl: '',
      error: '',
    });

    uploadPromise
      .then((uploadedUrl) => {
        setContentSectionDraft((current) =>
          current?.uploadPromise === uploadPromise
            ? { ...current, uploadedUrl: uploadedUrl || '', error: uploadedUrl ? '' : 'Image upload failed. No content box was updated.' }
            : current
        );
      })
      .catch(() => {
        setContentSectionDraft((current) =>
          current?.uploadPromise === uploadPromise
            ? { ...current, error: 'Image upload failed. No content box was updated.' }
            : current
        );
      });
  };

  useEffect(() => {
    const editor = editorRef.current;
    const nextValue = value || '';
    const normalizedNextValue = sanitizeEditorHtml(nextValue);
    if (editor && sanitizeEditorHtml(editor.innerHTML) !== normalizedNextValue) {
      editor.innerHTML = hydrateContentBoxes(nextValue);
    }
  }, [value]);

  return (
    <div className="flex max-h-[680px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div className="z-40 flex shrink-0 flex-wrap items-center gap-1 rounded-t-xl border-b border-slate-800 bg-slate-950 p-2">
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
        <ToolbarButton label="Content Section" icon={Columns2} onAction={beginContentSectionFlow} />
        <ToolbarButton label="Undo" icon={Undo2} onAction={() => runCommand('undo')} />
        <ToolbarButton label="Redo" icon={Redo2} onAction={() => runCommand('redo')} />
      </div>
      <input
        ref={contentImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleContentImageSelected}
      />
      <input
        ref={replacementImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleReplacementImageSelected}
      />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onPaste={handlePaste}
        onClick={handleEditorClick}
        onBlur={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="rich-text-editor__content min-h-[320px] w-full flex-1 overflow-y-auto px-3 py-3 text-slate-100 outline-none"
      />

      {contentSectionDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-xs rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-2xl">
            {contentSectionDraft.step === 'align' && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-white">Image Alignment</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                  <input type="radio" name="content-section-align" value="left" onChange={() => selectContentAlignment('left')} />
                  Left
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                  <input type="radio" name="content-section-align" value="right" onChange={() => selectContentAlignment('right')} />
                  Right
                </label>
              </fieldset>
            )}

            {contentSectionDraft.step === 'size' && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-white">Image Size</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                  <input type="radio" name="content-section-size" value="small" onChange={() => selectContentSize('small')} />
                  Small
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                  <input type="radio" name="content-section-size" value="medium" onChange={() => selectContentSize('medium')} />
                  Medium
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                  <input type="radio" name="content-section-size" value="large" onChange={() => selectContentSize('large')} />
                  Large
                </label>
              </fieldset>
            )}

            {contentSectionDraft.step === 'uploading' && (
              <div className="space-y-2 text-sm text-slate-300">
                <div className="font-semibold text-white">Image Size</div>
                <p>Uploading image...</p>
              </div>
            )}

            {contentSectionDraft.step === 'error' && (
              <div className="space-y-3 text-sm">
                <div className="font-semibold text-white">Image Upload</div>
                <p className="text-amber-300">{contentSectionDraft.error}</p>
                <button type="button" onClick={closeContentSectionModal} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;
