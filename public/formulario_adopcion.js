document.addEventListener('DOMContentLoaded', () => {
    const formAdopcion = document.getElementById('formAdopcionArca');
    const inputArchivo = document.getElementById('input-archivo-oculto');
    const previewContainer = document.getElementById('preview-container');
    const zonaArrastre = document.getElementById('zona-arrastre');
    const placeholderDrop = document.getElementById('contenido-drop-placeholder');
    
    const inputTelefono = document.getElementById('contacto-telefono');
    const inputCorreo = document.getElementById('contacto-correo');

    let imagenesBase64 = [];

    // Autocompletar datos de contacto del usuario al iniciar
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            if (inputCorreo) inputCorreo.value = user.email || '';
            
            // Consultar el teléfono del usuario en tu backend
            try {
                const response = await fetch(`/api/obtener-rol?correo=${encodeURIComponent(user.email)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.telefono && inputTelefono) {
                        inputTelefono.value = data.telefono;
                    }
                }
            } catch (error) {
                console.error("No se pudo cargar el teléfono de contacto automáticamente:", error);
            }
        }
    });

    // Procesar múltiples archivos de imágenes
    function procesarArchivos(archivos) {
        if (!archivos || archivos.length === 0) return;
        placeholderDrop.style.display = 'none';

        Array.from(archivos).forEach(archivo => {
            if (archivo.type.startsWith('image/')) {
                const lector = new FileReader();
                lector.onload = function(uploadEvent) {
                    const base64String = uploadEvent.target.result;
                    imagenesBase64.push(base64String);

                    const imgPreview = document.createElement('img');
                    imgPreview.src = base64String;
                    imgPreview.style.width = '70px';
                    imgPreview.style.height = '70px';
                    imgPreview.style.objectFit = 'cover';
                    imgPreview.style.borderRadius = '8px';
                    imgPreview.style.border = '2px solid #ccc';
                    previewContainer.appendChild(imgPreview);
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

    // Envío del formulario
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

            try {
                const response = await fetch('/api/crear-adopcion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosAdopcion)
                });

                const resultado = await response.json();
                if (response.ok) {
                    alert(resultado.mensaje || "¡Publicado con éxito!");
                    window.location.href = "home.html";
                } else {
                    alert("Error: " + (resultado.error || "No se pudo registrar."));
                }
            } catch (error) {
                console.error("Error de red:", error);
                alert("Hubo un error al conectar con el servidor.");
            }
        });
    }
});