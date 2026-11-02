document.addEventListener("DOMContentLoaded", () => {
    // Escuchar el estado de autenticación de Firebase primero
    firebase.auth().onAuthStateChanged((user) => {
        let correoUsuario = null;

        if (user && user.email) {
            correoUsuario = user.email;
        } else {
            // Si Firebase no responde a tiempo, busca en el localStorage con varias alternativas
            correoUsuario = localStorage.getItem('correo') || 
                            localStorage.getItem('correo_usuario') || 
                            localStorage.getItem('usuario') ||
                            localStorage.getItem('email');
        }

        if (correoUsuario) {
            cargarPublicacionesGuardadas(correoUsuario);
        } else {
            mostrarMensajeIniciaSesion();
        }
    });
});

function mostrarMensajeIniciaSesion() {
    const contenedor = document.getElementById('contenedorGuardados');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="estado-vacio-guardados">
                <div class="ilustracion-guardados">
                    <i class="fa-solid fa-user-lock" style="font-size: 36px; color: #d97736;"></i>
                </div>
                <h3>Inicia sesión</h3>
                <p>Debes iniciar sesión para ver tus publicaciones guardadas.</p>
            </div>
        `;
    }
}

async function cargarPublicacionesGuardadas(correo) {
    try {
        const response = await fetch(`/api/guardar-publicacion/${encodeURIComponent(correo)}`);
        if (!response.ok) throw new Error("No se pudieron cargar los guardados");

        const publicacionesGuardadas = await response.json();
        const contenedor = document.getElementById('contenedorGuardados'); 
        
        if (!contenedor) return;
        contenedor.innerHTML = ''; 

        // Aplicamos la cuadrícula fluida de ARCA
        contenedor.className = 'posts-grid';

        if (publicacionesGuardadas.length === 0) {
            contenedor.innerHTML = `
                <div class="estado-vacio-guardados" style="grid-column: 1 / -1;">
                    <div class="ilustracion-guardados">
                        <i class="fa-solid fa-bookmark" style="font-size: 36px; color: #d97736;"></i>
                    </div>
                    <h3>¡Aún no hay publicaciones guardadas!</h3>
                    <p>Explora las últimas novedades o el mapa y guarda las publicaciones que te interesen.</p>
                </div>
            `;
            return;
        }

        for (const item of publicacionesGuardadas) {
            const card = document.createElement('div');
            card.className = 'saved-post-card btn-arca-animado';

            // Formatear la fecha correctamente
            let fechaFormateada = "Fecha no disponible";
            if (item.Fecha_reporte) {
                const dateObj = new Date(item.Fecha_reporte);
                if (!isNaN(dateObj)) {
                    fechaFormateada = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                }
            }

            const tipoReporte = item.nombre_tipo_reporte || item.Nombre_tipo_reporte || item.tipo_emergencia || 'Publicación Guardada';
            
            // ID único y tipo de publicación para el botón
            const idUnico = item.id_origen || item.id_reporte || item.id_publicacion || item.id;
            const tipoPublicacion = item.tipo_publicacion || 'reporte';

            // Traducción automática de coordenadas a dirección legible
            let textoUbicacionBruta = item.Ubicacion || '';
            let ubicacionBonita = await obtenerNombreUbicacionGlobal(textoUbicacionBruta);

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: #775a4c;">
                        <i class="fa-regular fa-calendar" style="color: #e8a87c;"></i> ${fechaFormateada}
                    </span>
                    <span style="font-size: 12px; background: #faedcd; color: #8c6d3f; padding: 4px 12px; border-radius: 9999px;">
                        Guardado (${tipoPublicacion})
                    </span>
                </div>

                ${(() => {
                    let fotoSrc = item.img_reporte || '';
                    if (fotoSrc.startsWith('[')) {
                        try {
                            const parsed = JSON.parse(fotoSrc);
                            fotoSrc = parsed[0] || '';
                        } catch (e) {}
                    }
                    return fotoSrc ? `
                        <div style="width: 100%; height: 170px; border-radius: 24px; overflow: hidden; border: 2px solid rgba(255,255,255,0.9);">
                            <img src="${fotoSrc}" alt="Imagen de la publicación" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    ` : '';
                })()}

                <h3 class="saved-post-title">${tipoReporte}</h3>

                <p class="saved-post-desc">${item.Descripcion ? item.Descripcion : 'Sin descripción.'}</p>

                <div style="display: flex; align-items: center; gap: 6px; color: #775a4c; font-size: 14px; margin-top: 2px;">
                    <i class="fa-solid fa-location-dot" style="color: #e8a87c;"></i>
                    <span>${ubicacionBonita}</span>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button class="btn-detalles-guardado btn-arca-animado" data-id="${idUnico}" data-tipo="${tipoPublicacion}" style="flex: 1; background: #e8a87c; border: 2px solid rgba(255,255,255,0.9); color: white; font-family: 'Itim', cursive; padding: 9px 14px; border-radius: 9999px; text-align: center; cursor: pointer; box-shadow: 0 4px 12px rgba(232,168,124,0.3);">
                        <i class="fa-solid fa-eye"></i> Ver detalles
                    </button>
                </div>
            `;

            contenedor.appendChild(card);
        }

    } catch (error) {
        console.error("Error al cargar las publicaciones guardadas:", error);
    }
}

// Escucha global para el botón de "Ver detalles" de las tarjetas guardadas (soporta reportes y adopciones)
document.addEventListener('click', (event) => {
    const botonDetalle = event.target.closest('.btn-detalles-guardado');
    if (botonDetalle) {
        const idPub = botonDetalle.getAttribute('data-id');
        const tipoPub = botonDetalle.getAttribute('data-tipo');

        if (idPub && idPub !== "undefined" && idPub !== "null") {
            if (tipoPub === 'adopcion') {
                window.location.href = `detalle_adopcion.html?id=${idPub}&origen=guardados`;
            } else {
                window.location.href = `detalle_reporte.html?id=${idPub}&origen=guardados`;
            }
        } else {
            console.error("El ID de la publicación guardada no es válido:", idPub);
        }
    }
});