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
                    const respuesta = await fetch(`/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
                    
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
                        alert("No pudimos acceder a tu GPS. Escribe la dirección manualmente.");
                        btnUbicacion.innerHTML = textoOriginal;
                        btnUbicacion.disabled = false;
                        console.error("Error GPS:", error);
                    }
                );
            } else {
                alert("Tu navegador no soporta geolocalización.");
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
                    alert("¡Reporte guardado exitosamente en phpMyAdmin!");
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
                    alert("Error desde el servidor: " + (resultado.error || "No se pudo guardar el reporte."));
                }

            } catch (error) {
                console.error("Error al enviar el reporte:", error);
                alert("No se pudo conectar con el servidor Node.js. Verifica que 'node server.js' esté corriendo.");
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
