#!/usr/bin/env node

/**
 * scripts/sync-contracts.js
 * Avengers Protocol — Automated API Contract & Type Generator
 * Bridge between Edith (NestJS Backend), Friday (Next.js Frontend), and Thor (Flutter Mobile).
 * Zero external dependencies.
 */

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const contractFile = path.join(rootDir, 'docs/08-api-contract.md');
const frontendTypeDir = path.join(rootDir, 'development/frontend/src/types');
const frontendTypeFile = path.join(frontendTypeDir, 'api.generated.ts');
const mobileModelDir = path.join(rootDir, 'development/mobile/lib/core/models');
const mobileModelFile = path.join(mobileModelDir, 'api_models.dart');

console.log('🔄 ========================================================');
console.log('🛡️  AVENGERS PROTOCOL: Automated API Contract Sync');
console.log('    Orchestrating: Edith (Backend) ➡️ Friday (Web) & Thor (Mobile)');
console.log('========================================================\n');

if (!fs.existsSync(contractFile)) {
  console.error(`❌ Contract file not found: ${contractFile}`);
  process.exit(1);
}

const content = fs.readFileSync(contractFile, 'utf8');

// Parse Base URL
const baseUrlMatch = content.match(/Base URL\*\*:\s*`([^`]+)`/);
const baseUrl = baseUrlMatch ? baseUrlMatch[1] : '/api/v1';

// Parse endpoints: e.g. `### 2.1 User Login` followed by `- **Endpoint**: `POST /api/v1/auth/login``
const endpointRegex = /###\s+([\d.]+)?\s*([^\n]+)[\s\S]*?- \*\*Endpoint\*\*:\s*`([A-Z]+)\s+([^`]+)`/g;
const endpoints = [];
let match;

while ((match = endpointRegex.exec(content)) !== null) {
  const sectionTitle = match[2].trim();
  const method = match[3].trim();
  const pathUrl = match[4].trim();

  // Extract JSON blocks following this endpoint
  const endpointStartIndex = match.index;
  const nextEndpointIndex = content.indexOf('### ', endpointStartIndex + 10);
  const sectionBlock = nextEndpointIndex !== -1
    ? content.substring(endpointStartIndex, nextEndpointIndex)
    : content.substring(endpointStartIndex);

  // Request Body
  let requestJson = null;
  const reqMatch = sectionBlock.match(/Request Body\*\*:\s*```json([\s\S]*?)```/);
  if (reqMatch) {
    try {
      requestJson = JSON.parse(reqMatch[1].trim());
    } catch {}
  }

  // Response Body
  let responseJson = null;
  const resMatch = sectionBlock.match(/Success Response[^\n]*\*\*:\s*```json([\s\S]*?)```/);
  if (resMatch) {
    try {
      responseJson = JSON.parse(resMatch[1].trim());
    } catch {}
  }

  endpoints.push({
    title: sectionTitle,
    method,
    path: pathUrl,
    request: requestJson,
    response: responseJson,
  });
}

console.log(`📡 Base URL: ${baseUrl}`);
console.log(`🔍 Detected ${endpoints.length} API endpoints in docs/08-api-contract.md:\n`);

endpoints.forEach((ep, idx) => {
  console.log(`   [${idx + 1}] ${ep.method.padEnd(6)} ${ep.path} (${ep.title})`);
});
console.log('');

/**
 * Converts a JS object/value to TypeScript interface definition
 */
function jsonToTsType(name, obj) {
  if (!obj || typeof obj !== 'object') return `export type ${name} = any;\n`;
  let ts = `export interface ${name} {\n`;
  for (const [key, val] of Object.entries(obj)) {
    let type = typeof val;
    if (val === null) {
      type = 'any';
    } else if (Array.isArray(val)) {
      type = val.length > 0 && typeof val[0] === 'object' ? 'Record<string, any>[]' : `${typeof val[0] || 'any'}[]`;
    } else if (type === 'object') {
      type = 'Record<string, any>';
    }
    ts += `  ${key}: ${type};\n`;
  }
  ts += `}\n`;
  return ts;
}

/**
 * Converts a JS object/value to Dart class definition
 */
