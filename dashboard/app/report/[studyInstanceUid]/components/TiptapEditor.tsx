'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { normalizeTemplateHtml } from '@/app/components/ReportTemplatePicker';
import type { ReportTemplateOption } from '@/app/components/ReportTemplatePicker';
import {
  Bold,
  Code,
  Eraser,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

function ToolbarButton({
  active,
  children,
  disabled,
  onClick,
  title,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded p-1.5 transition-colors ${
        active ? 'bg-vin-accent text-white' : 'text-vin-muted hover:bg-vin-tableHover hover:text-white'
      } disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-vin-muted`}
      disabled={disabled}
      type="button"
      title={title}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-px bg-vin-border" />;
}

type ShortcutSuggestionState = {
  activeIndex: number;
  matches: ReportTemplateOption[];
  query: string;
  range: {
    from: number;
    to: number;
  };
};

function normalizeShortcut(value?: string | null) {
  const shortcut = (value || '').trim().toLowerCase();
  if (!shortcut) return '';
  return shortcut.startsWith('/') ? shortcut : `/${shortcut}`;
}

export default function TiptapEditor({
  onShortcutApply,
  value,
  onChange,
  shortcutTemplates = [],
  readOnly,
}: {
  onShortcutApply?: (template: ReportTemplateOption) => void;
  value: string;
  onChange: (html: string) => void;
  shortcutTemplates?: ReportTemplateOption[];
  readOnly?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const shortcutTemplatesRef = useRef<ReportTemplateOption[]>([]);
  const onShortcutApplyRef = useRef<typeof onShortcutApply>(onShortcutApply);
  const shortcutSuggestionRef = useRef<ShortcutSuggestionState | null>(null);
  const [shortcutSuggestion, setShortcutSuggestionState] = useState<ShortcutSuggestionState | null>(null);

  const setShortcutSuggestion = useCallback((next: ShortcutSuggestionState | null) => {
    shortcutSuggestionRef.current = next;
    setShortcutSuggestionState(next);
  }, []);

  useEffect(() => {
    shortcutTemplatesRef.current = shortcutTemplates;
  }, [shortcutTemplates]);

  useEffect(() => {
    onShortcutApplyRef.current = onShortcutApply;
  }, [onShortcutApply]);

  const findShortcutMatches = useCallback((query: string) => {
    const normalizedQuery = normalizeShortcut(query);
    const queryText = normalizedQuery.replace(/^\//, '');

    return shortcutTemplatesRef.current
      .filter(template => {
        const shortcut = normalizeShortcut(template.shortcut);
        if (!shortcut) return false;

        const name = (template.name || '').toLowerCase();
        return (
          shortcut === normalizedQuery ||
          shortcut.startsWith(normalizedQuery) ||
          shortcut.includes(normalizedQuery) ||
          (queryText.length > 0 && name.includes(queryText))
        );
      })
      .sort((a, b) => {
        const aShortcut = normalizeShortcut(a.shortcut);
        const bShortcut = normalizeShortcut(b.shortcut);
        const aExact = aShortcut === normalizedQuery ? 0 : aShortcut.startsWith(normalizedQuery) ? 1 : 2;
        const bExact = bShortcut === normalizedQuery ? 0 : bShortcut.startsWith(normalizedQuery) ? 1 : 2;
        if (aExact !== bExact) return aExact - bExact;
        if (Boolean(a.isNormal) !== Boolean(b.isNormal)) return a.isNormal ? -1 : 1;
        return a.name.localeCompare(b.name, 'vi');
      })
      .slice(0, 8);
  }, []);

  const handleImageUpload = useCallback(async (file: File, editor: any, pos?: number) => {
    if (!file.type.startsWith('image/')) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        if (url) {
          if (pos !== undefined) {
            editor
              .chain()
              .focus()
              .insertContentAt(pos, {
                type: 'image',
                attrs: { src: url },
              })
              .run();
          } else {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }
      } else {
        console.error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error', err);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          autolink: true,
          defaultProtocol: 'https',
          openOnClick: false,
        },
      }),
      TiptapImage.configure({
        inline: true,
        allowBase64: false,
      }),
    ],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert focus:outline-none max-w-none text-vin-text2 min-h-[400px]',
      },
      handlePaste: (view, event) => {
        if (readOnly) return true; // block paste in read-only mode
        const items = event.clipboardData?.items;
        if (!items) return false;

        let hasImage = false;
        for (const item of Array.from(items)) {
          if (item.type.indexOf('image') === 0) {
            hasImage = true;
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file, editor);
            }
          }
        }
        return hasImage;
      },
      handleDrop: (view, event, slice, moved) => {
        if (readOnly) return true; // block drop in read-only mode
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          let hasImage = false;
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;

          for (const file of Array.from(event.dataTransfer.files)) {
            if (file.type.indexOf('image') === 0) {
              hasImage = true;
              event.preventDefault();
              handleImageUpload(file, editor, pos);
            }
          }
          return hasImage;
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        const editorInstance = editorRef.current;
        const suggestion = shortcutSuggestionRef.current;

        if (suggestion) {
          if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(event.key)) {
            event.preventDefault();
            event.stopPropagation();
            const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
            setShortcutSuggestion({
              ...suggestion,
              activeIndex: (suggestion.activeIndex + direction + suggestion.matches.length) % suggestion.matches.length,
            });
            return true;
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setShortcutSuggestion(null);
            return true;
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();

            const template = suggestion.matches[suggestion.activeIndex];
            if (!template || !editorInstance) {
              setShortcutSuggestion(null);
              return true;
            }

            editorInstance
              .chain()
              .focus()
              .deleteRange(suggestion.range)
              .insertContent(normalizeTemplateHtml(template.findings))
              .run();

            setShortcutSuggestion(null);
            onShortcutApplyRef.current?.(template);
            return true;
          }

          setShortcutSuggestion(null);
          return false;
        }

        if (event.key !== 'Enter') return false;
        if (event.ctrlKey || event.metaKey || event.altKey || (event as any).isComposing) return false;

        if (!editorInstance || !view.state.selection.empty) return false;

        const { from } = view.state.selection;
        const $from = view.state.doc.resolve(from);
        const textBeforeCursor = $from.parent.textBetween(0, $from.parentOffset, '\n', '\0');
        const match = textBeforeCursor.match(/(?:^|\s)(\/[a-zA-Z0-9_-]*)$/);
        const shortcut = match?.[1]?.toLowerCase();
        if (!shortcut) return false;

        const matches = findShortcutMatches(shortcut);
        if (matches.length === 0) return false;

        event.preventDefault();
        event.stopPropagation();

        setShortcutSuggestion({
          activeIndex: 0,
          matches,
          query: shortcut,
          range: { from: from - shortcut.length, to: from },
        });
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sync readOnly state with editor editable
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Nhập URL liên kết', previousUrl);

    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const handlePickedImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file, editor);
    }
    event.target.value = '';
  };

  const applyShortcutSuggestion = (template: ReportTemplateOption, range: ShortcutSuggestionState['range']) => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    editorInstance
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent(normalizeTemplateHtml(template.findings))
      .run();

    setShortcutSuggestion(null);
    onShortcutApplyRef.current?.(template);
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-vin-border bg-vin-shell transition-colors focus-within:border-vin-accent"
      aria-readonly={readOnly || undefined}
    >
      {!readOnly && (
      <div className="flex flex-wrap items-center gap-1 border-b border-vin-border bg-vin-panel2 p-2">
        <ToolbarButton
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Hoàn tác"
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Làm lại"
        >
          <Redo2 size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Đoạn văn">
          <Pilcrow size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Tiêu đề 1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Tiêu đề 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="In đậm">
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="In nghiêng">
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Gạch chân">
          <Underline size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Gạch ngang">
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Code inline">
          <Code size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Danh sách chấm">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Danh sách số">
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Trích dẫn">
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Khối code">
          <Code size={16} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ ngang">
          <Minus size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('link')} onClick={setLink} title="Thêm/sửa liên kết">
          <Link size={16} />
        </ToolbarButton>
        <ToolbarButton disabled={!editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()} title="Bỏ liên kết">
          <Unlink size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Chèn ảnh">
          <ImagePlus size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Xóa định dạng">
          <Eraser size={16} />
        </ToolbarButton>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickedImage} />
      </div>
      )}

      {!readOnly && shortcutSuggestion && (
        <div className="border-b border-vin-border bg-vin-panel2 px-2 py-2">
          <div className="flex flex-wrap gap-1.5">
            {shortcutSuggestion.matches.map((template, index) => {
              const isActive = index === shortcutSuggestion.activeIndex;

              return (
                <button
                  key={template.id}
                  type="button"
                  onMouseDown={event => {
                    event.preventDefault();
                    applyShortcutSuggestion(template, shortcutSuggestion.range);
                  }}
                  className={`flex min-w-[190px] max-w-full items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-left text-[11px] transition ${
                    isActive
                      ? 'border-vin-accent bg-vin-accent text-white'
                      : 'border-vin-border bg-vin-shell text-vin-text2 hover:border-vin-accent hover:text-white'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{template.name}</span>
                    <span className={`block truncate font-mono text-[10px] ${isActive ? 'text-white/80' : 'text-vin-muted'}`}>
                      {normalizeShortcut(template.shortcut)} · {template.modality}
                      {template.bodyPart ? ` · ${template.bodyPart}` : ''}
                    </span>
                  </span>
                  {template.isNormal && (
                    <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-900/25 text-emerald-200'}`}>
                      BT
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        {/* @ts-ignore: React 18/19 type conflict with Tiptap */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
