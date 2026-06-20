'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
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
import { useCallback, useEffect, useRef } from 'react';

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

export default function TiptapEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert focus:outline-none max-w-none text-vin-text2 min-h-[400px]',
      },
      handlePaste: (view, event) => {
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
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

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

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-vin-border bg-vin-shell transition-colors focus-within:border-vin-accent">
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

      <div className="flex-1 p-4">
        {/* @ts-ignore: React 18/19 type conflict with Tiptap */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
