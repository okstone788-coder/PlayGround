// Shared content for the Pumpkin Wish Parlor.

export const PALETTES = {
  ember: { name: 'Ember', body: '#ff8a2e', dark: '#a3440c', accent: '#ffc07a', swatch: '#ff8f3a' },
  butter: { name: 'Buttercream', body: '#ffd884', dark: '#b8842b', accent: '#fff0bf', swatch: '#ffdd8f' },
  blush: { name: 'Rose', body: '#ff9fb8', dark: '#b34f70', accent: '#ffd6e2', swatch: '#ffa7be' },
  lilac: { name: 'Lilac', body: '#b795ff', dark: '#6240b0', accent: '#e6d9ff', swatch: '#bd9dff' },
  mint: { name: 'Mint', body: '#83e2bd', dark: '#2f8a6b', accent: '#d4fcec', swatch: '#8ce7c4' },
  ash: { name: 'Ash', body: '#9896b1', dark: '#474560', accent: '#dedcef', swatch: '#9c9ab7' },
};

export const FACES = {
  happy: { name: 'Happy', glow: '#ffa11f', blurb: 'big sparkly smiles' },
  sleepy: { name: 'Sleepy', glow: '#ff9a2e', blurb: 'soft little yawns' },
  wink: { name: 'Wink', glow: '#ffb300', blurb: 'a cheeky little glow' },
  cat: { name: 'Kitty', glow: '#ffc233', blurb: 'purrfectly mysterious' },
  spooky: { name: 'Spooky', glow: '#63ffb0', blurb: 'a classic green fright' },
};

export const ACCESSORIES = {
  none: { name: 'Bare', icon: '✦' },
  witch: { name: 'Witch Hat', icon: '🧙' },
  bow: { name: 'Big Bow', icon: '🎀' },
  crown: { name: 'Bloom Crown', icon: '👑' },
  ears: { name: 'Kitty Ears', icon: '🐱' },
  wings: { name: 'Bat Wings', icon: '🦇' },
};

export const RUSH_ACCESSORIES = ['witch', 'bow', 'crown', 'ears', 'wings'];

export const STAMPS = {
  star: { name: 'Star', icon: '⭐', color: '#ffe27a', glow: '#ffcf3d' },
  heart: { name: 'Heart', icon: '💗', color: '#ff9ec9', glow: '#ff5fa8' },
  moon: { name: 'Moon', icon: '🌙', color: '#cbb8ff', glow: '#9a7bff' },
  bat: { name: 'Bat', icon: '🦇', color: '#c3b2ff', glow: '#8c6dff' },
  flower: { name: 'Bloom', icon: '🌸', color: '#ffbcd6', glow: '#ff87b8' },
};

export const STAMP_LIMIT = 36;

export const SPIRITS = [
  { name: 'Mochi', color: '#d9f4ff', line: 'Something sleepy and soft, please…' },
  { name: 'Pip', color: '#ffe9bd', line: 'I want the spookiest little lantern!' },
  { name: 'Bun', color: '#ffd9ea', line: 'Make it fancy. Very, very fancy.' },
  { name: 'Nox', color: '#dcd4ff', line: 'A starry friend for my dark porch!' },
  { name: 'Tilly', color: '#d7ffe9', line: 'Surprise me — but make it cute!' },
];

export const COLOR_LINES = {
  ember: 'warm as a hearth',
  butter: 'sweet as candy corn',
  blush: 'soft as a petal',
  lilac: 'dreamy as dusk',
  mint: 'cool as moonmint',
  ash: 'mysterious as fog',
};

export const ALBUM_KEY = 'pumpkin-parlor-best';

export const TIER_LABEL = [
  { min: 5800, rank: 'S', title: 'Moonlight Royalty!', line: 'The spirits are absolutely dazzled. The patch will glow for a year.' },
  { min: 4400, rank: 'A', title: 'Patch favorite!', line: 'Five wishes granted with style. The little spirits are smitten.' },
  { min: 3000, rank: 'B', title: 'Lovely little lantern!', line: 'A few wishes wandered off, but the patch is still glowing.' },
  { min: 0, rank: 'C', title: 'The moon is patient.', line: 'The spirits had fun anyway. One more round? The patch believes in you.' },
];
