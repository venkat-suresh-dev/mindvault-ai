<p align="center">
  <img src="./images/branding/mindvault-banner.png" alt="MindVault AI — AI knowledge companion for books and documents" />
</p>

<h1 align="center">MindVault AI</h1>

<p align="center">
  Your personal AI knowledge companion for books and documents.
</p>

<p align="center">
  Upload your knowledge. Ask questions. Get grounded AI answers from your own content.
</p>

## Overview

**A private, AI-powered knowledge workspace for the books and documents that matter to you.**

MindVault AI turns uploaded PDFs into a searchable personal library. Users can upload books privately, open a protected book details dashboard, chat with grounded AI responses, and keep persistent conversation history tied to each book.

## Features

- Clerk-based user authentication
- Private PDF and book uploads
- Ownership-isolated document access
- PDF processing, text extraction, and chunking
- BookSegment storage for retrieval-ready document segments
- Gemini embedding generation
- MongoDB Atlas Vector Search over existing BookSegment embeddings
- Book-scoped Retrieval Augmented Generation (RAG)
- Streaming AI responses with citations
- Persistent, book-scoped conversations
- Conversation sidebar with create, select, rename, and delete actions
- Protected in-app PDF viewing
- Book details dashboard
- Light, dark, and system theme support

## How It Works

```text
Upload document
  -> Private storage
  -> PDF processing
  -> Text chunking
  -> Embedding preparation
  -> MongoDB Atlas Vector Search
  -> Relevant context retrieval
  -> Gemini generation
  -> Answer with citations
```

Uploaded documents stay private. Access is controlled through Clerk authentication and server-side ownership checks before document files, book metadata, or vector-search results are returned.

## Conversation Intelligence

Conversation features are implemented and book-scoped. Each conversation belongs to a user and a selected book, and chat history persists after page reloads.

Implemented conversation capabilities:

- Persistent conversations
- Book-scoped conversation history
- Conversation sidebar
- Create, select, rename, and delete conversations
- Message persistence
- Multi-turn conversations
- Conversation summaries
- Bounded conversation memory
- Recent-message context
- Persistent chat history after reload
- Retrieval on every question

User-level flow:

```text
User Question
  ->
Conversation Context Loaded
  ->
Relevant Book Content Retrieved
  ->
Grounded Prompt Created
  ->
Gemini Streaming Response
  ->
Conversation History Saved
```

Conversation memory supports continuity, but it does not replace retrieval. Every question still performs document grounding against the selected book.

## Technology Stack

| Category       | Technologies                                                           |
| -------------- | ---------------------------------------------------------------------- |
| Frontend       | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui   |
| Authentication | Clerk                                                                  |
| Database       | MongoDB Atlas, Mongoose                                                |
| Storage        | Vercel Blob private storage                                            |
| AI             | Gemini embeddings, Gemini generation, MongoDB Atlas Vector Search, RAG |

## Architecture

MindVault AI follows a feature-first architecture. Each domain owns its components, services, types, repositories, and related data access patterns. `app/` is reserved for routing and page composition, while shared technical infrastructure lives under `lib/`.

```text
app/
  Routing and page composition

features/
  books/
    Book lifecycle
    Upload processing
    Document management

  chat/
    Chat interface
    Streaming responses
    Message rendering
    Citations

  conversations/
    Conversation persistence
    Message history
    Summaries
    Conversation lifecycle

  search/
    Retrieval
    Vector search
    Reranking

lib/
  Database infrastructure
  AI providers
  Configuration
  Shared utilities
```

### System Flow

```mermaid
flowchart TD
  A["User asks a question"] --> B["Authenticate request"]
  B --> C["Verify book ownership"]
  C --> D["Load conversation context"]
  D --> E["Retrieve relevant book content"]
  E --> F["Build grounded AI prompt"]
  F --> G["Gemini streaming response"]
  G --> H["Answer + citations"]
  G --> I["Persist conversation history"]
```

### Security and Authorization Flow

```mermaid
flowchart TD
  A["User Request"] --> B["Clerk Authentication"]
  B --> C["Verify Book Ownership"]
  C --> D["Verify Conversation Ownership"]
  D --> E["Access Messages"]
  E --> F["MongoDB Repository Layer"]
```

This ownership model keeps private data isolated. Authentication happens first, then ownership is verified before any protected content is accessed.

### RAG Pipeline

```mermaid
flowchart TD
  A["Upload Book"] --> B["PDF Processing"]
  B --> C["Text Chunking"]
  C --> D["Generate Embeddings"]
  D --> E["MongoDB Atlas Vector Search"]

  F["User Question"] --> G["Retrieve Relevant Segments"]
  G --> H["Context Assembly"]
  H --> I["Gemini Response"]
  I --> J["Answer + Citations"]
```

The knowledge pipeline is book-scoped and uses the existing BookSegment embeddings. AI providers receive prepared context and do not query the database directly.

## RAG Architecture

The retrieval and generation flow is intentionally separated:

1. Book upload and PDF processing prepare the source text.
2. Text is chunked into BookSegments that preserve page and ordering metadata.
3. Embeddings are generated for those segments.
4. Retrieval uses MongoDB Atlas Vector Search against the stored BookSegment embeddings.
5. Ownership checks run before any private document data is accessed.
6. Gemini receives curated context and generates the response stream.
7. Citations are attached to the answer so users can trace the source material.

This keeps retrieval grounded, book-scoped, and independent from generation.

## User Experience

The current interface includes:

- A library experience for browsing uploaded books
- A book details page with status, metadata, and a protected PDF viewer
- A chat experience for asking questions about a selected book
- A persistent conversation sidebar for switching between threads
- Conversation history that survives page reloads

Existing screenshots:

### Home

![Home](images/screenshots/Home.jpeg)

### Add a Book

![Add New](images/screenshots/Add%20New.jpeg)

### Book Details

![Book Details](images/screenshots/Book%20Details.jpeg)

### Dark Mode

![Dark Mode](images/screenshots/Dark%20Mode.jpeg)

## Security and Privacy

Documents are private and owned by individual users. Clerk authentication and server-side ownership checks are enforced before protected files, books, conversations, or vector-search results are returned. Vercel Blob credentials remain server-side, and blob keys are stored in MongoDB rather than treated as public access URLs.

## Development Setup

### Prerequisites

- Node.js
- A MongoDB Atlas account and database
- A Clerk application
- A Gemini API key
- A Vercel Blob store configured for private document storage

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file and configure the required values:

```env
# MongoDB Atlas database connection string
MONGODB_URI=

# Clerk authentication
# Public key used by the frontend
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Secret key used for server-side authentication
CLERK_SECRET_KEY=

# Google Gemini API key for embeddings and AI generation
GOOGLE_GEMINI_API_KEY=

# Vercel Blob private storage access token
BLOB_READ_WRITE_TOKEN=
```

- Do not commit any credentials.
- Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Keep all other keys server-side.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Roadmap

### Completed

- Authentication
- Book uploads
- PDF processing
- Private storage
- Protected document access
- Vector search
- RAG chat
- Streaming responses
- Citations
- Conversation Intelligence
- Conversation UI
- Book details dashboard
- Library experience
- Persistent conversation history

### Planned

- Multi-book search
- AI personas / customizable assistant behavior
- Flashcards
- Quiz generation
- Mind maps
- Voice conversations
- Subscription limits
- Analytics

## Engineering Principles

MindVault AI is built with SOLID principles, strict TypeScript, clean architecture, and a production-focused approach to privacy, maintainability, and scale.
