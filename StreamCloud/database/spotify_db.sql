 -- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs table
CREATE TABLE songs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100),
    artist VARCHAR(100),
    album VARCHAR(100),
    duration INT,
    plays INT DEFAULT 0
);

-- Playlists table
CREATE TABLE playlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Playlist_songs junction table
CREATE TABLE playlist_songs (
    playlist_id INT,
    song_id INT,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
);
