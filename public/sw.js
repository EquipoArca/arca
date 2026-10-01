const NOMBRE_CACHE = 'arca-cache-v2'; // Cambiamos la versión para forzar la actualización

const ARCHIVOS_A_GUARDAR = [
    '/',
    '/home.html',
    '/adopciones.html',
    '/configuracion.html',
    '/detalle_reporte.html',
    '/formulario_adoptante.html',
    '/formularior.html',
    '/guardados_usuario.html',
    '/index.html',
    '/mapa.html',
    '/mis_publicaciones.html',
    '/perfil_adoptante.html',
    '/perfil_usuario.html',
    '/perfil.css',
    '/style_adopciones.css',
    '/style_guardados.css',
    '/style_home.css',
    '/dark-mode.css',
    '/notificaciones.html',
    '/notificaciones.css',
    '/novedades.html',
    '/novedades.css',
    '/novedades-reportes.html',
    '/novedades-reportes-style.css',
    '/novedades-eventos.html',
    '/novedades-eventos-style.css',
    '/novedades-adopciones.html',
    '/novedades-adopciones-style.css',
    '/script.js', 
    '/notificaciones.js'   
];

// 1. INSTALACIÓN SEGURO (Si un archivo falla, no rompe todo el SW)
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Obliga al SW nuevo a activarse inmediatamente
    e.waitUntil(
        caches.open(NOMBRE_CACHE).then((cache) => {
            return Promise.allSettled(
                ARCHIVOS_A_GUARDAR.map(url => cache.add(url).catch(err => console.warn(`No se pudo cachear: ${url}`, err)))
            );
        })
    );
});

// 2. ACTIVACIÓN (Elimina cachés viejas automáticamente)
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== NOMBRE_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. ESTRATEGIA NETWORK-FIRST (Primero la red para ver cambios en Render, luego la caché)
self.addEventListener('fetch', (e) => {
    // Si la petición es externa o a la API de tu backend, déjala pasar a la red directamente
    if (!e.request.url.startsWith(self.location.origin) || e.request.url.includes('/api/')) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((respuestaRed) => {
                // Si la red responde bien, guardamos una copia actualizada en caché y la devolvemos
                if (respuestaRed && respuestaRed.status === 200) {
                    const copiaRespuesta = respuestaRed.clone();
                    caches.open(NOMBRE_CACHE).then((cache) => cache.put(e.request, copiaRespuesta));
                }
                return respuestaRed;
            })
            .catch(() => {
                // SI NO HAY INTERNET: Buscamos en la caché como respaldo
                return caches.match(e.request).then((respuestaCached) => {
                    if (respuestaCached) {
                        return respuestaCached;
                    }
                    return new Response("No tienes conexión a Internet y este recurso no está en caché.", {
                        status: 533,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                });
            })
    );
});

