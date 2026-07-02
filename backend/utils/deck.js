// ──────────────────────────────────────────────
// Deck & room-code utility helpers
// ──────────────────────────────────────────────

/**
 * Generate a random 4-character alphanumeric room code.
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Build a full 52-card deck.
 */
export function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];

  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      const rank = ranks[i];
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: i + 1,
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates in-place shuffle.
 */
export function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
