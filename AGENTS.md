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

Implemented:

- Gemini embeddings
- BookSegment embedding generation
- MongoDB Atlas Vector Search
- RAG retrieval pipeline
- Gemini generation provider
- Streaming AI responses
- Citation system
- Book-scoped AI chat
- Conversation history
- Persistent conversations
- Multi-turn conversation memory
- Conversation summaries
- Book-scoped conversation lifecycle
- Conversation-aware RAG chat
- Conversation citations persistence
- Knowledge Intelligence
- AI summaries
- Key takeaways
- Flashcards
- Quiz generation
- Mind maps
- Knowledge generation orchestration
- Background-friendly artifact generation
- Generation status tracking
- Artifact regeneration

Planned:

- Multi-book search
- AI personas / customizable AI assistants
- Voice conversations

---

# Architecture Rules

## Feature First Architecture

Follow feature-based organization.

Current pattern:

```
features/
├── books/
│   ├── actions/
│   ├── components/
│   ├── constants/
│   ├── errors/
│   ├── models/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   │   ├── storage/
│   │   └── *.service.ts
│   ├── types/
│   ├── utils/
│   ├── validation/
│   └── index.ts
│
├── chat/
│   ├── components/
│   ├── services/
│   └── types/
│
├── conversations/
│   ├── components/
│   ├── errors/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── types/
│   └── validation/
│
├── home/
│   ├── components/
│   ├── constants/
│   ├── types/
│   └── index.ts
│
├── knowledge/
│   ├── actions/
│   ├── components/
│   ├── constants/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── types/
│   ├── validation/
│   └── index.ts
│
├── search/
│   ├── repositories/
│   ├── services/
│   │   └── reranking/
│   └── types/
│
└── voice/
    └── models/
```

```
Current high-level repository structure:

mindvault-ai
├── app/
│   ├── api/                  # Next.js route handlers. Thin transport layer only.
│   │                         # Auth, validation, ownership checks, service delegation.
│   └── books/                # Route composition for book-related pages.
│                             # Pages should compose feature components only.
│
├── components/               # Shared application UI only.
│   ├── layout/               # Global layout components (navbar, navigation).
│   ├── providers/            # Application providers (theme, context providers).
│   └── ui/                   # Reusable design system components (shadcn/ui).
│
├── config/                   # Application-level configuration.
│
├── docs/                     # Developer documentation and infrastructure notes.
│                             # Example: database indexes, deployment notes.
│
├── features/                 # Main business domain boundary.
│                             # Each feature owns its UI, logic, types, and persistence.
│
│   ├── books/                # Book/document lifecycle domain.
│   │                         # Owns uploads, PDF processing, storage,
│   │                         # Book metadata, BookSegments, and document access.
│   │
│   │   ├── actions/          # Server actions for book operations.
│   │   ├── components/       # Book-specific UI components.
│   │   ├── constants/        # Book domain constants.
│   │   ├── errors/           # Book-specific domain errors.
│   │   ├── models/           # MongoDB/Mongoose book models.
│   │   ├── repositories/     # Database access for books and segments.
│   │   ├── schemas/          # Validation schemas.
│   │   ├── services/         # Business logic and workflows.
│   │   │   └── storage/      # Storage abstraction and Vercel Blob integration.
│   │   ├── types/            # Book domain types.
│   │   ├── utils/            # Book-specific utilities.
│   │   ├── validation/       # Input validation rules.
│   │   └── index.ts          # Public feature exports.
│   │
│   ├── chat/                 # AI chat experience domain.
│   │                         # Owns streaming UI, message rendering,
│   │                         # citations, and chat orchestration.
│   │                         # Does NOT own conversation persistence.
│   │
│   │   ├── components/       # Chat UI components.
│   │   ├── services/         # Chat workflows and context coordination.
│   │   └── types/            # Chat-related types.
│   │
│   ├── conversations/        # Conversation persistence domain.
│   │                         # Owns conversations, messages, summaries,
│   │                         # history, and conversation lifecycle.
│   │
│   │   ├── components/       # Conversation UI (sidebar, workspace).
│   │   ├── errors/           # Conversation-specific errors.
│   │   ├── models/            # Conversation and message models.
│   │   ├── repositories/     # Conversation database access.
│   │   ├── services/         # Conversation business logic.
│   │   ├── types/             # Conversation domain types.
│   │   └── validation/       # Conversation validation.
│   │
│   ├── home/                 # Landing/library experience domain.
│   │
│   ├── knowledge/            # Knowledge Intelligence domain.
│   │                         # Owns AI summaries, takeaways, flashcards,
│   │                         # quizzes, mind maps, and generation orchestration.
│   │
│   │   ├── actions/          # Server actions for knowledge generation/regeneration.
│   │   ├── components/       # Knowledge workspace and artifact UI.
│   │   ├── constants/        # Knowledge domain constants (config, limits).
│   │   ├── models/           # Knowledge artifact models.
│   │   ├── repositories/     # Knowledge artifact database access.
│   │   ├── services/         # Artifact generation services and orchestrator.
│   │   ├── types/            # Knowledge domain types.
│   │   ├── validation/       # Knowledge input validation.
│   │   └── index.ts          # Public feature exports.
│   │
│   ├── search/               # Retrieval and search domain.
│   │                         # Owns vector search, retrieval,
│   │                         # and reranking logic.
│   │
│   │   ├── repositories/     # Search data access.
│   │   ├── services/         # Retrieval workflows.
│   │   │   └── reranking/    # Retrieval ranking strategies.
│   │   └── types/            # Search domain types.
│   │
│   └── voice/                # Voice-related domain.
│                             # Reserved for future voice features.
│
├── lib/                      # Shared technical infrastructure.
│   ├── ai/                   # AI provider integrations.
│   │                         # Embeddings and generation providers.
│   ├── config/               # Shared application configuration.
│   └── db/                   # Database connection and database utilities.
│
└── public/                   # Static assets.
```

