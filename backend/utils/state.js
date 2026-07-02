// ──────────────────────────────────────────────
// Room state serialisation helper
// Strips private card data before broadcasting.
// ──────────────────────────────────────────────

/**
 * Return a sanitised snapshot of a room suitable for sending to all clients.
 * Individual card arrays are never included — only counts and metadata.
 */
export function getCleanRoomState(room) {
  return {
    id: room.id,
    status: room.status,
    settings: room.settings,
    players: room.players.map(p => ({
      id: p.id,
      username: p.username,
      cardCount: p.cards ? p.cards.length : 0,
      isReady: p.isReady,
      isCreator: p.isCreator,
      passed: p.passed,
      disconnected: p.disconnected,
    })),
    chatLog: room.chatLog || [],
    gameState: room.gameState ? {
      turnIndex: room.gameState.turnIndex,
      discardPileCount: room.gameState.discardPile.length,
      lastPlay: room.gameState.lastPlay ? {
        playerId: room.gameState.lastPlay.playerId,
        username: room.players.find(p => p.id === room.gameState.lastPlay.playerId)?.username,
        cardCount: room.gameState.lastPlay.cardCount,
        claimedRank: room.gameState.lastPlay.claimedRank,
      } : null,
      phase: room.gameState.phase,
      winner: room.gameState.winner,
      history: room.gameState.history.slice(-15),
      remainderCards: room.gameState.remainderCards,
      timerLeft: room.gameState.timerLeft,
      challengeResult: room.gameState.challengeResult,
      roundTurnsCount: room.gameState.roundTurnsCount,
      activeRank: room.gameState.activeRank,
    } : null,
  };
}
