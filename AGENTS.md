# MindVault AI — AI Agent Development Guidelines

## Project Overview

MindVault AI is an AI-powered personal knowledge platform.

Core idea:

Users upload books/documents, the system processes them, and users can have natural conversations with their knowledge using text and voice AI.

The application should be built as a production-grade SaaS product.

---

# Technology Stack

## Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- next-themes

## Authentication

- Clerk

## Database

- MongoDB Atlas
- Mongoose

## Storage

- Vercel Blob
- Private Blob storage for user-owned documents
- Blob access must always be controlled through Clerk authentication and database ownership checks
- Never expose Blob tokens client-side
- Store Blob identifiers/keys in MongoDB
- Do not rely on permanent public URLs for private files

## AI Infrastructure

Planned:

- Embeddings
- Vector search
- RAG pipeline
- Voice conversations
- AI personas

---

# Architecture Rules

## Feature First Architecture

Follow feature-based organization.

Current pattern:

```
features/

  books/
    actions/
    components/
    constants/
    errors/
    models/
    repositories/
    schemas/
    services/
    types/
    utils/
    validation/

  home/
    components/
    constants/
    types/

  voice/
    models/

```

```
Current Repo Structure:
mindvault-ai
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── app
│   ├── books
│   │   └── new
│   │       └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── layout
│   │   └── navbar
│   │       ├── auth-section.tsx
│   │       ├── desktop-nav.tsx
│   │       ├── guest-actions.tsx
│   │       ├── index.ts
│   │       ├── logo.tsx
│   │       ├── mobile-nav.tsx
│   │       ├── nav-link.tsx
│   │       ├── navbar.tsx
│   │       └── user-profile.tsx
│   ├── providers
│   │   └── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── ui
│       ├── alert-dialog.tsx
│       ├── button.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── sheet.tsx
├── components.json
├── config
│   └── navigation.ts
├── eslint.config.mjs
├── features
│   ├── books
│   │   ├── actions
│   │   │   ├── book-action-helpers.ts
│   │   │   ├── create-book.ts
│   │   │   ├── delete-book.ts
│   │   │   ├── find-book-by-slug.ts
│   │   │   ├── get-book.ts
│   │   │   └── save-book-segments.ts
│   │   ├── components
│   │   │   ├── book-form-fields.tsx
│   │   │   ├── book-upload-form.tsx
│   │   │   ├── cover-upload-field.tsx
│   │   │   ├── new-book-page.tsx
│   │   │   ├── pdf-upload-field.tsx
│   │   │   ├── upload-loading-overlay.tsx
│   │   │   ├── upload-success-state.tsx
│   │   │   └── voice-selector.tsx
│   │   ├── constants
│   │   │   ├── book-upload.ts
│   │   │   └── voice-personas.ts
│   │   ├── errors
│   │   │   └── book-errors.ts
│   │   ├── index.ts
│   │   ├── models
│   │   │   ├── book-segment.model.ts
│   │   │   └── book.model.ts
│   │   ├── repositories
│   │   │   ├── book-segment.repository.ts
│   │   │   └── book.repository.ts
│   │   ├── schemas
│   │   │   └── book-schema.ts
│   │   ├── services
│   │   │   ├── book-processing.service.ts
│   │   │   ├── book-storage.service.ts
│   │   │   ├── book.service.ts
│   │   │   ├── chunk.service.ts
│   │   │   ├── embedding.service.ts
│   │   │   └── pdf.service.ts
│   │   ├── types
│   │   │   ├── book-processing.ts
│   │   │   └── book.ts
│   │   ├── utils
│   │   │   ├── generate-slug.ts
│   │   │   └── normalize-book-title.ts
│   │   └── validation
│   │       └── book.validation.ts
│   ├── home
│   │   ├── components
│   │   │   ├── book-card.tsx
│   │   │   ├── book-grid.tsx
│   │   │   ├── empty-library.tsx
│   │   │   ├── hero-illustration.tsx
│   │   │   ├── hero-section.tsx
│   │   │   ├── home-page.tsx
│   │   │   ├── how-it-works-card.tsx
│   │   │   └── library-section.tsx
│   │   ├── constants
│   │   │   └── home-content.ts
│   │   ├── index.ts
│   │   └── types
│   │       └── home.ts
│   └── voice
│       └── models
│           └── voice-session.model.ts
├── lib
│   ├── ai
│   │   └── embeddings
│   │       ├── embedding-errors.ts
│   │       ├── embedding-provider.ts
│   │       ├── gemini
│   │       │   └── gemini-embedding-provider.ts
│   │       ├── index.ts
│   │       └── types.ts
│   ├── config
│   │   └── ai.config.ts
│   ├── db
│   │   ├── action-result.ts
│   │   ├── connection.ts
│   │   ├── errors.ts
│   │   └── serialize.ts
│   └── utils.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── proxy.ts
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── images
│   │   └── mindvault-library-hero.png
│   ├── vercel.svg
│   └── window.svg
└── tsconfig.json
```

