---
description:  Executa o fluxo de limpeza (clean install), validação (lint, test, build)   e verificação do Cloudflare Wrangler para garantir um deploy seguro.
---

---
name: cloudflare-deploy
description: >-
  Executa o fluxo de limpeza (clean install), validação (lint, test, build)
  e verificação do Cloudflare Wrangler para garantir um deploy seguro.
---

# Cloudflare Deploy Workflow

Sua missão neste workflow é garantir que o projeto está em um estado limpo, perfeitamente funcional e validado para deploy no Cloudflare através do OpenNext.

## Etapas de Execução

Execute os passos abaixo sequencialmente. Pare imediatamente e relate o erro ao usuário caso algum passo falhe.

1. **Limpeza e Instalação Limpa**:
   - Delete os diretórios `node_modules`, `.next` e o arquivo `package-lock.json`.
   - Rode `npm install` para instalar as dependências do zero e atualizar o lockfile.

2. **Validação de Testes**:
   - Rode `npm run test` para garantir que as alterações não quebraram nenhuma funcionalidade existente.

3. **Build da Aplicação**:
   - Rode `npm run build` para garantir que o Next.js (SSR/Client) está compilando corretamente.

4. **Validação de Código (Lint)**:
   - Rode `npm run lint` para garantir que o código segue as regras do projeto.

5. **Build do Worker Cloudflare**:
   - Rode `npm run build:worker` (OpenNext) para compilar o servidor e assets para a plataforma Cloudflare.

6. **Validação do Wrangler (Dry-Run)**:
   - Rode `npx wrangler deploy --dry-run` para validar a formatação do `wrangler.jsonc` e garantir que o bundle gerado pelo OpenNext é válido.

7. **Finalização**:
   - Se tudo passar, informe o usuário que o ambiente está limpo e validado, pronto para o deploy oficial (`npx wrangler deploy`).
