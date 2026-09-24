const NOMBRE_CACHE = 'arca-cache-v1';
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

// Instalar el Service Worker y guardar archivos en caché
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(NOMBRE_CACHE).then((cache) => {
            return cache.addAll(ARCHIVOS_A_GUARDAR);
        })
    );
});
// Responder con archivos de la caché si no hay conexión, ignorando APIs externas o de terceros
self.addEventListener('fetch', (e) => {
    // Si la petición es de otra cosa externa (como el traductor), déjala pasar libremente
    if (!e.request.url.startsWith(self.location.origin)) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((respuestaCached) => {
            return respuestaCached || fetch(e.request).catch(() => {
                // Si falla la red para un archivo tuyo propio, devolvemos un respaldo seguro
                return new Response("Recurso no disponible offline", {
                    status: 404,
                    statusText: "Not Found"
                });
            });
        })
    );
});