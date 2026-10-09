import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useMemo, useRef } from 'react';

// Register custom font sizes
const Size = Quill.import('attributors/style/size') as any;
Size.whitelist = [
  '10px','11px','12px','13px','14px','16px',
  '18px','20px','22px','24px','28px','32px',
  '36px','48px','64px'
];
Quill.register(Size, true);

// Register fonts
const Font = Quill.import('formats/font') as any;
Font.whitelist = [
  false, 'serif', 'monospace'
];
Quill.register(Font, true);

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Write post content here...' 
}: Props) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        // Row 1: History
        [{ history: 'undo' }, { history: 'redo' }],

        // Row 2: Font & Size
        [{ font: [false, 'serif', 'monospace'] }],
        [{ size: [
          false,
          '10px','11px','12px','13px','14px',
          '16px','18px','20px','22px','24px',
          '28px','32px','36px','48px','64px'
        ]}],

        // Row 3: Block format
        [{ header: [1, 2, 3, 4, 5, 6, false] }],

        // Row 4: Text style
        ['bold', 'italic', 'underline', 'strike'],
        [{ script: 'sub' }, { script: 'super' }],

        // Row 5: Color
        [{ color: [] }, { background: [] }],

        // Row 6: Alignment
        [{ align: [] }],

        // Row 7: Lists & Indent
        [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        [{ indent: '-1' }, { indent: '+1' }],

        // Row 8: Blocks
        ['blockquote', 'code-block'],

        // Row 9: Media & Links
        ['link', 'image', 'video'],

        // Row 10: Direction & Clean
        [{ direction: 'rtl' }],
        ['clean'],
      ],
      handlers: {
        undo() {
          (this as any).quill.history.undo();
        },
        redo() {
          (this as any).quill.history.redo();
        },
      },
    },
    history: {
      delay: 500,
      maxStack: 200,
      userOnly: true,
    },
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'font', 'size', 'header',
    'bold', 'italic', 'underline', 'strike',
    'script', 'color', 'background',
    'align', 'direction',
    'list', 'indent',
    'link', 'image', 'video',
    'blockquote', 'code-block',
  ];

  const wordCount = value
    ? value
        .replace(/<[^>]*>/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;

  return (
    <div className="editor-wrapper rounded-2xl 
      border border-gray-200 dark:border-gray-700 
      overflow-hidden">

      <style>{`
        /* Toolbar — sticky, elegant wrapped toolbar to prevent absolute clipping */
        .editor-wrapper .ql-toolbar.ql-snow {
          position: sticky;
          top: 0;
          z-index: 30;
          background: #f8fafc;
          border: none;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap; /* Allows natural wrapping */
        }
        .editor-wrapper .ql-toolbar.ql-snow::after,
        .editor-wrapper .ql-toolbar.ql-snow::before {
          display: none !important; /* Remove ancient clear-fix floats to make flex-wrap work beautifully */
        }
        .editor-wrapper .ql-toolbar.ql-snow .ql-formats {
          display: inline-flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 2px;
          margin-right: 8px !important;
          margin-top: 2px;
          margin-bottom: 2px;
        }
        .dark .editor-wrapper .ql-toolbar.ql-snow {
          background: #1e293b;
          border-color: #334155;
        }
        .dark .editor-wrapper .ql-toolbar button,
        .dark .editor-wrapper .ql-toolbar .ql-picker-label,
        .dark .editor-wrapper .ql-toolbar .ql-picker-options {
          color: #cbd5e1 !important;
        }
        .dark .editor-wrapper .ql-toolbar .ql-stroke {
          stroke: #cbd5e1 !important;
        }
        .dark .editor-wrapper .ql-toolbar .ql-fill {
          fill: #cbd5e1 !important;
        }

        /* Customize Pickers (Dropdowns) styling */
        .editor-wrapper .ql-toolbar .ql-picker {
          height: 28px;
          line-height: 24px;
        }
        .editor-wrapper .ql-toolbar .ql-picker-label {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0 8px;
          font-size: 13px !important;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 500;
        }
        .dark .editor-wrapper .ql-toolbar .ql-picker-label {
          border-color: #334155;
          background: #0f172a;
        }

        /* Specific widths for pickers to prevent overlapping and stretching */
        .editor-wrapper .ql-toolbar .ql-picker.ql-font {
          width: 104px;
        }
        .editor-wrapper .ql-toolbar .ql-picker.ql-size {
          width: 80px;
        }
        .editor-wrapper .ql-toolbar .ql-picker.ql-header {
          width: 96px;
        }

        /* Complete Heading Labels Map */
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before {
          content: 'Heading 1' !important;
        }
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before {
          content: 'Heading 2' !important;
        }
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before {
          content: 'Heading 3' !important;
        }
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="4"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="4"]::before {
          content: 'Heading 4' !important;
        }
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="5"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="5"]::before {
          content: 'Heading 5' !important;
        }
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="6"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="6"]::before {
          content: 'Heading 6' !important;
        }
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item:not([data-value])::before,
        .editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label:not([data-value])::before {
          content: 'Normal' !important;
        }

        /* Custom Sizes text content mapper */
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value]::before {
          content: attr(data-value) !important;
        }
        /* Fallbacks when default/falsy */
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item:not([data-value])::before,
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label:not([data-value])::before,
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="false"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="false"]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value=""]::before,
        .editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value=""]::before {
          content: 'Normal' !important;
        }

        /* Custom Button feedback / styling */
        .editor-wrapper .ql-toolbar button {
          border-radius: 6px;
          width: 28px !important;
          height: 28px !important;
          padding: 4px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .editor-wrapper .ql-toolbar button:hover {
          background: #e2e8f0;
        }
        .dark .editor-wrapper .ql-toolbar button:hover {
          background: #334155;
        }
        .editor-wrapper .ql-toolbar button.ql-active {
          background: #dbeafe !important;
          color: #1e40af !important;
        }
        .dark .editor-wrapper .ql-toolbar button.ql-active {
          background: #1e3a8a !important;
          color: #93c5fd !important;
        }
        .editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #1e40af !important;
        }
        .dark .editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #93c5fd !important;
        }
        .editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #1e40af !important;
        }
        .dark .editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #93c5fd !important;
        }

        /* Editor content area — FIXED HEIGHT, SCROLLS INSIDE */
        .editor-wrapper .ql-container.ql-snow {
          border: none;
          height: 420px;        /* fixed height */
          overflow-y: auto;     /* scroll inside */
          overflow-x: hidden;
          font-size: 15px;
          background: white;
        }
        .dark .editor-wrapper .ql-container.ql-snow {
          background: #0f172a;
        }

        /* Editor text area */
        .editor-wrapper .ql-editor {
          min-height: 100%;
          padding: 16px 20px;
          line-height: 1.75;
          color: #1a1a1a;
          word-break: normal;
          hyphens: none;
          -webkit-hyphens: none;
        }
        .dark .editor-wrapper .ql-editor {
          color: #f1f5f9;
        }

        /* Placeholder */
        .editor-wrapper .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
          font-size: 14px;
        }

        /* Lists inside editor */
        .editor-wrapper .ql-editor ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }
        .editor-wrapper .ql-editor ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }
        .editor-wrapper .ql-editor li {
          margin-bottom: 4px;
        }

        /* Blockquote */
        .editor-wrapper .ql-editor blockquote {
          border-left: 4px solid #1E3A8A;
          padding-left: 16px;
          margin: 12px 0;
          color: #64748b;
          font-style: italic;
        }

        /* Code block */
        .editor-wrapper .ql-editor pre.ql-syntax {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          overflow-x: auto;
          white-space: pre-wrap;
        }

        /* Headings */
        .editor-wrapper .ql-editor h1 {
          font-size: 2em;
          font-weight: 1000;
          margin: 16px 0 8px;
        }
        .editor-wrapper .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 850;
          margin: 14px 0 6px;
        }
        .editor-wrapper .ql-editor h3 {
          font-size: 1.25em;
          font-weight: 750;
          margin: 12px 0 6px;
        }

        /* Picker dropdown overlay styles */
        .editor-wrapper .ql-toolbar .ql-picker-options {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 9999 !important; /* Forces layout on top of any container */
          padding: 6px;
          max-height: 250px;
          overflow-y: auto;
        }
        .dark .editor-wrapper .ql-toolbar .ql-picker-options {
          background: #1e293b;
          border-color: #334155;
        }
        .editor-wrapper .ql-toolbar .ql-picker-item {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          display: block;
        }
        .editor-wrapper .ql-toolbar .ql-picker-item:hover {
          background: #f1f5f9;
        }
        .dark .editor-wrapper .ql-toolbar .ql-picker-item:hover {
          background: #334155;
        }

        /* Mobile Adjustments */
        @media (max-width: 640px) {
          .editor-wrapper .ql-toolbar.ql-snow {
            padding: 6px 8px;
            gap: 4px;
          }
          .editor-wrapper .ql-container.ql-snow {
            height: 350px;
          }
        }
      `}</style>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ display: 'flex', flexDirection: 'column' }}
      />

      {/* Word count footer */}
      <div className="flex items-center justify-between 
        px-4 py-2 bg-gray-50 dark:bg-gray-900 
        border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            wordCount >= 600 
              ? 'bg-green-100 text-green-700' 
              : wordCount >= 300 
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
          }`}>
            {wordCount} words
          </span>
          {wordCount < 300 && (
            <span className="text-[10px] text-gray-400">
              Add more content for better SEO
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => quillRef.current?.getEditor()
              .history.undo()}
            className="text-[10px] px-2 py-1 bg-gray-100 
              dark:bg-gray-800 text-gray-500 rounded-lg 
              hover:bg-gray-200 font-bold"
            title="Undo"
          >
            &larr; Undo
          </button>
          <button
            type="button"
            onClick={() => quillRef.current?.getEditor()
              .history.redo()}
            className="text-[10px] px-2 py-1 bg-gray-100 
              dark:bg-gray-800 text-gray-500 rounded-lg 
              hover:bg-gray-200 font-bold"
            title="Redo"
          >
            &rarr; Redo
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
