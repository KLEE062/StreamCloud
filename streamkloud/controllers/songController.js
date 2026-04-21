import Song from '../models/Song.js';

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
const getSongs = async (req, res) => {
  const songs = await Song.find({}).populate('uploadedBy', 'name');
  res.json(songs);
};

// @desc    Get song by ID
// @route   GET /api/songs/:id
// @access  Public
const getSongById = async (req, res) => {
  const song = await Song.findById(req.params.id).populate('uploadedBy', 'name');

  if (song) {
    res.json(song);
  } else {
    res.status(404).json({ message: 'Song not found' });
  }
};

// @desc    Create a song
// @route   POST /api/songs
// @access  Private
const createSong = async (req, res) => {
  const { title, artist, url, coverImage, duration } = req.body;

  const song = new Song({
    title,
    artist,
    url,
    coverImage,
    duration,
    uploadedBy: req.user._id,
  });

  const createdSong = await song.save();
  res.status(201).json(createdSong);
};

// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private/Admin
const deleteSong = async (req, res) => {
  const song = await Song.findById(req.params.id);

  if (song) {
    await song.deleteOne();
    res.json({ message: 'Song removed' });
  } else {
    res.status(404).json({ message: 'Song not found' });
  }
};

export { getSongs, getSongById, createSong, deleteSong };
