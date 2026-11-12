#!/usr/bin/env node
// v273: gera public/js/rep.js — o SDK do Sentry (@sentry/browser, só erros, sem replay nem traços) num único ficheiro
// servido pelo PRÓPRIO site (assim os bloqueadores de anúncios não o apanham). Só é preciso voltar a correr isto
// quando se mudar a versão do @sentry/browser em package.json:  node tools/build-reporter.js
const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");
const entry = 'import { init, captureException } from "@sentry/browser"; window.Sentry = { init, captureException };';
const out = esbuild.buildSync({
  stdin: { contents: entry, resolveDir: path.join(__dirname, ".."), loader: "js" },
  bundle: true, minify: true, format: "iife", target: ["es2018"], write: false, legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"', "__DEBUG_BUILD__": "false" }
});
const dest = path.join(__dirname, "..", "public", "js", "rep.js");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out.outputFiles[0].contents);
console.log("public/js/rep.js:", out.outputFiles[0].contents.length, "bytes");