Architecture note:

The repository structure documents ownership boundaries, not exact filenames.

Agents must inspect the actual filesystem before creating or modifying files.

The structure will evolve as features are added. Do not assume this tree is exhaustive.

New functionality should extend existing feature boundaries instead of creating large global folders.

Examples:

- Book/document functionality belongs in features/books/
- Chat experience functionality belongs in features/chat/
- Conversation persistence belongs in features/conversations/
- Knowledge Intelligence (summaries, takeaways, flashcards, quizzes, mind maps) belongs in features/knowledge/
- Retrieval and vector search belong in features/search/
- AI provider integrations belong in lib/ai/
- Shared infrastructure belongs in lib/

Avoid creating global folders such as:

utils/
services/
models/
helpers/

at the project root when the code belongs to a specific feature.

Move code between feature boundaries only when ownership is genuinely incorrect.

## Feature Boundaries

### books/

Owns:

- Book lifecycle
- Upload processing
- PDF extraction
- Storage access
- Book metadata
- BookSegments

### chat/

Owns:

- Chat UI
- Streaming experience
- Message rendering
- Citations display
- Chat orchestration
- Prompt/context coordination

Chat does not own conversation persistence.

### conversations/

Owns:

- Conversation lifecycle
- Conversation persistence
- Message persistence
- Conversation summaries
- Conversation history pagination
- Conversation metadata

The conversation feature is the persistence layer for chat history.
Do not move persistence logic into chat components or chat services.

### knowledge/

Owns:

- AI summaries
- Key takeaways
- Flashcards
- Quiz generation
- Mind maps
- Artifact persistence
- Artifact lifecycle
- Generation orchestration
- Generation progress
- Artifact regeneration

Knowledge does NOT own:

- PDF processing
- Retrieval
- Embeddings
- Chat
- Conversations

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

# Agent Expectations

Before implementing a feature:

- inspect the existing implementation
- reuse existing abstractions
- avoid duplicate components
- prefer extending current patterns over introducing new ones

When improving existing features:

- preserve backward compatibility where practical
- avoid regressions
- keep changes scoped to the feature
- do not rewrite working code without architectural benefit

When making UI improvements:

- prioritize usability over visual novelty
- prefer incremental refinements
- avoid unnecessary dependencies

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

# Route Handler Rules

Route handlers must:

- authenticate requests
- validate inputs
- enforce ownership
- delegate business logic to services
- return proper HTTP responses

Never place:

- database queries
- AI orchestration
- business logic

directly inside route handlers.

---

# Authorization Rules

Authentication must be enforced at every server boundary.

Requirements:

