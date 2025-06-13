# Curate Technical Specification  (Auth-less Edition)

> **Scope note** This version removes all authentication, billing, and analytics content.  
> It assumes a pre-existing, in-memory Google Drive **access token** (`drive.readonly` scope) is available on both client and server for every request.

---

## 1. System Overview
- **Purpose**  
  Curate lets experts hand-select reference material from Google Drive and assemble an auditable Markdown context block for LLM prompts, with live token accounting.

- **Key Workflows**  
  1. **Pick a Drive folder** with the Google Picker.  
  2. **Scan & stream-list** all DOCX/PDF ≤ 1 MB (recursive).  
  3. **Preview content**, select/deselect files.  
  4. **Generate** and **copy** a single Markdown snippet (≤ 1 M tokens).

- **System Architecture**  
  | Layer | Tech |
  |-------|------|
  | Frontend | Next.js 15 App Router, React 18, Tailwind CSS, shadcn/ui, WASM `tiktoken` |
  | Backend  | Vercel serverless functions (TypeScript) for Drive API calls, extraction, tokenisation |
  | Storage  | None by default (stateless) |
  | Deployment | Vercel; edge-runtime where feasible |

---

## 2. Project Structure
/src
├─ app/ # Next.js routes
│ ├─ layout.tsx # Theme loader
│ └─ curate/… # Main tool
├─ components/
│ ├─ DrivePicker.tsx
│ ├─ FileTree/
│ ├─ TokenMeter.tsx
│ ├─ PreviewPane.tsx
│ ├─ SnippetModal.tsx
│ └─ ui/ # shadcn re-exports
├─ lib/
│ ├─ drive.ts # Google Drive wrapper
│ ├─ extract.ts # Mammoth & pdfjs helpers
│ ├─ tokenizer.ts # WASM worker bootstrap
│ └─ snippet.ts # formatter utils
├─ server/
│ └─ actions/
│ ├─ scanFolder.ts
│ ├─ extractFile.ts
│ ├─ tokenizeText.ts
│ └─ generateSnippet.ts
├─ styles/ (tailwind.css, tokens)
├─ tests/
│ └─ …

yaml
Copy

---

## 3. Feature Specification

### 3.1 Folder Selection & Scanning
| Requirement | Detail |
|-------------|--------|
| Folder picker | Google Picker SDK → choose **one** Drive folder |
| Recursion | Server action `scanFolder(folderId)` breadth-first: `files.list` with `q='PARENT' in parents` |
| Filtering | DOCX + PDF only, `size ≤ 1 048 576` B |
| Pagination | `pageSize = 1000`, stream results to client |
| Rate-limit | Exponential back-off on 403/429 (`2ⁿ s`, max 32 s, 5 attempts) |
| UI Badges  | Oversize > 1 MB → red badge |

---

### 3.2 Content Extraction
| Type | Pipeline | Failure Handling |
|------|----------|------------------|
| DOCX | `files.get?alt=media` stream → `mammoth` → plain text | Corrupt file → toast + mark red |
| PDF  | Stream into `pdfjs-dist` worker → concat `textContent.items[].str` | 0-text → grey badge “Image-only” |
| Memory | Abort extraction if live buffer > 50 MB |

---

### 3.3 Selection & Filtering UI
- Virtualised tree (`react-virtualized`)
- Checkbox cascade select
- Header controls: **Select All**, **Clear All**, Sort (Name / Tokens / Modified)
- Filename search (200 ms debounce)
- PreviewPane loads first 8 kB (expand on “Show more”)

---

### 3.4 Token Accounting
| Item | Detail |
|------|--------|
| Tokeniser | WASM `tiktoken` in a (Shared)WebWorker |
| Updates   | Post each extracted chunk; worker returns `{fileId, tokens}` |
| Limits    | Soft warn 750 k; hard cap 1 M tokens; selecting file that breaches cap ⇒ toast + prevented |

---

### 3.5 Snippet Assembly & Copy
````md
```md
<filename> /foo/Bar.docx </filename>
<stripped text>

<filename> /foo/Baz.pdf </filename>
<stripped text>

<custom instructions …>
Strip excess whitespace (\n{3,} → \n\n)

Clipboard API writeText; > 16 MB ⇒ Copy button disabled + tooltip

Optional Download .txt (creates Blob → anchor download)

3.6 UX / UI
Element	Spec
Theme	Light / dark (localStorage.theme)
Progress	n-progress bar during scan / extract / tokenize
Icons	DOCX, PDF
Toasts	Oversize, near-cap, copy success/failure
“Reset”	Clears localStorage & component state

4. Server Actions & Endpoints
Endpoint	Method	Params	Returns	Notes
/api/drive/scan	GET	folderId	Stream<FileMeta[]>	Recurses server-side
/api/drive/extract	POST	{fileId, mimeType}	Stream text chunks	DOCX/PDF switch
/api/drive/tokenize	POST	{text}	{tokens}	Runs WASM
/api/snippet/generate	POST	{files[], customInstructions}	{snippet}	Executes formatter

All endpoints expect an Authorization: Bearer ACCESS_TOKEN header forwarded from the client.

5. Design System
5.1 Visual Style
Token	Hex	Usage
Primary	#1F6FEB	buttons, links
BG-dark	#0D1117	dark theme
BG-light	#FFFFFF	light theme
Alert-red	#FF4D4F	hard cap
Grey	#8B949E	disabled text

Typography Inter (400/500/700); monospaced snippets.

4-pt spacing grid; 2xl rounded corners; soft shadows.

5.2 Core Components
Component	Key Props
DrivePicker	onPicked(folderId)
FileTree	{files, onToggle}
TokenMeter	{total, softCap, hardCap}
PreviewPane	{fileId, content}
SnippetModal	{snippet, disabled}

Interactive states: Tailwind hover:opacity-80, disabled:opacity-40.

6. Component Architecture
6.1 Server Components
/curate/page.tsx streams the Drive scan into <FileTree> via React Suspense.

Error boundary shows status-specific message.

6.2 Client Components
State with Recoil atoms:

selectionState (Set<fileId>)

tokenState (Map<fileId, tokens>, total)

uiPrefsState (theme, sort, expandedNodes)

Events

mermaid
Copy
graph TD
  selectFile --> recalcTotal
  recalcTotal -->|> cap? | preventSelect
  generateSnippet --> POST_snippet
  POST_snippet --> copyClipboard
ts
Copy
export interface FileMeta {
  id: string;
  name: string;
  mimeType: 'application/pdf'
          | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  size: number;
  modifiedTime: string;
  tokens?: number;
}
7. Data Flow
arduino
Copy
Client <--fetch/stream-- Serverless
   │                          │
   │          files.list + files.get
   └──► WebWorker (tiktoken) ──► total tokens
Server streams file metadata & extraction chunks.

Client posts chunks to tokenizer worker; updates sidebar meter.

No persistent storage.

8. Testing Strategy
Layer	Tool	Representative Cases
Unit	Jest + RTL	tokenizer counts; oversize badge; snippet formatter
Integration	Jest	scanFolder pagination + retry logic
e2e	Playwright	pick demo folder → select files → preview → generate snippet → clipboard verification
Accessibility	jest-axe	Keyboard nav in FileTree

Mock Google Drive endpoints via msw.