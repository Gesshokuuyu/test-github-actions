const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const PKG_PATH = path.join(ROOT_DIR, 'package.json');

/**
 * Executa um comando Git no diretorio raiz do projeto e retorna a saida limpa.
 */
function git(command, fallback = '') {
  try {
    return execSync(`git ${command}`, {
      cwd: ROOT_DIR,
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
  } catch {
    return fallback;
  }
}

/**
 * Obtem a URL HTTP do repositorio a partir do package.json ou do remote origin.
 */
function getRepoUrl() {
  if (fs.existsSync(PKG_PATH)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
      if (pkg.repository && pkg.repository.url) {
        return pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
      }
    } catch {
      // Continua para o fallback via git config
    }
  }

  const remote = git('config --get remote.origin.url', '');
  if (remote.startsWith('git@github.com:')) {
    return 'https://github.com/' + remote.replace('git@github.com:', '').replace(/\.git$/, '');
  }
  return remote.replace(/\.git$/, '');
}

/**
 * Lê um argumento de linha de comando no formato --flag valor.
 */
function getArgValue(args, flag, defaultValue = '') {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultValue;
}

module.exports = {
  ROOT_DIR,
  PKG_PATH,
  git,
  getRepoUrl,
  getArgValue,
};
