const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": allowedOrigins.includes("*") ? "*" : origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
  }

  return {
    "Vary": "Origin",
  };
}

function jsonResponse(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      ...getCorsHeaders(request, env),
    },
  });
}

function normalizePath(value) {
  const path = String(value || "").trim();

  if (!path.startsWith("/") || path.length > 500) {
    return "";
  }

  return path;
}

async function getLikeCount(env, path) {
  const row = await env.DB.prepare("SELECT count FROM post_likes WHERE path = ?1")
    .bind(path)
    .first();

  return Number(row?.count || 0);
}

async function incrementLikeCount(env, path) {
  await env.DB.prepare(`
    INSERT INTO post_likes (path, count, updated_at)
    VALUES (?1, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(path) DO UPDATE SET
      count = count + 1,
      updated_at = CURRENT_TIMESTAMP
  `)
    .bind(path)
    .run();

  return getLikeCount(env, path);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env),
      });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/likes") {
      return jsonResponse(request, env, { error: "Not found." }, 404);
    }

    const path = normalizePath(url.searchParams.get("path"));

    if (!path) {
      return jsonResponse(request, env, { error: "A valid post path is required." }, 400);
    }

    if (request.method === "GET") {
      const count = await getLikeCount(env, path);
      return jsonResponse(request, env, { path, count });
    }

    if (request.method === "POST") {
      const count = await incrementLikeCount(env, path);
      return jsonResponse(request, env, { path, count });
    }

    return jsonResponse(request, env, { error: "Method not allowed." }, 405);
  },
};
