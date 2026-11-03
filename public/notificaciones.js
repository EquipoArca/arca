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
        // MODO INVITADO: Mostramos la misma escena kawaii con el sol y las nubes
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
}

window.responderSolicitud = async function(idSolicitud, accion) {
    const correoPropietario = obtenerCorreoUsuarioActivo();
    try {
        const res = await fetch('/api/responder-solicitud-adoptante', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_solicitud: idSolicitud, accion, correo_propietario: correoPropietario })
        });
        const data = await res.json();
      mostrarAlertaArca(data.mensaje, { 
        tipo: "aviso",
        alCerrar: () => {
            cargarNotificacionesServidor(); 
        }
    });
} catch (e) {
    console.error("Error respondiendo solicitud ♡", e);
}
}

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

// ==========================================
// ALERTA PERSONALIZADA ARCA
// ==========================================
function mostrarAlertaArca(titulo, mensaje, opciones = {}) {
    const {
        tipo = "error",
        textoBoton = "Entendido",
        alCerrar = null
    } = opciones;

    document.getElementById("alerta-arca-personalizada")?.remove();

    if (!document.getElementById("estilos-alerta-arca")) {
        const estilos = document.createElement("style");
        estilos.id = "estilos-alerta-arca";
        estilos.textContent = `
            /* Estilos generales para error y aviso */
            .arca-alerta-overlay {
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                background: rgba(40, 25, 35, 0.38);
                backdrop-filter: blur(5px);
                animation: arcaAparecer .22s ease;
            }

            .arca-alerta-tarjeta {
                width: min(100%, 360px);
                padding: 30px 25px 25px;
                border: 2px solid #fff;
                border-radius: 28px;
                background: #FFF1F2;
                box-shadow: 0 15px 45px rgba(120, 60, 80, .20);
                text-align: center;
                font-family: 'Itim', sans-serif;
                animation: arcaSaltar .28s ease;
            }

            .arca-alerta-icono {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 76px;
                height: 76px;
                margin: 0 auto 17px;
                border: 3px solid white;
                border-radius: 50%;
                background: #FAD4DE;
                font-size: 36px;
            }

            .arca-alerta-titulo {
                margin: 0 0 10px;
                color: #704653;
                font-size: 25px;
            }

            .arca-alerta-mensaje {
                margin: 0 0 23px;
                color: #795F68;
                font-size: 17px;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

           .arca-alerta-boton {
                width: 100%;
                padding: 12px 18px;
                border: 0;
                outline: none;
                border-radius: 18px;
                background: #E985A0;
                color: white;
                font: inherit;
                font-size: 17px;
                cursor: pointer;
                transition: transform .2s, background .2s;
            }

            .arca-alerta-boton:hover {
                background: #D96F8D;
                transform: translateY(-2px);
            }

            /* CSS EXCLUSIVO PARA EL TIPO "CONEXION" */
            .custom-alert-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(92, 64, 51, 0.45);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                animation: arcaAparecer .22s ease;
            }

            .custom-alert-card {
                position: relative;
                background-color: rgba(235, 224, 223, 0.94);
                backdrop-filter: blur(16px);
                color: #333333;
                padding: 32px 24px 28px 24px;
                border-radius: 38px;
                max-width: 380px;
                width: 88%;
                text-align: center;
                box-shadow: 0 24px 50px rgba(92, 64, 51, 0.18);
                display: flex;
                flex-direction: column;
                align-items: center;
                border: 2px solid rgba(255, 255, 255, 0.9);
                font-family: 'Itim', sans-serif;
                animation: entradaEscalonada 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .alert-icon-circle {
                width: 90px;
                height: 90px;
                background-color: #f7cac9;
                border-radius: 50%;
                border: 4px solid #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                box-shadow: 0 8px 20px rgba(247, 202, 201, 0.7);
                animation: latidoSuave 2s ease-in-out infinite;
            }

            .alert-icon {
                width: 44px;
                height: 44px;
            }

            .custom-alert-title {
                font-size: 1.25rem;
                font-weight: 400;
                color: #2b2b2b;
                margin-bottom: 10px;
                letter-spacing: 0.3px;
            }

            .custom-alert-message {
                font-size: 0.9rem;
                color: #666666;
                line-height: 1.45;
                margin-bottom: 24px;
            }

          .custom-alert-btn {
                background-color: #ffffff;
                color: #e57373;
                border: 2px solid #ffffff;
                outline: none;
                border-radius: 26px;
                padding: 12px 0;
                width: 100%;
                font-size: 0.95rem;
                font-weight: 400;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .custom-alert-btn:hover {
                background-color: #f9f9f9;
                transform: scale(1.04) translateY(-2px);
                box-shadow: 0 8px 20px rgba(229, 115, 115, 0.2);
            }

            @keyframes arcaAparecer {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes arcaSaltar {
                from { opacity: 0; transform: scale(.92) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @keyframes entradaEscalonada {
                from { opacity: 0; transform: scale(0.92) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @keyframes latidoSuave {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(estilos);
    }

    const overlay = document.createElement("div");
    overlay.id = "alerta-arca-personalizada";

    const tarjeta = document.createElement("div");
    const icono = document.createElement("div");
    const encabezado = document.createElement("h2");
    const texto = document.createElement("p");
    const boton = document.createElement("button");

    if (tipo === "conexion") {
        overlay.className = "custom-alert-overlay";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-modal", "true");

        tarjeta.className = "custom-alert-card";

        icono.className = "alert-icon-circle";
        icono.innerHTML = `
            <svg class="alert-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#4a4a4a"/>
                <path d="M12 7v5" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1.2" fill="white"/>
            </svg>
        `;

        encabezado.className = "custom-alert-title";
        encabezado.textContent = titulo;

        texto.className = "custom-alert-message";
        texto.textContent = mensaje;

        boton.type = "button";
        boton.className = "custom-alert-btn";
        boton.textContent = textoBoton;

    } else {
        overlay.className = "arca-alerta-overlay";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-modal", "true");

        tarjeta.className = "arca-alerta-tarjeta";

        const iconos = {
            error: "♡",
            aviso: "🌸"
        };
        icono.className = "arca-alerta-icono";
        icono.textContent = iconos[tipo] || "♡";

        encabezado.className = "arca-alerta-titulo";
        encabezado.textContent = titulo;

        texto.className = "arca-alerta-mensaje";
        texto.textContent = mensaje;

        boton.type = "button";
        boton.className = "arca-alerta-boton";
        boton.textContent = textoBoton;
    }

    boton.addEventListener("click", () => {
        overlay.remove();
        if (typeof alCerrar === "function") {
            alCerrar();
        }
    });

    tarjeta.append(icono, encabezado, texto, boton);
    overlay.appendChild(tarjeta);
    document.body.appendChild(overlay);

    boton.focus();
}