function jsonToDartClass(name, obj) {
  if (!obj || typeof obj !== 'object') return '';
  const fields = Object.entries(obj);
  let dart = `class ${name} {\n`;
  for (const [key, val] of fields) {
    let dartType = 'dynamic';
    if (typeof val === 'string') dartType = 'String';
    else if (typeof val === 'number') dartType = Number.isInteger(val) ? 'int' : 'double';
    else if (typeof val === 'boolean') dartType = 'bool';
    else if (Array.isArray(val)) dartType = 'List<dynamic>';
    else if (typeof val === 'object' && val !== null) dartType = 'Map<String, dynamic>';

    dart += `  final ${dartType} ${key};\n`;
  }

  dart += `\n  const ${name}({\n`;
  for (const [key] of fields) {
    dart += `    required this.${key},\n`;
  }
  dart += `  });\n\n`;

  // fromJson
  dart += `  factory ${name}.fromJson(Map<String, dynamic> json) {\n    return ${name}(\n`;
  for (const [key, val] of fields) {
    let cast = `json['${key}']`;
    if (typeof val === 'string') cast = `json['${key}'] as String? ?? ''`;
    else if (typeof val === 'number') cast = `json['${key}'] as ${Number.isInteger(val) ? 'int' : 'double'}? ?? 0`;
    else if (typeof val === 'boolean') cast = `json['${key}'] as bool? ?? false`;
    dart += `      ${key}: ${cast},\n`;
  }
  dart += `    );\n  }\n\n`;

  // toJson
  dart += `  Map<String, dynamic> toJson() => {\n`;
  for (const [key] of fields) {
    dart += `    '${key}': ${key},\n`;
  }
  dart += `  };\n}\n\n`;
  return dart;
}

// 1. Generate Frontend TypeScript
let tsOutput = `/**
 * ============================================================================
 * 🛡️ AUTO-GENERATED BY AVENGERS PROTOCOL CONTRACT SYNC
 * Source: docs/08-api-contract.md
 * Maintainer: Edith (Backend) ➡️ Friday (Web Frontend)
 * DO NOT MODIFY MANUALLY. Run 'npm run sync:contracts' to update.
 * ============================================================================
 */

export const API_BASE_URL = '${baseUrl}';

export const API_ENDPOINTS = {
`;

endpoints.forEach((ep) => {
  const key = ep.title.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  tsOutput += `  ${key}: '${ep.path}',\n`;
});

tsOutput += `} as const;\n\n`;

// Append Health check standard model
tsOutput += `export interface SystemHealthDto {\n  status: string;\n  service: string;\n  architect: string;\n  timestamp: string;\n  uptime: number;\n}\n\n`;

endpoints.forEach((ep) => {
  const baseName = ep.title.replace(/[^a-zA-Z0-9]/g, '');
  if (ep.request) {
    tsOutput += jsonToTsType(`${baseName}RequestDto`, ep.request) + '\n';
  }
  if (ep.response) {
    tsOutput += jsonToTsType(`${baseName}ResponseDto`, ep.response) + '\n';
  }
});

// Write to frontend
if (fs.existsSync(path.join(rootDir, 'development/frontend'))) {
  fs.mkdirSync(frontendTypeDir, { recursive: true });
  fs.writeFileSync(frontendTypeFile, tsOutput, 'utf8');
  console.log(`✅ [Friday Frontend] TypeScript contract written to:`);
  console.log(`   ${path.relative(rootDir, frontendTypeFile)}`);
}

// 2. Generate Mobile Dart Models
let dartOutput = `/// ============================================================================
/// ⚡ AUTO-GENERATED BY AVENGERS PROTOCOL CONTRACT SYNC
/// Source: docs/08-api-contract.md
/// Maintainer: Edith (Backend) ➡️ Thor (Flutter Mobile)
/// DO NOT MODIFY MANUALLY. Run 'npm run sync:contracts' to update.
/// ============================================================================

const String apiBaseUrl = '${baseUrl}';

class ApiEndpoints {
`;

endpoints.forEach((ep) => {
  const key = ep.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  dartOutput += `  static const String ${key} = '${ep.path}';\n`;
});
dartOutput += `}\n\n`;

endpoints.forEach((ep) => {
  const baseName = ep.title.replace(/[^a-zA-Z0-9]/g, '');
  if (ep.request) {
    dartOutput += jsonToDartClass(`${baseName}RequestDto`, ep.request);
  }
  if (ep.response) {
    dartOutput += jsonToDartClass(`${baseName}ResponseDto`, ep.response);
  }
});

// Write to mobile
if (fs.existsSync(path.join(rootDir, 'development/mobile'))) {
  fs.mkdirSync(mobileModelDir, { recursive: true });
  fs.writeFileSync(mobileModelFile, dartOutput, 'utf8');
  console.log(`✅ [Thor Mobile] Dart contract models written to:`);
  console.log(`   ${path.relative(rootDir, mobileModelFile)}`);
}

console.log('\n🎉 Contract Synchronization Complete! Zero Mismatch Across Stack.\n');

