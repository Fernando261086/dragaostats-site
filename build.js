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

  const css = readAllIn(path.join(SRC, "styles"));
  const js = readAllIn(path.join(SRC, "scripts"));

  const html = headBeforeStyle + css + betweenStyleAndScript + js + tail;

  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, "index.html"), html, "utf-8");

  // copia os ficheiros estáticos (manifest.json, sw.js, ícones, páginas por
  // modalidade, etc.) tal como estão, sem precisarem de nenhum módulo
  if (fs.existsSync(PUBLIC)) {
    copyDirInto(PUBLIC, DIST);
  }

  console.log("Build pronto em dist/index.html (" + html.length + " caracteres).");
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
