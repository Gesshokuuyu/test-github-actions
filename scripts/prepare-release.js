#!/usr/bin/env node

/**
 * Script de calculo e preparacao de Release SemVer.
 * Atualiza os arquivos de versao, gera o RELEASE_NOTES.md e atualiza o CHANGELOG.md.
 *
 * Uso:
 *   node scripts/prepare-release.js --type auto [--custom-version 1.2.0] [--dry-run] [--ci]
 *   node scripts/prepare-release.js --type patch|minor|major|prerelease-rc|prerelease-beta|prerelease-alpha
 */

const fs = require('fs');
const { getRepoUrl, getArgValue } = require('./lib/git');
const { parseSemVer, getCurrentVersionInfo, incrementVersion } = require('./lib/semver');
const { analyzeCommitsSince } = require('./lib/commits');
const {
  RELEASE_NOTES_PATH,
  generateReleaseNotes,
  updateProjectVersionFiles,
  prependChangelog,
} = require('./lib/changelog');

const args = process.argv.slice(2);
const releaseTypeInput = getArgValue(args, '--type', 'auto');
const customVersionInput = getArgValue(args, '--custom-version', '');
const dryRun = args.includes('--dry-run');
const isCi = args.includes('--ci') || Boolean(process.env.GITHUB_OUTPUT);

const info = getCurrentVersionInfo();
const baseTag = info.latestTag;
const analysis = analyzeCommitsSince(baseTag);

let targetVersion = null;
let bumpApplied = releaseTypeInput;

if (customVersionInput) {
  targetVersion = parseSemVer(customVersionInput);
  if (!targetVersion) {
    console.error(
      `[ERRO] A versao informada "${customVersionInput}" nao segue o padrao SemVer (ex: 1.2.3 ou v1.2.3-rc.1).`
    );
    process.exit(1);
  }
  bumpApplied = 'custom';
} else if (releaseTypeInput === 'auto') {
  if (!baseTag) {
    targetVersion = parseSemVer(info.packageVersion) || parseSemVer('1.0.0');
    bumpApplied = 'initial';
  } else if (analysis.suggestedBump === 'none') {
    console.log(
      '[INFO] Nenhum commit elegivel para incremento de versao (feat, fix, perf, breaking) desde a ultima tag.'
    );
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, 'should_release=false\n');
    }
    process.exit(0);
  } else {
    targetVersion = incrementVersion(baseTag, analysis.suggestedBump);
    bumpApplied = analysis.suggestedBump;
  }
} else {
  const baseVersion = baseTag || info.packageVersion;
  targetVersion = incrementVersion(baseVersion, releaseTypeInput);
}

const notes = generateReleaseNotes({
  versionInfo: targetVersion,
  previousTag: baseTag,
  analysis,
  repoUrl: getRepoUrl(),
});

if (isCi) {
  fs.writeFileSync(RELEASE_NOTES_PATH, notes, 'utf8');
}

if (!dryRun) {
  updateProjectVersionFiles(targetVersion.raw);
  prependChangelog(notes);
}

console.log(
  `[OK] Versao preparada: ${targetVersion.tag} (Incremento: ${bumpApplied}, Dry-Run: ${dryRun})`
);

if (!isCi && !dryRun) {
  console.log('[INFO] Comandos sugeridos para concluir o lancamento manualmente:');
  console.log('  git add package*.json CHANGELOG.md');
  console.log(`  git commit -m "chore(release): ${targetVersion.tag}"`);
  console.log(`  git tag -a ${targetVersion.tag} -m "Release ${targetVersion.tag}"`);
  console.log('  git push --follow-tags');
}

if (process.env.GITHUB_OUTPUT) {
  const outputs = [
    'should_release=true',
    `version_raw=${targetVersion.raw}`,
    `version_tag=${targetVersion.tag}`,
    `major_tag=v${targetVersion.major}`,
    `minor_tag=v${targetVersion.major}.${targetVersion.minor}`,
    `is_prerelease=${targetVersion.isPrerelease}`,
    `previous_tag=${baseTag || ''}`,
    `bump_type=${bumpApplied}`,
  ];
  fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs.join('\n') + '\n');
}