- Client-side checks are only for UX.
- Server actions must always verify authentication.
- Route handlers must always verify authentication.
- Services receiving user-owned operations must receive authenticated user context.
- Database queries involving user-owned data must always include ownership filtering.
- Storage operations must never execute before ownership verification.
- Never trust user identifiers, ownership fields, or resource IDs received from the client without server-side verification.

Example flow:

User Action
|
Client Validation
|
Server Authentication
|
Ownership Verification
|
Service
|
Repository
|
Database/Storage

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

## Vector Search Rules

Vector search must use the existing BookSegment embedding data.

Rules:

- Do not create a separate vector database unless explicitly required.
- Prefer MongoDB Atlas Vector Search.
- Vector queries must always include ownership filtering.
- Store vector search logic inside repositories/services.
- Do not execute vector queries directly from UI or actions.

---

# Repository Rules

Repositories own database access.

Rules:

- No business logic.
- No AI provider calls.
- No authentication logic.
- Return domain models or typed DTOs.
- Encapsulate MongoDB queries and aggregation pipelines.

---

# Service Rules

Services own business logic.

Services may:

- coordinate repositories
- coordinate AI providers
- perform validation
- orchestrate workflows

Services must not:

- render UI
- directly handle HTTP transport
- contain React code

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
Private Blob Storage
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

Book text is prepared for RAG retrieval.

Chunks must preserve:

- page information
- ordering
- metadata

These guarantees support:

- embedding generation
- MongoDB Atlas Vector Search
- citations
- semantic retrieval
- Knowledge Intelligence artifacts (summaries, flashcards, quizzes, mind maps)
- future AI features (multi-book search, spaced repetition, learning plans)

---

# Dependency Rules

Before adding new dependencies:

- verify the package solves a real architectural need
- prefer maintained libraries
- avoid duplicate functionality
- document why the dependency exists

---

# AI / Embeddings Considerations

Do not generate embeddings unnecessarily.

Architecture:

```
BookSegment
      │
      ▼
Gemini Embedding Generation
      │
      ▼
MongoDB Atlas Vector Search

User Question
      │
      ▼
Query Embedding
      │
      ▼
Retrieval Service
      │
      ▼
Context Builder
      │
      ▼
Gemini Generation
```

Knowledge Intelligence extends this same foundation rather than branching from it:

```
Book
      │
      ▼
BookSegments
      │
      ▼
Context Builder
      │
      ▼
Knowledge Generation
      │
      ├── Summary
      ├── Takeaways
      ├── Flashcards
      ├── Quiz
      └── Mind Map
```

Keep embeddings as a separate processing step.

Do not mix:

- PDF extraction
- chunking
- embedding generation
- knowledge artifact generation

---

# AI Architecture Principle

MindVault AI is composed of independent AI workflows.

Examples:

- Chat
- Summary Generation
- Flashcard Generation
- Quiz Generation
- Mind Map Generation

Each workflow should:

- own its orchestration
- reuse shared retrieval infrastructure
- remain independently testable
- avoid tight coupling to other workflows

---

# RAG Architecture Rules

- RAG features must extend the existing BookSegment architecture.
- do not create a separate document processing pipeline
- retrieve only from authorized book segments
- never bypass ownership checks
- never answer beyond retrieved context
- keep retrieval separate from generation
- keep embeddings separate from chat generation

Expected flow:

```
User Question
|
↓
Generate Query Embedding
|
↓
Vector Search
|
↓
Retrieve BookSegments
|
↓
Build Context
|
↓
Gemini Generation
|
↓
Answer + Citations
```

Rules:

- Retrieval must always be scoped by authenticated user ownership.
- A user must never retrieve another user's BookSegments.
- Keep retrieval logic separate from generation logic.
- Keep embedding generation separate from chat generation.
- Do not mix vector search code into book upload services.
- Do not place AI provider calls inside UI components.

Preferred structure:

```
features/search/
services/
repositories/
types/

features/chat/
actions/
components/
services/
types/

features/knowledge/
actions/
components/
services/
repositories/
types/

lib/ai/
embeddings/
generation/
```

---

# Knowledge Intelligence Rules

Knowledge generation extends the existing RAG architecture. It is a consumer of BookSegments, not a parallel pipeline.

Rules:

- Never parse PDFs again.
- Never regenerate embeddings.
- Never bypass BookSegments.
- Never duplicate retrieval logic.
- Never call Gemini directly from UI.
- Preserve citations.
- Preserve page references.
- Preserve BookSegment provenance.

