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
    const contenedor = document.getElementById('grid-publicaciones-guardadas');
    if (contenedor) {
        contenedor.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <i class="fa-solid fa-user-lock" style="font-size: 48px; color: #fec39f; margin-bottom: 15px;"></i>
                <h3 style="font-family: 'Itim', cursive; color: #333; font-size: 20px; margin-bottom: 8px;">Inicia sesión</h3>
                <p style="color: #666; font-size: 14px;">Debes iniciar sesión para ver tus publicaciones guardadas.</p>
            </div>
        `;
    }
}

async function cargarPublicacionesGuardadas(correo) {
    try {
        const response = await fetch(`http://localhost:3000/api/guardar-publicacion/${encodeURIComponent(correo)}`);
        if (!response.ok) throw new Error("No se pudieron cargar los guardados");

        const publicacionesGuardadas = await response.json();
        const contenedor = document.getElementById('grid-publicaciones-guardadas');
        
        if (!contenedor) return;
        contenedor.innerHTML = ''; 

        // Asegurar que el contenedor tenga el estilo de cuadrícula correcto
        contenedor.style.cssText = "display: grid !important; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important; gap: 25px;";

        if (publicacionesGuardadas.length === 0) {
            contenedor.innerHTML = `
                <div id="estado-vacio-guardados" style="grid-column: 1 / -1; background: rgba(232, 168, 124, 0.35); border: 2px solid rgba(232, 168, 124, 0.6); border-radius: 20px; padding: 45px 30px; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; gap: 15px;">
                    <i class="fa-solid fa-bookmark" style="font-size: 50px; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"></i>
                    <h3 style="font-family: 'Itim', cursive; color: #2c2c2c; font-size: 24px; margin: 0;">Aún no hay publicaciones guardadas</h3>
                    <p style="font-family: 'Itim', cursive; color: #555555; font-size: 16px; margin: 0;">Explora las últimas novedades o el mapa y guarda las publicaciones que te interesen.</p>
                </div>
            `;
            return;
        }

        // Usamos un bucle for...of para permitir el uso de 'await' al traducir la ubicación
        for (const reporte of publicacionesGuardadas) {
            const card = document.createElement('div');
            card.className = 'publicacion-card';
            card.style.cssText = `
                background: rgba(232, 168, 124, 0.25);
                border: 2px solid rgba(232, 168, 124, 0.5);
                border-radius: 20px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                position: relative;
            `;

            // Formatear la fecha correctamente igual que en mis publicaciones
            let fechaFormateada = "Fecha no disponible";
            if (reporte.Fecha_reporte) {
                const dateObj = new Date(reporte.Fecha_reporte);
                if (!isNaN(dateObj)) {
                    fechaFormateada = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                }
            }

            // Tipo de reporte seguro
            const tipoReporte = reporte.nombre_tipo_reporte || reporte.Nombre_tipo_reporte || reporte.NOMBRE_TIPO_REPORTE || reporte.tipo_emergencia || 'Reporte Guardado';
            
            // Extracción robusta del ID idéntica al estándar de novedades
            const idUnico = reporte.id_reporte || reporte.id_publicacion || reporte.id;

            // Traducción automática de coordenadas a dirección legible
            let textoUbicacionBruta = reporte.Ubicacion || '';
            let ubicacionBonita = await obtenerNombreUbicacionGlobal(textoUbicacionBruta);

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: 'Itim', cursive; font-size: 13px; color: #555;">
                        <i class="fa-regular fa-calendar" style="color: #e8a87c;"></i> ${fechaFormateada}
                    </span>
                    <span style="font-family: 'Itim', cursive; font-size: 12px; background: #faedcd; color: #8c6d3f; padding: 3px 10px; border-radius: 10px;">
                        Guardado
                    </span>
                </div>

                ${reporte.img_reporte ? `
                    <div style="width: 100%; height: 160px; border-radius: 12px; overflow: hidden;">
                        <img src="${reporte.img_reporte}" alt="Imagen del reporte" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                ` : ''}

                <h3 style="font-family: 'Itim', cursive; color: #2c2c2c; font-size: 20px; margin: 0;">
                    ${tipoReporte}
                </h3>

                <p style="font-family: 'Itim', cursive; color: #555; font-size: 15px; margin: 0; line-height: 1.4;">
                    ${reporte.Descripcion ? reporte.Descripcion : 'Sin descripción.'}
                </p>

                <div style="display: flex; align-items: center; gap: 6px; font-family: 'Itim', cursive; color: #666; font-size: 14px; margin-top: 2px;">
                    <i class="fa-solid fa-location-dot" style="color: #e8a87c;"></i>
                    <span>${ubicacionBonita}</span>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="btn-detalles-guardado" data-id="${idUnico}" style="flex: 1; background: #e8a87c; border: 2px solid #e8a87c; color: white; font-family: 'Itim', cursive; padding: 8px 10px; border-radius: 15px; text-align: center; cursor: pointer; transition: background 0.2s;">
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

// Escucha global para el botón de "Ver detalles" de las tarjetas guardadas (igual que en novedades)
// ✅ CÓMO DEBE QUEDAR:
document.addEventListener('click', (event) => {
    const botonDetalle = event.target.closest('.btn-detalles-guardado');
    if (botonDetalle) {
        const reporteId = botonDetalle.getAttribute('data-id');
        if (reporteId && reporteId !== "undefined" && reporteId !== "null") {
            window.location.href = `detalle_reporte.html?id=${reporteId}&origen=guardados`;
        } else {
            console.error("El ID del reporte guardado no es válido:", reporteId);
        }
    }
});