Do not create large global folders containing feature-specific code.

Note:
The repository structure may evolve as new features are added.

For the current Vercel Blob + Book Details milestone, expected additions include:

features/books/services/storage/

    storage-provider.ts
    vercel-blob-storage.ts
    blob-access.service.ts

app/books/[slug]/

    page.tsx

features/books/components/

    book-details-page.tsx

These must follow existing feature-first boundaries.
---

# Folder Responsibilities

## app/

Only routing and page composition.

Example:

```
app/books/new/page.tsx
```

should only:

- import feature components
- compose routes

Do not place business logic here.

---

## components/

Only shared application UI.

Examples:

Allowed:

- navbar
- theme provider
- generic UI components
- shadcn components

Not allowed:

- book-specific components
- upload-specific components
- feature business logic

---

## features/

Feature ownership boundary.

Each feature owns:

- UI
- types
- constants
- business logic
- server actions
- database models

---

## lib/

Shared infrastructure.

Examples:

- database connection
- utilities
- serialization
- external service clients

---

# Engineering Principles

Always follow:

- SOLID principles
- DRY
- KISS
- Separation of concerns
- Composition over inheritance
- Clean architecture
- Domain-driven organization

Avoid:

- giant components
- duplicated code
- tightly coupled features
- premature abstractions

---

# React Rules

Prefer:

- Server Components by default
- Client Components only when required

Use client components only for:

- browser APIs
- state
- event handlers
- interactive UI

Avoid unnecessary:

- useEffect
- useState
- client boundaries

---

# Next.js Rendering Rules

User-specific pages must not be statically cached.

For authenticated routes:

- verify authentication server-side
- verify ownership server-side
- use appropriate dynamic rendering behavior
- never allow one user's private data to appear in another user's cached response

---

# TypeScript Rules

Strict TypeScript required.

Never use:

```ts
any;
```

Avoid:

```ts
as any
```

Avoid unsafe type casting.

Prefer:

- proper interfaces
- discriminated unions
- reusable domain types

---

# Database Rules

MongoDB access must happen through:

```
features/*/repositories
```

or

```
lib/db
```

Never directly query MongoDB inside:

- components
- pages
- UI code

---

# Mongoose Rules

All models must:

- support Next.js hot reload
- avoid duplicate model registration

Pattern:

```ts
mongoose.models.ModelName ||
mongoose.model(...)
```

All schemas should include:

- timestamps
- indexes where needed
- strict typing

---

# Private Storage Rules

Vercel Blob is private storage.

Rules:

- Never expose BLOB_READ_WRITE_TOKEN to clients.
- Never call Blob SDK directly from React components.
- Blob operations belong inside storage services.
- Authorization must happen before generating file access.
- Verify Clerk authentication and database ownership before serving files.
- Store blob keys in database records.
- Do not use blob metadata as an authorization mechanism.
- Do not create custom signing algorithms.
- Prefer official Vercel Blob access mechanisms.
- Keep storage provider replaceable through abstraction.

Storage flow:

User
|
Clerk Authentication
|
Ownership Verification
|
Storage Service
|
Authorized File Access

---

# Server Action Rules

