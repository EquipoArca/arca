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
            imgPreview.style.width = '70px';
            imgPreview.style.height = '70px';
            imgPreview.style.objectFit = 'cover';
            imgPreview.style.borderRadius = '8px';
            imgPreview.style.border = '2px solid #ccc';

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
                alert("Por favor inicia sesión para continuar.");
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
                    alert(resultado.mensaje || "¡Operación realizada con éxito!");
                    window.location.href = "mis_publicaciones.html";
                } else {
                    alert("Error: " + (resultado.error || resultado.mensaje || "No se pudo procesar."));
                }
            } catch (error) {
                console.error("Error de red:", error);
                alert("Hubo un error al conectar con el servidor.");
            }
        });
    }
});