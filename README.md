# Curate

A browser-based tool that gives human experts precise, manual control over what goes into an LLM prompt. Instead of relying on similarity search in a RAG pipeline, users can pick a Google Drive folder, review every `.docx` and text-PDF inside, select exactly the pieces they want, and generate a single, well-annotated Markdown block—ready to paste into any chat window—while tracking the token footprint in real time.

## Features

- **Google Drive Integration**
  - Google OAuth 2.0 with `drive.file` scope
  - One-hour access tokens only (no refresh token storage)
  - Recursive folder scanning with pagination
  - Support for `.docx` and text-PDF files (≤ 1 MB)

- **Content Management**
  - Collapsible tree view with file selection
  - Sort by name, token count, or last modified
  - Filename search with debouncing
  - Preview pane for content review
  - Real-time token counting with soft/hard limits

- **Output Generation**
  - Well-formatted Markdown output
  - Custom instructions support
  - One-click copy to clipboard
  - Token breakdown tracking
  - Automatic whitespace optimization

## Tech Stack

- **IDE**: [Cursor](https://www.cursor.com/)
- **AI Tools**: [V0](https://v0.dev/), [Perplexity](https://www.perplexity.com/)
- **Frontend**: 
  - [Next.js](https://nextjs.org/docs) 15 App Router
  - [Tailwind](https://tailwindcss.com/docs/guides/nextjs)
  - [Shadcn](https://ui.shadcn.com/docs/installation)
  - [Framer Motion](https://www.framer.com/motion/introduction/)
- **Backend**: 
  - [PostgreSQL](https://www.postgresql.org/about/)
  - [Supabase](https://supabase.com/)
  - [Drizzle](https://orm.drizzle.team/docs/get-started-postgresql)
  - [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- **Auth**: [Clerk](https://clerk.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **Analytics**: [PostHog](https://posthog.com/)

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the environment variables:
   ```
   # Google Drive API
   NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
   GOOGLE_CLIENT_ID=your_client_id
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # PostHog
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run Jest tests
- `pnpm e2e` - Run Playwright E2E tests

## Project Structure

```
/src
├─ app/                    # Next.js routes
│ ├─ layout.tsx           # Theme loader
│ └─ curate/…            # Main tool
├─ components/            # Shared components
│ ├─ DrivePicker.tsx     # Google Drive picker
│ ├─ FileTree/           # File selection tree
│ ├─ TokenMeter.tsx      # Token counter
│ ├─ PreviewPane.tsx     # Content preview
│ ├─ SnippetModal.tsx    # Output modal
│ └─ ui/                 # shadcn re-exports
├─ lib/                  # Library code
│ ├─ drive.ts           # Google Drive wrapper
│ ├─ extract.ts         # Mammoth & pdfjs helpers
│ ├─ tokenizer.ts       # WASM worker bootstrap
│ └─ snippet.ts         # Formatter utils
├─ server/              # Server code
│ └─ actions/           # Server actions
├─ styles/              # Tailwind styles
└─ tests/               # Test files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