Server actions must:

- validate input
- authenticate user
- handle errors
- return serializable data

Structure:

```
action
 |
 validation
 |
 service
 |
 repository
 |
 database
```

Do not put business logic directly in actions.

---

# Error Handling

Use domain-specific errors.

Example:

```
BookNotFoundError

PdfProcessingError

UnauthorizedError

ValidationError
```

Never expose raw database/parser errors to users.

---

# PDF Processing Rules

Current PDF pipeline:

```
Upload
 |
Validation
 |
Storage
 |
PDF Extraction
 |
Text Cleaning
 |
Chunking
 |
Database Storage
 |
Embedding Generation
```

Embeddings are already implemented.
Future work should extend the pipeline, not replace it.
Extraction belongs only inside:

```
features/books/services/pdf.service.ts
```

Never parse PDFs inside components/actions.

---

# Chunking Rules

Book text should be prepared for future RAG.

Chunks should preserve:

- page information
- ordering
- metadata

Future compatibility:

- embeddings
- vector database
- citations
- semantic search

---

# AI / Embeddings Considerations

Do not generate embeddings unnecessarily.

Architecture currently supports:

```
BookSegment
      |
      |
Gemini Embedding generation
      |
      |
Future vector database
      |
      |
RAG retrieval
```

Keep embeddings as a separate processing step.

Do not mix:

- PDF extraction
- chunking
- embedding generation

---

# UI Rules

All UI must:

- support light mode
- support dark mode
- support system theme

Never hardcode:

```
bg-white
text-black
gray-500
```

Use semantic tokens:

```
bg-background

text-foreground

text-muted-foreground

border-border
```

---

# Accessibility Rules

Always implement:

- semantic HTML
- keyboard support
- ARIA labels where needed
- visible focus states
- proper heading hierarchy

Images:

Always use:

```
next/image
```

Never:

```
<img>
```

---

# Forms

All forms should use:

- react-hook-form
- zod validation
- shadcn form patterns

Requirements:

- client validation
- server validation
- clear error messages
- loading states
- disabled submission states

---

# Styling Rules

Use:

- Tailwind CSS
- existing design tokens
- shadcn components

Avoid:

- inline styles
- arbitrary CSS unless necessary
- duplicated utility classes

---

# Performance Rules

Optimize for production.

Avoid:

- unnecessary re-renders
- unnecessary client components
- duplicate API calls
- large bundle imports

Use:

- lazy loading where appropriate
- Next Image optimization
- server rendering

---

# Git / Code Quality Rules

Before finishing any task:

Check:

- no unused imports
- no console.log
- no TODO comments
- no dead code
- no duplicate code
- no TypeScript errors

Run when possible:

```
npm run lint

npm run build
```

---

# Naming Conventions

Components:

PascalCase

Example:

```
BookCard.tsx
```

Functions:

camelCase

Example:

```
createBook()
```

Constants:

UPPER_CASE

Example:

```
BOOK_UPLOAD_LIMITS
```

Types:

PascalCase

Example:

```
BookRecord
```

---

# When Adding New Features

Before coding:

1. Inspect existing architecture.
2. Reuse existing patterns.
3. Avoid modifying unrelated features.
4. Keep route files thin.
5. Add code inside the correct feature folder.

---

# Current Product Roadmap

Completed:

✓ Next.js foundation
✓ Tailwind
✓ shadcn/ui
✓ Theme system
✓ Navbar
✓ Clerk authentication
✓ Homepage
✓ Book upload UI
✓ MongoDB foundation
✓ Book models
✓ Server actions
✓ PDF processing pipeline
✓ Gemini embeddings

Upcoming:

- Vercel Blob production storage
- Book details dashboard
- PDF viewer
- Vector search
- RAG chat
- Citations
- AI personas
- Voice conversations
- Subscription limits
- Analytics

---

# Final Rule

Write code as if this application will be maintained by a professional engineering team.

Prioritize:

- maintainability
- scalability
- correctness
- clarity
- production readiness

Do not optimize for fastest implementation.

Optimize for long-term quality.
