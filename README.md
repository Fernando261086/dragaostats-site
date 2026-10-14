# Dragão Stats

Código fonte do site [dragaostats.pt](https://dragaostats.pt) — calendário,
resultados e estatísticas do FC Porto em várias modalidades.

Ver `CLAUDE.md` para como o código está organizado e como gerar o site a
partir dos módulos.

## Build

```
node build.js
```

Gera `dist/index.html` e copia os ficheiros estáticos de `public/` para
`dist/`. O conteúdo de `dist/` é o que se publica.
