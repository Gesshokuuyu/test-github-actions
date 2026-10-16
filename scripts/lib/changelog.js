const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ROOT_DIR, PKG_PATH } = require('./git');
const { VERSION_FILE_PATH } = require('./semver');

const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');
const RELEASE_NOTES_PATH = path.join(ROOT_DIR, 'RELEASE_NOTES.md');

/**
 * Gera o texto Markdown das notas de versao (Release Notes / Changelog).
 */
function generateReleaseNotes({ versionInfo, previousTag, analysis, repoUrl }) {
  const dateStr = new Date().toISOString().split('T')[0];
  const lines = [];

  lines.push(`## [${versionInfo.tag}] - ${dateStr}`);
  lines.push('');

  const formatItem = (c) => {
    const scopePrefix = c.scope ? `**${c.scope}:** ` : '';
    return `- ${scopePrefix}${c.description} (\`${c.hash}\`)`;
  };

  if (analysis.categories.breaking.length > 0) {
    lines.push('### Mudancas Incompativeis (Breaking Changes)');
    analysis.categories.breaking.forEach((c) => lines.push(formatItem(c)));
    lines.push('');
  }

  if (analysis.categories.feat.length > 0) {
    lines.push('### Novas Funcionalidades (Features)');
    analysis.categories.feat.forEach((c) => lines.push(formatItem(c)));
    lines.push('');
  }

  if (analysis.categories.fix.length > 0) {
    lines.push('### Correcoes (Bug Fixes)');
    analysis.categories.fix.forEach((c) => lines.push(formatItem(c)));
    lines.push('');
  }

  if (analysis.categories.perf.length > 0 || analysis.categories.refactor.length > 0) {
    lines.push('### Performance e Refatoracoes');
    [...analysis.categories.perf, ...analysis.categories.refactor].forEach((c) =>
      lines.push(formatItem(c))
    );
    lines.push('');
  }

  if (analysis.categories.docs.length > 0 || analysis.categories.other.length > 0) {
    lines.push('### Manutencao e Outros');
    [...analysis.categories.docs, ...analysis.categories.other].forEach((c) =>
      lines.push(formatItem(c))
    );
    lines.push('');
  }

  if (analysis.commits.length === 0) {
    lines.push('- Release gerada manualmente (sem novos commits de codigo desde a ultima versao).');
    lines.push('');
  }

  if (previousTag && repoUrl) {
    const cleanUrl = repoUrl.replace(/\.git$/, '').replace(/^git\+/, '');
    lines.push(
      `**Comparacao de alteracoes:** [\`${previousTag}...${versionInfo.tag}\`](${cleanUrl}/compare/${previousTag}...${versionInfo.tag})`
    );
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Atualiza a versao no package.json, package-lock.json e/ou arquivo VERSION.
 */
function updateProjectVersionFiles(newVersionRaw) {
  if (fs.existsSync(PKG_PATH)) {
    try {
      execSync(`npm version ${newVersionRaw} --no-git-tag-version --allow-same-version`, {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
    } catch {
      const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
      pkg.version = newVersionRaw;
      fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }
  }

  if (fs.existsSync(VERSION_FILE_PATH)) {
    fs.writeFileSync(VERSION_FILE_PATH, `${newVersionRaw}\n`, 'utf8');
  }
}

/**
 * Insere a nova entrada no topo do CHANGELOG.md preservando o historico anterior.
 */
function prependChangelog(releaseNotesMarkdown) {
  const header =
    '# Changelog\n\nTodas as mudancas notaveis neste projeto serao documentadas neste arquivo.\nO formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e este projeto adere ao [Versionamento Semantico (SemVer)](https://semver.org/lang/pt-BR/).\n\n';

  if (!fs.existsSync(CHANGELOG_PATH)) {
    fs.writeFileSync(CHANGELOG_PATH, `${header}${releaseNotesMarkdown}\n`, 'utf8');
    return;
  }

  const existing = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const firstVersionIndex = existing.indexOf('\n## [');

  if (firstVersionIndex !== -1) {
    const updated =
      existing.slice(0, firstVersionIndex + 1) +
      releaseNotesMarkdown +
      '\n' +
      existing.slice(firstVersionIndex + 1);
    fs.writeFileSync(CHANGELOG_PATH, updated, 'utf8');
  } else {
    fs.writeFileSync(CHANGELOG_PATH, `${existing.trim()}\n\n${releaseNotesMarkdown}\n`, 'utf8');
  }
}

module.exports = {
  CHANGELOG_PATH,
  RELEASE_NOTES_PATH,
  generateReleaseNotes,
  updateProjectVersionFiles,
  prependChangelog,
};
