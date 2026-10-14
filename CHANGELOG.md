# Changelog

## 2026-10-14 — Divisão em módulos

O `index.html` (um único ficheiro de ~450KB) foi dividido em módulos mais
pequenos dentro de `src/` (ver `CLAUDE.md`), sem mudar nenhum comportamento —
confirmado com uma comparação byte a byte entre o `index.html` original e o
resultado do `build.js` logo após a divisão. Esta versão corresponde ao que
estava publicado como `dragaostats-deploy-v95.zip`.

Nenhuma funcionalidade foi alterada nesta divisão; é só reorganização do
código para facilitar trabalhar nele.
