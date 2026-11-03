// Hacemos que la variable y la función sean globales para que el HTML pueda usarlas al editar
let imagenesBase64 = [];
let renderizarPrevisualizaciones;

document.addEventListener('DOMContentLoaded', () => {
    const formAdopcion = document.getElementById('formAdopcionArca');
    const inputArchivo = document.getElementById('input-archivo-oculto');
    const previewContainer = document.getElementById('preview-container');
    const zonaArrastre = document.getElementById('zona-arrastre');
    const placeholderDrop = document.getElementById('contenido-drop-placeholder');
    
    const inputTelefono = document.getElementById('contacto-telefono');
    const inputCorreo = document.getElementById('contacto-correo');

    // Función global para renderizar las imágenes con su botón "X" de eliminación
    renderizarPrevisualizaciones = function() {
        if (!previewContainer) return;
        previewContainer.innerHTML = '';

        if (imagenesBase64.length === 0) {
            if (placeholderDrop) placeholderDrop.style.display = 'flex';
            return;
        }

        if (placeholderDrop) placeholderDrop.style.display = 'none';

        imagenesBase64.forEach((url, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position: relative; display: inline-block;';

            const imgPreview = document.createElement('img');
            imgPreview.src = url;
            imgPreview.style.width = '75px';
            imgPreview.style.height = '75px';
            imgPreview.style.objectFit = 'cover';
            imgPreview.style.borderRadius = '16px'; // Más orgánico
            imgPreview.style.border = '2px solid rgba(255, 255, 255, 0.9)';
            imgPreview.style.boxShadow = '0 4px 10px rgba(92, 64, 51, 0.1)';

            // Botón de eliminar (X)
            const btnEliminar = document.createElement('button');
            btnEliminar.innerHTML = '&times;';
            btnEliminar.type = 'button';
            btnEliminar.style.cssText = `
                position: absolute; top: -5px; right: -5px;
                background: #ff5252; color: white; border: none;
                border-radius: 50%; width: 20px; height: 20px;
                font-size: 14px; cursor: pointer; display: flex;
                align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;

            btnEliminar.onclick = () => {
                imagenesBase64.splice(index, 1); // Borra la imagen del arreglo
                renderizarPrevisualizaciones(); // Vuelve a pintar la galería
            };

            wrapper.appendChild(imgPreview);
            wrapper.appendChild(btnEliminar);
            previewContainer.appendChild(wrapper);
        });
    };

    // Autocompletar datos de contacto del usuario al iniciar
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            if (inputCorreo) inputCorreo.value = user.email || '';
            
            try {
                const response = await fetch(`/api/datos-usuario-registro?correo=${encodeURIComponent(user.email)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.telefono_usuario && inputTelefono) {
                        inputTelefono.value = data.telefono_usuario;
                    }
                }
            } catch (error) {
                console.error("No se pudo cargar el teléfono automáticamente:", error);
            }
        }
    });

    // Procesar múltiples archivos de imágenes
    function procesarArchivos(archivos) {
        if (!archivos || archivos.length === 0) return;

        Array.from(archivos).forEach(archivo => {
            if (archivo.type.startsWith('image/')) {
                const lector = new FileReader();
                lector.onload = function(uploadEvent) {
                    const base64String = uploadEvent.target.result;
                    imagenesBase64.push(base64String);
                    renderizarPrevisualizaciones(); // Actualiza la vista con la "X"
                };
                lector.readAsDataURL(archivo);
            }
        });
    }

    if (zonaArrastre && inputArchivo) {
        zonaArrastre.addEventListener('click', () => inputArchivo.click());
        inputArchivo.addEventListener('change', (e) => procesarArchivos(e.target.files));

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zonaArrastre.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        zonaArrastre.addEventListener('drop', (e) => {
            const archivos = e.dataTransfer.files;
            if (archivos.length > 0) {
                inputArchivo.files = archivos;
                procesarArchivos(archivos);
            }
        });
    }

    // Envío del formulario (Crear o Editar)
    if (formAdopcion) {
        formAdopcion.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                // CORRECCIÓN AQUÍ: Paréntesis bien cerrados, comas correctas y se añade 'return'
                mostrarAlertaArca(
                    "Acceso requerido",
                    "Por favor inicia sesión para continuar. 🌸",
                    { tipo: "conexion" }
                );
                return; 
            }
        
            const mes = document.getElementById('edad-mes').value;
            const anio = document.getElementById('edad-anio').value;
            const edad_aprox = `${mes}/${anio}`;

            const datosAdopcion = {
                nombre_animal: document.getElementById('nombre-animal').value,
                id_especie: document.querySelector('input[name="id_especie"]:checked')?.value,
                sexo_animal: document.querySelector('input[name="sexo_animal"]:checked')?.value,
                edad_aprox: edad_aprox,
                id_raza: document.getElementById('select-raza').value,
                otro_raza: document.getElementById('otro-raza')?.value || null,
                id_tamaño: document.querySelector('input[name="id_tamaño"]:checked')?.value,
                descripcion_adopcion: document.getElementById('descripcion-adopcion').value,
                ubicacion_adopcion: document.getElementById('input-direccion-adopcion').value,
                telefono_contacto: inputTelefono?.value || null,
                correo_contacto: inputCorreo?.value || user.email,
                fotos_animal: JSON.stringify(imagenesBase64),
                correo_usuario: user.email
            };

            const urlParams = new URLSearchParams(window.location.search);
            const idAdopcionEditar = urlParams.get('editar');
            
            const endpoint = idAdopcionEditar ? `/api/actualizar-adopcion/${idAdopcionEditar}` : '/api/crear-adopcion';
            const metodoHTTP = idAdopcionEditar ? 'PUT' : 'POST';

            try {
                const response = await fetch(endpoint, {
                    method: metodoHTTP,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosAdopcion)
                });

                const resultado = await response.json();
               
if (response.ok) {
    mostrarAlertaArca(
        "Adopción publicada con éxito",
        resultado.mensaje || "¡Tu publicación se realizó correctamente! 🌸",
        {
            tipo: "aviso",
            alCerrar: () => {
                window.location.href = "home.html";
            }
        }
    );
} else {
    mostrarAlertaArca(
        "Error",
        resultado.error || resultado.mensaje || "No se pudo procesar.",
        { tipo: "error" }
    );
}
            } catch (error) {
                console.error("Error de red:", error);
                mostrarAlertaArca(
                    "Error",
                    "Hubo un error al conectar con el servidor. ♡",
                    { tipo: "error" }
                );
            }
        });
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
                   