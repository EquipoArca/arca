function obtenerContenedor() {
    return document.getElementById('contenedor-notificaciones') || document.getElementById('contenedorNotificaciones');
}

function obtenerCorreoUsuarioActivo() {
    const authUser = typeof firebase !== 'undefined' && firebase.auth().currentUser;
    if (authUser && authUser.email) return authUser.email;

    return localStorage.getItem('correo_usuario') || 
           localStorage.getItem('usuario_correo') || 
           localStorage.getItem('user_email') || '';
}

async function cargarNotificacionesServidor() {
    const contenedor = obtenerContenedor();
    if (!contenedor) return;

    const correo = obtenerCorreoUsuarioActivo();

    if (!correo) {
        contenedor.innerHTML = `
            <div class="estado-vacio" style="text-align: center; padding: 40px;">
                <h2>¡Inicia sesión para ver tus notificaciones!</h2>
                <p>&lt;3</p>
            </div>
        `;
        return;
    }

    try {
        const respuesta = await fetch(`/api/notificaciones/${encodeURIComponent(correo)}`);
        if (!respuesta.ok) throw new Error("Error al obtener notificaciones");

        const notificaciones = await respuesta.json();
        
        // FILTRO EN CLIENTE: Evita pintar tarjetas duplicadas
        const notificacionesUnicas = [];
        const idsVistos = new Set();

        for (const n of notificaciones) {
            const claveUnica = `${n.tipo}_${n.id_usuario_origen}_${n.mensaje}`;
            if (!idsVistos.has(claveUnica)) {
                idsVistos.add(claveUnica);
                notificacionesUnicas.push(n);
            }
        }

        renderizarNotificaciones(notificacionesUnicas);

    } catch (error) {
        console.error("Error cargando notificaciones:", error);
    }
}

function renderizarNotificaciones(lista) {
    const contenedor = obtenerContenedor();
    if (!contenedor) return;
    
    contenedor.innerHTML = '';

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <div class="escena-cielo-kawaii">
                    <div class="nube-kawaii nube-izq"></div>
                    <div class="sol-kawaii">
                        <div class="ojo-sol izq"></div>
                        <div class="ojo-sol der"></div>
                        <div class="boca-sol"></div>
                        <div class="rubor-sol izq"></div>
                        <div class="rubor-sol der"></div>
                    </div>
                    <div class="nube-kawaii nube-der"></div>
                    <span class="destello d1">✦</span>
                    <span class="destello d2">✦</span>
                </div>
                <h2>¡Aún no hay notificaciones!</h2>
                <p>&lt;3</p>
            </div>
        `;
        return;
    }

    lista.forEach(notif => {
        const tarjeta = document.createElement('article');
        tarjeta.classList.add('tarjeta-notificacion');
        tarjeta.style.background = 'rgba(255, 255, 255, 0.7)';
        tarjeta.style.borderRadius = '20px';
        tarjeta.style.padding = '18px 24px';
        tarjeta.style.marginBottom = '15px';
        tarjeta.style.border = '2px solid #f9d5d3';
        tarjeta.style.display = 'flex';
        tarjeta.style.justifyContent = 'space-between';
        tarjeta.style.alignItems = 'center';

        const fechaStr = notif.fecha_notificacion ? notif.fecha_notificacion.split('T')[0] : 'Reciente';
        
        // MODIFICACIÓN CLAVE: Convertimos el nombre de usuario en un enlace interactivo <a>
        const autorNombre = notif.origen_nombre 
            ? `<a href="perfil_publico.html?user=${encodeURIComponent(notif.origen_nombre)}" style="color: #e06d53; font-weight: bold; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">@${notif.origen_nombre}</a>` 
            : 'Sistema ARCA';

        let htmlAccion = '';
        if (notif.tipo === 'solicitud_adoptante' && notif.estado_solicitud === 'pendiente') {
            htmlAccion = `
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button onclick="responderSolicitud(${notif.id_solicitud}, 'aceptar')" style="background: #25d366; color: white; border: none; padding: 6px 14px; border-radius: 12px; cursor: pointer; font-weight: bold; font-family: 'Itim';">Aceptar</button>
                    <button onclick="responderSolicitud(${notif.id_solicitud}, 'rechazar')" style="background: #d9534f; color: white; border: none; padding: 6px 14px; border-radius: 12px; cursor: pointer; font-weight: bold; font-family: 'Itim';">Rechazar</button>
                </div>
            `;
        } else if (notif.tipo === 'solicitud_adoptante' && notif.estado_solicitud === 'aceptada') {
            htmlAccion = `<span style="color: #25d366; font-weight: bold; font-size: 13.5px;"> Solicitud aceptada ✓</span>`;
        } else {
            htmlAccion = `<button onclick="window.location.href='perfil_publico.html?user=${notif.origen_nombre}'" style="background: #fffde8; border: 1px solid #f0e6b8; padding: 6px 14px; border-radius: 12px; cursor: pointer; font-weight: bold; font-family: 'Itim'; margin-top: 6px;">Ver perfil</button>`;
        }

        tarjeta.innerHTML = `
            <div class="info-notif-izq">
                <div style="font-weight: bold; font-size: 16px; color: #2b2b2b;">
                    ${autorNombre} ${notif.mensaje}
                </div>
                <span style="font-size: 12px; color: #777;">${fechaStr}</span>
                <div>${htmlAccion}</div>
            </div>
            <button onclick="eliminarNotificacionBd(${notif.id_notificacion})" title="Borrar notificación" style="background: none; border: none; color: #d9534f; cursor: pointer; font-size: 18px;">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        contenedor.appendChild(tarjeta);
    });
window.responderSolicitud = async function(idSolicitud, accion) {
    const correoPropietario = obtenerCorreoUsuarioActivo();
    try {
        const res = await fetch('/api/responder-solicitud-adoptante', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_solicitud: idSolicitud, accion, correo_propietario: correoPropietario })
        });
        const data = await res.json();
        alert(data.mensaje);
        cargarNotificacionesServidor();
    } catch (e) {
        console.error("Error respondiendo solicitud:", e);
    }
};

window.eliminarNotificacionBd = async function(idNotificacion) {
    try {
        await fetch(`/api/notificaciones/${idNotificacion}`, { method: 'DELETE' });
        cargarNotificacionesServidor();
    } catch (e) {
        console.error("Error al eliminar notificación:", e);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(() => {
            cargarNotificacionesServidor();
        });
    } else {
        cargarNotificacionesServidor();
    }
});