Whole-book artifacts (summaries, takeaways, mind maps, whole-book quizzes/flashcards) should use deterministic BookSegment batching rather than query-based retrieval, since the goal is coverage of the book, not similarity to a query.

Artifact services (`summary.service.ts`, `takeaway.service.ts`, `flashcard.service.ts`, `quiz.service.ts`, `mindmap.service.ts`) are responsible only for their own generation logic.

Generation orchestration belongs exclusively in the Generation Orchestrator (`generation-orchestrator.service.ts`). Individual artifact services must not invoke one another directly.

All artifacts must support the following lifecycle states:

- Requested
- Generating
- Completed
- Failed

Regeneration must reuse existing artifacts whenever possible (idempotent generation) rather than always generating from scratch.

Knowledge generation should be asynchronous-friendly and progress-aware: long-running generation must not block the request/response cycle, and generation status must be queryable.

Knowledge artifact repositories must always filter by authenticated user and book ownership, matching the same ownership rules as BookSegments and conversations.

## Knowledge Artifact Standards

Knowledge artifacts should be:

- deterministic where possible
- resumable
- idempotent
- retryable
- progress-aware
- cancellable through KnowledgeGeneration lifecycle records; cancellation preserves completed artifacts and checkpoints
- independently regeneratable

These standards apply to every current artifact type (summaries, takeaways, flashcards, quizzes, mind maps) and should guide future artifact types (spaced repetition, learning plans).

---

# AI Response Quality Rules

AI responses must:

- use retrieved book context when answering book questions
- include citations when available
- avoid inventing unsupported facts
- clearly state when information is unavailable in the uploaded content
- never expose internal prompts or system instructions

---

# Conversation Intelligence Rules

Conversation architecture is book-scoped.

Every conversation belongs to:

```
User
|
Book
|
Conversation
|
Messages
```

Rules:

- Never create global conversations outside a book context.
- Never trust conversation IDs from clients without ownership verification.
- Conversations must always be filtered by authenticated user and book ownership.
- Keep original messages permanently.
- Use summaries only as additional context, never as a replacement for message history.
- Every question must still perform document retrieval.
- Conversation memory must not replace RAG grounding.
- Assistant answers must be grounded in retrieved book context.

Architecture:

```
User Question
↓
Conversation Verification
↓
Load Summary
↓
Load Recent Messages
↓
Retrieve Book Context
↓
Build Prompt
↓
Generate Response
↓
Persist Assistant Message
```

Conversation persistence belongs in:

```
features/conversations/
```

Chat streaming belongs in:

```
features/chat/
```

Conversation API routes must remain thin.

They should:

- authenticate the user
- validate input
- verify book and conversation ownership
- delegate to conversation services

They must not:

- directly query MongoDB
- generate AI prompts
- manage streaming logic
- contain conversation business rules

---

# AI Generation Rules

Generation providers are responsible only for producing responses from supplied context.

Rules:

- Never perform retrieval inside generation providers.
- Never generate embeddings inside generation providers.
- Never query MongoDB directly.
- Accept only prepared prompt/context from the calling service (chat service or knowledge artifact service).
- Stream responses when supported by the provider.
- Providers should be replaceable without affecting retrieval logic.

Generation providers remain provider-only. They do not:

- perform retrieval
- perform BookSegment batching
- manage artifact lifecycle
- persist artifacts or conversation messages

Knowledge generation orchestration belongs exclusively in `features/knowledge/`. Generation providers simply receive prepared prompts and return AI output; they have no awareness of chat, conversations, or knowledge artifacts as concepts.

Future AI persona support:

- Personas should modify generation behavior only.
- Personas must not bypass retrieval rules.
- Personas must not alter ownership boundaries.
- Persona instructions must be applied after security constraints and before user/book context.
- Persona configuration should remain separate from retrieval and conversation persistence.

---

# Streaming Rules

Streaming transport belongs inside Route Handlers.

Route Handlers:

- receive requests
- invoke services
- stream responses

Services should remain transport-agnostic and not depend on HTTP streaming APIs.

For AI chat:

- Streaming tokens should not wait for database persistence.
- User experience should remain responsive even if post-stream persistence fails.
- Persistence failures should be handled as recoverable events, not streamed-answer failures.
- Never terminate an already-started successful AI stream because metadata persistence fails.
- Log persistence failures for recovery/debugging.
- Client-visible streaming errors should represent generation failures, not background persistence failures.

