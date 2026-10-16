#!/usr/bin/env node

/**
 * Guia de referencia rapida do padrao Conventional Commits no terminal.
 * Uso:
 *   node scripts/commit-guide.js
 */

console.log(`
----------------------------------------------------------------------
 GUIA DE REFERENCIA - CONVENTIONAL COMMITS & SEMVER
----------------------------------------------------------------------
 Formato: <tipo>(<escopo opcional>): <descricao curta>

 Tipos que geram incremento de versao automaticamente:
  - feat:     Nova funcionalidade          -> Incrementa MINOR (0.X.0)
  - fix:      Correcao de bug              -> Incrementa PATCH (0.0.X)
  - perf:     Melhoria de performance      -> Incrementa PATCH (0.0.X)
  - revert:   Reversao de commit anterior  -> Incrementa PATCH (0.0.X)
  - feat!: ou BREAKING CHANGE no rodape    -> Incrementa MAJOR (X.0.0)

 Tipos administrativos (sem incremento automatico isolado):
  - docs:     Alteracoes exclusivas de documentacao
  - style:    Formatacao, lint (sem alteracao de logica)
  - refactor: Refatoracao de codigo (sem nova feat nem fix)
  - test:     Adicao ou manutencao de testes automatizados
  - build:    Alteracoes em ferramentas de build ou dependencias
  - ci:       Alteracoes nos arquivos de pipeline CI/CD
  - chore:    Tarefas gerais de manutencao

 Exemplos:
  git commit -m "feat(auth): adiciona autenticacao OAuth2"
  git commit -m "fix(api): corrige tratamento de timeout na rota de pagamentos"
  git commit -m "feat(api)!: altera contrato de resposta do endpoint v2"
----------------------------------------------------------------------
`);
