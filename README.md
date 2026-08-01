# 📚 MindVault AI

> AI-powered platform for real-time voice conversations with your books.

Transform static PDFs into interactive voice experiences using AI. Upload books, talk naturally with them using voice, and receive intelligent responses powered by modern LLMs, natural speech synthesis, and conversational AI.

---

## ✨ Features

- 📄 Upload PDF books
- 🎙️ Real-time voice conversations
- 🤖 AI-powered question answering
- 🔊 Natural voice synthesis with ElevenLabs
- 📞 Voice agent integration using Vapi
- 📝 Session transcripts
- 🔐 Secure user authentication
- 📚 Personal library management
- ⚡ Fast and responsive Next.js 16 application

---

## 🛠️ Tech Stack

| Technology   | Purpose                    |
| ------------ | -------------------------- |
| Next.js 16   | Full-stack React framework |
| TypeScript   | Type safety                |
| MongoDB      | Database                   |
| Mongoose     | Database ORM               |
| Vapi         | Voice AI platform          |
| ElevenLabs   | AI voice synthesis         |
| Tailwind CSS | Styling                    |
| Clerk/Auth   | Authentication             |
| PDF Parser   | Text extraction            |

---

## 📁 Project Structure

```
app/
components/          # Global UI, layout, and providers
config/              # Application-wide configuration
features/
  home/              # Homepage-specific components, content, and types
lib/
public/
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/yourusername/mindvault-ai.git
```

### Navigate to the project

```bash
cd mindvault-ai
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file.

```env
MONGODB_URI=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

VAPI_API_KEY=
NEXT_PUBLIC_VAPI_PUBLIC_KEY=

ELEVENLABS_API_KEY=

OPENAI_API_KEY=
```

### Run the development server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🎯 Roadmap

- [x] Authentication
- [x] PDF upload
- [x] PDF text extraction
- [x] Voice conversations
- [x] Session history
- [ ] Multi-document support
- [ ] Retrieval-Augmented Generation (RAG)
- [ ] Semantic search
- [ ] AI Notebook
- [ ] AI Personas
- [ ] Learning analytics
- [ ] Flashcards & quizzes
- [ ] AI Podcast mode

---

## 📸 Screenshots

Coming soon.

---

## 📖 How It Works

1. Upload a PDF book.
2. Extract the document text.
3. Start a voice conversation.
4. AI answers using the uploaded content.
5. View transcripts and revisit conversations.

---

## 📌 Future Improvements

- Multi-document conversations
- Vector search
- Source citations
- Conversation memory
- EPUB & DOCX support
- AI-generated notes
- Study dashboard
- Mobile PWA
- Team collaboration

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

Feel free to open an issue or submit a pull request.

---

## 📄 License

MIT License

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub.
