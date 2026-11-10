document.addEventListener('DOMContentLoaded', async () => {
    const selectFundacion = document.getElementById('select-fundacion-donacion');

    // 1. Cargar las fundaciones aprobadas/registradas en el sistema
    try {
        const res = await fetch('/api/fundaciones-lista');
        if (res.ok) {
            const fundaciones = await res.json();
            if (fundaciones && fundaciones.length > 0) {
                fundaciones.forEach(f => {
                    const option = document.createElement('option');
                    option.value = f.id_fundacion;
                    option.textContent = f.Nombre_Comercial || f.Nombre_Legal || f.Correo_fundacion;
                    selectFundacion.appendChild(option);
                });
            } else {
                selectFundacion.innerHTML = '<option value="">No hay fundaciones disponibles</option>';
            }
        }
    } catch (e) {
        console.error("Error al cargar la lista de fundaciones:", e);
    }

    // 2. Prellenar datos del usuario autenticado si ya inició sesión
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user && user.email) {
                const inputCorreo = document.getElementById('donante-correo');
                if (inputCorreo) inputCorreo.value = user.email;

                try {
                    const resUsr = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
                    if (resUsr.ok) {
                        const datos = await resUsr.json();
                        const inputNombre = document.getElementById('donante-nombre');
                        const inputTel = document.getElementById('donante-telefono');

                        if (datos.nombre_usuario && inputNombre) inputNombre.value = datos.nombre_usuario;
                        if (datos.Telefono_usuario && inputTel) inputTel.value = datos.Telefono_usuario;
                    }
                } catch (err) {
                    console.error("Error al obtener datos del usuario:", err);
                }
            }
        });
    }

    // 3. Manejar el envío de la donación con alertas estilo ARCA
    const btnEnviar = document.getElementById('btn-enviar-donacion');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', async () => {
            const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
            if (!user) {
                mostrarAlertaArca("Inicio de sesión requerido", "Debes iniciar sesión para realizar una donación.", { tipo: "error" });
                return;
            }

            // Recoger tipos de donación seleccionados (checkboxes)
            const checkboxes = document.querySelectorAll('.donation-column:first-child input[type="checkbox"]:checked');
            const tiposSeleccionados = Array.from(checkboxes).map(cb => cb.closest('label').textContent.trim());

            const descripcionInput = document.querySelector('.donation-textarea');
            const descripcion = descripcionInput ? descripcionInput.value.trim() : '';
            const idFundacion = selectFundacion ? selectFundacion.value : '';
            
            const inputCorreo = document.getElementById('donante-correo');
            const correoDonante = inputCorreo ? inputCorreo.value.trim() : user.email;

            if (tiposSeleccionados.length === 0) {
                mostrarAlertaArca("Campo requerido", "Por favor selecciona al menos un tipo de donación.", { tipo: "error" });
                return;
            }

            if (!idFundacion) {
                mostrarAlertaArca("Campo requerido", "Por favor selecciona una fundación de destino.", { tipo: "error" });
                return;
            }

            const datosDonacion = {
                correo_usuario: correoDonante || user.email,
                id_fundacion: idFundacion,
                tipo_donacion: tiposSeleccionados.join(', '),
                descripcion_donacion: descripcion
            };

            try {
                const respuesta = await fetch('/api/crear-donacion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosDonacion)
                });

                const resultado = await respuesta.json();
                if (respuesta.ok) {
                    // ALERTA DE ÉXITO CON ESTILO ARCA
                    mostrarAlertaArca(
                        "Donación Enviada", 
                        "Tu donación se registró con éxito y la fundación ha sido notificada, pronto recibiras actualizaciones para llevar a cabo la donación. Muchas gracias por tu apoyo", 
                        {
                            tipo: "aviso",
                            textoBoton: "Ir al Inicio",
                            alCerrar: () => {
                                window.location.href = "home.html";
                            }
                        }
                    );
                } else {
                    throw new Error(resultado.error || "No se pudo registrar la donación.");
                }
            } catch (error) {
                console.error("Error al enviar donación:", error);
                mostrarAlertaArca("Error", "Hubo un error al enviar la donación: " + error.message, { tipo: "error" });
            }
        });
    }
});

// ==========================================
// FUNCIÓN GLOBAL MOSTRAR ALERTA ARCA
// (Garantiza que la alerta bonita esté disponible siempre en esta vista)
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
                font-family: 'Itim', cursive, sans-serif;
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
                white-space: pre-line;
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

            @keyframes arcaAparecer {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes arcaSaltar {
                from { opacity: 0; transform: scale(.92) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
        `;
        document.head.appendChild(estilos);
    }

    const overlay = document.createElement("div");
    overlay.id = "alerta-arca-personalizada";
    overlay.className = "arca-alerta-overlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");

    const tarjeta = document.createElement("div");
    tarjeta.className = "arca-alerta-tarjeta";

    const iconos = {
        error: "♡",
        aviso: "🌸"
    };

    const icono = document.createElement("div");
    icono.className = "arca-alerta-icono";
    icono.textContent = iconos[tipo] || "🌸";

    const encabezado = document.createElement("h2");
    encabezado.className = "arca-alerta-titulo";
    encabezado.textContent = titulo;

    const texto = document.createElement("p");
    texto.className = "arca-alerta-mensaje";
    texto.textContent = mensaje;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "arca-alerta-boton";
    boton.textContent = textoBoton;

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