# Changelog

## 2026-10-22/23 — Redesenho completo (v129–v140)

Novo desenho em todo o site (escuro + claro): ecrã Início, páginas de
modalidade, cabeçalho "Dragão Stats", navegação inferior com menu "Mais",
botão "Lembrar-me" (aviso 1 hora antes; requer Apps Script v93), calendário
com linhas modernas e filtros em pílulas, modo edição com barra "Gestão",
Histórico/Esta semana/Marcadores restyle, formulários e painéis, esqueleto de
carregamento, páginas SEO das modalidades, correção do transbordo da
newsletter. Detalhes e localização no código em `CLAUDE.md`.
Último zip: `dragaostats-deploy-v140.zip`. Versão anterior sem redesenho: v126.

## 2026-10-14 — Divisão em módulos

O `index.html` (um único ficheiro de ~450KB) foi dividido em módulos mais
pequenos dentro de `src/` (ver `CLAUDE.md`), sem mudar nenhum comportamento —
confirmado com uma comparação byte a byte entre o `index.html` original e o
resultado do `build.js` logo após a divisão. Esta versão corresponde ao que
estava publicado como `dragaostats-deploy-v95.zip`.

Nenhuma funcionalidade foi alterada nesta divisão; é só reorganização do
código para facilitar trabalhar nele.
