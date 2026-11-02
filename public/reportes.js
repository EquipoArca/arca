document.addEventListener('DOMContentLoaded', () => {
    const formReporte = document.getElementById('formReporteArca');
    const inputTel = document.getElementById('contacto-telefono');
    const inputCorreo = document.getElementById('contacto-correo');
    
    const btnUbicacion = document.getElementById('btn-ubicacion');
    const inputDireccion = document.getElementById('input-direccion');
    
    const inputArchivo = document.getElementById('input-archivo-oculto');
    const btnSubirArchivo = document.getElementById('btn-subir-archivo');
    const btnCirculo = document.getElementById('btn-circulo');
    const zonaDrop = document.querySelector('.zona-drop');

    // 1. Cargar datos del usuario desde Firebase/MySQL
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user && user.email) {
                try {
                    const respuesta = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
                    
                    if (respuesta.ok) {
                        const usuario = await respuesta.json();

                        if (inputCorreo) {
                            inputCorreo.value = user.email;
                        }
                        if (inputTel) {
                            inputTel.value = usuario.Telefono_usuario || usuario.telefono_usuario || usuario.telefono || '';
                        }
                    }
                } catch (err) {
                    console.warn("No se pudieron autocompletar los datos del usuario desde MySQL:", err);
                }
            }
        });
    }

    // 2. Geolocalización con indicador de carga
    if (btnUbicacion && inputDireccion) {
        btnUbicacion.addEventListener('click', () => {
            if (navigator.geolocation) {
                const textoOriginal = btnUbicacion.innerHTML;
                btnUbicacion.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obteniendo ubicación...';
                btnUbicacion.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    (posicion) => {
                        const lat = posicion.coords.latitude;
                        const lng = posicion.coords.longitude;
                        inputDireccion.value = `Ubicación GPS: ${lat}, ${lng}`;
                        btnUbicacion.innerHTML = "¡Ubicación lista! ✓";
                        btnUbicacion.disabled = false;
                    },
                    (error) => {
                        mostrarAlertaArca(
                            "Error de geolocalización",
                            "No pudimos acceder a tu GPS. Escribe la dirección manualmente. ♡",
                            { tipo: "error" }
                        );
                        btnUbicacion.innerHTML = textoOriginal;
                        btnUbicacion.disabled = false;
                        console.error("Error GPS:", error);
                    }
                );
            } else {
                mostrarAlertaArca
                    "Navegador incompatible",
                    "Tu navegador no soporta geolocalización. ♡",
                    {tipo: "error"}
            }
        });
    }

    // 3. Selección y Arrastre de Archivos (Drag & Drop + Previsualización)
    const activarInputArchivo = (e) => {
        e.preventDefault();
        if (inputArchivo) inputArchivo.click();
    };

    if (btnSubirArchivo) btnSubirArchivo.addEventListener('click', activarInputArchivo);
    if (btnCirculo) btnCirculo.addEventListener('click', activarInputArchivo);

    if (zonaDrop) {
        // Prevenir eventos de arrastre por defecto para que no abran la imagen en el navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zonaDrop.addEventListener(eventName, (e) => e.preventDefault(), false);
            document.body.addEventListener(eventName, (e) => e.preventDefault(), false);
        });

        // Feedback visual al arrastrar un archivo encima
        ['dragenter', 'dragover'].forEach(eventName => {
            zonaDrop.addEventListener(eventName, () => zonaDrop.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zonaDrop.addEventListener(eventName, () => zonaDrop.classList.remove('highlight'), false);
        });

        // Evento Drop
        zonaDrop.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt.files && dt.files.length > 0 && inputArchivo) {
                inputArchivo.files = dt.files;
                procesarPrevisualizacion(dt.files);
            }
        });
    }

    if (inputArchivo) {
        inputArchivo.addEventListener('change', () => {
            if (inputArchivo.files.length > 0) {
                procesarPrevisualizacion(inputArchivo.files);
            }
        });
    }

    function procesarPrevisualizacion(archivos) {
        const cantidad = archivos.length;
        const textoArrastra = document.getElementById('texo-arrastra');
        if (textoArrastra) {
            textoArrastra.textContent = `📷 ${cantidad} foto(s) seleccionada(s)`;
        }

        let contenedorPreview = document.getElementById('preview-container');
        if (!contenedorPreview && zonaDrop) {
            contenedorPreview = document.createElement('div');
            contenedorPreview.id = 'preview-container';
            contenedorPreview.style.display = 'flex';
            contenedorPreview.style.flexWrap = 'wrap';
            contenedorPreview.style.gap = '10px';
            contenedorPreview.style.marginTop = '12px';
            contenedorPreview.style.justifyContent = 'center';
            zonaDrop.appendChild(contenedorPreview);
        }

        if (contenedorPreview) {
            contenedorPreview.innerHTML = ''; // Limpiar miniaturas anteriores

            Array.from(archivos).forEach((file) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                        const wrapper = document.createElement('div');
                        wrapper.style.position = 'relative';

                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.width = '70px';
                        img.style.height = '70px';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '8px';
                        img.style.border = '1px solid rgba(255, 255, 255, 0.3)';

                        const btnBorrar = document.createElement('button');
                        btnBorrar.innerHTML = '&times;';
                        btnBorrar.type = 'button';
                        btnBorrar.style.position = 'absolute';
                        btnBorrar.style.top = '-5px';
                        btnBorrar.style.right = '-5px';
                        btnBorrar.style.background = '#ff4d4d';
                        btnBorrar.style.color = '#fff';
                        btnBorrar.style.border = 'none';
                        btnBorrar.style.borderRadius = '50%';
                        btnBorrar.style.width = '20px';
                        btnBorrar.style.height = '20px';
                        btnBorrar.style.cursor = 'pointer';
                        btnBorrar.style.fontSize = '12px';

                        btnBorrar.addEventListener('click', (evt) => {
                            evt.stopPropagation();
                            if (inputArchivo) inputArchivo.value = '';
                            wrapper.remove();
                            if (textoArrastra) {
                                textoArrastra.textContent = "Arrastra tu imagen aquí o haz clic para buscar";
                            }
                        });

                        wrapper.appendChild(img);
                        wrapper.appendChild(btnBorrar);
                        contenedorPreview.appendChild(wrapper);
                    };
                }
            });
        }
    }

    // 4. Conversión y compresión a Base64
    const convertirABase64 = (archivo) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(archivo);
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const MAX_ANCHO = 800;
                    const MAX_ALTO = 800;
                    let ancho = img.width;
                    let alto = img.height;

                    if (ancho > alto) {
                        if (ancho > MAX_ANCHO) {
                            alto = Math.round((alto * MAX_ANCHO) / ancho);
                            ancho = MAX_ANCHO;
                        }
                    } else {
                        if (alto > MAX_ALTO) {
                            ancho = Math.round((ancho * MAX_ALTO) / alto);
                            alto = MAX_ALTO;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = ancho;
                    canvas.height = alto;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, ancho, alto);

                    const base64Comprimido = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(base64Comprimido);
                };

                img.onerror = (error) => reject(error);
            };

            reader.onerror = (error) => reject(error);
        });
    };

    // 5. Envío del Formulario
    if (formReporte) {
        formReporte.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btnSubmit = formReporte.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = "Guardando reporte...";
            }

            try {
                const radioSeleccionado = document.querySelector('input[name="tipo_reporte"]:checked');
                const idTipoReporte = radioSeleccionado ? parseInt(radioSeleccionado.value) : 1;

                const descripcion = document.getElementById('descripcion-reporte')?.value || '';
                const direccion = inputDireccion?.value || '';
                const telefono = inputTel ? inputTel.value : '';
                const correoContacto = inputCorreo ? inputCorreo.value : '';

                let fotoBase64 = null;

            if (inputArchivo && inputArchivo.files.length > 0) {
                // Si el usuario seleccionó una FOTO NUEVA, la convertimos
                fotoBase64 = await convertirABase64(inputArchivo.files[0]);
            } else {
                // Si NO seleccionó ninguna nueva, CONSERVAMOS la que ya tenía
                fotoBase64 = window.imagenBase64Actual || null;
            }

                const usuarioAuth = firebase.auth().currentUser;
                const correoUsuarioLogueado = usuarioAuth ? usuarioAuth.email : correoContacto;

                const datosReporte = {
                    id_tipo_reporte: idTipoReporte,
                    Descripcion: descripcion,
                    Ubicacion: direccion,
                    telefono_contacto: telefono,
                    correo_contacto: correoContacto,
                    img_reporte: fotoBase64,
                    correo_usuario: correoUsuarioLogueado
                };

        
            const urlParamsSubmit = new URLSearchParams(window.location.search);
            const idEditar = urlParamsSubmit.get('editar');

            let urlFetch = '/crear-reporte';
            let metodoFetch = 'POST';

            if (idEditar) {
                urlFetch = `/api/reportes/${idEditar}`;
                metodoFetch = 'PUT';
            }

            const respuesta = await fetch(urlFetch, {
                method: metodoFetch,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosReporte)
            });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    mostrarAlertaArca(
                        "¡Reporte guardado! ",
                        "Tu reporte ha sido guardado exitosamente. 🌸",
                        {tipo: "aviso"}
                    );
                    formReporte.reset();

                    const textoArrastra = document.getElementById('texo-arrastra');
                    if (textoArrastra) {
                        textoArrastra.textContent = "Arrastra tu imagen aquí o haz clic para buscar";
                    }

                    const contenedorPreview = document.getElementById('preview-container');
                    if (contenedorPreview) {
                        contenedorPreview.innerHTML = '';
                    }
                    window.location.href = 'mis_publicaciones.html';
                } else {
        mostrarAlertaArca(
                "Error en el servidor",
                resultado.error || "No se pudo guardar el reporte, inténtalo más tarde. ♡",
                { tipo: "error" }
            );
        }

    } catch (error) {
        console.error("Error al enviar el reporte:", error);
        mostrarAlertaArca(
            "Sin conexión con el servidor",
            "No se pudo conectar con el servidor. Inténtalo nuevamente más tarde.",
            { tipo: "conexion" } // Usamos tipo "conexion" para la tarjeta especial con !
        );
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Enviar Reporte";
        }
    }
});
}
    // ==========================================
