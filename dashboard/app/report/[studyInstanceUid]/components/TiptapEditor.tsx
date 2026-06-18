'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useCallback, useEffect } from 'react';

export default function TiptapEditor({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (html: string) => void;
}) {
  const handleImageUpload = useCallback(async (file: File, editor: any, pos?: number) => {
    if (!file.type.startsWith('image/')) return;
    
    // Upload image to server
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
             editor.chain().focus().insertContentAt(pos, {
               type: 'image',
               attrs: { src: url }
             }).run();
          } else {
             editor.chain().focus().setImage({ src: url }).run();
          }
        }
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error", err);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false, // Bắt buộc chặn paste raw base64 nếu config hỗ trợ, nhưng ta xử lý paste riêng.
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert focus:outline-none max-w-none text-slate-300 min-h-[400px]',
      },
      handlePaste: (view, event, slice) => {
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
        return hasImage; // Prevent default paste if we handled an image
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
          return hasImage; // Prevent default drop if we handled an image
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync with external value, e.g. on initial async load
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/50 flex flex-col focus-within:border-emerald-500/50 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-700/60 bg-slate-800/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          type="button"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          type="button"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          type="button"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          type="button"
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      <div className="p-4 flex-1">
        {/* @ts-ignore: React 18/19 type conflict with Tiptap */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
