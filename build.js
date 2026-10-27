#!/usr/bin/env node
// Junta os módulos de src/ num único index.html, pronto a publicar —
// exatamente como o site sempre funcionou, só que agora escrito em vários
// ficheiros mais pequenos em vez de um só gigante.
//
// Uso: node build.js
// Resultado: dist/index.html (mais os ficheiros estáticos copiados de public/)

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

function readDirSorted(dir) {
  return fs.readdirSync(dir).filter(f => !f.startsWith(".")).sort();
}

function readAllIn(dir) {
  return readDirSorted(dir).map(f => fs.readFileSync(path.join(dir, f), "utf-8")).join("");
}

function build() {
  const headBeforeStyle = fs.readFileSync(path.join(SRC, "template/01-head-before-style.html"), "utf-8");
  const betweenStyleAndScript = fs.readFileSync(path.join(SRC, "template/02-between-style-and-script.html"), "utf-8");
  const tail = fs.readFileSync(path.join(SRC, "template/03-tail.html"), "utf-8");

  let css = readAllIn(path.join(SRC, "styles"));
  let js = readAllIn(path.join(SRC, "scripts"));

  // v190: reduz espaços e comentários (NÃO muda nomes de funções/variáveis, por
  // isso os onclick do HTML e tudo o resto continuam iguais). `node build.js --no-min`
  // gera a versão legível (para depurar). Sem o esbuild instalado, não reduz.
  let minNote = "sem reduzir";
  if (!process.argv.includes("--no-min")) {
    try {
      const esbuild = require("esbuild");
      js = esbuild.transformSync(js, { loader: "js", minifyWhitespace: true, minifySyntax: false, legalComments: "none" }).code;
      css = esbuild.transformSync(css, { loader: "css", minifyWhitespace: true, minifySyntax: false, legalComments: "none" }).code;
      minNote = "reduzido";
    } catch (e) {
      console.log("Aviso: não consegui reduzir (" + String(e.message).split("\n")[0] + ") — gerado sem reduzir.");
    }
  }

  const html = headBeforeStyle + css + betweenStyleAndScript + js + tail;

  // v192: limpa o dist antes (para ficheiros apagados em public/ não ficarem esquecidos no zip)
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, "index.html"), html, "utf-8");

  // copia os ficheiros estáticos (manifest.json, sw.js, ícones, páginas por
  // modalidade, etc.) tal como estão, sem precisarem de nenhum módulo
  if (fs.existsSync(PUBLIC)) {
    copyDirInto(PUBLIC, DIST);
  }

  console.log("Build pronto em dist/index.html (" + html.length + " caracteres, " + minNote + ").");
}

function copyDirInto(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirInto(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

build();
