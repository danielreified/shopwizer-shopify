import CodeMirrorImport from "@uiw/react-codemirror";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";

const CodeMirror = CodeMirrorImport as any;

interface EditorCodePaneProps {
  activeKey: string;
  value: string;
  onChange: (value: string) => void;
}

export function EditorCodePane({ activeKey, value, onChange }: EditorCodePaneProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "8px 16px",
          background: "#252526",
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#007acc", fontFamily: "monospace", fontSize: "13px" }}>
          📄 {activeKey}.css
        </span>
        <span style={{ color: "#666", fontSize: "12px" }}>CSS Mode</span>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[css()]}
          onChange={onChange}
          placeholder={`/* Add your custom styles for ${activeKey} here */\n\n.sw-card {\n  /* border: 1px solid #000; */\n}`}
          style={{ height: "100%" }}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
          }}
        />
      </div>
    </div>
  );
}
