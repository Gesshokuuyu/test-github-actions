const { git } = require('./git');

// Expressao regular para Conventional Commits: type(scope)!: description
const CONVENTIONAL_COMMIT_REGEX = /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i;

/**
 * Coleta e classifica os commits desde uma referencia Git (tag) ate o HEAD.
 */
function analyzeCommitsSince(sinceRef) {
  const range = sinceRef ? `${sinceRef}..HEAD` : 'HEAD';
  const logOutput = git(`log ${range} --no-merges --pretty=format:"%h|%s|%b===COMMIT_END==="`);

  if (!logOutput) {
    return {
      commits: [],
      suggestedBump: 'none',
      categories: {
        breaking: [],
        feat: [],
        fix: [],
        perf: [],
        refactor: [],
        docs: [],
        other: [],
      },
    };
  }

  const rawEntries = logOutput
    .split('===COMMIT_END===')
    .map((e) => e.trim())
    .filter(Boolean);

  const categories = {
    breaking: [],
    feat: [],
    fix: [],
    perf: [],
    refactor: [],
    docs: [],
    other: [],
  };

  const commits = [];
  let suggestedBump = 'none';

  const bumpPriority = { none: 0, patch: 1, minor: 2, major: 3 };
  const elevateBump = (newBump) => {
    if (bumpPriority[newBump] > bumpPriority[suggestedBump]) {
      suggestedBump = newBump;
    }
  };

  for (const entry of rawEntries) {
    const parts = entry.split('|');
    const hash = parts[0];
    const subject = parts[1] || '';
    const body = parts.slice(2).join('|').trim();

    if (subject.includes('[skip ci]') || subject.startsWith('chore(release):')) {
      continue;
    }

    const match = subject.match(CONVENTIONAL_COMMIT_REGEX);
    const hasBreakingInBody =
      /BREAKING[ -]CHANGE:/i.test(body) || /BREAKING[ -]CHANGE:/i.test(subject);

    if (match) {
      const type = match[1].toLowerCase();
      const scope = match[2] || null;
      const isBreakingBang = Boolean(match[3]);
      const description = match[4];
      const isBreaking = isBreakingBang || hasBreakingInBody;

      const item = {
        hash,
        type,
        scope,
        description,
        subject,
        isBreaking,
        conventional: true,
      };
      commits.push(item);

      if (isBreaking) {
        categories.breaking.push(item);
        elevateBump('major');
      } else if (type === 'feat') {
        categories.feat.push(item);
        elevateBump('minor');
      } else if (type === 'fix' || type === 'revert') {
        categories.fix.push(item);
        elevateBump('patch');
      } else if (type === 'perf') {
        categories.perf.push(item);
        elevateBump('patch');
      } else if (type === 'refactor') {
        categories.refactor.push(item);
      } else if (type === 'docs') {
        categories.docs.push(item);
      } else {
        categories.other.push(item);
      }
    } else {
      const item = {
        hash,
        type: 'other',
        scope: null,
        description: subject,
        subject,
        isBreaking: hasBreakingInBody,
        conventional: false,
      };
      commits.push(item);
      if (hasBreakingInBody) {
        categories.breaking.push(item);
        elevateBump('major');
      } else {
        categories.other.push(item);
      }
    }
  }

  if (commits.length > 0 && suggestedBump === 'none' && !sinceRef) {
    suggestedBump = 'patch';
  }

  return { commits, suggestedBump, categories };
}

module.exports = {
  CONVENTIONAL_COMMIT_REGEX,
  analyzeCommitsSince,
};
