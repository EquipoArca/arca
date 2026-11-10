let donacionesGlobales = [];

function obtenerCorreoUsuario() {
    const authUser = typeof firebase !== 'undefined' && firebase.auth().currentUser;
    if (authUser && authUser.email) return authUser.email;

    return localStorage.getItem('correo_usuario') || 
           localStorage.getItem('usuario_correo') || 
           localStorage.getItem('user_email') || '';
}

async function cargarDonacionesServidor() {
    const contenedor = document.getElementById('contenedor-donaciones');
    const correoFundacion = obtenerCorreoUsuario();

    if (!correoFundacion) {
        contenedor.innerHTML = `
            <div style="text-align:center; padding: 30px;">
                <h2>Inicia sesión con tu cuenta de fundación para gestionar donaciones.</h2>
            </div>
        `;
        return;
    }

    try {
        const respuesta = await fetch(`/api/donaciones/fundacion?correo_fundacion=${encodeURIComponent(correoFundacion)}`);
        if (!respuesta.ok) throw new Error("Error al obtener donaciones");

        donacionesGlobales = await respuesta.json();
        renderizarLista(donacionesGlobales);
    } catch (error) {
        console.error("❌ Error cargando donaciones:", error);
        contenedor.innerHTML = `<p style="text-align:center; color: #d9534f;">No se pudieron cargar las donaciones.</p>`;
    }
}

function renderizarLista(lista) {
    const contenedor = document.getElementById('contenedor-donaciones');
    contenedor.innerHTML = '';

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align:center; color: #888; padding: 40px 0;">
                <i class="fa-solid fa-box-open" style="font-size: 3rem; margin-bottom: 10px; color: #f9d5d3;"></i>
                <h2>No hay donaciones en esta categoría</h2>
            </div>
        `;
        return;
    }

    lista.forEach(donacion => {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'tarjeta-donacion';

        const fechaFormateada = donacion.fecha_donacion ? donacion.fecha_donacion.split('T')[0] : 'Reciente';
        const fotoPerfil = donacion.foto_donante || 'https://via.placeholder.com/150';

        let estadoBadge = donacion.estado === 'recogida' 
            ? `<span class="badge-estado estado-recogida">Recogida ✓</span>`
            : `<span class="badge-estado estado-pendiente">Pendiente ⏳</span>`;

        let botonAccion = '';
        if (donacion.estado === 'pendiente') {
            botonAccion = `
                <button class="btn-cambiar-estado" onclick="actualizarEstadoDonacion(${donacion.id_donacion}, 'recogida')">
                    Marcar como recogida
                </button>
            `;
        }

        tarjeta.innerHTML = `
            <div class="cabecera-donacion">
                <div class="info-donante">
                    <img src="${fotoPerfil}" alt="Donante" class="foto-donante">
                    <div>
                        <div class="nombre-donante">@${donacion.nombre_donante}</div>
                        <span style="font-size: 0.85rem; color: #888;">${fechaFormateada}</span>
                    </div>
                </div>
                ${estadoBadge}
            </div>

            <div class="detalle-donacion">
                <strong>Tipo:</strong> ${donacion.tipo_donacion}<br>
                <strong>Detalles:</strong> ${donacion.descripcion_donacion || 'Sin especificación adicional.'}<br>
                ${donacion.telefono_donante ? `<strong>Contacto:</strong> ${donacion.telefono_donante}` : ''}
            </div>

            <div class="acciones-donacion">
                ${botonAccion}
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}

function filtrarDonaciones(filtro, botonPresionado) {
    // Cambiar estilos de botones activos
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('activo'));
    if (botonPresionado) botonPresionado.classList.add('activo');

    if (filtro === 'todas') {
        renderizarLista(donacionesGlobales);
    } else {
        const filtradas = donacionesGlobales.filter(d => d.estado === filtro);
        renderizarLista(filtradas);
    }
}

async function actualizarEstadoDonacion(idDonacion, nuevoEstado) {
    try {
        const res = await fetch(`/api/donaciones/${idDonacion}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (res.ok) {
            cargarDonacionesServidor(); // Recargar lista al actualizar
        }
    } catch (e) {
        console.error("Error al actualizar donación:", e);
    }
}

document.addEventListener('DOMContentLoaded', cargarDonacionesServidor);