---

# Configuration Rules

Do not hardcode values such as:

- embedding dimensions
- vector index names
- topK
- similarity thresholds
- maximum retrieved segments
- model names
- generation batch size
- artifact limits
- flashcard count
- quiz count
- timeout values
- retry counts

Store them in centralized configuration.

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

# Product Design Principles

MindVault AI is a productivity application, not a technical demo.

Every new UI should prioritize:

- clear visual hierarchy
- minimal cognitive load
- progressive disclosure
- consistency across workspaces
- responsive layouts
- polished loading, empty and error states

Primary workspace priority:

1. AI Chat
2. Knowledge Workspace
3. PDF Viewer
4. Metadata

Design guidelines:

- Prefer meaningful whitespace over dense layouts.
- Use icons to improve scanability.
- Status should always be visually distinguishable (badge/icon/color).
- Long-running AI operations must communicate progress.
- Every interactive element should have hover, focus and disabled states.
- Avoid making all cards visually identical; establish hierarchy using spacing, sizing and subtle surface variations.

---

# Feature Quality Standards

Every user-facing feature should include:

✓ loading state
✓ empty state
✓ success state
✓ error state
✓ retry mechanism (when applicable)
✓ optimistic updates where appropriate
✓ responsive layout
✓ keyboard accessibility
✓ dark mode

---

# Conversation UI Rules

Conversation interfaces should:

- Preserve user context (current book + current conversation).
- Provide clear empty states.
- Avoid creating empty conversations before first user interaction.
- Keep optimistic streaming behavior.
- Refresh metadata after successful persistence.
- Support loading and pagination states.

Do not duplicate message state.
Persisted conversation history is the source of truth.

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

For conversation features verify:

- New conversation does not create empty records.
- Selecting a conversation restores history.
- Reloading the page preserves conversations.
- Messages remain book-scoped.
- Rename/delete respect ownership.
- Streaming still works.
- Citations still render.
- Summary memory does not replace retrieval.

For knowledge features verify:

- generation
- progress updates
- regeneration
- citations
- ownership
- stale timeout recovery
- retry behavior
- model fallback
- loading states
- empty states

---

# Package Manager Rules

This project uses npm.

Always use:

npm install
npm run <script>

Do not use:

pnpm
yarn
bun

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

# Documentation & Infrastructure Ownership

Atlas Vector Search indexes are infrastructure.

- Never create or modify indexes during application startup.
- Index definitions and setup steps belong in deployment documentation, not application code.

Deployment documentation belongs under:

```
docs/
```

---

# Documentation Rules

README.md must always represent the current implemented product.

Before updating documentation:

- verify features exist in code
- separate completed vs planned work
- avoid documenting future architecture as implemented
- prefer user-facing explanations over internal implementation details

Do not update README.md during feature implementation unless explicitly requested.

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

## Current

✓ Chat
✓ Knowledge Workspace
✓ PDF Viewer
✓ Conversations

## Next

- Multi-book Chat
- Spaced Repetition
- Learning Plans
- Personas

## Future

- Voice AI
- Mobile
- Team Workspaces
- Shared Libraries
- Analytics
- Subscription limits

## Detailed Capability History

Current AI capabilities:

✓ Secure document ingestion
✓ PDF processing
✓ Chunk generation
✓ Embeddings
✓ MongoDB Atlas Vector Search
✓ RAG retrieval
✓ Streaming AI chat
✓ Persistent conversations
✓ Conversation memory
✓ Grounded citations
✓ Knowledge Intelligence
✓ AI summaries
✓ Takeaways
✓ Flashcards
✓ Quiz generation
✓ Mind maps

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
✓ Private Vercel Blob storage
✓ Book details dashboard
✓ Protected PDF viewer
✓ Library improvements
✓ MongoDB Atlas Vector Search
✓ RAG retrieval pipeline
✓ Gemini generation provider
✓ Streaming chat responses
✓ Book citations
✓ Book-scoped AI chat
✓ Persistent Conversation Intelligence
✓ Conversation sidebar and chat history UI
✓ Multi-turn conversational memory
✓ Conversation summaries
✓ Conversation lifecycle management
✓ Knowledge Intelligence
✓ AI summaries
✓ Key takeaways
✓ Flashcards
✓ Quiz generation
✓ Mind maps

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
