document.addEventListener('DOMContentLoaded', () => {
    const formReporte = document.getElementById('formReporteArca');
    const inputTel = document.getElementById('contacto-telefono');
    const inputCorreo = document.getElementById('contacto-correo');
    
    const btnUbicacion = document.getElementById('btn-ubicacion');
    const inputDireccion = document.getElementById('input-direccion');
    
    const inputArchivo = document.getElementById('input-archivo-oculto');
    const btnSubirArchivo = document.getElementById('btn-subir-archivo');
    const btnCirculo = document.getElementById('btn-circulo');
    const zonaDrop = document.querySelector('.zona-drop') || document.getElementById('zona-arrastre');
    const contenedorPreview = document.getElementById('preview-container') || document.getElementById('contenedor-previsualizacion');

    const MAXIMO_FOTOS = 3;
    let archivosSeleccionados = [];

    // 1. Cargar datos del usuario desde Firebase/MySQL
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user && user.email) {
                try {
                    const respuesta = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
                    
                    if (respuesta.ok) {
                        const usuario = await respuesta.json();

                        if (inputCorreo && !inputCorreo.value) {
                            inputCorreo.value = user.email;
                        }
                        if (inputTel && !inputTel.value) {
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
                mostrarAlertaArca(
                    "Navegador incompatible",
                    "Tu navegador no soporta geolocalización. ♡",
                    { tipo: "error" }
                );
            }
        });
    }

    // 3. Sincronización clave para el FormData
    function sincronizarInputFiles() {
        if (!inputArchivo) return;
        const dataTransfer = new DataTransfer();
        archivosSeleccionados.forEach(file => dataTransfer.items.add(file));
        inputArchivo.files = dataTransfer.files;
    }

    // 4. Selección y Arrastre de Archivos (Drag & Drop + Previsualización)
    const activarInputArchivo = (e) => {
        e.preventDefault();
        if (inputArchivo) inputArchivo.click();
    };

    if (btnSubirArchivo) btnSubirArchivo.addEventListener('click', activarInputArchivo);
    if (btnCirculo) btnCirculo.addEventListener('click', activarInputArchivo);

    if (inputArchivo) {
        inputArchivo.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                procesarNuevosArchivos(e.target.files);
                inputArchivo.value = '';
            }
        });
    }

    if (zonaDrop) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zonaDrop.addEventListener(eventName, (e) => e.preventDefault(), false);
            document.body.addEventListener(eventName, (e) => e.preventDefault(), false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            zonaDrop.addEventListener(eventName, () => {
                zonaDrop.style.border = "2px dashed #fbc2c4";
                zonaDrop.style.backgroundColor = "rgba(251, 194, 196, 0.2)";
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zonaDrop.addEventListener(eventName, () => {
                zonaDrop.style.border = "none";
                zonaDrop.style.backgroundColor = "transparent";
            }, false);
        });

        zonaDrop.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt.files && dt.files.length > 0) {
                procesarNuevosArchivos(dt.files);
            }
        });
    }

    function procesarNuevosArchivos(nuevosArchivos) {
        let excedioLimite = false;
        let duplicadosIgnorados = false;

        Array.from(nuevosArchivos).forEach(nuevoArchivo => {
            if (!nuevoArchivo.type.startsWith('image/')) return;

            const yaExiste = archivosSeleccionados.some(
                arc => arc.name === nuevoArchivo.name && 
                       arc.size === nuevoArchivo.size && 
                       arc.lastModified === nuevoArchivo.lastModified
            );
            
            if (yaExiste) {
                duplicadosIgnorados = true;
                return;
            }

            if (archivosSeleccionados.length >= MAXIMO_FOTOS) {
                excedioLimite = true;
                return;
            }

            archivosSeleccionados.push(nuevoArchivo);
        });

        sincronizarInputFiles();
        renderizarMiniaturas();

        if (excedioLimite) {
            mostrarAlertaArca(
                "¡Ey, no puedes hacer eso! 🌸",
                "No puedes cargar más de tres imágenes. El máximo que puedes adjuntar son tres.",
                { tipo: "aviso" }
            );
        } else if (duplicadosIgnorados) {
            mostrarAlertaArca(
                "¡Fotografía repetida! 🌸",
                "Ya habías seleccionado esta imagen antes.",
                { tipo: "aviso" }
            );
        }
    }

    function renderizarMiniaturas() {
        const textoArrastra = document.getElementById('texto-arrastra') || document.getElementById('texo-arrastra') || document.querySelector('.texto-arrastra');
        if (textoArrastra) {
            if (archivosSeleccionados.length > 0) {
                textoArrastra.textContent = `${archivosSeleccionados.length} de 3 fotos seleccionadas`;
                textoArrastra.style.color = "#4caf50";
            } else {
                textoArrastra.textContent = "o arrastra una imagen aquí";
                textoArrastra.style.color = "";
            }
        }

        if (!contenedorPreview) return;
        contenedorPreview.innerHTML = ''; 

        archivosSeleccionados.forEach((file, index) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                wrapper.style.margin = '4px';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '70px';
                img.style.height = '70px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                img.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

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
                btnBorrar.style.display = 'flex';
                btnBorrar.style.alignItems = 'center';
                btnBorrar.style.justifyContent = 'center';

                btnBorrar.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    archivosSeleccionados.splice(index, 1);
                    sincronizarInputFiles();
                    renderizarMiniaturas();
                });

                wrapper.appendChild(img);
                wrapper.appendChild(btnBorrar);
                contenedorPreview.appendChild(wrapper);
            };
        });
    }

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
                const idTipoReporte = radioSeleccionado ? radioSeleccionado.value : '1';

                const descripcion = document.getElementById('descripcion-reporte')?.value || '';
                const direccion = inputDireccion?.value || '';
                const telefono = inputTel ? inputTel.value : '';
                const correoContacto = inputCorreo ? inputCorreo.value : '';

                const usuarioAuth = typeof firebase !== 'undefined' && firebase.auth().currentUser ? firebase.auth().currentUser : null;
                const correoUsuarioLogueado = (usuarioAuth && usuarioAuth.email) ? usuarioAuth.email : (localStorage.getItem('correo_usuario') || correoContacto);

                const formData = new FormData();
                formData.append('id_tipo_reporte', idTipoReporte);
                formData.append('Descripcion', descripcion);
                formData.append('Ubicacion', direccion);
                formData.append('telefono_contacto', telefono);
                formData.append('correo_contacto', correoContacto);
                formData.append('correo_usuario', correoUsuarioLogueado);

                // Adjuntamos directamente desde nuestro array de archivos seleccionados
                if (archivosSeleccionados && archivosSeleccionados.length > 0) {
                    archivosSeleccionados.forEach(file => {
                        formData.append('fotos_reporte', file);
                    });
                }

                // DETECCIÓN SEGURA DEL MODO EDICIÓN
                const urlParamsSubmit = new URLSearchParams(window.location.search);
                const idEditar = urlParamsSubmit.get('editar');

                let urlFetch = '/crear-reporte';
                let metodoFetch = 'POST';

                if (idEditar && idEditar !== '') {
                    urlFetch = `/api/reportes/${idEditar}`;
                    metodoFetch = 'PUT'; 
                }

                const respuesta = await fetch(urlFetch, {
                    method: metodoFetch,
                    body: formData 
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    mostrarAlertaArca(
                        "¡Reporte guardado!",
                        "Tu reporte ha sido guardado exitosamente. 🌸",
                        {
                            tipo: "aviso",
                            alCerrar: () => {
                                formReporte.reset();
                                window.location.href = 'mis_publicaciones.html';
                            }
                        }
                    );
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
                    { tipo: "conexion" }
                );
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Enviar Reporte";
                }
            }
        });
    }

    // 6. MODO EDICIÓN: Cargar datos si viene ?editar=ID
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
                    if (reporte.id_tipo_reporte) {
                        const radio = document.getElementById(`reporte-opcion-${reporte.id_tipo_reporte}`);
                        if (radio) radio.checked = true;
                    }

                    const inputDesc = document.querySelector('#descripcion-reporte');
                    if (inputDesc) inputDesc.value = reporte.Descripcion || '';

                    const inputDir = document.querySelector('#input-direccion');
                    if (inputDir) inputDir.value = reporte.Ubicacion || '';

                    const inputTel = document.querySelector('#contacto-telefono');
                    if (inputTel) inputTel.value = reporte.telefono_contacto || '';

                    const inputCorreo = document.querySelector('#contacto-correo');
                    if (inputCorreo) inputCorreo.value = reporte.correo_contacto || '';

                    if (reporte.img_reporte) {
                        const textoArrastra = document.getElementById('texto-arrastra') || document.getElementById('texo-arrastra');
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

        const iconos = { error: "♡", aviso: "🌸" };
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