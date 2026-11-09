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
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user && user.email) {
            document.getElementById('donante-correo').value = user.email;
            try {
                const resUsr = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
                if (resUsr.ok) {
                    const datos = await resUsr.json();
                    if (datos.nombre_usuario) document.getElementById('donante-nombre').value = datos.nombre_usuario;
                    if (datos.Telefono_usuario) document.getElementById('donante-telefono').value = datos.Telefono_usuario;
                }
            } catch (err) {
                console.error("Error al obtener datos del usuario:", err);
            }
        }
    });

    // 3. Manejar el envío de la donación
    const btnEnviar = document.getElementById('btn-enviar-donacion');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Debes iniciar sesión para realizar una donación.");
                return;
            }

            // Recoger tipos de donación seleccionados (checkboxes)
            const checkboxes = document.querySelectorAll('.donation-column:first-child input[type="checkbox"]:checked');
            const tiposSeleccionados = Array.from(checkboxes).map(cb => cb.closest('label').textContent.trim());

            const descripcion = document.querySelector('.donation-textarea').value.trim();
            const idFundacion = selectFundacion.value;
            const correoDonante = document.getElementById('donante-correo').value.trim();

            if (tiposSeleccionados.length === 0) {
                alert("Por favor selecciona al menos un tipo de donación.");
                return;
            }

            if (!idFundacion) {
                alert("Por favor selecciona una fundación de destino.");
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
                    alert("¡Donación enviada con éxito! La fundación ha sido notificada.");
                    window.location.href = "home.html";
                } else {
                    throw new Error(resultado.error || "No se pudo registrar la donación.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Hubo un error al enviar la donación: " + error.message);
            }
        });
    }
});