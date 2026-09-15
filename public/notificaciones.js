document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedorNotificaciones');

    function renderizarNotificaciones(listaNotificaciones) {
        if (!contenedor) return;
        contenedor.innerHTML = '';

        if (!listaNotificaciones || listaNotificaciones.length === 0) {
            contenedor.style.justifyContent = 'center';
            
            contenedor.innerHTML = `
                <div class="estado-vacio">
                    <svg class="svg-perrito-vacio" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- Césped -->
                        <path d="M15 82C25 80 35 83 45 81C55 83 65 80 85 82" stroke="#A8E6CF" stroke-width="4" stroke-linecap="round"/>
                        <path d="M25 81L23 75M28 81L30 74M68 81L66 74M72 81L75 75" stroke="#A8E6CF" stroke-width="3" stroke-linecap="round"/>
                        
                        <!-- Orejitas caídas -->
                        <path d="M28 42C22 45 20 58 26 62C30 64 34 58 34 50" fill="#E8A598"/>
                        <path d="M72 42C78 45 80 58 74 62C70 64 66 58 66 50" fill="#E8A598"/>

                        <!-- Cuerpo redondito y gordito -->
                        <ellipse cx="50" cy="62" rx="20" ry="18" fill="#FCEADE"/>
                        
                        <!-- Cabeza -->
                        <circle cx="50" cy="45" r="18" fill="#FCEADE"/>
                        
                        <!-- Patitas delanteras -->
                        <rect x="40" y="65" width="7" height="15" rx="3.5" fill="#FCEADE" stroke="#E8A598" stroke-width="1.5"/>
                        <rect x="53" y="65" width="7" height="15" rx="3.5" fill="#FCEADE" stroke="#E8A598" stroke-width="1.5"/>

                        <!-- Ojos, hocico y sonrisa tierna -->
                        <circle cx="43" cy="43" r="2.5" fill="#4A3E3D"/>
                        <circle cx="57" cy="43" r="2.5" fill="#4A3E3D"/>
                        <ellipse cx="50" cy="48" rx="3" ry="2" fill="#4A3E3D"/>
                        <path d="M47 51C49 53 51 53 53 51" stroke="#4A3E3D" stroke-width="1.5" stroke-linecap="round"/>
                        
                        <!-- Rubor/Mejillas -->
                        <circle cx="39" cy="47" r="3" fill="#FFB7B2" opacity="0.6"/>
                        <circle cx="61" cy="47" r="3" fill="#FFB7B2" opacity="0.6"/>

                        <!-- Preguntita flotando arriba -->
                        <path d="M66 28C66 24 71 24 71 28C71 31 68 31 68 34" stroke="#F2A4AD" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="68" cy="38" r="1.5" fill="#F2A4AD"/>
                    </svg>

                    <h2>¡Sin notificaciones por aquí!</h2>
                    <p class="subtexto-vacio">Todo está tranquilo por ahora &lt;3</p>
                </div>
            `;
            return;
        }

        // SI SÍ HAY NOTIFICACIONES: Genera las tarjetas
        contenedor.style.justifyContent = 'flex-start';
        listaNotificaciones.forEach(notif => {
            const tarjeta = document.createElement('div');
            tarjeta.classList.add('tarjeta-notificacion');

            tarjeta.innerHTML = `
                <div class="header-notificacion">
                    <span class="badge-mensaje">${notif.mensaje.toUpperCase()}</span>
                    <span class="fecha-notificacion">${notif.fecha}</span>
                </div>
                <div class="cuerpo-notificacion">
                    <span class="etiqueta-origen">${notif.origen.toUpperCase()}</span>
                    <button class="btn-detalles-notif" onclick="verDetalles(${notif.id})">Ver detalles</button>
                </div>
            `;

            contenedor.appendChild(tarjeta);
        });
    }

    // Probar plantilla vacía por defecto
    renderizarNotificaciones([]);
});