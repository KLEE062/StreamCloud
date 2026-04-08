🎙️ Streaming Service

A dedicated microservice for streaming audio files to the frontend. Handles range requests so audio can be seeked without downloading the full file.

---

## 🗂️ Folder Structure

```
spotify-clone/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Song.js
│   │   └── Playlist.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── songs.js
│   │   ├── playlists.js
│   │   └── search.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── songController.js
│   │   └── playlistController.js
│   ├── config/
│   │   └── db.js
│   ├── .env
│   └── server.js
├── frontend/
│   ├── css/
│   │   ├── style.css
│   │   ├── player.css
│   │   └── sidebar.css
│   ├── js/
│   │   ├── app.js
│   │   ├── player.js
│   │   ├── api.js
│   │   └── auth.js
│   └── pages/
│       ├── index.html
│       ├── login.html
│       └── playlist.html
├── database/
│   └── spotify_db.sql
├── docs/
│   ├── README.md
│   ├── API_DOCS.md
│   └── TEAM_CONTRIBUTIONS.md
├── .gitignore
└── package.json
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
