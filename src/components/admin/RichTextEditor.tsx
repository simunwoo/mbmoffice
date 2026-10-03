"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, type NodeViewProps } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { uploadMedia } from "@/lib/actions/admin/media";
import { trimEmptyEdgeParagraphs } from "@/lib/richText";

const IMAGE_WIDTHS = [
  { label: "작게", value: "30%" },
  { label: "보통", value: "60%" },
  { label: "크게", value: "100%" },
];
const IMAGE_ALIGNS: { label: string; value: "left" | "center" | "right" }[] = [
  { label: "왼쪽", value: "left" },
  { label: "가운데", value: "center" },
  { label: "오른쪽", value: "right" },
];

/** style 문자열을 key:value 맵으로 파싱해 patch만 덮어쓴 뒤 다시 합칩니다 (width·정렬을 서로 건드리지 않기 위함). */
function mergeStyle(current: string | null | undefined, patch: Record<string, string>): string {
  const styles: Record<string, string> = {};
  (current ?? "").split(";").forEach((decl) => {
    const [k, v] = decl.split(":").map((s) => s.trim());
    if (k && v) styles[k] = v;
  });
  Object.assign(styles, patch);
  return Object.entries(styles)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

function alignPatch(align: "left" | "center" | "right"): Record<string, string> {
  if (align === "center") return { display: "block", "margin-left": "auto", "margin-right": "auto" };
  if (align === "right") return { display: "block", "margin-left": "auto", "margin-right": "0" };
  return { display: "block", "margin-left": "0", "margin-right": "auto" };
}

/** style 문자열(css 텍스트)을 React 인라인 style 객체로 변환합니다. */
function parseStyleString(styleStr?: string | null): React.CSSProperties {
  const obj: Record<string, string> = {};
  (styleStr ?? "").split(";").forEach((decl) => {
    const [k, v] = decl.split(":").map((s) => s.trim());
    if (k && v) obj[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  });
  return obj as React.CSSProperties;
}

/**
 * 이미지 노드를 React로 렌더링합니다. 선택했을 때 이미지 바로 아래에 크기(px 직접 입력 포함)·정렬
 * 도구 바가 붙어서 나오므로, 에디터 아래쪽 이미지를 고칠 때도 스크롤해서 멀리 떨어진 툴바를 찾을 필요가
 * 없습니다. 위치 계산 라이브러리 없이 일반 React 트리 레이아웃만으로 동작해 안정적입니다.
 */
function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const [widthInput, setWidthInput] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  // 도구 바가 열릴 때(이미지를 선택할 때)마다, 지금 화면에 실제로 보이는 가로 크기(px)를 입력칸에
  // 미리 채워 둡니다 — style에 %로 저장돼 있어도 사용자는 실제 픽셀 값을 보고 조정할 수 있습니다.
  useEffect(() => {
    if (selected && imgRef.current) {
      setWidthInput(String(Math.round(imgRef.current.offsetWidth)));
    }
  }, [selected]);

  function applyWidth() {
    const num = Number(widthInput);
    if (!Number.isFinite(num) || num <= 0) return;
    updateAttributes({ style: mergeStyle(node.attrs.style as string | null, { width: `${num}px` }) });
  }

  function applyPreset(width: string) {
    updateAttributes({ style: mergeStyle(node.attrs.style as string | null, { width }) });
  }

  function applyAlign(align: "left" | "center" | "right") {
    updateAttributes({ style: mergeStyle(node.attrs.style as string | null, alignPatch(align)) });
  }

  return (
    <NodeViewWrapper className="my-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- 에디터 안에 업로드된 임의 URL 이미지라 next/image 최적화 대상이 아닙니다. */}
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        style={parseStyleString(node.attrs.style as string | null)}
        className={`max-w-full rounded-lg ${selected ? "outline outline-2 outline-offset-2 outline-brand" : ""}`}
      />
      {selected && (
        <div
          contentEditable={false}
          className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-1.5 text-xs shadow-sm"
        >
          <input
            type="number"
            min={10}
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyWidth();
              }
            }}
            placeholder="너비(px)"
            className="w-20 rounded border border-border bg-transparent px-2 py-1 outline-none focus:border-brand"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyWidth}
            className="rounded px-2 py-1 font-semibold text-foreground-soft hover:bg-surface"
          >
            적용
          </button>
          <div className="h-5 w-px bg-border" />
          {IMAGE_WIDTHS.map((w) => (
            <button
              key={w.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyPreset(w.value)}
              className="rounded px-2 py-1 font-semibold text-foreground-soft hover:bg-surface"
            >
              {w.label}
            </button>
          ))}
          <div className="h-5 w-px bg-border" />
          {IMAGE_ALIGNS.map((a) => (
            <button
              key={a.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyAlign(a.value)}
              className="rounded px-2 py-1 font-semibold text-foreground-soft hover:bg-surface"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
}

// 이미지의 너비·정렬을 인라인 style로 저장합니다 — 사이트에서 그대로 dangerouslySetInnerHTML로
// 렌더링되므로, 별도 CSS 없이 저장된 스타일만으로 동일하게 보입니다.
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("style"),
        renderHTML: (attributes: { style?: string | null }) => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
  addKeyboardShortcuts() {
    return {
      // 이미지가 선택된 상태에서 Backspace: 이미지 바로 앞 문단에 글자가 남아 있으면 그 글자부터
      // 하나씩 지우고, 더 지울 글자가 없으면(빈 문단이거나 이미지가 맨 앞이면) 이미지 자체를 지웁니다.
      Backspace: () => {
        const { selection, doc } = this.editor.state;
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== this.name) {
          return false;
        }
        const pos = selection.from;
        const before = doc.resolve(pos).nodeBefore;
        if (before && before.isTextblock && before.content.size > 0) {
          return this.editor.chain().focus().deleteRange({ from: pos - 1, to: pos }).run();
        }
        return this.editor.chain().focus().deleteSelection().run();
      },
    };
  },
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-brand-soft text-brand-ink" : "text-foreground-soft hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-border" />;
}

export function RichTextEditor({
  htmlFieldName,
  textFieldName,
  defaultValue,
}: {
  htmlFieldName: string;
  textFieldName: string;
  defaultValue?: string;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const initialHtml = trimEmptyEdgeParagraphs(defaultValue ?? "");
  // 폼이 실제로 제출하는 값은 이 state입니다 — ref로 DOM을 직접 건드리는 대신 React state로
  // 관리해, 리렌더링·폼 제출 타이밍과 무관하게 항상 최신 값이 hidden input에 반영되도록 합니다.
  const [html, setHtml] = useState(initialHtml);
  const [text, setText] = useState("");
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      ResizableImage,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "내용을 입력해주세요" }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
      setText(editor.getText());
    },
    onSelectionUpdate: () => forceUpdate((t) => t + 1),
    onTransaction: () => forceUpdate((t) => t + 1),
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral min-h-[320px] max-w-none bg-background px-4 py-3 focus:outline-none [&_img]:max-w-full [&_img]:rounded-lg [&_table]:w-full",
      },
    },
  });

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadMedia(formData);
    setUploading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.url) editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadMedia(formData);
    setUploading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.url) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${result.url}" target="_blank" rel="noopener noreferrer">📎 ${file.name}</a>&nbsp;`
        )
        .run();
    }
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소를 입력하세요", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <input type="hidden" name={htmlFieldName} value={html} readOnly />
      <input type="hidden" name={textFieldName} value={text} readOnly />

      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface p-1.5">
        <ToolbarButton title="실행 취소" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          ↺
        </ToolbarButton>
        <ToolbarButton title="다시 실행" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          ↻
        </ToolbarButton>

        <Divider />

        <select
          title="문단 크기"
          className="h-8 rounded border border-border bg-background px-1.5 text-xs font-semibold text-foreground-soft outline-none"
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: Number(v.replace("h", "")) as 1 | 2 | 3 }).run();
          }}
        >
          <option value="p">본문</option>
          <option value="h1">제목 1</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
        </select>

        <Divider />

        <ToolbarButton title="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton title="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton title="밑줄" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton title="취소선" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton title="인라인 코드" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          {"</>"}
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="왼쪽 정렬" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          ≡
        </ToolbarButton>
        <ToolbarButton title="가운데 정렬" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          ≣
        </ToolbarButton>
        <ToolbarButton title="오른쪽 정렬" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          ☰
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="글머리 기호 목록" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •≡
        </ToolbarButton>
        <ToolbarButton title="번호 매기기 목록" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1≡
        </ToolbarButton>
        <ToolbarButton title="인용구" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo;
        </ToolbarButton>
        <ToolbarButton title="코드 블록" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {"{ }"}
        </ToolbarButton>
        <ToolbarButton title="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          ―
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="링크" active={editor.isActive("link")} onClick={setLink}>
          🔗
        </ToolbarButton>
        <ToolbarButton title="사진 삽입" disabled={uploading} onClick={() => imageInputRef.current?.click()}>
          📷
        </ToolbarButton>
        <ToolbarButton title="첨부파일 삽입" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          📎
        </ToolbarButton>
        <ToolbarButton
          title="표 삽입"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          ▦
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="서식 지우기" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          Tx
        </ToolbarButton>

        {uploading && <span className="ml-2 text-xs text-foreground-soft">업로드 중...</span>}
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePick} />

      {/* 툴바는 이 스크롤 영역 밖에 고정돼 있어 항상 보이고, 본문만 안에서 스크롤됩니다 —
          페이지 전체를 내릴 필요 없이 이 박스 안에서만 수정이 끝납니다. */}
      <div className="max-h-[70vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
