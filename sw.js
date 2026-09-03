// sw.js — Service Worker do AcessaAqui
// Estratégia: app shell em cache (funciona offline) + fontes em "stale-while-revalidate".
// Sempre que publicar uma nova versão do app, mude CACHE_VERSION para forçar a atualização.

const CACHE_VERSION = "acessaaqui-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png"
];

// Instala o service worker e guarda o app shell em cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches de versões antigas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("acessaaqui-") && key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Permite que a página peça para o novo SW assumir imediatamente (botão "atualizar")
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isAppShellRequest(url) {
  return APP_SHELL_FILES.some((file) => url.endsWith(file.replace("./", "/")) || url.endsWith(file));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Só tratamos GET; o resto (POST etc.) vai direto para a rede
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

  // Navegação (abrir/recarregar o app): tenta rede, cai para o index em cache se estiver offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // App shell (html/css/js/ícones/manifest do próprio app): cache-first
  if (isSameOrigin && isAppShellRequest(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // Fontes do Google Fonts: stale-while-revalidate (usa cache rápido, atualiza em segundo plano)
  if (isGoogleFonts) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Qualquer outra requisição same-origin: tenta rede, cai para cache se houver
  if (isSameOrigin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
