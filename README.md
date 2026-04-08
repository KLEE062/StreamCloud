🎙️ Streaming Service

A dedicated microservice for streaming audio files to the frontend. Handles range requests so audio can be seeked without downloading the full file.

---

## 🗂️ Folder Structure

```
src/
├── controllers/       # Stream request handlers
├── routes/            # Route definitions (e.g. /stream/:songId)
├── services/          # Streaming logic, file lookup
└── utils/             # Helpers (e.g. parse range headers)
storage/               # Local audio files (or cloud storage links)
app.js                 # Express app
```

---

## ⚙️ Setup

```bash
npm install
npm run dev
```

Service runs at **http://localhost:5001**

---

## 🔧 Environment Variables

```env
PORT=5001
STORAGE_PATH=./storage
BACKEND_API_URL=http://localhost:5000
```

---

## 📡 API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/stream/:songId` | Stream audio for a song |
| GET | `/health` | Health check |

---

## 🔊 How Streaming Works

1. Frontend requests `/stream/:songId`
2. Service looks up the file path (from local storage or cloud)
3. Reads the HTTP `Range` header from the request
4. Returns a `206 Partial Content` response with the correct byte range
5. Browser's `<audio>` element plays and seeks using these ranges

This allows the audio to start playing immediately without waiting for the full file to download.

---

## 📁 Audio Storage

For local development, put `.mp3` files in the `storage/` folder. For production, configure cloud storage (AWS S3, Cloudinary, etc.) via environment variables.

---

## 🛠️ Tech Stack

- Node.js + Express
- HTTP Range Requests (RFC 7233)
- Local filesystem or cloud storage (S3, Cloudinary)
