// Variable global para mantener la referencia del usuario de Firebase
let usuarioActual = null;

// Escuchar cambios de sesión en Firebase Auth
firebase.auth().onAuthStateChanged((user) => {
    usuarioActual = user;
    if (user) {
        console.log("Sesión de usuario detectada en Adopciones:", user.email);
    }
});

// Manejador para el botón "Ver animales en adopción"
async function alHacerClicVerAnimales() {
    const user = usuarioActual || firebase.auth().currentUser;

    if (!user) {
        if (typeof abrirBloqueo === "function") {
            abrirBloqueo();
        } else {
            mostrarAlertaArca(
                "Acceso requerido."),
                "Por favor inicia sesión para continuar. 🌸",
                {tipo: "conexion"};
        }
        return;
    }

    try {
        // Corregido: Usando query params (?correo=...) para que coincida con server.js
        const respuesta = await fetch(`/api/verificar-adoptante?correo=${encodeURIComponent(user.email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const data = await respuesta.json();

        if (data.tienePerfil) {
            // ¡Tiene perfil! Guardamos su ubicación en localStorage para calcular cercanía
            localStorage.setItem('ubicacion_adoptante', data.ubicacion || data.ciudad || '');
            
            // Abre el catálogo de animales y carga las mascotas ordenadas por cercanía
            mostrarSeccionAdopcion('seccion-catalogo-animales');
            if (typeof cargarMascotasAdopcionOrdenadas === 'function') {
                cargarMascotasAdopcionOrdenadas();
            }
        } else {
            // No tiene perfil -> Muestra el modal personalizado
            abrirModalAviso();
        }

    } catch (error) {
        console.error("❌ Error al verificar adoptante:", error);
        mostrarAlertaArca(
            "Ocurrió un error",
            "Revisa que el servidor esté corriendo. ♡",
            { tipo: "error" }
        );
        return null;
    }
}
// Manejador para el botón "Poner animal en adopción"
async function alHacerClicPonerEnAdopcion() {
    const user = usuarioActual || firebase.auth().currentUser;

    if (!user) {
        if (typeof abrirBloqueo === "function") {
            abrirBloqueo();
        } else {
            mostrarAlertaArca(
                "Acceso requerido."),
                "Por favor inicia sesión para continuar. 🌸",
                {tipo: "conexion"};
        }
        return;
    }

    try {
        // Verificamos si también tiene perfil de adoptante antes de permitir publicar
        const respuesta = await fetch(`/api/verificar-adoptante?correo=${encodeURIComponent(user.email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const data = await respuesta.json();
if (data.tienePerfil) {
            localStorage.setItem('ubicacion_adoptante', data.ubicacion || data.ciudad || '');
            window.location.href = "formulario_adopcion.html";
        } else {
            abrirModalAviso();
        }

    } catch (error) {
        console.error("❌ Error al verificar adoptante:", error);
        mostrarAlertaArca(
            "Ocurrió un error al consultar tu perfil.",
            "Revisa que el servidor esté corriendo. ♡",
            { tipo: "error" }
        );
        return null; 
    }
}
function abrirModalAviso() {
    const modal = document.getElementById('modal-aviso-adoptante');
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
    }
}

function cerrarModalAviso() {
    const modal = document.getElementById('modal-aviso-adoptante');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
    }
}

function irAFormularioAdoptante() {
    cerrarModalAviso();
    // Redirección a la nueva página independiente
    window.location.href = "formulario_adoptante.html";
}

function mostrarSeccionAdopcion(idSeccion) {
    const pantallaOpciones = document.getElementById('pantalla-opciones-adopcion');
    const catalogoAnimales = document.getElementById('seccion-catalogo-animales');

    if (pantallaOpciones) {
        pantallaOpciones.style.setProperty('display', 'none', 'important');
    }
    
    if (catalogoAnimales) {
        // Lo mostramos como flex para que mantenga el contenedor centrado y ordenado
        catalogoAnimales.style.setProperty('display', 'flex', 'important');
        catalogoAnimales.style.setProperty('flex-direction', 'column', 'important');
    }

    const mainContainer = document.querySelector('.main-content.main-adopciones');
    if (mainContainer) {
        // Le devolvemos el diseño centrado que usa la vista principal para que luzca hermoso
        mainContainer.style.setProperty('display', 'flex', 'important');
        mainContainer.style.setProperty('align-items', 'center', 'important');
        mainContainer.style.setProperty('justify-content', 'center', 'important');
        mainContainer.classList.add('vista-opciones-centrada');
    }
}

function volverAOpciones() {
    const catalogoAnimales = document.getElementById('seccion-catalogo-animales');
    const pantallaOpciones = document.getElementById('pantalla-opciones-adopcion');

    if (catalogoAnimales) {
        catalogoAnimales.style.setProperty('display', 'none', 'important');
    }
    
    if (pantallaOpciones) {
        pantallaOpciones.style.setProperty('display', 'flex', 'important');
    }

    const mainContainer = document.querySelector('.main-content.main-adopciones');
    if (mainContainer) {
        mainContainer.style.setProperty('display', 'flex', 'important');
        mainContainer.style.setProperty('align-items', 'center', 'important');
        mainContainer.style.setProperty('justify-content', 'center', 'important');
        mainContainer.classList.add('vista-opciones-centrada');
    }
}

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
                outline: none; /* <-- Añade esto */
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
                outline: none; /* <-- Y esto aquí también */
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
        // Aquí incorporamos el icono SVG exacto con el círculo oscuro y el signo de exclamación (!)
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

    