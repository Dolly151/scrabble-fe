const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export async function newGame(players = 2): Promise<{ game_id: string }> {
  const r = await fetch(`${BASE}/new-game?players=${players}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getBoard(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/board`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').BoardResp>;
}

export async function getNumPlayers(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/number-of-players`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').NumPlayersResp>;
}

export async function getCurrentPlayer(gid: string) {
  const r = await fetch(`${BASE}/g/${gid}/current-player`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').CurrentPlayerResp>;
}

export async function getHand(gid: string, pnum: number) {
  const r = await fetch(`${BASE}/g/${gid}/p/${pnum}/hand`, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<import('@/types/api').PlayersHandResp>;
}

export async function placeWord(
    gid: string,
    x: number,
    y: number,
    w: string,
    d: 'row' | 'col'
  ) {
    const url = `${BASE}/g/${gid}/place-word?x=${x}&y=${y}&w=${encodeURIComponent(
      w
    )}&d=${d}`;
    const r = await fetch(url, { method: 'POST' });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ result: 'ok' | 'failed'; error_description?: string }>;
  }
  
  export async function getBoardLayout() {
    const r = await fetch(`${BASE}/board-layout`, { cache: 'no-store' });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<import('@/types/api').BoardLayoutResp>;
  }
  