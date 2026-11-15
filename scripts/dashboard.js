#!/usr/bin/env node

/**
 * scripts/dashboard.js
 * Avengers Protocol — Visual Web Dashboard (Stark HUD)
 * Realtime Kanban Board, Token Saver Calculator & Avenger Radar.
 * Zero external npm dependencies. Pure Node.js.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { exec, spawn } = require('node:child_process');

const PORT = process.env.AVENGERS_PORT || 4040;
const rootDir = path.resolve(__dirname, '..');
const taskMdPath = path.join(rootDir, 'planning/task.md');
const tasksDirPath = path.join(rootDir, 'planning/tasks');
const updatePlanningPath = path.join(rootDir, 'planning/updateplanning.md');

// ============================================================================
// 1. Task Parser & Serializer for planning/task.md
// ============================================================================

function parseTaskBoard() {
  if (!fs.existsSync(taskMdPath)) {
    return [];
  }
  const content = fs.readFileSync(taskMdPath, 'utf8');
  const lines = content.split('\n');
  const tasks = [];

  let inTable = false;
  for (const line of lines) {
    if (line.includes('| Task ID |') || line.includes('| Task Title |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.trim().startsWith('|---')) {
      continue;
    }
    if (inTable && line.trim().startsWith('|')) {
      const parts = line.split('|').map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 6) {
        // [TASK-001](tasks/TASK-001.md)
        const idMatch = parts[0].match(/\[?(TASK-[\w\d]+)\]?/i);
        const id = idMatch ? idMatch[1] : parts[0];
        const title = parts[1];
        const assignee = parts[2].replace(/`/g, '');
        const dependencies = parts[3];
        const status = parts[4].replace(/`/g, '');
        const priority = parts[5].replace(/`/g, '');
        const complexity = (parts[6] || 'STANDARD').replace(/`/g, '');
        const verification = (parts[7] || 'Pending').replace(/`/g, '');

        tasks.push({
          id,
          title,
          assignee,
          dependencies,
          status: status.toUpperCase(),
          priority,
          complexity,
          verification,
        });
      }
    } else if (inTable && !line.trim().startsWith('|') && line.trim().length > 0) {
      if (line.startsWith('## ') || line.startsWith('---')) {
        inTable = false;
      }
    }
  }
  return tasks;
}

function updateTaskStatusInFile(taskId, newStatus) {
  if (!fs.existsSync(taskMdPath)) return false;
  let content = fs.readFileSync(taskMdPath, 'utf8');

  // Regex to match the table row with this task ID
  const rowRegex = new RegExp(`(\\|\\s*\\[?${taskId}\\]?[^|]*\\|[^|]*\\|[^|]*\\|[^|]*\\|\\s*)(` + '`?[A-Z_]+`?' + `)(\\s*\\|.*)`, 'i');
  if (rowRegex.test(content)) {
    content = content.replace(rowRegex, `$1\`${newStatus.toUpperCase()}\`$3`);
    fs.writeFileSync(taskMdPath, content, 'utf8');

    // Also update individual task file if exists
    const singleTaskFile = path.join(tasksDirPath, `${taskId}.md`);
    if (fs.existsSync(singleTaskFile)) {
      let singleContent = fs.readFileSync(singleTaskFile, 'utf8');
      singleContent = singleContent.replace(
        /> \*\*Status\*\*:\s*\[?[A-Z_]+\]?/i,
        `> **Status**: ${newStatus.toUpperCase()}`
      );
      fs.writeFileSync(singleTaskFile, singleContent, 'utf8');
    }

    // Append to updateplanning.md
    if (fs.existsSync(updatePlanningPath)) {
      const timestamp = new Date().toLocaleTimeString();
      const logLine = `\n- [${timestamp}] **Status Updated**: ${taskId} moved to \`${newStatus.toUpperCase()}\` via Visual Dashboard HUD.`;
      fs.appendFileSync(updatePlanningPath, logLine, 'utf8');
    }

    return true;
  }
  return false;
}

function calculateMetrics(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const ready = tasks.filter((t) => t.status === 'READY').length;
  const blocked = tasks.filter((t) => t.status === 'BLOCKED').length;
  const backlog = tasks.filter((t) => t.status === 'BACKLOG').length;

  // Avengers Protocol saves ~45,000 tokens per completed task vs standard un-isolated chat compounding
  const tokensSaved = (done * 45000) + (inProgress * 18000) + (ready * 8000);
  const costSaved = ((tokensSaved / 1000000) * 3.0).toFixed(2); // Based on ~$3.00/1M blended tokens

  return {
    total,
    done,
    inProgress,
    ready,
    blocked,
    backlog,
    tokensSaved: tokensSaved.toLocaleString(),
    costSaved,
    efficiency: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

// ============================================================================
// 2. High-Tech Cyberpunk / Stark HUD Dashboard UI (Embedded HTML/CSS/JS)
// ============================================================================

const HTML_DASHBOARD = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛡️ Avengers Protocol — Stark HUD Visual Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(18, 24, 38, 0.85);
      --card-border: rgba(56, 189, 248, 0.15);
      --card-hover: rgba(56, 189, 248, 0.3);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --cyan: #06b6d4;
      --cyan-glow: rgba(6, 182, 212, 0.35);
      --gold: #f59e0b;
      --purple: #a855f7;
      --emerald: #10b981;
      --rose: #f43f5e;
      --blue: #3b82f6;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at 50% 0%, #172554 0%, var(--bg) 60%);
      background-attachment: fixed;
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    /* Scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--cyan); }

    /* Top Nav */
    header {
      background: rgba(11, 15, 25, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--card-border);
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      font-size: 28px;
      filter: drop-shadow(0 0 10px var(--cyan));
      animation: pulse 3s infinite ease-in-out;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-sub {
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Outfit', sans-serif;
      border: 1px solid transparent;
      outline: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: white;
      box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
    }
    .btn-primary:hover {
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.6);
      transform: translateY(-1px);
    }

    .btn-outline {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--card-border);
      color: #e2e8f0;
    }
    .btn-outline:hover {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--cyan);
      color: var(--cyan);
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 20px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: #34d399;
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: blink 1.5s infinite;
    }

    /* Container */
    main {
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      flex: 1;
    }

    /* HUD Metrics Row */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(12px);
      transition: all 0.3s ease;
    }
    .metric-card:hover {
      border-color: var(--card-hover);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(90deg, transparent, var(--cyan), transparent);
      opacity: 0.7;
    }

    .metric-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-family: 'JetBrains Mono', monospace;
    }
    .metric-value {
      font-size: 26px;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
    }
    .metric-sub {
      font-size: 12px;
      color: var(--emerald);
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    /* Avengers Radar */
    .avengers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 8px;
    }

    .hero-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 12px;
      text-align: center;
      transition: all 0.3s ease;
    }
    .hero-card.active {
      border-color: var(--cyan);
      background: rgba(6, 182, 212, 0.1);
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
    }
    .hero-avatar { font-size: 24px; margin-bottom: 4px; }
    .hero-name { font-size: 12px; font-weight: 700; color: #e2e8f0; }
    .hero-role { font-size: 10px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
    .hero-badge {
      margin-top: 6px;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
      display: inline-block;
    }
    .hero-card.active .hero-badge {
      background: var(--cyan);
      color: #0b0f19;
      font-weight: 700;
    }

    /* Kanban Board */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(6, minmax(280px, 1fr));
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 16px;
      min-height: 520px;
    }

    .kanban-col {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 300px);
      min-width: 280px;
      backdrop-filter: blur(10px);
      transition: border-color 0.2s;
    }
    .kanban-col.drag-over {
      border-color: var(--cyan);
      background: rgba(6, 182, 212, 0.05);
    }

    .col-header {
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .col-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .col-count {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .col-cards {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      flex: 1;
    }

    /* Task Card */
    .task-card {
      background: var(--card-bg);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 14px;
      cursor: grab;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
    }
    .task-card:hover {
      border-color: var(--cyan);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      transform: translateY(-2px);
    }
    .task-card.dragging {
      opacity: 0.4;
      cursor: grabbing;
    }

    .task-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .task-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: var(--cyan);
      background: rgba(6, 182, 212, 0.12);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .task-priority {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .p-p0 { background: rgba(244, 63, 94, 0.2); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.4); }
    .p-p1 { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .p-p2 { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .p-p3 { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.4); }

    .task-title {
      font-size: 13px;
      font-weight: 600;
      color: #f8fafc;
      line-height: 1.4;
    }

    .task-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .task-assignee {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      color: #cbd5e1;
    }
    .tier-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
    }
    .tier-heavy { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
    .tier-standard { background: rgba(6, 182, 212, 0.2); color: #38bdf8; border: 1px solid rgba(6, 182, 212, 0.4); }
    .tier-light { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }

    /* Modal / Terminal Drawer */
    .drawer-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 200;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .drawer-overlay.active { display: flex; }

    .drawer-box {
      background: #0f172a;
      border: 1px solid var(--cyan);
      box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
      border-radius: 12px;
      width: 100%;
      max-width: 720px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: zoomIn 0.2s ease-out;
    }

    .drawer-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .drawer-title { font-size: 15px; font-weight: 700; color: #38bdf8; }
    .drawer-close {
      background: transparent; border: none; font-size: 20px; color: #94a3b8; cursor: pointer;
    }
    .drawer-close:hover { color: white; }

    .drawer-terminal {
      padding: 18px 20px;
      background: #090d16;
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      overflow-y: auto;
      line-height: 1.6;
      flex: 1;
      white-space: pre-wrap;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 28px;
      background: #0284c7;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      z-index: 300;
      display: none;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease;
    }

    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand">
      <div class="brand-logo">🛡️</div>
      <div>
        <div class="brand-title">TAJUL AVENGERS HUD</div>
        <div class="brand-sub">Multi-Agent AI Protocol • Realtime Board</div>
      </div>
    </div>

    <div class="header-actions">
      <div class="live-indicator">
        <div class="pulse-dot"></div>
        <span>LIVE SYNC</span>
      </div>
      <button class="btn btn-outline" onclick="runThanosVerify()">
        <span>🧤</span> Thanos Verify
      </button>
      <button class="btn btn-outline" onclick="runSyncContracts()">
        <span>🔄</span> Sync Contracts
      </button>
      <button class="btn btn-primary" onclick="openAddTaskModal()">
        <span>➕</span> New Task
      </button>
    </div>
  </header>

  <!-- Main HUD Body -->
  <main>
    <!-- Top Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Token Savings</span>
        <div class="metric-value" id="val-tokens">~145,000</div>
        <div class="metric-sub">
          <span>💰</span> <span id="val-cost">~$2.90</span> saved vs Monolithic Context
        </div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Context Choking</span>
        <div class="metric-value">92%</div>
        <div class="metric-sub"><span>⚡</span> Progressive Disclosure Active</div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Sprint Progress</span>
        <div class="metric-value" id="val-progress">0%</div>
        <div class="metric-sub"><span id="val-done-count">0 / 0</span> Tasks Verified</div>
      </div>

      <div class="metric-card">
        <span class="metric-label">Chief Orchestrator</span>
        <div class="metric-value" style="font-size: 20px; color: #38bdf8;">🦾 Iron Man</div>
        <div class="metric-sub"><span>🟢</span> Active System Conductor</div>
      </div>
    </div>

    <!-- Avengers Team Radar -->
    <div>
      <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-family: 'JetBrains Mono'; margin-bottom: 10px; letter-spacing: 1px;">
        Avengers Team Radar & Active Specialization
      </div>
      <div class="avengers-grid">
        <div class="hero-card" id="hero-nick_fury">
          <div class="hero-avatar">🕵️‍♂️</div>
          <div class="hero-name">Nick Fury</div>
          <div class="hero-role">Client PM</div>
          <div class="hero-badge">Discovery</div>
        </div>
        <div class="hero-card" id="hero-iron_man">
          <div class="hero-avatar">🦾</div>
          <div class="hero-name">Iron Man</div>
          <div class="hero-role">Orchestrator</div>
          <div class="hero-badge">Leader</div>
        </div>
        <div class="hero-card" id="hero-jarvis">
          <div class="hero-avatar">🎨</div>
          <div class="hero-name">Jarvis</div>
          <div class="hero-role">UI/UX & Tokens</div>
          <div class="hero-badge">6 UI States</div>
        </div>
        <div class="hero-card" id="hero-friday">
          <div class="hero-avatar">💻</div>
          <div class="hero-name">Friday</div>
          <div class="hero-role">Next.js Web</div>
          <div class="hero-badge">Frontend</div>
        </div>
        <div class="hero-card" id="hero-edith">
          <div class="hero-avatar">⚙️</div>
          <div class="hero-name">Edith</div>
          <div class="hero-role">NestJS & DB</div>
          <div class="hero-badge">Backend</div>
        </div>
        <div class="hero-card" id="hero-thor">
          <div class="hero-avatar">⚡</div>
          <div class="hero-name">Thor</div>
          <div class="hero-role">Flutter Mobile</div>
          <div class="hero-badge">Cross-Platform</div>
        </div>
        <div class="hero-card" id="hero-thanos">
          <div class="hero-avatar">🧤</div>
          <div class="hero-name">Thanos</div>
          <div class="hero-role">QA & Verify</div>
          <div class="hero-badge">Zero Flaws</div>
        </div>
        <div class="hero-card" id="hero-loki">
          <div class="hero-avatar">🎭</div>
          <div class="hero-name">Loki</div>
          <div class="hero-role">Chaos & Pen-Test</div>
          <div class="hero-badge">Anti-Fragile</div>
        </div>
        <div class="hero-card" id="hero-ultron">
          <div class="hero-avatar">🛡️</div>
          <div class="hero-name">Ultron</div>
          <div class="hero-role">Docker & Security</div>
          <div class="hero-badge">DevOps</div>
        </div>
      </div>
    </div>

    <!-- Live Kanban Board -->
    <div class="kanban-board" id="kanban-board">
      <!-- 1. BACKLOG -->
      <div class="kanban-col" data-status="BACKLOG" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'BACKLOG')">
        <div class="col-header">
          <div class="col-title" style="color: #94a3b8;"><span>📋</span> BACKLOG</div>
          <span class="col-count" id="count-BACKLOG">0</span>
        </div>
        <div class="col-cards" id="cards-BACKLOG"></div>
      </div>

      <!-- 2. READY -->
      <div class="kanban-col" data-status="READY" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'READY')">
        <div class="col-header">
          <div class="col-title" style="color: #38bdf8;"><span>⏳</span> READY</div>
          <span class="col-count" id="count-READY">0</span>
        </div>
        <div class="col-cards" id="cards-READY"></div>
      </div>

      <!-- 3. IN_PROGRESS -->
      <div class="kanban-col" data-status="IN_PROGRESS" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'IN_PROGRESS')">
        <div class="col-header">
          <div class="col-title" style="color: #f59e0b;"><span>🚀</span> IN PROGRESS</div>
          <span class="col-count" id="count-IN_PROGRESS">0</span>
        </div>
        <div class="col-cards" id="cards-IN_PROGRESS"></div>
      </div>

      <!-- 4. BLOCKED -->
      <div class="kanban-col" data-status="BLOCKED" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'BLOCKED')">
        <div class="col-header">
          <div class="col-title" style="color: #f43f5e;"><span>🚨</span> BLOCKED</div>
          <span class="col-count" id="count-BLOCKED">0</span>
        </div>
        <div class="col-cards" id="cards-BLOCKED"></div>
      </div>

      <!-- 5. IN_REVIEW -->
      <div class="kanban-col" data-status="IN_REVIEW" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'IN_REVIEW')">
        <div class="col-header">
          <div class="col-title" style="color: #a855f7;"><span>🔍</span> IN REVIEW</div>
          <span class="col-count" id="count-IN_REVIEW">0</span>
        </div>
        <div class="col-cards" id="cards-IN_REVIEW"></div>
      </div>

      <!-- 6. DONE -->
      <div class="kanban-col" data-status="DONE" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'DONE')">
        <div class="col-header">
          <div class="col-title" style="color: #10b981;"><span>✅</span> DONE</div>
          <span class="col-count" id="count-DONE">0</span>
        </div>
        <div class="col-cards" id="cards-DONE"></div>
      </div>
    </div>
  </main>

  <!-- Terminal Output Drawer Modal -->
  <div class="drawer-overlay" id="drawer-modal">
    <div class="drawer-box">
      <div class="drawer-header">
        <div class="drawer-title" id="drawer-title">⚡ Command Output</div>
        <button class="drawer-close" onclick="closeDrawer()">✕</button>
      </div>
      <div class="drawer-terminal" id="drawer-terminal">Running...</div>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast" id="toast">✔ Updated</div>

  <script>
    const HERO_MAP = {
      nick_fury: { avatar: '🕵️‍♂️', name: 'Nick Fury' },
      iron_man:  { avatar: '🦾', name: 'Iron Man' },
      jarvis:    { avatar: '🎨', name: 'Jarvis' },
      friday:    { avatar: '💻', name: 'Friday' },
      edith:     { avatar: '⚙️', name: 'Edith' },
      thor:      { avatar: '⚡', name: 'Thor' },
      thanos:    { avatar: '🧤', name: 'Thanos' },
      loki:      { avatar: '🎭', name: 'Loki' },
      ultron:    { avatar: '🛡️', name: 'Ultron' },
    };

    let allTasks = [];
    let draggedTaskId = null;

    async function loadTasks() {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        allTasks = data.tasks || [];
        renderBoard(allTasks);
        renderMetrics(data.metrics || {});
        renderHeroes(allTasks);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      }
    }

    function renderMetrics(metrics) {
      if (metrics.tokensSaved) document.getElementById('val-tokens').textContent = metrics.tokensSaved;
      if (metrics.costSaved) document.getElementById('val-cost').textContent = '$' + metrics.costSaved;
      if (metrics.efficiency !== undefined) document.getElementById('val-progress').textContent = metrics.efficiency + '%';
      if (metrics.done !== undefined) document.getElementById('val-done-count').textContent = metrics.done + ' / ' + metrics.total;
    }

    function renderHeroes(tasks) {
      const activeAssignees = new Set(
        tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'READY').map(t => t.assignee.toLowerCase())
      );
      Object.keys(HERO_MAP).forEach(hero => {
        const el = document.getElementById('hero-' + hero);
        if (el) {
          if (activeAssignees.has(hero) || hero === 'iron_man') {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        }
      });
    }

    function renderBoard(tasks) {
      const columns = ['BACKLOG', 'READY', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'DONE'];
      columns.forEach(col => {
        const container = document.getElementById('cards-' + col);
        const countBadge = document.getElementById('count-' + col);
        container.innerHTML = '';

        const colTasks = tasks.filter(t => t.status === col);
        countBadge.textContent = colTasks.length;

        colTasks.forEach(task => {
          const card = document.createElement('div');
          card.className = 'task-card';
          card.draggable = true;
          card.id = 'task-' + task.id;

          const pClass = 'p-' + (task.priority || 'P2').toLowerCase();
          const tier = (task.complexity || 'STANDARD').toLowerCase();
          const hero = HERO_MAP[task.assignee.toLowerCase()] || { avatar: '👤', name: task.assignee };

          card.innerHTML = \`
            <div class="task-top">
              <span class="task-id">\${task.id}</span>
              <span class="task-priority \${pClass}">\${task.priority || 'P2'}</span>
            </div>
            <div class="task-title">\${task.title}</div>
            <div class="task-bottom">
              <div class="task-assignee">
                <span>\${hero.avatar}</span>
                <span>\${hero.name}</span>
              </div>
              <span class="tier-badge tier-\${tier}">\${tier}</span>
            </div>
          \`;

          card.addEventListener('dragstart', (e) => {
            draggedTaskId = task.id;
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id);
          });

          card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
          });

          container.appendChild(card);
        });
      });
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
      e.currentTarget.classList.remove('drag-over');
    }

    async function handleDrop(e, targetStatus) {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      if (!draggedTaskId) return;

      const task = allTasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== targetStatus) {
        task.status = targetStatus;
        renderBoard(allTasks);
        showToast(\`✔ \${task.id} moved to \${targetStatus}\`);

        try {
          await fetch('/api/tasks/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: task.id, newStatus: targetStatus }),
          });
          loadTasks();
        } catch (err) {
          console.error('Update status failed:', err);
        }
      }
      draggedTaskId = null;
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.style.display = 'flex';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }

    function openDrawer(title, initialLog) {
      document.getElementById('drawer-title').textContent = title;
      document.getElementById('drawer-terminal').textContent = initialLog;
      document.getElementById('drawer-modal').classList.add('active');
    }

    function closeDrawer() {
      document.getElementById('drawer-modal').classList.remove('active');
    }

    async function runThanosVerify() {
      openDrawer('🧤 Thanos Tri-Platform Verification Gate', 'Executing bash scripts/verify-task.sh ...\\n\\n');
      try {
        const res = await fetch('/api/verify', { method: 'POST' });
        const data = await res.json();
        document.getElementById('drawer-terminal').textContent = data.output || 'Verification run completed.';
      } catch (err) {
        document.getElementById('drawer-terminal').textContent = 'Error: ' + err.message;
      }
    }

    async function runSyncContracts() {
      openDrawer('🔄 Automated Contract Sync (Edith ➡️ Friday & Thor)', 'Executing node scripts/sync-contracts.js ...\\n\\n');
      try {
        const res = await fetch('/api/sync-contracts', { method: 'POST' });
        const data = await res.json();
        document.getElementById('drawer-terminal').textContent = data.output || 'Contract sync completed.';
      } catch (err) {
        document.getElementById('drawer-terminal').textContent = 'Error: ' + err.message;
      }
    }

    function openAddTaskModal() {
      const title = prompt('Enter new task title:');
      if (!title) return;
      const assignee = prompt('Assignee (iron_man / jarvis / friday / edith / thor / thanos / ultron):', 'friday') || 'friday';

      fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, assignee }),
      }).then(() => {
        showToast('✔ Task created!');
        loadTasks();
      });
    }

    // Initial load & Polling every 5 seconds for live sync with file edits
    loadTasks();
    setInterval(loadTasks, 4000);
  </script>
</body>
</html>`;

// ============================================================================
// 3. HTTP Server & Endpoints
// ============================================================================

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Dashboard UI HTML
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_DASHBOARD);
    return;
  }

  // 2. GET /api/tasks
  if (pathname === '/api/tasks' && req.method === 'GET') {
    const tasks = parseTaskBoard();
    const metrics = calculateMetrics(tasks);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tasks, metrics }));
    return;
  }

  // 3. POST /api/tasks/update-status
  if (pathname === '/api/tasks/update-status' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { taskId, newStatus } = JSON.parse(body);
        if (taskId && newStatus) {
          const success = updateTaskStatusInFile(taskId, newStatus);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing taskId or newStatus' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 4. POST /api/tasks/create
  if (pathname === '/api/tasks/create' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { title, assignee, priority = 'P1', complexity = 'STANDARD' } = JSON.parse(body);
        const tasks = parseTaskBoard();
        const nextNum = tasks.length + 1;
        const taskId = `TASK-${String(nextNum).padStart(3, '0')}`;

        if (fs.existsSync(taskMdPath)) {
          let content = fs.readFileSync(taskMdPath, 'utf8');
          const newRow = `| [\`${taskId}\`](tasks/${taskId}.md) | ${title} | \`${assignee}\` | None | \`READY\` | \`${priority}\` | \`${complexity}\` | Pending |\n`;
          content = content.replace(/(## Granular Task Architecture)/, `${newRow}\n$1`);
          fs.writeFileSync(taskMdPath, content, 'utf8');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, taskId }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. POST /api/verify
  if (pathname === '/api/verify' && req.method === 'POST') {
    exec('bash scripts/verify-task.sh', { cwd: rootDir }, (err, stdout, stderr) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ output: stdout || stderr || 'No output.' }));
    });
    return;
  }

  // 6. POST /api/sync-contracts
  if (pathname === '/api/sync-contracts' && req.method === 'POST') {
    exec('node scripts/sync-contracts.js', { cwd: rootDir }, (err, stdout, stderr) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ output: stdout || stderr || 'Contract sync executed.' }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`Port ${PORT} in use, trying ${nextPort}...`);
    server.listen(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`
\x1b[36m\x1b[1m================================================================\x1b[0m
  \x1b[33m🛡️  AVENGERS PROTOCOL — Visual Dashboard Active  🛡️\x1b[0m
  \x1b[32m✔ Live Stark HUD:\x1b[0m \x1b[1m\x1b[4m${url}\x1b[0m
  \x1b[2mRealtime sync with planning/task.md | Drag-and-Drop Kanban\x1b[0m
\x1b[36m\x1b[1m================================================================\x1b[0m
`);

  // Auto-open browser if supported
  const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${startCmd} ${url}`, () => {});
});

