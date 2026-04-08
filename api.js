// simple fetch (can improve later)
export const fetchSongs = async () => {
  const res = await fetch("http://localhost:5000/api/songs");
  return res.json();
};
