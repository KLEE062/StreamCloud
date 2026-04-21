import Artist from '../models/Artist.js';

// @desc    Get all artists
// @route   GET /api/artists
// @access  Public
const getArtists = async (req, res) => {
  const artists = await Artist.find({});
  res.json(artists);
};

// @desc    Create an artist
// @route   POST /api/artists
// @access  Private
const createArtist = async (req, res) => {
  const { name, bio, imageUrl } = req.body;

  const artist = new Artist({
    name,
    bio,
    imageUrl,
  });

  const createdArtist = await artist.save();
  res.status(201).json(createdArtist);
};

export { getArtists, createArtist };
