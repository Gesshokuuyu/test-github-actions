#!/usr/bin/env node

/**
 * Script de diagnostico de versao SemVer, tags e previa de Changelog.
 * Uso:
 *   node scripts/status.js
 *   node scripts/status.js --preview
 */

const { getRepoUrl } = require('./lib/git');
const { parseSemVer, getCurrentVersionInfo, incrementVersion } = require('./lib/semver');
const { analyzeCommitsSince } = require('./lib/commits');
const { generateReleaseNotes } = require('./lib/changelog');

const args = process.argv.slice(2);
const showPreview = args.includes('--preview');

const info = getCurrentVersionInfo();
const baseTag = info.latestTag;
const analysis = analyzeCommitsSince(baseTag);

const effectiveBump = !baseTag
  ? 'initial'
  : analysis.suggestedBump === 'none'
    ? 'patch'
    : analysis.suggestedBump;

const nextVersion = !baseTag
  ? parseSemVer(info.packageVersion) || parseSemVer('1.0.0')
  : incrementVersion(baseTag, effectiveBump);

console.log('--------------------------------------------------------------');
console.log(' DIAGNOSTICO DE VERSIONAMENTO SEMANTICO (SemVer)');
console.log('--------------------------------------------------------------');
console.log(` Versao no package.json (branch atual) : v${info.packageVersion}`);
console.log(` Maior Tag registrada no historico     : ${info.latestTag || '(Nenhuma tag registrada)'}`);
console.log(` Versao Ativa no Canal 'stable'        : ${info.latestStableTag || '(Nenhuma release estavel)'}${info.stablePointer ? ` (commit ${info.stablePointer})` : ''}`);
console.log(` Tag Stable Anterior (alvo rollback)   : ${info.previousStableTag || '(Indisponivel para rollback automatico)'}`);
console.log('--------------------------------------------------------------');
console.log(` Commits desde ${baseTag || 'o inicio'}                : ${analysis.commits.length}`);
console.log(` Sugestao de Bump SemVer               : ${effectiveBump.toUpperCase()}`);
console.log(` Proxima Versao prevista               : ${nextVersion.tag}`);
console.log('--------------------------------------------------------------');

if (showPreview) {
  console.log('\nPREVIA DO CHANGELOG:\n');
  console.log(
    generateReleaseNotes({
      versionInfo: nextVersion,
      previousTag: baseTag,
      analysis,
      repoUrl: getRepoUrl(),
    })
  );
}
