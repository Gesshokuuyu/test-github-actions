#!/usr/bin/env node

/**
 * Script de validacao de mensagens de commit segundo o padrao Conventional Commits.
 * Uso:
 *   node scripts/validate-commits.js
 *   node scripts/validate-commits.js --base origin/main --head HEAD [--strict]
 */

const fs = require('fs');
const { git, getArgValue } = require('./lib/git');
const { CONVENTIONAL_COMMIT_REGEX } = require('./lib/commits');

const args = process.argv.slice(2);
const baseRef = getArgValue(args, '--base', '');
const headRef = getArgValue(args, '--head', 'HEAD');
const strict = args.includes('--strict');

const range = baseRef ? `${baseRef}..${headRef}` : '-n 10';
const rawLog = git(`log ${range} --no-merges --pretty=format:"%h|%s"`);
const lines = rawLog ? rawLog.split(/\r?\n/).filter(Boolean) : [];

console.log('--------------------------------------------------------------');
console.log(' VALIDACAO DE CONVENTIONAL COMMITS');
console.log('--------------------------------------------------------------');

let invalidCount = 0;
const tableRows = [];

for (const line of lines) {
  const [hash, ...rest] = line.split('|');
  const subject = rest.join('|').trim();

  if (
    subject.startsWith('Merge ') ||
    subject.startsWith('Initial commit') ||
    subject.includes('[skip ci]')
  ) {
    continue;
  }

  const isValid = CONVENTIONAL_COMMIT_REGEX.test(subject);
  if (!isValid) invalidCount += 1;

  const statusText = isValid ? '[OK] Valido' : '[WARN] Fora do padrao';
  console.log(` ${statusText.padEnd(22)} | ${hash} | ${subject}`);
  tableRows.push(`| \`${hash}\` | ${subject.replace(/\|/g, '\\|')} | ${statusText} |`);
}

console.log('--------------------------------------------------------------');

if (process.env.GITHUB_STEP_SUMMARY && tableRows.length > 0) {
  const summaryMd = [
    '### Relatorio de Validacao de Commits (Conventional Commits)',
    '| Commit | Mensagem | Status |',
    '| :--- | :--- | :--- |',
    ...tableRows,
    '',
    invalidCount > 0
      ? `> **Aviso:** Foram encontrados **${invalidCount}** commit(s) fora do padrao Conventional Commits (\`feat:\`, \`fix:\`, \`chore:\`, etc.).`
      : '> **Status:** Todos os commits analisados seguem o padrao Conventional Commits.',
    '',
  ].join('\n');
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd);
}

if (strict && invalidCount > 0) {
  console.error(
    `[ERRO] Falha na validacao estrita: ${invalidCount} commit(s) fora do padrao Conventional Commits.`
  );
  console.error('[INFO] Execute "npm run commit:guide" para consultar os formatos aceitos.');
  process.exit(1);
}
