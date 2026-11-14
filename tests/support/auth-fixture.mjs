// Loopback-only, fictional HTTP fixture for SSR browser tests. Never a live
// Supabase project, cryptographic verifier, or replacement for real RLS tests.
import http from "node:http";
const ownerA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ownerB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const sessions = new Map();
const refreshTokens = new Map();
let failAuth = false;
const profiles = new Map();
const checkIns = new Map();
let failHealth = false;
let serial = 0;
const users = new Map();
const passwords = new Map();
function reset() {
  sessions.clear();
  refreshTokens.clear();
  failAuth = false;
  profiles.clear();
  checkIns.clear();
  failHealth = false;
  users.clear();
  passwords.clear();
  for (const [id, email, confirmed] of [
    [ownerA, "fixture-a@example.invalid", true],
    [ownerB, "fixture-b@example.invalid", true],
    [
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "unverified@example.invalid",
      false,
    ],
  ]) {
    users.set(email, {
      id,
      email,
      aud: "authenticated",
      role: "authenticated",
      email_confirmed_at: confirmed ? "2026-11-14T00:00:00Z" : null,
      created_at: "2026-11-14T00:00:00Z",
      app_metadata: {},
      user_metadata: {},
    });
    passwords.set(email, "fictional-passphrase");
  }
  profiles.set(ownerB, {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: ownerB,
    display_name: "Fixture B",
    crew_identifier: "TEST-B",
    mission_name: "Private B mission",
    mission_environment: "spacecraft",
    mission_start_date: null,
    role: null,
    created_at: "2026-11-14T00:00:00Z",
  });
}
reset();
function session(user, expired = false) {
  const encoded = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + (expired ? -60 : 3600);
  const access_token = `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({ sub: user.id, aud: "authenticated", role: "authenticated", exp: expires, iat: Math.floor(Date.now() / 1000), serial: ++serial })}.fixture-signature-not-cryptographic`;
  sessions.set(access_token, user);
  const refresh_token = `fictional-refresh-${serial}`;
  refreshTokens.set(refresh_token, user);
  return {
    access_token,
    refresh_token,
    token_type: "bearer",
    expires_in: expired ? -60 : 3600,
    expires_at: expires,
    user,
  };
}
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3102");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  const reply = (status, value) => {
    res.statusCode = status;
    res.end(JSON.stringify(value));
  };
  if (req.method === "OPTIONS") return reply(200, {});
  const url = new URL(req.url, "http://127.0.0.1:4400");
  let raw = "";
  for await (const part of req) raw += part;
  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return reply(400, {});
  }
  if (url.pathname === "/__fixture/ready") return reply(200, { fixture: true });
  if (url.pathname === "/__fixture/reset" && req.method === "POST") {
    reset();
    return reply(200, {});
  }
  if (url.pathname === "/__fixture/expire" && req.method === "POST") {
    sessions.clear();
    refreshTokens.clear();
    return reply(200, {});
  }
  if (url.pathname === "/__fixture/expired-access" && req.method === "POST")
    return reply(200, session(users.get("fixture-b@example.invalid"), true));
  if (url.pathname === "/__fixture/auth-failure" && req.method === "POST") {
    failAuth = body.enabled === true;
    return reply(200, {});
  }
  if (
    url.pathname === "/auth/v1/token" &&
    url.searchParams.get("grant_type") === "refresh_token"
  ) {
    if (failAuth)
      return reply(503, {
        code: "unexpected_failure",
        msg: "Fictional temporary Auth failure",
      });
    const user = refreshTokens.get(body.refresh_token);
    if (!user)
      return reply(400, {
        code: "refresh_token_not_found",
        msg: "Refresh session expired",
      });
    refreshTokens.delete(body.refresh_token);
    return reply(200, session(user));
  }
  if (url.pathname === "/__fixture/health-failure" && req.method === "POST") {
    failHealth = body.enabled === true;
    return reply(200, {});
  }
  if (url.pathname === "/__fixture/records")
    return reply(200, [...checkIns.values()]);
  if (url.pathname === "/__fixture/health-data" && req.method === "POST") {
    for (const row of body.records ?? []) checkIns.set(row.id, row);
    return reply(200, {});
  }
  if (url.pathname === "/__fixture/touch-record" && req.method === "POST") {
    const row = checkIns.get(body.id);
    if (row)
      checkIns.set(row.id, {
        ...row,
        notes: "Fictional concurrent edit.",
        updated_at: new Date().toISOString(),
      });
    return reply(200, {});
  }
  if (
    url.pathname === "/auth/v1/token" &&
    url.searchParams.get("grant_type") === "password"
  ) {
    const user = users.get(body.email);
    return user && body.password === passwords.get(body.email)
      ? reply(200, session(user))
      : reply(400, {
          error_code: "invalid_credentials",
          msg: "Invalid login credentials",
        });
  }
  if (
    url.pathname === "/auth/v1/token" &&
    url.searchParams.get("grant_type") === "pkce"
  ) {
    return body.auth_code === "fictional-pkce-code" && body.code_verifier
      ? reply(200, session(users.get("fixture-a@example.invalid")))
      : reply(400, { code: "bad_code_verifier", msg: "Invalid recovery code" });
  }
  if (
    url.pathname === "/auth/v1/signup" ||
    url.pathname === "/auth/v1/recover" ||
    url.pathname === "/auth/v1/resend"
  )
    return reply(200, {});
  if (
    url.pathname === "/auth/v1/verify" &&
    ["fictional-verification", "fictional-recovery"].includes(body.token_hash)
  )
    return reply(200, session(users.get("fixture-a@example.invalid")));
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  const user = sessions.get(token);
  if (url.pathname === "/auth/v1/user") {
    if (failAuth)
      return reply(503, {
        code: "unexpected_failure",
        msg: "Fictional temporary Auth failure",
      });
    if (!user)
      return reply(401, { code: "session_not_found", msg: "Session expired" });
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    if (payload.exp <= Math.floor(Date.now() / 1000))
      return reply(401, { code: "bad_jwt", msg: "Expired access token" });
    if (req.method === "PUT" && body.password)
      passwords.set(user.email, body.password);
    return reply(200, user);
  }
  if (url.pathname === "/auth/v1/logout") {
    if (user && url.searchParams.get("scope") === "global") {
      for (const [key, value] of sessions)
        if (value.id === user.id) sessions.delete(key);
      for (const [key, value] of refreshTokens)
        if (value.id === user.id) refreshTokens.delete(key);
    }
    sessions.delete(token);
    return reply(200, {});
  }
  if (url.pathname === "/rest/v1/health_check_ins") {
    if (!user) return reply(401, { message: "Not authorized" });
    if (failHealth)
      return reply(503, { message: "Fictional test connection failure" });
    const profile = profiles.get(user.id);
    if (!profile) return reply(403, { message: "Profile required" });
    const matches = (row) =>
      row.astronaut_profile_id === profile.id &&
      [...url.searchParams.entries()].every(
        ([name, value]) =>
          !["id", "astronaut_profile_id", "updated_at"].includes(name) ||
          value === `eq.${row[name]}`,
      );
    const rows = [...checkIns.values()].filter(matches);
    const stamp = () => new Date().toISOString();
    if (req.method === "GET") {
      rows.sort(
        (a, b) =>
          b.recorded_at.localeCompare(a.recorded_at) ||
          b.id.localeCompare(a.id),
      );
      const start = Number(url.searchParams.get("offset") || 0),
        limit = Number(url.searchParams.get("limit") || rows.length);
      return reply(200, rows.slice(start, start + limit));
    }
    if (req.method === "POST") {
      if (
        body.astronaut_profile_id !== profile.id ||
        body.data_source !== "user-entered"
      )
        return reply(403, { code: "42501", message: "Ownership required" });
      if (checkIns.has(body.id))
        return reply(409, { code: "23505", message: "Duplicate ID" });
      const row = { ...body, created_at: stamp(), updated_at: stamp() };
      checkIns.set(row.id, row);
      return reply(201, {});
    }
    if (req.method === "PATCH") {
      if (!rows.length) return reply(200, []);
      if (
        [
          "id",
          "astronaut_profile_id",
          "recorded_at",
          "created_at",
          "data_source",
        ].some((key) => key in body)
      )
        return reply(403, {});
      const row = { ...rows[0], ...body, updated_at: stamp() };
      checkIns.set(row.id, row);
      return reply(200, [row]);
    }
    if (req.method === "DELETE") {
      for (const row of rows) checkIns.delete(row.id);
      return reply(
        200,
        rows.map((row) => ({ id: row.id })),
      );
    }
  }
  if (url.pathname === "/rest/v1/astronaut_profiles") {
    if (!user) return reply(401, { message: "Not authorized" });
    if (req.method === "GET") {
      const filter = url.searchParams.get("user_id");
      const row = filter === `eq.${user.id}` ? profiles.get(user.id) : null;
      return reply(200, row ? [row] : []);
    }
    if (req.method === "POST") {
      if (body.user_id !== user.id || profiles.has(user.id))
        return reply(403, { message: "Ownership required" });
      const row = {
        ...body,
        id: "11111111-1111-4111-8111-111111111111",
        created_at: "2026-11-14T00:00:00Z",
      };
      profiles.set(user.id, row);
      return reply(201, row);
    }
    if (req.method === "PATCH") {
      const previous = profiles.get(user.id);
      if (
        !previous ||
        url.searchParams.get("user_id") !== `eq.${user.id}` ||
        url.searchParams.get("id") !== `eq.${previous.id}`
      )
        return reply(403, {});
      const row = { ...previous, ...body };
      profiles.set(user.id, row);
      return reply(200, row);
    }
  }
  return reply(400, { message: "Unsupported fictional fixture request" });
});
server.listen(4400, "127.0.0.1", () =>
  console.log("Fictional auth fixture ready on loopback port 4400"),
);
