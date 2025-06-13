# Curate

## Project Description
Curate is a browser-based tool that gives human experts precise, manual control over what goes into an LLM prompt.  
Instead of relying on similarity search in a RAG pipeline, the user picks a Google Drive folder, reviews every `.docx` and text-PDF inside, selects exactly the pieces they want, and Curate generates a single, well-annotated Markdown block—ready to paste into any chat window—while tracking the token footprint in real time.

## Target Audience
- Developers, analysts, lawyers, researchers—anyone who stores reference material in Google Drive and needs deterministic, auditable context for an LLM conversation.

## Desired Features

### Authentication & Permissions
- [ ] Google OAuth 2.0 (`drive.file` scope)  
    - [ ] No refresh-token storage; one-hour access tokens only.

### Folder Selection & Scanning
- [ ] Google Drive folder picker → single folder  
    - [ ] Recursive listing (`files.list`, paginated)  
    - [ ] Filter to `.docx` and PDF  
    - [ ] Skip any file whose `size > 1 MB` (display “oversize” badge)

### Content Extraction
- [ ] `.docx` → plain text via **mammoth.js** (Next.js server action)  
- [ ] PDF → plain text via `pdfjs-dist` text layer extraction  
    - [ ] Detect 0-text PDFs; render greyed-out with “Image-only” tooltip  
    - [ ] **No OCR fallback**

### Selection & Filtering UI
- [ ] Collapsible tree / virtualised list  
    - [ ] Select / deselect individual files or whole sub-folders  
    - [ ] “Select All” / “Clear All”  
- [ ] Sort options: Name, Token count, Last-modified  
- [ ] Filename search
- [ ] **Preview pane:** clicking a file loads its extracted text in a side panel for skimming before selection

### Token Accounting
- [ ] Per-file and total token counts via **`tiktoken` (WASM)**  
- [ ] Running meter; soft warning at 750 k, hard cap at 1 M tokens

### Text Snippet Assembly
- [ ] Output format:  
````md
```md
<filename> /path/to/file.docx </filename>
<file-text…>

<filename> /another/file.pdf </filename>
<file-text…>
 Headers wrapped in <filename> tags inside a single ```md code-fence

 Strips excess whitespace

 Appends user-supplied “Custom Instructions” block at the end

 One-click “Copy to clipboard”

 If total text exceeds browser clipboard limit, Copy button is disabled and shows tooltip “Snippet too large—trim selection”

UX / UI
 Next.js 15 App Router (Vercel)

 Tailwind CSS + shadcn/ui

 Light/dark toggle (localStorage.theme)

 Progress bar during scan / extract / tokenize

 Manual “Rescan folder” button

 Greyed-out styling + icon for non-extractable PDFs

State Management
 Persist theme, sort order, expanded nodes in localStorage

 “Reset” clears storage and signs out

Backend & Deployment
 All Drive API calls and extraction run in Vercel serverless functions (TypeScript)

 Streaming download → streaming text extraction to keep memory < 256 MB

Security & Privacy
 HTTPS enforced by Vercel

 CSP + SameSite cookies

 No file contents or snippets stored after response

Optional / Future
 Download snippet as .txt

 Token breakdown CSV

 Accessibility / ARIA-compliant keyboard nav (phase 2)

Design Requests
 Minimal developer aesthetic

 Collapsible tree with file-type icons

 Fixed sidebar token meter

 Toasts for oversize files, nearing token limit, copy success / failure

Other Notes
Motivation: allow deterministic, hand-picked context for LLMs, avoiding RAG mis-hits.

Clipboard payload of ~1 M tokens ≈ 4 – 5 MB; some browsers cap at 16 MB, but memory spikes require testing—hence copy-button disable logic.

Google Drive quota: batch listing (1000 items per page) and exponential back-off on 403/429.