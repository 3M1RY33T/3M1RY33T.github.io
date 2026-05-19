const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const MAX_COMMENTS_PER_POST = 100;

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
      "Access-Control-Allow-Headers": "Accept, Content-Type",
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

function normalizeText(value, maxLength) {
  const text = String(value || "").trim();
  return text.length <= maxLength ? text : "";
}

function normalizeOptionalText(value, maxLength) {
  const text = String(value || "").trim();
  return text.length <= maxLength ? text : "";
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatTimestamp(value) {
  const timestamp = String(value || "");
  if (!timestamp) return "";
  return timestamp.includes("T") ? timestamp : `${timestamp.replace(" ", "T")}Z`;
}

async function getLikeCount(env, path) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured.");
  }

  const row = await env.DB.prepare("SELECT count FROM post_likes WHERE path = ?1")
    .bind(path)
    .first();

  return Number(row?.count || 0);
}

async function incrementLikeCount(env, path) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured.");
  }

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

async function getApprovedComments(env, path) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured.");
  }

  const { results } = await env.DB.prepare(`
    SELECT id, author_name, content, created_at
    FROM post_comments
    WHERE path = ?1 AND status = 'approved'
    ORDER BY created_at ASC, id ASC
    LIMIT ?2
  `)
    .bind(path, MAX_COMMENTS_PER_POST)
    .all();

  return (results || []).map((comment) => ({
    id: comment.id,
    authorName: comment.author_name,
    content: comment.content,
    createdAt: formatTimestamp(comment.created_at),
  }));
}

async function createComment(env, data) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured.");
  }

  const result = await env.DB.prepare(`
    INSERT INTO post_comments (
      path,
      page_url,
      page_title,
      author_name,
      author_email,
      content,
      status,
      created_at,
      updated_at
    )
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `)
    .bind(
      data.path,
      data.pageUrl,
      data.pageTitle,
      data.nickname,
      data.email || null,
      data.content,
    )
    .run();

  return result.meta?.last_row_id || null;
}

async function handleLikes(request, env, url) {
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
}

async function handleComments(request, env, url) {
  if (request.method === "GET") {
    const path = normalizePath(url.searchParams.get("path"));

    if (!path) {
      return jsonResponse(request, env, { error: "A valid post path is required." }, 400);
    }

    const comments = await getApprovedComments(env, path);
    return jsonResponse(request, env, { path, comments });
  }

  if (request.method === "POST") {
    let payload;

    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse(request, env, { error: "Request body must be valid JSON." }, 400);
    }

    payload = payload && typeof payload === "object" ? payload : {};

    if (String(payload.website || "").trim()) {
      return jsonResponse(request, env, { ok: true, status: "pending" }, 202);
    }

    const path = normalizePath(payload.path);
    const pageUrl = normalizeText(payload.pageUrl, 1000);
    const pageTitle = normalizeText(payload.pageTitle, 300);
    const nickname = normalizeText(payload.nickname, 80);
    const email = normalizeOptionalText(payload.email, 254);
    const content = normalizeText(payload.content, 2000);

    if (!path || !pageUrl || !pageTitle || !nickname || !content) {
      return jsonResponse(request, env, { error: "Comment is missing required fields." }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse(request, env, { error: "Email address is invalid." }, 400);
    }

    const id = await createComment(env, {
      path,
      pageUrl,
      pageTitle,
      nickname,
      email,
      content,
    });

    return jsonResponse(request, env, { id, path, status: "pending" }, 201);
  }

  return jsonResponse(request, env, { error: "Method not allowed." }, 405);
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: getCorsHeaders(request, env),
        });
      }

      const url = new URL(request.url);

      if (url.pathname === "/likes") {
        return handleLikes(request, env, url);
      }

      if (url.pathname === "/comments") {
        return handleComments(request, env, url);
      }

      return jsonResponse(request, env, { error: "Not found." }, 404);
    } catch (error) {
      return jsonResponse(request, env, {
        error: "Engagement service failed.",
        message: error instanceof Error ? error.message : "Unknown error.",
      }, 500);
    }
  },
};
