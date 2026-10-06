document.addEventListener('DOMContentLoaded', () => {
    const formAdopcion = document.getElementById('formAdopcionArca');
    const inputArchivo = document.getElementById('input-archivo-oculto');
    const previewImg = document.getElementById('preview-img-adopcion');
    const zonaArrastre = document.getElementById('zona-arrastre');
    const btnSubirArchivo = document.getElementById('btn-subir-archivo');

    let imagenBase64 = null;

    // Manejar clic en zona de carga de imagen
    if (btnSubirArchivo && inputArchivo) {
        btnSubirArchivo.addEventListener('click', () => inputArchivo.click());
        zonaArrastre.addEventListener('click', () => inputArchivo.click());

        inputArchivo.addEventListener('change', (e) => {
            const archivo = e.target.files[0];
            if (archivo) {
                const lector = new FileReader();
                lector.onload = function(uploadEvent) {
                    imagenBase64 = uploadEvent.target.result;
                    if (previewImg) {
                        previewImg.src = imagenBase64;
                        previewImg.style.display = 'block';
                    }
                };
                lector.readAsDataURL(archivo);
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
                if (typeof abrirBloqueo === "function") abrirBloqueo();
                return;
            }

            // Recolectar datos del formulario
            const datosAdopcion = {
                nombre_animal: document.getElementById('nombre-animal').value,
                id_especie: document.querySelector('input[name="id_especie"]:checked')?.value,
                otro_especie: null,
                sexo_animal: document.querySelector('input[name="sexo_animal"]:checked')?.value,
                edad_aprox: document.getElementById('edad-animal').value,
                id_raza: document.getElementById('select-raza').value,
                otro_raza: document.getElementById('otro-raza')?.value || null,
                id_tamaño: document.querySelector('input[name="id_tamaño"]:checked')?.value,
                descripcion_adopcion: document.getElementById('descripcion-adopcion').value,
                ubicacion_adopcion: document.getElementById('input-direccion-adopcion').value,
                foto_animal: imagenBase64,
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
                    alert("Error: " + (resultado.error || "No se pudo registrar la adopción."));
                }
            } catch (error) {
                console.error("Error de red:", error);
                alert("Hubo un error al conectar con el servidor.");
            }
        });
    }
});