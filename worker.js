// Cloudflare Worker — Times Tables high score API
// KV binding: SCORES

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const MAX_SCORES = 10;
const KV_KEY = 'high-scores';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/scores' && request.method === 'GET') {
      return getScores(env);
    }

    if (url.pathname === '/api/scores' && request.method === 'POST') {
      return addScore(request, env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};

async function getScores(env) {
  const data = await env.SCORES.get(KV_KEY, 'json');
  const scores = data || [];
  return new Response(JSON.stringify(scores), { headers: CORS_HEADERS });
}

async function addScore(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const { name, initials, score } = body;
  const playerName = (name || initials || '').toString().trim().substring(0, 15);

  if (!playerName) {
    return new Response(JSON.stringify({ error: 'Invalid name' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }
  if (typeof score !== 'number' || score < 0 || score > 100000) {
    return new Response(JSON.stringify({ error: 'Invalid score' }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const data = await env.SCORES.get(KV_KEY, 'json');
  const scores = data || [];

  const questions = typeof body.questions === 'number' ? body.questions : null;
  const tables = Array.isArray(body.tables) ? body.tables.map(Number).filter(n => n >= 2 && n <= 12) : null;

  const now = new Date();
  scores.push({
    name: playerName,
    score: Math.round(score),
    questions,
    tables,
    date: `${now.getDate()}/${now.getMonth() + 1}`,
    ts: now.getTime(),
  });

  scores.sort((a, b) => b.score - a.score);
  if (scores.length > MAX_SCORES) scores.length = MAX_SCORES;

  await env.SCORES.put(KV_KEY, JSON.stringify(scores));

  return new Response(JSON.stringify(scores), { headers: CORS_HEADERS });
}
