import Album from '../models/Album.js';

// @desc    Get all albums
// @route   GET /api/albums
// @access  Public
const getAlbums = async (req, res) => {
  const albums = await Album.find({});
  res.json(albums);
};

// @desc    Create an album
// @route   POST /api/albums
// @access  Private
const createAlbum = async (req, res) => {
  const { title, artist, artistId, coverUrl, releaseYear } = req.body;

  const album = new Album({
    title,
    artist,
    artistId,
    coverUrl,
    releaseYear,
  });

  const createdAlbum = await album.save();
  res.status(201).json(createdAlbum);
};

export { getAlbums, createAlbum };
