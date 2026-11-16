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
        archivosSeleccionados.forEach(file => {
            if (file instanceof File) {
                dataTransfer.items.add(file);
            }
        });
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

        archivosSeleccionados.forEach((item, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '4px';

            const img = document.createElement('img');
            // Soporta tanto archivos nuevos (File) como URLs previas en modo edición (String)
            if (item instanceof File) {
                const reader = new FileReader();
                reader.readAsDataURL(item);
                reader.onload = (e) => { img.src = e.target.result; };
            } else {
                img.src = item;
            }

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
                formData.append('id_tipo_reporte', idTipoReporte || '1');
                formData.append('Descripcion', descripcion || '');
                formData.append('Ubicacion', direccion || '');
                formData.append('telefono_contacto', telefono || '');
                formData.append('correo_contacto', correoContacto || '');
                formData.append('correo_usuario', correoUsuarioLogueado || '');

                const archivosNuevos = archivosSeleccionados.filter(item => item instanceof File);
                const urlsExistentes = archivosSeleccionados.filter(item => typeof item === 'string');

                archivosNuevos.forEach((file) => {
                    formData.append('fotos_reporte', file, file.name);
                });

                formData.append('img_reporte_existente', JSON.stringify(urlsExistentes));

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

                    // Cargar las imágenes existentes en el array de previsualización con la 'X'
                    if (reporte.img_reporte) {
                        try {
                            const parsed = JSON.parse(reporte.img_reporte);
                            if (Array.isArray(parsed)) {
                                archivosSeleccionados = parsed;
                            } else {
                                archivosSeleccionados = [reporte.img_reporte];
                            }
                        } catch(e) {
                            archivosSeleccionados = [reporte.img_reporte];
                        }
                        renderizarMiniaturas();
                    }
                }
            })
            .catch(error => console.error("Error al cargar datos para edición:", error));
    }
});

