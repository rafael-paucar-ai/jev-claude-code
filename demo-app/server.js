const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const publicDir = path.join(__dirname, "public");

const users = {
  admin: { password: "admin123", name: "Alex Admin", role: "admin" },
  manager: { password: "manager123", name: "Morgan Manager", role: "manager" },
  employee: { password: "employee123", name: "Emery Employee", role: "employee" },
};

const pages = {
  "/dashboard": { title: "Dashboard", eyebrow: "Workspace overview" },
  "/employees": { title: "Employees", eyebrow: "People operations" },
  "/reports": { title: "Reports", eyebrow: "Performance intelligence" },
  "/settings": { title: "Settings", eyebrow: "Workspace controls" },
};

const permissions = {
  admin: ["/dashboard", "/employees", "/reports", "/settings"],
  manager: ["/dashboard", "/employees", "/reports"],
  employee: ["/dashboard"],
};

const sessions = new Map();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf("=");
      return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
    }),
  );
}

function currentUser(req) {
  const sid = parseCookies(req.headers.cookie).role_demo_session;
  const username = sid && sessions.get(sid);
  return username ? { username, ...users[username] } : null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error("Request body too large"));
    });
    req.on("end", () => resolve(new URLSearchParams(body)));
    req.on("error", reject);
  });
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    ...headers,
  });
  res.end(body);
}

function redirect(res, location, cookie) {
  const headers = { Location: location };
  if (cookie) headers["Set-Cookie"] = cookie;
  res.writeHead(303, headers);
  res.end();
}

