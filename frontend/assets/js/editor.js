// Monaco Editor Management
let editor = null;

function initMonacoEditor(containerId, initialCode = '') {
    return new Promise((resolve) => {
        // Load Monaco Editor dynamically using AMD loader
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
        
        require(['vs/editor/editor.main'], function () {
            // LeetCode Dark Theme
            monaco.editor.defineTheme('leetcode-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
                    { token: 'keyword', foreground: '569cd6' },
                    { token: 'string', foreground: 'ce9178' },
                    { token: 'number', foreground: 'b5cea8' },
                    { token: 'type', foreground: '4ec9b0' }
                ],
                colors: {
                    'editor.background': '#282828',
                    'editor.foreground': '#eff1f6',
                    'editorCursor.foreground': '#ffa116',
                    'editor.lineHighlightBackground': '#2e2e2e',
                    'editorLineNumber.foreground': '#636366',
                    'editorLineNumber.activeForeground': '#eff1f6',
                    'editor.selectionBackground': '#264f78',
                    'editor.inactiveSelectionBackground': '#3a3d41',
                    'editorIndentGuide.background': '#383838',
                    'editorIndentGuide.activeBackground': '#555555'
                }
            });

            // LeetCode Light Theme
            monaco.editor.defineTheme('leetcode-light', {
                base: 'vs',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#ffffff',
                    'editor.foreground': '#262626',
                    'editorCursor.foreground': '#ffa116',
                    'editor.lineHighlightBackground': '#f7f7f8',
                    'editorLineNumber.foreground': '#a3a3a3',
                    'editorLineNumber.activeForeground': '#262626',
                    'editorIndentGuide.background': '#e5e5e5'
                }
            });

            const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');

            editor = monaco.editor.create(document.getElementById(containerId), {
                value: initialCode || `#include <iostream>\n\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    cout << "Hello World!" << endl;\n    return 0;\n}`,
                language: 'cpp',
                theme: isDark ? 'leetcode-dark' : 'leetcode-light',
                fontSize: 14,
                fontFamily: `'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace`,
                automaticLayout: true,
                minimap: { enabled: false },
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                lineHeight: 22,
                tabSize: 4,
                roundedSelection: false,
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
                overviewRulerBorder: false,
                scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8
                }
            });

            // Listen for theme changes and adjust Monaco
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const isDarkMode = document.documentElement.classList.contains('dark');
                        monaco.editor.setTheme(isDarkMode ? 'leetcode-dark' : 'leetcode-light');
                    }
                });
            });
            observer.observe(document.documentElement, { attributes: true });

            resolve(editor);
        });
    });
}

function getEditorCode() {
    return editor ? editor.getValue() : '';
}

function setEditorCode(code) {
    if (editor) {
        editor.setValue(code);
    }
}

function updateEditorFontSize(size) {
    if (editor) {
        editor.updateOptions({ fontSize: size });
    }
}
