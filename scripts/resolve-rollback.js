#!/usr/bin/env node

/**
 * Script de resolucao e validacao de versao alvo para Rollback.
 * Uso:
 *   node scripts/resolve-rollback.js --target previous
 *   node scripts/resolve-rollback.js --target v1.0.0
 */

const fs = require('fs');
const { git, getArgValue } = require('./lib/git');
const { getCurrentVersionInfo, incrementVersion } = require('./lib/semver');

const args = process.argv.slice(2);
const targetInput = getArgValue(args, '--target', 'previous');
const info = getCurrentVersionInfo();

let resolvedTag = '';
const currentVersion = info.highestStableTag || info.latestTag || '';
const previousCandidate = info.stableTags[1] || null;

if (targetInput === 'previous' || !targetInput) {
  if (!previousCandidate) {
    console.error(
      `[ERRO] Nao ha versao estavel anterior disponivel para rollback automatico. Tags estaveis registradas: [${info.stableTags.join(', ')}]`
    );
    process.exit(1);
  }
  resolvedTag = previousCandidate;
} else {
  const normalized = targetInput.startsWith('v') ? targetInput : `v${targetInput}`;
  const existingTag = git(`tag -l "${normalized}"`);
  if (!existingTag) {
    console.error(
      `[ERRO] A tag solicitada para rollback ("${normalized}") nao foi encontrada no repositorio.`
    );
    process.exit(1);
  }
  resolvedTag = normalized;
}

const baseForPatch = currentVersion || info.packageVersion;
const nextPatch = incrementVersion(baseForPatch, 'patch');

console.log(`[OK] Rollback resolvido: de ${currentVersion || 'HEAD'} para ${resolvedTag}`);

if (process.env.GITHUB_OUTPUT) {
  const outputs = [
    `current_version=${currentVersion}`,
    `target_tag=${resolvedTag}`,
    `target_raw=${resolvedTag.replace(/^v/, '')}`,
    `forward_patch_tag=${nextPatch.tag}`,
    `forward_patch_raw=${nextPatch.raw}`,
  ];
  fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs.join('\n') + '\n');
}
