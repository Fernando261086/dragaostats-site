// Notificações push a sério (Firebase Cloud Messaging) — trata das notificações
// que chegam com a app fechada ou em segundo plano. Não interfere em nada do
// resto deste ficheiro (cache, instalação, etc.), só acrescenta o processamento
// de mensagens push.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyDSKjE-hTNayvLdjbs616i3K6qYWQOFRYw",
  authDomain: "dragaostats-31945.firebaseapp.com",
  projectId: "dragaostats-31945",
  storageBucket: "dragaostats-31945.firebasestorage.app",
  messagingSenderId: "266556086254",
  appId: "1:266556086254:web:1d8bdfaba3f5b096c320ff"
});
firebase.messaging(); // já trata sozinho de mostrar a notificação quando chega em segundo plano

const CACHE_NAME = "dia22-cache-v298";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./manifest-edit.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192-maskable.png",
  "./icon-512-maskable.png",
  "./header-emblem.png",
  "./dragao-stats-logo.png"
];

self.addEventListener("install", (event) => {
  // Cada ficheiro é guardado SEPARADAMENTE (não tudo-ou-nada): se um ícone falhar
  // a descarregar por um instante de rede instável, os outros continuam a ficar
  // guardados na mesma — sobretudo o "./index.html", que é o que mais importa
  // ter sempre disponível para a app nunca ficar presa no ecrã do logo.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(ASSETS_TO_CACHE.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Nunca guardar em cache os pedidos ao Apps Script — têm de ir sempre à rede,
  // é onde vivem os dados reais e atualizados.
  if (url.includes("script.google.com") || url.includes("script.googleusercontent.com")) {
    return;
  }

  // /edicao é redirecionado pelo servidor para /?view=edit — deixa o browser tratar
  // desse redirecionamento sozinho, sem o service worker pelo meio.
  if (event.request.mode === "navigate" &&
      new URL(url).pathname.replace(/\/$/, "").toLowerCase().endsWith("/edicao")) {
    return;
  }

  // Estatísticas do Cloudflare (Web Analytics) — deixa passar direto, sem tocar.
  if (url.includes("cloudflareinsights.com")) {
    return;
  }

  // A página principal (o HTML da app) vai sempre primeiro à rede, para nunca
  // mostrar uma versão antiga — mas com um LIMITE DE TEMPO: se a rede demorar
  // mais de 4s a responder (comum ao reabrir a app, com a ligação ainda "a
  // acordar"), usa já a cópia guardada em vez de ficar presa no ecrã do logo à
  // espera. Quando a rede finalmente responder, a cópia guardada é atualizada
  // na mesma, para a próxima vez já vir mais recente.
  const isAppShell = event.request.mode === "navigate" ||
    url.endsWith("/") || url.endsWith("/index.html");

  if (isAppShell) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const networkPromise = fetch(event.request)
          .then((response) => {
            // só guarda respostas boas (nunca um erro 404/500 nem um redirecionamento)
            if (response && response.ok && response.type === "basic") {
              cache.put(event.request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => null);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 4000));

        const fast = await Promise.race([networkPromise, timeoutPromise]);
        if (fast) return fast;

        // rede lenta ou falhou: mostra já a cópia guardada, sem esperar mais
        const cached = await cache.match(event.request);
        if (cached) return cached;

        // sem cache nenhuma ainda (ex: primeiríssima visita) — só aí vale a pena
        // continuar à espera da rede, porque não há mais nada para mostrar
        const late = await networkPromise;
        return late || new Response("Sem ligação à internet.", { status: 503 });
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
