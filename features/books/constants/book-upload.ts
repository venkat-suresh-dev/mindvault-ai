export const BOOK_UPLOAD_LIMITS = {
  pdfBytes: 50 * 1024 * 1024,
  pdfPages: 2_000,
  coverBytes: 8 * 1024 * 1024,
  title: {
    min: 2,
    max: 160,
  },
  author: {
    min: 2,
    max: 120,
  },
} as const;

export const BOOK_PROCESSING_CONFIG = {
  chunkSizeWords: 500,
  chunkOverlapWords: 50,
} as const;

export const BOOK_SUPPORTED_MIME_TYPES = {
  pdf: ["application/pdf"],
  cover: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const BOOK_UPLOAD_ACCEPT = {
  pdf: {
    "application/pdf": [".pdf"],
  },
  cover: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  },
} as const;

export const BOOK_UPLOAD_FIELD_CONTENT = {
  pdf: {
    label: "PDF source",
    prompt: "Drop your PDF here",
    help: "PDF files up to 50 MB",
    choose: "Choose PDF",
    remove: "Remove selected PDF",
  },
  cover: {
    label: "Book cover",
    title: "Cover image",
    help: "Optional PNG, JPEG, or WEBP image up to 8 MB.",
    choose: "Choose cover",
    replace: "Replace cover",
    remove: "Remove",
  },
  voice: {
    label: "AI voice persona",
    help: "Choose how your book will speak with you.",
  },
  privacy: "Your files stay private to your library.",
} as const;

export const BOOK_PAGE_CONTENT = {
  title: "Add New Book",
  description:
    "Upload a book and transform it into an AI-powered conversation partner for your personal knowledge library.",
  form: {
    title: "Book details",
    description: "Add the source, metadata, and voice that will guide every conversation.",
    submit: "Prepare book for AI",
    authenticationMessage: "Sign in to add books to your personal AI library.",
  },
  help: {
    title: "What happens next",
    items: [
      "Your PDF is securely uploaded to your library.",
      "MindVault extracts and organizes the source material.",
      "Your book becomes ready for search, chat, and voice conversations.",
    ],
  },
} as const;
