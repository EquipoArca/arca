document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            alert("Debes iniciar sesión.");
            window.location.href = "adopciones.html";
            return;
        }

        try {
            // 1. Primero obtenemos el id_usuarios interno mediante el correo
            const resUser = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
            if (!resUser.ok) throw new Error("No se pudo obtener el usuario.");
            const datosUser = await resUser.json();

            // 2. Consultamos la ficha de adoptante usando el id_usuarios
            const resFicha = await fetch(`/api/obtener-ficha-adoptante/${datosUser.id_usuarios}`);
            
            if (resFicha.ok) {
                const ficha = await resFicha.json();
                
                // Pintamos los datos en la vista
                document.getElementById('lbl-nombre').textContent = ficha.nombre_completo || '';
                document.getElementById('lbl-ubicacion').textContent = ficha.ubicacion || '';
                document.getElementById('lbl-ocupacion').textContent = ficha.ocupacion || '';
                document.getElementById('lbl-telefono').textContent = ficha.telefono || '';
                document.getElementById('lbl-correo').textContent = ficha.correo || '';
                document.getElementById('lbl-vivienda').textContent = ficha.tipo_vivienda_nombre || 'No especificado';
                document.getElementById('lbl-presupuesto').textContent = ficha.prosupuesto_mensual || '0';
                document.getElementById('lbl-motivacion').textContent = ficha.motivacion || '';

                document.getElementById('ficha-adoptante').style.display = 'block';
            } else {
                // Si no tiene perfil registrado, mostramos la opción de crearlo
                document.getElementById('sin-perfil').style.display = 'block';
            }

        } catch (error) {
            console.error("Error al cargar la ficha:", error);
            document.getElementById('sin-perfil').style.display = 'block';
        }
    });
});

function irAEditar() {
    // Redirige al formulario que ya tienes para que pueda modificarlo (gracias al ON DUPLICATE KEY UPDATE se actualizará sin duplicar)
    window.location.href = "formulario_adoptante.html?modo=editar";
}