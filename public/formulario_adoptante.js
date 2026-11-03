let formularioModificado = false;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-adoptante');

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            mostrarAlertaArca(
                "Acceso requerido",
                "Por favor inicia sesión para continuar. 🌸",
                { tipo: "conexion",
                    alCerrar: () =>
                    window.location.href = "adopciones.html"}
            );
        } else {
            // Verificamos si venimos desde el botón de "Editar Perfil"
            const urlParams = new URLSearchParams(window.location.search);
            const esEdicion = urlParams.get('modo') === 'editar';

            if (esEdicion) {
                await cargarDatosCompletosAdoptante(user.email);
            } else {
                await cargarDatosRegistroUsuario(user.email);
            }
        }
    }
);

    if (form) {
        form.addEventListener('input', () => { formularioModificado = true; });
        form.addEventListener('change', () => { formularioModificado = true; });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                mostrarAlertaArca(
                    "Sesión no detectada",
                    "Por favor inicia sesión para continuar. 🌸",
                    { tipo: "aviso",}
                );
                return;
            }

            const getRadioValue = (name) => {
                const checked = document.querySelector(`input[name="${name}"]:checked`);
                return checked ? parseInt(checked.value, 10) : 0;
            };

            const tenencia = document.querySelector('input[name="tenencia_vivienda"]:checked')?.value;
            const inputVivienda = document.getElementById('id_tipo_vivienda');

            const datosGuardar = {
                correo: user.email,
                nombre_completo: document.getElementById('nombre_completo')?.value.trim() || '',
                fecha_nacimiento: document.getElementById('fecha_nacimiento')?.value || '',
                telefono: document.getElementById('telefono')?.value.trim() || '',
                ubicacion: document.getElementById('ubicacion')?.value.trim() || '',
                ocupacion: document.getElementById('ocupacion')?.value.trim() || '',
                id_tipo_vivienda: inputVivienda ? parseInt(inputVivienda.value, 10) : 1,
                vivienda_propia: tenencia === 'propia' ? 1 : 0,
                vivienda_arrendada: tenencia === 'arrendada' ? 1 : 0,
                mascotas_permitidas: getRadioValue('mascotas_permitidas'),
                hay_niños_en_casa: getRadioValue('hay_niños_en_casa'),
                con_quien_vives: document.getElementById('con_quien_vives')?.value.trim() || '',
                tiene_otras_mascotas: getRadioValue('tiene_otras_mascotas'),
                // CORREGIDO: Ahora lee correctamente el valor del radio (0 o 1) en lugar de buscar un ID inexistente
                prosupuesto_mensual: document.getElementById('prosupuesto_mensual')?.value.trim() || 'No definido',
                horas_ausente: parseInt(document.getElementById('horas_ausente')?.value || 0, 10),
                cuidador: document.getElementById('cuidador')?.value.trim() || '',
                motivacion: document.getElementById('motivacion')?.value.trim() || ''
            };

            try {
                const respuesta = await fetch('/api/guardar-adoptante', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosGuardar)
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    formularioModificado = false;
                    mostrarAlertaArca(
                        "¡Perfil de adoptante guardado con éxito!",
                        "Tu perfil ha sido actualizado correctamente. 🌸",
                        { tipo: "aviso",
                    alCerrar: () =>
                    window.location.href = "perfil_adoptante.html"});
                } else {
                    mostrarAlertaArca(
                        "Error al guardar: " 
                        + (data.mensaje || data.detalle || "Error en el servidor. ♡"));
                }
            } catch (error) {
                console.error("Error en la solicitud:", error);
                mostrarAlertaArca(
                    "Error al conectar con el servidor.",
                    "No se pudo conectar con el servidor. ♡"
                );
            }
        });
    }
});

// Función para cargar datos cuando se presiona "Editar Perfil"
async function cargarDatosCompletosAdoptante(correo) {
    try {
        const resUser = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(correo)}`);
        if (!resUser.ok) return;
        const datosUser = await resUser.json();

        const resFicha = await fetch(`/api/obtener-ficha-adoptante/${datosUser.id_usuarios}`);
        if (!resFicha.ok) return;
        const ficha = await resFicha.json();

        // Rellenar cada campo con la información ya guardada
        document.getElementById('nombre_completo').value = ficha.nombre_completo || '';
        if (ficha.fecha_nacimiento) {
            document.getElementById('fecha_nacimiento').value = ficha.fecha_nacimiento.split('T')[0];
        }
        document.getElementById('telefono').value = ficha.telefono || '';
        document.getElementById('ubicacion').value = ficha.ubicacion || '';
        document.getElementById('ocupacion').value = ficha.ocupacion || '';

        if (ficha.id_tipo_vivienda) {
            document.getElementById('id_tipo_vivienda').value = ficha.id_tipo_vivienda;
        }

        if (ficha.vivienda_propia === 1) {
            document.querySelector('input[name="tenencia_vivienda"][value="propia"]').checked = true;
        } else if (ficha.vivienda_arrendada === 1) {
            document.querySelector('input[name="tenencia_vivienda"][value="arrendada"]').checked = true;
        }

        setRadio('mascotas_permitidas', ficha.mascotas_permitidas);
        setRadio('hay_niños_en_casa', ficha.hay_niños_en_casa);
        setRadio('tiene_otras_mascotas', ficha.tiene_otras_mascotas);
        setRadio('prosupuesto_mensual', ficha.prosupuesto_mensual);

        document.getElementById('con_quien_vives').value = ficha.con_quien_vives || '';
        document.getElementById('horas_ausente').value = ficha.horas_ausente || '';
        document.getElementById('cuidador').value = ficha.cuidador || '';
        document.getElementById('motivacion').value = ficha.motivacion || '';

        formularioModificado = false;
    } catch (error) {
        console.error("Error al cargar datos para editar:", error);
    }
}

// Función auxiliar para marcar los botones de opción (radios)
function setRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) radio.checked = true;
}

async function cargarDatosRegistroUsuario(correo) {
    if (!correo) return;

    try {
        const res = await fetch(`/api/datos-usuario-registro?correo=${encodeURIComponent(correo)}`);
        if (!res.ok) return;
        const usuario = await res.json();

        if (usuario.nombre_usuario) {
            const campoNombre = document.getElementById('nombre_completo');
            if (campoNombre) campoNombre.value = usuario.nombre_usuario;
        }
        if (usuario.telefono_usuario) {
            const campoTelefono = document.getElementById('telefono');
            if (campoTelefono) campoTelefono.value = usuario.telefono_usuario;
        }
        if (usuario.fecha_nacimiento) {
            const campoFecha = document.getElementById('fecha_nacimiento');
            if (campoFecha) {
                campoFecha.value = usuario.fecha_nacimiento.toString().split('T')[0];
            }
        }
        formularioModificado = false;
    } catch (error) {
        console.error("Error al autocompletar datos de registro:", error);
    }
}

function intentarVolver() {
    if (formularioModificado) {
        const modal = document.getElementById('modal-confirmar-volver');
        if (modal) modal.style.display = 'flex';
    } else {
        window.location.href = "perfil_adoptante.html";
    }
}

function cerrarModalVolver() {
    document.getElementById('modal-confirmar-volver').style.display = 'none';
}

function confirmarSalida() {
    window.location.href = "perfil_adoptante.html";
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