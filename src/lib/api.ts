/*
 *  ###################
 *  #                 #
 *  #   #####         #
 *  #        ######   #
 *  #        ##       #
 *  #        ##       #
 *  #        ##       #
 *  #        ##       #
 *  #                 #
 *  ###################
 *
 * Faculty of Information Technologies
 * Brno University of Technology
 * User Interface Programming (ITU)
 *
 * File: src/lib/api.ts
 *
 * Description:
 *  Thin API client for communication with the Scrabble backend.
 *  This file contains small functions in the style of “1 endpoint = 1 function”, which:
 *   - compose URLs based on BASE and parameters (gid, pnum, query string)
 *   - call fetch()
 *   - handle HTTP errors (r.ok) and throw an Error with the response text on failure
 *   - return typed data (Promise<...Resp>) according to types in `@/types/api`
 *
 *  Motivation:
 *   - separate network communication from UI components and the store
 *   - have unified error handling (throw Error) that can be easily caught in the store
 *   - keep URL and type consistency in a single place
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

// src/lib/api.ts

/*
 * Backend BASE URL:
 *  - in production / deployment it is set via NEXT_PUBLIC_API_URL
 *  - locally it falls back to Flask running on 127.0.0.1:5000
 *
 * Note: The NEXT_PUBLIC_ prefix means the variable is also available on the client.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

/*
 * Create a new game.
 * The backend creates a game_id and initializes the game state
 * for the given number of players.
 */
export async function newGame(players = 2): Promise<{ game_id: string }> {
  const r = await fetch(`${BASE}/new-game?players=${players}`, {
    // no-store: we do not want to cache results, because the game state changes.
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/*
 * Load the current board for a given game.
 * Returns a matrix/structure representing letters on the board.
 */
export async function getBoard(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/board`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').BoardResp>;
}

/*
 * Number of players in the given game (useful during load,
 * so we know how many player panels and racks to expect).
 */
export async function getNumPlayers(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/number-of-players`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').NumPlayersResp>;
}

/*
 * Determine which player is currently on turn.
 * The store uses this to highlight the active player in the UI
 * and to display the correct rack.
 */
export async function getCurrentPlayer(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/current-player`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').CurrentPlayerResp>;
}

/*
 * Load the hand (rack) of a specific player.
 * pnum = player index (0-based, according to the backend).
 */
export async function getHand(gid: string, pnum: number) {
  const r = await fetch(`${BASE}/g/${gid}/p/${pnum}/hand`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').PlayersHandResp>;
}

/*
 * Place a word on the board:
 *  - x, y are the start coordinates
 *  - w is the word
 *  - d is the direction (row/col)
 *
 * Note: encodeURIComponent is required so the word in the query string
 * does not break the URL (e.g. if special characters ever appear).
 */
export async function placeWord(
  gid: string,
  x: number,
  y: number,
  w: string,
  d: 'row' | 'col',
) {
  const url = `${BASE}/g/${gid}/place-word?x=${x}&y=${y}&w=${encodeURIComponent(
    w,
  )}&d=${d}`;
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) throw new Error(await r.text());

  /*
   * The backend returns a unified structure with result
   * and optionally error_description.
   * The store maps this to UI errors and possible state refreshes.
   */
  return r.json() as Promise<{
    result: 'ok' | 'failed';
    error_description?: string;
  }>;
}

/*
 * Layout of bonus squares on the board (TW/DW/TL/DL etc.).
 * Used for colors and labels on empty board squares.
 */
export async function getBoardLayout() {
  const r = await fetch(`${BASE}/board-layout`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').BoardLayoutResp>;
}

/*
 * Points of all players in a single response.
 * Useful for refreshing scores without N separate requests.
 */
export async function getAllPlayerPoints(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/player-points`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').PlayerPointsAllResp>;
}

/*
 * Points of a single specific player (alternative to the bulk endpoint).
 */
export async function getPlayerPoints(gid: string, pnum: number) {
  const r = await fetch(`${BASE}/g/${gid}/p/${pnum}/points`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').PlayerPointsResp>;
}

/*
 * Letter point values (A=1, B=3, ...).
 * Used to render the number on tiles in the rack and on the board.
 */
export async function getLetterValues() {
  const r = await fetch(`${BASE}/letter-values`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').LetterValuesResp>;
}

// ---- nicknames ----

/*
 * Load player nicknames from the backend.
 * (In the project you additionally use localStorage for UX,
 * but this endpoint is useful for sharing state.)
 */
export async function getPlayerNicknames(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/player-nicknames`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').PlayerNicknamesResp>;
}

/*
 * Set the nickname of a single player.
 * The nickname is passed in the query string, therefore encodeURIComponent is used.
 */
export async function setPlayerNickname(
  gid: string,
  pnum: number,
  nickname: string,
) {
  const url = `${BASE}/g/${gid}/p/${pnum}/set-nickname?n=${encodeURIComponent(
    nickname,
  )}`;
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').SetNicknameResp>;
}

// ---- replace letters ----

/*
 * Letter exchange:
 *  - letters is a string of selected letters (e.g. "AEI")
 *  - the backend performs the replacement and returns ok/failed
 */
export async function replaceLetters(
  gid: string,
  letters: string,
): Promise<{ result: 'ok' | 'failed'; error_description?: string | null }> {
  const url = `${BASE}/g/${gid}/replace-letters?letters=${encodeURIComponent(
    letters,
  )}`;
  const r = await fetch(url, { method: 'POST' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ---- skip turn ----

/*
 * Skip the turn.
 * Used if the player does not want to or cannot place a word.
 */
export async function skipTurn(
  gid: string,
): Promise<{ result: 'ok' | 'failed'; error_description?: string | null }> {
  const r = await fetch(`${BASE}/g/${gid}/skip-turn`, { method: 'POST' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ---- log / history ----

/*
 * Move / event history.
 * The UI displays it in MoveHistory (table).
 */
export async function getLog(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/log`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').LogResp>;
}
