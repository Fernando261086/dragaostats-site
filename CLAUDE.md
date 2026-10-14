# Dragão Stats — site (dragaostats.pt)

Site de adeptos do FC Porto com calendário, resultados e estatísticas de
várias modalidades (Andebol, Basquetebol, Voleibol, Futsal, Hóquei em
Patins, Futebol Feminino, Equipa B). Projeto do Fernando e do irmão dele.

## Como isto está organizado

O site inteiro **era** um único `index.html` gigante (~450KB, código e estilo
tudo misturado). Foi dividido em módulos em outubro de 2026 para ser mais
seguro trabalhar nele, **sem mudar nenhum comportamento**:

```
src/
  template/           peças fixas do HTML (cabeçalho <head>, zona entre o
                      <style> e o <script> principal, e o fecho do ficheiro)
  styles/             o <style> antigo, dividido por secção (01-07, numerados
                      pela ordem em que apareciam no ficheiro original)
  scripts/            o <script> principal, dividido por secção (01-26,
                      também pela ordem original)
public/               tudo o que não é o index.html: manifest.json, sw.js,
                      ícones, páginas de cada modalidade (andebol.html, etc.),
                      robots.txt, sitemap.xml, _headers, _redirects
build.js              junta tudo de volta num único dist/index.html
```

**Regra de ouro: a ordem dos ficheiros dentro de `styles/` e `scripts/`
importa tanto como o código em si.** O `build.js` lê cada pasta por ordem
alfabética (por isso os nomes têm prefixos `01-`, `02-`, etc.) e cola tudo
sequencialmente — exatamente como estava no ficheiro original. Nunca
reordenar ficheiros só por "parecer mais lógico"; se for preciso mover
código de um ficheiro para outro, mover o código a sério, não só renomear.

## Build e deploy

```
node build.js
```

Gera `dist/index.html` (o ficheiro juntado) e copia tudo de `public/` para
`dist/`. O conteúdo de `dist/` é o que vai para o servidor — é equivalente ao
"deploy zip" que se costumava publicar manualmente em dragaostats.pt.

**Verificação de segurança feita na divisão inicial:** logo a seguir a
dividir o `index.html` original nestes módulos, corri o build e confirmei
com `diff` que o resultado era **byte a byte idêntico** ao ficheiro antes da
divisão. Isto garante que dividir em módulos não mudou nada em produção —
só a forma como o código está arrumado para trabalhar nele. Qualquer sessão
futura que reestruture mais isto deve repetir este tipo de verificação
sempre que possível (build + comparação com uma cópia conhecida de estar a
funcionar), antes de publicar.

## O site em si (contexto para trabalhar no código)

- Multi-competição: cada "competição" tem um `mode`, `"matches"` (Modo
  Modalidades — jogos públicos, visíveis a toda a gente) ou `"medals"` (Modo
  Medalhas — só para quem edita, nunca visível em links de "só ver").
- Backend: Google Apps Script + Google Sheets como base de dados (não está
  neste repositório — vive na conta Google do Fernando/irmão). O `STORE_URL`
  no `src/scripts/01-core-data-and-state.js` aponta para essa Web App.
- Notificações push a sério via Firebase Cloud Messaging, despachadas pelo
  Apps Script (não por este código do browser).
- `READONLY_MODE` distingue o link normal (edição, com password) do link "só
  ver" (`?view=readonly` ou idêntico) — muita lógica do site ramifica-se
  consoante este modo.
- Testar sem o backend a sério: o `fetch(STORE_URL)` falha nesse caso; é
  possível simular dados com `page.route()` do Playwright a interceptar o
  pedido e devolver um JSON de exemplo (ver conversas anteriores para um
  exemplo deste mock).
- O ambiente de desenvolvimento típico (sandbox cloud) **bloqueia
  fonts.googleapis.com e outros domínios externos** — um screenshot feito
  aqui pode mostrar as fontes (Bebas Neue, Archivo, Archivo Narrow) a cair
  para a fonte genérica do browser, mesmo que no site a sério carreguem bem.
  Não concluir que há um bug de tipografia só a partir de um screenshot
  feito neste tipo de sandbox — confirmar primeiro se o bloqueio de rede
  está a afetar o teste.

## Fluxo de trabalho com o Fernando

Ele não mexe em código — pede alterações em português, e espera receber de
volta um ficheiro pronto a publicar (zip com `dist/index.html` + `public/`).
Depois de qualquer alteração: correr `node build.js`, testar visualmente
(Playwright + mock de dados quando fizer sentido), e só depois empacotar.