function icon(name) {
  const paths = {
    shield: '<path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    employees: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    reports: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.34.73.6 1 .3.3.7.45 1.1.45h.1v4h-.1c-.4 0-.8.15-1.1.45-.26.27-.47.62-.6 1.1Z"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function layout({ title, user, active, content, status = 200 }) {
  const nav = Object.entries(pages)
    .filter(([route]) => permissions[user.role].includes(route))
    .map(([route, page]) => `<a class="nav-link${active === route ? " is-active" : ""}" href="${route}"${active === route ? ' aria-current="page"' : ""}>${icon(route.slice(1))}<span>${page.title}</span></a>`)
    .join("");

  return {
    status,
    html: `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · RoleGuard</title><link rel="stylesheet" href="/styles.css"></head>
<body class="app-shell">
  <aside class="sidebar">
    <a class="brand" href="/dashboard" aria-label="RoleGuard dashboard"><span class="brand-mark">${icon("shield")}</span><span><strong>RoleGuard</strong><small>Access control lab</small></span></a>
    <nav aria-label="Primary navigation">${nav}</nav>
    <div class="sidebar-footer">
      <div class="identity"><span class="avatar">${user.name.split(" ").map((part) => part[0]).join("")}</span><span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.role)}</small></span></div>
      <form method="post" action="/logout"><button class="icon-button" type="submit" aria-label="Log out">${icon("logout")}</button></form>
    </div>
  </aside>
  <main class="main"><div class="page-wrap">${content}</div></main>
</body></html>`,
  };
}

function loginPage(error = "") {
  const accounts = Object.entries(users).map(([username, user]) => `
    <button class="account-card" type="button" data-username="${username}" data-password="${user.password}">
      <span class="account-avatar">${user.name.split(" ").map((part) => part[0]).join("")}</span>
      <span><strong>${user.role.toUpperCase()}</strong><small>${username} / ${user.password}</small></span>
      <span class="use-label">Use</span>
    </button>`).join("");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in · RoleGuard</title><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script></head>
<body class="login-shell">
  <main class="login-layout">
    <section class="login-intro" aria-labelledby="intro-title">
      <div class="brand brand-light"><span class="brand-mark">${icon("shield")}</span><span><strong>RoleGuard</strong><small>Access control lab</small></span></div>
      <div><p class="kicker">Jev browser testing demo</p><h1 id="intro-title">Permissions you can see. Routes you can trust.</h1><p class="intro-copy">A deliberately small app for observing how an AI coding agent plans, Jev navigates, and deterministic role rules decide access.</p></div>
      <div class="signal-row"><span><i></i> Local only</span><span><i></i> Server-protected</span><span><i></i> Three roles</span></div>
    </section>
    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-card">
        <p class="eyebrow">Welcome back</p><h2 id="login-title">Sign in to the workspace</h2><p class="muted">Choose a demo account or type its credentials.</p>
        ${error ? `<div class="form-error" role="alert">${escapeHtml(error)}</div>` : ""}
        <form method="post" action="/login" class="login-form">
          <label for="username">Username</label><input id="username" name="username" autocomplete="username" required>
          <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required>
          <button class="primary-button" type="submit">Sign in securely</button>
        </form>
        <div class="divider"><span>Demo accounts</span></div>
        <div class="account-list">${accounts}</div>
      </div>
    </section>
  </main>
</body></html>`;
}

function dashboardContent(user) {
  const accessCount = permissions[user.role].length;
  return `<header class="page-header"><div><p class="eyebrow">Workspace overview</p><h1>Good morning, ${escapeHtml(user.name.split(" ")[0])}.</h1><p>Your <strong>${escapeHtml(user.role)}</strong> workspace is ready.</p></div><span class="role-pill">${escapeHtml(user.role)} access</span></header>
  <section class="metric-grid" aria-label="Workspace metrics">
    <article class="metric-card"><span class="metric-label">Visible areas</span><strong>${accessCount} / 4</strong><small>Based on your assigned role</small></article>
    <article class="metric-card"><span class="metric-label">Active employees</span><strong>48</strong><small>Across 6 departments</small></article>
    <article class="metric-card"><span class="metric-label">Reports this month</span><strong>12</strong><small>Updated two minutes ago</small></article>
  </section>
  <section class="content-card"><div class="section-heading"><div><p class="eyebrow">Access map</p><h2>Your available workspace</h2></div><span class="status-dot">Policy active</span></div>
    <div class="access-list">${Object.entries(pages).map(([route, page]) => {
      const allowed = permissions[user.role].includes(route);
      return `<div class="access-row"><span>${icon(route.slice(1))}<strong>${page.title}</strong></span><span class="access-status ${allowed ? "allowed" : "denied"}">${allowed ? "Allowed" : "Restricted"}</span></div>`;
    }).join("")}</div>
  </section>`;
}

function employeesContent() {
  const people = [["Maya Chen", "Design", "Active"], ["Noah Williams", "Engineering", "Active"], ["Sofia Martin", "Operations", "On leave"]];
  return `<header class="page-header"><div><p class="eyebrow">People operations</p><h1>Employees</h1><p>Manage the people who make the workspace run.</p></div><button class="secondary-button" type="button">Add employee</button></header>
  <section class="content-card"><div class="section-heading"><div><p class="eyebrow">Directory</p><h2>Team members</h2></div><span class="quiet-count">48 total</span></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Department</th><th>Status</th></tr></thead><tbody>${people.map(([name, team, status]) => `<tr><td><strong>${name}</strong></td><td>${team}</td><td><span class="table-status">${status}</span></td></tr>`).join("")}</tbody></table></div></section>`;
}

function reportsContent() {
  return `<header class="page-header"><div><p class="eyebrow">Performance intelligence</p><h1>Reports</h1><p>A concise view of company momentum.</p></div><button class="secondary-button" type="button">Export report</button></header>
  <section class="metric-grid"><article class="metric-card"><span class="metric-label">Completion rate</span><strong>94%</strong><small>+6% from last month</small></article><article class="metric-card"><span class="metric-label">Open reviews</span><strong>7</strong><small>3 due this week</small></article><article class="metric-card"><span class="metric-label">Team health</span><strong>8.7</strong><small>Out of 10</small></article></section>
  <section class="content-card"><div class="section-heading"><div><p class="eyebrow">Quarterly trend</p><h2>Performance index</h2></div><span class="status-dot">On track</span></div><div class="bar-chart" aria-label="Performance increased from 64 to 91 across four quarters"><span style="--value:64%"><i>Q1</i></span><span style="--value:73%"><i>Q2</i></span><span style="--value:82%"><i>Q3</i></span><span style="--value:91%"><i>Q4</i></span></div></section>`;
}

function settingsContent() {
  return `<header class="page-header"><div><p class="eyebrow">Workspace controls</p><h1>Settings</h1><p>Configure organization-wide preferences.</p></div><span class="role-pill">Admin only</span></header>
  <section class="content-card settings-list"><div><span>${icon("shield")}</span><div><h2>Security policy</h2><p>Require strong passwords and session expiry.</p></div><button class="secondary-button" type="button">Configure</button></div><div><span>${icon("employees")}</span><div><h2>Role assignments</h2><p>Manage workspace permissions by role.</p></div><button class="secondary-button" type="button">Review roles</button></div></section>`;
}

function deniedContent(user, route) {
  const page = pages[route];
  return `<section class="denied-card"><span class="denied-icon">${icon("lock")}</span><p class="eyebrow">403 · Access denied</p><h1>${escapeHtml(page.title)} is restricted</h1><p>Your <strong>${escapeHtml(user.role)}</strong> role does not have permission to access this page. The server blocked the request before rendering protected content.</p><a class="primary-button link-button" href="/dashboard">Return to Dashboard</a><code>Requested route: ${escapeHtml(route)}</code></section>`;
}

function renderPage(route, user) {
  const content = route === "/dashboard" ? dashboardContent(user)
    : route === "/employees" ? employeesContent()
    : route === "/reports" ? reportsContent()
    : settingsContent();
  return layout({ title: pages[route].title, user, active: route, content });
}

function serveAsset(res, filename, contentType) {
  fs.readFile(path.join(publicDir, filename), (error, data) => {
    if (error) return send(res, 404, "Not found");
    res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const route = url.pathname;
  const user = currentUser(req);

  if (req.method === "GET" && route === "/styles.css") return serveAsset(res, "styles.css", "text/css; charset=utf-8");
  if (req.method === "GET" && route === "/app.js") return serveAsset(res, "app.js", "text/javascript; charset=utf-8");
  if (req.method === "GET" && route === "/") return redirect(res, user ? "/dashboard" : "/login");
  if (req.method === "GET" && route === "/login") return send(res, 200, loginPage(url.searchParams.get("error") || ""));

  if (req.method === "POST" && route === "/login") {
    const body = await readBody(req);
    const username = body.get("username") || "";
    const password = body.get("password") || "";
    if (!users[username] || users[username].password !== password) {
      return redirect(res, "/login?error=Invalid%20username%20or%20password");
    }
    const sid = crypto.randomUUID();
    sessions.set(sid, username);
    return redirect(res, "/dashboard", `role_demo_session=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600`);
  }

  if (req.method === "POST" && route === "/logout") {
    const sid = parseCookies(req.headers.cookie).role_demo_session;
    if (sid) sessions.delete(sid);
    return redirect(res, "/login", "role_demo_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  }

  if (pages[route] && req.method === "GET") {
    if (!user) return redirect(res, `/login?next=${encodeURIComponent(route)}`);
    if (!permissions[user.role].includes(route)) {
      const denied = layout({ title: "Access denied", user, active: "", content: deniedContent(user, route), status: 403 });
      return send(res, denied.status, denied.html);
    }
    const rendered = renderPage(route, user);
    return send(res, rendered.status, rendered.html);
  }

  return send(res, 404, "<!doctype html><title>Not found</title><h1>Page not found</h1>");
});

server.listen(PORT, HOST, () => {
  console.log(`RoleGuard demo running at http://${HOST}:${PORT}`);
});
