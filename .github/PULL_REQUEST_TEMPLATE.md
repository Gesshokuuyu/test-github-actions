## Descricao da Mudanca

<!-- Descreva de forma clara e objetiva o que este Pull Request altera e a motivacao. -->

---

## Impacto no Versionamento Semantico (SemVer)

Marque a classificacao principal desta alteracao (define o proximo incremento automatico de versao na `main`):

- [ ] **PATCH (`fix:` / `perf:` / `revert:`)** — Correcao de bug ou melhoria de performance retrocompativel (`1.0.X`).
- [ ] **MINOR (`feat:`)** — Nova funcionalidade retrocompativel (`1.X.0`).
- [ ] **MAJOR (`feat!:` / `BREAKING CHANGE`)** — Alteracao incompativel com versoes anteriores (`X.0.0`).
- [ ] **NENHUM (`chore:` / `docs:` / `refactor:` / `test:` / `ci:`)** — Manutencao interna sem gerar nova release imediata.

---

## Checklist de Qualidade e Seguranca

- [ ] Os commits seguem o padrao **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.).
- [ ] Testes locais (`npm run test`) e build (`npm run build`) executados sem erros.
- [ ] Caso haja **Breaking Change**, o impacto e o procedimento de migracao foram documentados abaixo.
- [ ] **Plano de Rollback:** Esta mudanca e segura para reversao via workflow `04. Rollback` caso apresente anomalia no canal `stable`.

---

## Notas de Deploy e Rollback (Opcional)

<!-- Indique variaveis de ambiente adicionadas, migracoes ou observacoes relevantes para operacao/rollback. -->
