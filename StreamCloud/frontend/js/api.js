 const API_URL = 'http://localhost:5000/api';

async function fetchSongs() {
    const response = await fetch(`${API_URL}/songs`);
    return await response.json();
}

async function login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return await response.json();
}

async function createPlaylist(name) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
    });
    return await response.json();
}
