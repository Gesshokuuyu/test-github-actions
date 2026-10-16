const fs = require('fs');
const path = require('path');
const { ROOT_DIR, PKG_PATH, git } = require('./git');

const VERSION_FILE_PATH = path.join(ROOT_DIR, 'VERSION');

// Expressao regular oficial para Semantic Versioning (SemVer 2.0.0)
const SEMVER_REGEX = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

/**
 * Converte uma string de versao (ex: "v1.2.3-rc.1") em objeto estruturado.
 */
function parseSemVer(versionStr) {
  if (!versionStr) return null;
  const match = String(versionStr).trim().match(SEMVER_REGEX);
  if (!match) return null;

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);
  const prerelease = match[4] || null;
  const build = match[5] || null;

  return {
    raw: `${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ''}`,
    tag: `v${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ''}`,
    major,
    minor,
    patch,
    prerelease,
    build,
    isPrerelease: Boolean(prerelease),
  };
}

/**
 * Compara duas strings SemVer para ordenacao decrescente (mais recente primeiro).
 */
function compareSemVerDesc(aStr, bStr) {
  const a = parseSemVer(aStr);
  const b = parseSemVer(bStr);
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  if (a.major !== b.major) return b.major - a.major;
  if (a.minor !== b.minor) return b.minor - a.minor;
  if (a.patch !== b.patch) return b.patch - a.patch;

  if (!a.prerelease && b.prerelease) return -1;
  if (a.prerelease && !b.prerelease) return 1;
  if (a.prerelease && b.prerelease) {
    return b.prerelease.localeCompare(a.prerelease, undefined, { numeric: true });
  }
  return 0;
}

/**
 * Retorna todas as tags SemVer do repositorio ordenadas da mais recente para a mais antiga.
 */
function getAllSemVerTags({ includePrerelease = true } = {}) {
  const rawTags = git('tag -l "v*"');
  if (!rawTags) return [];

  return rawTags
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter((t) => {
      const parsed = parseSemVer(t);
      if (!parsed) return false;
      if (!includePrerelease && parsed.isPrerelease) return false;
      return true;
    })
    .sort(compareSemVerDesc);
}

/**
 * Identifica qual tag SemVer (vX.Y.Z) corresponde exatamente ao ponteiro 'stable' atual.
 */
function getActiveStableTag() {
  const stableCommit =
    git('rev-list -n 1 refs/tags/stable', '') ||
    git('rev-list -n 1 origin/stable', '');

  if (!stableCommit) return null;

  const tagsAtStable = git(`tag --points-at ${stableCommit}`);
  if (!tagsAtStable) return null;

  const matched = tagsAtStable
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter((t) => {
      const parsed = parseSemVer(t);
      return parsed && !parsed.isPrerelease;
    })
    .sort(compareSemVerDesc);

  return matched[0] || null;
}

/**
 * Coleta as informacoes de versao atual do projeto (package.json, VERSION e tags Git).
 */
function getCurrentVersionInfo() {
  const allTags = getAllSemVerTags({ includePrerelease: true });
  const stableTags = getAllSemVerTags({ includePrerelease: false });

  let pkgVersion = '0.1.0';
  if (fs.existsSync(PKG_PATH)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
      if (pkg.version) pkgVersion = pkg.version;
    } catch {
      // Mantem fallback
    }
  } else if (fs.existsSync(VERSION_FILE_PATH)) {
    pkgVersion = fs.readFileSync(VERSION_FILE_PATH, 'utf8').trim();
  }

  const latestTag = allTags[0] || null;
  const highestStableTag = stableTags[0] || null;
  const activeStableTag = getActiveStableTag() || highestStableTag;

  // A versao anterior para rollback e a tag estavel imediatamente anterior a versao ativa em stable
  let previousStableTag = null;
  if (activeStableTag) {
    const activeIdx = stableTags.indexOf(activeStableTag);
    if (activeIdx !== -1 && activeIdx + 1 < stableTags.length) {
      previousStableTag = stableTags[activeIdx + 1];
    } else if (stableTags.length > 1) {
      previousStableTag = stableTags[1];
    }
  }

  const stablePointer =
    git('rev-parse --short refs/tags/stable', '') ||
    git('rev-parse --short origin/stable', '');

  return {
    packageVersion: pkgVersion,
    latestTag,
    latestStableTag: activeStableTag,
    highestStableTag,
    previousStableTag,
    stablePointer,
    allTags,
    stableTags,
  };
}

/**
 * Incrementa uma versao SemVer de acordo com o tipo solicitado.
 */
function incrementVersion(currentVersionStr, releaseType) {
  const current = parseSemVer(currentVersionStr) || parseSemVer('0.0.0');
  let { major, minor, patch, prerelease } = current;

  if (releaseType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
    prerelease = null;
  } else if (releaseType === 'minor') {
    minor += 1;
    patch = 0;
    prerelease = null;
  } else if (releaseType === 'patch') {
    if (prerelease) {
      prerelease = null;
    } else {
      patch += 1;
    }
  } else if (releaseType.startsWith('prerelease')) {
    const channel = releaseType.split('-')[1] || 'rc';
    if (prerelease && prerelease.startsWith(`${channel}.`)) {
      const currentNum = parseInt(prerelease.split('.')[1] || '0', 10);
      prerelease = `${channel}.${currentNum + 1}`;
    } else if (prerelease) {
      prerelease = `${channel}.1`;
    } else {
      minor += 1;
      patch = 0;
      prerelease = `${channel}.1`;
    }
  }

  const raw = `${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ''}`;
  return parseSemVer(raw);
}

module.exports = {
  VERSION_FILE_PATH,
  SEMVER_REGEX,
  parseSemVer,
  compareSemVerDesc,
  getAllSemVerTags,
  getActiveStableTag,
  getCurrentVersionInfo,
  incrementVersion,
};