// MODO EDICIÓN: Cargar datos si viene ?editar=ID
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const idReporteEditar = urlParams.get('editar');

if (idReporteEditar) {
    const tituloPagina = document.querySelector('.page-title');
    if (tituloPagina) tituloPagina.textContent = "Editar Reporte";

    const btnEnviar = document.querySelector('.btn-enviar-reporte'); 
    if (btnEnviar) btnEnviar.textContent = "Guardar Cambios";

    fetch(`/api/reportes/${idReporteEditar}`)
        .then(res => {
            if (!res.ok) throw new Error("No se pudo cargar la información del reporte");
            return res.json();
        })
        .then(reporte => {
            if (reporte) {
                // 1. Seleccionar el tipo de reporte (radio button)
                if (reporte.id_tipo_reporte) {
                    const radio = document.getElementById(`reporte-opcion-${reporte.id_tipo_reporte}`);
                    if (radio) radio.checked = true;
                }

                // 2. Rellenar campos de texto
                const inputDesc = document.querySelector('#descripcion-reporte');
                if (inputDesc) inputDesc.value = reporte.Descripcion || '';

                const inputDir = document.querySelector('#input-direccion');
                if (inputDir) inputDir.value = reporte.Ubicacion || '';

                const inputTel = document.querySelector('#contacto-telefono');
                if (inputTel) inputTel.value = reporte.telefono_contacto || '';

                const inputCorreo = document.querySelector('#contacto-correo');
                if (inputCorreo) inputCorreo.value = reporte.correo_contacto || '';

                // 3. Mostrar la imagen actual si ya existe
                if (reporte.img_reporte) {
                    const imgPreview = document.querySelector('#preview-img-reporte');
                    if (imgPreview) {
                        imgPreview.src = reporte.img_reporte;
                        imgPreview.style.display = 'block';
                        window.imagenBase64Actual = reporte.img_reporte;
                    }
                    const textoArrastra = document.getElementById('texo-arrastra');
                    if (textoArrastra) {
                        textoArrastra.textContent = "Imagen actual cargada (puedes subir otra para reemplazarla)";
                    }
                }
            }
        })
        .catch(error => console.error("Error al cargar datos para edición:", error));
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

