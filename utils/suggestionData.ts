export const SUGGESTED_WORDS = [
  "Serendipity", "Ephemeral", "Mellifluous", "Ineffable", "Petrichor", 
  "Limerence", "Sonder", "Opia", "Vellichor", "Eloquence", 
  "Solitude", "Aurora", "Idyllic", "Euphoria", "Ethereal",
  "Resilience", "Ambivalence", "Nostalgia", "Wanderlust", "Quintessential",
  "Ubiquitous", "Vicarious", "Zephyr", "Labyrinth", "Epiphany",
  "Oblivion", "Paradigm", "Alacrity", "Benevolent", "Cacophony"
];

export const getRandomWord = () => {
  const randomIndex = Math.floor(Math.random() * SUGGESTED_WORDS.length);
  return SUGGESTED_WORDS[randomIndex];
};