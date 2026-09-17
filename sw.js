const NOMBRE_CACHE = 'arca-cache-v1';
const ARCHIVOS_A_GUARDAR = [
    '/',
    '/home.html',
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

// Instalar el Service Worker y guardar archivos en caché
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(NOMBRE_CACHE).then((cache) => {
            return cache.addAll(ARCHIVOS_A_GUARDAR);
        })
    );
});

// Responder con archivos de la caché si no hay conexión
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((respuestaCached) => {
            return respuestaCached || fetch(e.request).catch(() => {
                // Si falla la red y no está en caché, opcionalmente puedes devolver una página offline genérica
            });
        })
    );
});