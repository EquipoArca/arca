// 1. Cargar notificaciones desde localStorage
let listaNotificaciones = JSON.parse(localStorage.getItem('arca_notificaciones')) || [
    { id: 1, mensaje: "Inicio de sesión requerido", fecha: "16 Sep", origen: "Sistema ARCA" }
];

function obtenerContenedor() {
    return document.getElementById('contenedorNotificaciones');
}

// 2. Guardar en localStorage
function guardarNotificaciones() {
    localStorage.setItem('arca_notificaciones', JSON.stringify(listaNotificaciones));
}

// 3. Función unificada para borrar y guardar
window.eliminarNotificacion = function(id) {
    listaNotificaciones = listaNotificaciones.filter(notif => notif.id !== Number(id));
    guardarNotificaciones(); // Guarda de verdad en todas las vistas
    renderizarNotificaciones(listaNotificaciones);
};

// ==========================================
// RENDERIZADO DE NOTIFICACIONES
// ==========================================
function renderizarNotificaciones(lista) {
    const contenedor = obtenerContenedor();
    if (!contenedor) return;
    
    contenedor.innerHTML = '';

    if (!lista || lista.length === 0) {
        contenedor.style.justifyContent = 'center';
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <svg class="svg-perrito-vacio" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 82C25 80 35 83 45 81C55 83 65 80 85 82" stroke="#A8E6CF" stroke-width="4" stroke-linecap="round"/>
                    <path d="M25 81L23 75M28 81L30 74M68 81L66 74M72 81L75 75" stroke="#A8E6CF" stroke-width="3" stroke-linecap="round"/>
                    <path d="M35 32C22 32 18 48 24 60C28 68 36 68 38 60C40 52 38 42 35 32Z" fill="var(--perrito-orejas, #E8A598)"/>
                    <path d="M65 32C78 32 82 48 76 60C72 68 64 68 62 60C60 52 62 42 65 32Z" fill="var(--perrito-orejas, #E8A598)"/>
                    <circle cx="50" cy="46" r="20" fill="var(--perrito-cuerpo, #FCEADE)"/>
                    <ellipse cx="50" cy="64" rx="21" ry="17" fill="var(--perrito-cuerpo, #FCEADE)"/>
                    <rect x="39" y="66" width="9" height="15" rx="4.5" fill="var(--perrito-cuerpo, #FCEADE)" stroke="var(--perrito-orejas, #E8A598)" stroke-width="1.5"/>
                    <rect x="52" y="66" width="9" height="15" rx="4.5" fill="var(--perrito-cuerpo, #FCEADE)" stroke="var(--perrito-orejas, #E8A598)" stroke-width="1.5"/>
                    <circle cx="42" cy="44" r="2.5" fill="var(--perrito-detalles, #4A3E3D)"/>
                    <circle cx="58" cy="44" r="2.5" fill="var(--perrito-detalles, #4A3E3D)"/>
                    <ellipse cx="50" cy="49" rx="3.5" ry="2.2" fill="var(--perrito-detalles, #4A3E3D)"/>
                    <path d="M46 52C48 54 52 54 54 52" stroke="var(--perrito-detalles, #4A3E3D)" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="38" cy="48" r="3.5" fill="#FFB7B2" opacity="0.6"/>
                    <circle cx="62" cy="48" r="3.5" fill="#FFB7B2" opacity="0.6"/>
                    <path d="M68 26C68 21 74 21 74 26C74 29 70 29 70 33" stroke="#F2A4AD" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="70" cy="37" r="1.5" fill="#F2A4AD"/>
                </svg>
                <h2>¡Sin notificaciones por aquí!</h2>
                <p class="subtexto-vacio">Todo está tranquilo por ahora &lt;3</p>
            </div>
        `;
        return;
    }

    contenedor.style.justifyContent = 'flex-start';
    lista.forEach(notif => {
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta-notificacion');

        tarjeta.innerHTML = `
            <div class="header-notificacion">
                <span class="badge-mensaje">${notif.mensaje.toUpperCase()}</span>
                <div class="header-notif-derecha">
                    <span class="fecha-notificacion">${notif.fecha}</span>
                    <button class="btn-borrar-notif" data-id="${notif.id}" title="Borrar notificación">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <div class="cuerpo-notificacion">
                <span class="etiqueta-origen">${notif.origen.toUpperCase()}</span>
                <button class="btn-detalles-notif" onclick="verDetalles(${notif.id})">Ver detalles</button>
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}

window.verDetalles = function(idNotificacion) {
    if (!navigator.onLine) {
        mostrarAlertaOffline();
        return;
    }

    const contenedor = obtenerContenedor();
    if (!contenedor) return;

    contenedor.style.justifyContent = 'center';
    contenedor.innerHTML = `
        <div class="tarjeta-pasos-login">
            <button class="btn-volver" onclick="renderizarNotificaciones(listaNotificaciones)">← Volver a notificaciones</button>
            <h2>Inicia sesión en 3 sencillos pasos</h2>
            <p class="subtexto-pasos">Completa este proceso para acceder a tu cuenta de ARCA</p>
            <div class="contenedor-pasos">
                <div class="paso-item">
                    <div class="paso-numero">1</div>
                    <div class="paso-contenido">
                        <h3>Ingresa tu correo</h3>
                        <p>Escribe el correo electrónico asociado a tu cuenta.</p>
                    </div>
                </div>
                <div class="paso-item">
                    <div class="paso-numero">2</div>
                    <div class="paso-contenido">
                        <h3>Verifica tu identidad</h3>
                        <p>Ingresa el código de 6 dígitos enviado a tu e-mail.</p>
                    </div>
                </div>
                <div class="paso-item">
                    <div class="paso-numero">3</div>
                    <div class="paso-contenido">
                        <h3>Escribe tu contraseña</h3>
                        <p>Introduce tu clave de acceso para ingresar al sistema.</p>
                    </div>
                </div>
            </div>
            <a href="login.html" class="btn-ir-login">Ir a Iniciar Sesión</a>
        </div>
    `;
};

// ==========================================
// FUNCIONES AUXILIARES DE RED
// ==========================================
function mostrarAlertaOffline() {
    const overlay = document.getElementById('offline-alert-overlay');
    if (overlay) overlay.classList.remove('d-none');
}

function ocultarAlertaOffline() {
    const overlay = document.getElementById('offline-alert-overlay');
    if (overlay) overlay.classList.add('d-none');
}

window.addEventListener('offline', mostrarAlertaOffline);
window.addEventListener('online', ocultarAlertaOffline);

// ==========================================
// INICIALIZACIÓN DE LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btnCerrar = document.getElementById('close-offline-alert');
    const btnX = document.getElementById('close-x-btn');

    if (btnCerrar) btnCerrar.addEventListener('click', ocultarAlertaOffline);
    if (btnX) btnX.addEventListener('click', ocultarAlertaOffline);

    if (!navigator.onLine) {
        mostrarAlertaOffline();
    }

    const contenedor = obtenerContenedor();
    if (contenedor) {
        // Evento delegación para capturar clics en la caneca de basura
        contenedor.addEventListener('click', (e) => {
            const botonBorrar = e.target.closest('.btn-borrar-notif');
            if (botonBorrar) {
                const id = botonBorrar.getAttribute('data-id');
                window.eliminarNotificacion(id);
            }
        });

        inicializarFiltros();

    // Dibujar pantalla inicial
    renderizarNotificaciones(listaNotificaciones);
    
    }

    // Dibujar pantalla inicial
    renderizarNotificaciones(listaNotificaciones);
});

// ==========================================
// LÓGICA DE FILTROS POR CATEGORÍA
// ==========================================
function inicializarFiltros() {
    const botonesFiltro = document.querySelectorAll('.chip-filtro');

    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', (e) => {
            // 1. Quitar la clase 'activo' de todos los botones
            botonesFiltro.forEach(btn => btn.classList.remove('activo'));

            // 2. Marcar el botón presionado como activo
            e.target.classList.add('activo');

            // 3. Obtener el texto de la categoría elegida
            const categoria = e.target.textContent.trim().toLowerCase();

            // 4. Filtrar la lista de notificaciones
            filtrarNotificaciones(categoria);
        });
    });
}

function filtrarNotificaciones(categoria) {
    if (categoria === 'todas') {
        renderizarNotificaciones(listaNotificaciones);
        return;
    }

    // Filtra según la propiedad 'origen' o el tipo de notificación
    const listaFiltrada = listaNotificaciones.filter(notif => {
        return notif.origen.toLowerCase().includes(categoria);
    });

    renderizarNotificaciones(listaFiltrada);
}
