# Template Padronizado de Workflows Git, SemVer, Releases, Stable e Rollback

Repositório de referência contendo uma arquitetura completa e modular de CI/CD com **GitHub Actions**, **Versionamento Semântico (SemVer 2.0.0)**, controle de canal de produção (**`stable`**), **Rollback** e **Hotfix**.

Para a explicação detalhada de como trabalhar entre as branches, exemplos de cenários de emergência e o passo a passo de integração em projetos reais, consulte o **[Manual Completo (`WORKFLOW_GUIDE.md`)](./WORKFLOW_GUIDE.md)**.

---

## Estrutura do Projeto

- **[`.github/workflows/ci.yml`](./.github/workflows/ci.yml):** Validação de Pull Requests, padrão Conventional Commits, lint, testes e build.
- **[`.github/workflows/release.yml`](./.github/workflows/release.yml):** Cálculo automático/manual de versão SemVer, atualização de `CHANGELOG.md`, criação de tags (`vX.Y.Z`, `vX`, `vX.Y`) e publicação de GitHub Release.
- **[`.github/workflows/stable-deploy.yml`](./.github/workflows/stable-deploy.yml):** Deploy rastreável por ambiente (`production` / `staging`) e atualização da branch e tag `stable`.
- **[`.github/workflows/rollback.yml`](./.github/workflows/rollback.yml):** Reversão de versão (`revert-main-and-stable`, `only-stable-pointer` e `forward-revert-release`) com auditoria na GitHub Release.
- **[`.github/workflows/hotfix.yml`](./.github/workflows/hotfix.yml):** Criação de branch de correção urgente a partir de `stable`, publicação de versão `PATCH` e abertura automática de PR de *backport* para a `main`.
- **[`scripts/`](./scripts):** Scripts modulares zero-dependência para cálculo SemVer, validação de commits, geração de Changelog e resolução de rollback.

---

## Comandos Rápidos no Terminal

```bash
# Sincronizar branch main e tags móveis atualizadas pelo GitHub Actions
npm run git:sync

# Ver diagnóstico da versão atual, maior tag e versão ativa no canal 'stable'
npm run version:status

# Visualizar prévia do CHANGELOG.md antes de lançar versão
npm run version:preview

# Validar se os últimos commits seguem o padrão Conventional Commits
npm run commit:check

# Consultar guia rápido de prefixos de commit (feat, fix, chore, etc.)
npm run commit:guide
```

---

## Resumo do Fluxo de Trabalho

1. **Desenvolvimento:** Crie uma branch `feature/nome` ou `fix/nome` a partir da `main`.
2. **Commits:** Utilize os prefixos `fix:` (gera `PATCH`), `feat:` (gera `MINOR`) ou `feat!:` (gera `MAJOR`).
3. **Pull Request:** Abra um PR para a `main`; o workflow **01. CI** validará os testes e commits.
4. **Release e Produção:** Ao fazer Merge na `main`, o workflow **02. Release** gera a nova versão e aciona automaticamente o **03. Stable e Deploy**, atualizando a branch e tag `stable`.
5. **Contingência:** Utilize o **04. Rollback** para reverter versões com falha ou o **05. Hotfix** para correções urgentes diretas na versão `stable`.

Consulte o **[`WORKFLOW_GUIDE.md`](./WORKFLOW_GUIDE.md)** para o guia completo.
