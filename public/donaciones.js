document.addEventListener('DOMContentLoaded', () => {
    const btnSelectMap = document.querySelector('.btn-select-map');
    const inputFundacion = document.querySelector('.foundation-sub-options input[type="text"]');
    
    let mapaDonacion = null;
    let contenedorMapa = null;

    if (btnSelectMap && inputFundacion) {
        // Creamos el contenedor del mapa adaptado para ancho completo debajo de la fila
        contenedorMapa = document.createElement('div');
        contenedorMapa.id = 'contenedor-mapa-donacion-dinamico';
        contenedorMapa.style.cssText = `
            display: none;
            width: 100%;
            height: 280px;
            margin-top: 15px;
            border-radius: 20px;
            border: 2px solid rgba(255, 255, 255, 0.5);
            position: relative;
            z-index: 10;
        `;
        
        const divInterno = document.createElement('div');
        divInterno.id = 'mapa-donacion-interno';
        divInterno.style.cssText = 'width: 100%; height: 100%; border-radius: 18px;';
        contenedorMapa.appendChild(divInterno);

        // Insertamos el contenedor justo después del bloque horizontal de fundaciones
        const foundationGroup = btnSelectMap.closest('.foundation-sub-options');
        if (foundationGroup) {
            foundationGroup.parentNode.insertBefore(contenedorMapa, foundationGroup.nextSibling);
        }

        btnSelectMap.addEventListener('click', () => {
            if (contenedorMapa.style.display === 'none' || contenedorMapa.style.display === '') {
                contenedorMapa.style.display = 'block';
                btnSelectMap.textContent = "🗺️ Ocultar mapa";

                if (!mapaDonacion) {
                    mapaDonacion = L.map('mapa-donacion-interno').setView([6.265, -75.615], 14);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap - ARCA'
                    }).addTo(mapaDonacion);

                    const fundacionesAliadas = [
                        { nombre: "Refugio Huellitas de Amor 🐾", lat: 6.268, lng: -75.620, dir: "Vía principal San Cristóbal" },
                        { nombre: "Fundación SOS Animal Medellín 🏡", lat: 6.260, lng: -75.610, dir: "Sector Central" }
                    ];

                    fundacionesAliadas.forEach(f => {
                        const marker = L.marker([f.lat, f.lng]).addTo(mapaDonacion);
                        marker.bindPopup(`
                            <div style="font-family: 'Itim', cursive; text-align: center; color: #5c4033;">
                                <b style="color: #d97736;">${f.nombre}</b>
                                <p style="font-size: 12px; margin: 4px 0;">${f.dir}</p>
                                <button type="button" class="btn-elegir-refugio" data-nombre="${f.nombre}" style="background: #E985A0; color: white; border: none; padding: 5px 12px; border-radius: 9999px; cursor: pointer; font-family: 'Itim', cursive;">
                                    Elegir fundación ♡
                                </button>
                            </div>
                        `);
                    });

                    document.addEventListener('click', (e) => {
                        if (e.target.classList.contains('btn-elegir-refugio')) {
                            const nombreElegido = e.target.getAttribute('data-nombre');
                            inputFundacion.value = nombreElegido;
                            contenedorMapa.style.display = 'none';
                            btnSelectMap.textContent = "Seleccione una fundación en el mapa";
                            
                            mostrarAlertaArca(
                                "¡Fundación seleccionada! 🌸",
                                `Has elegido a: ${nombreElegido}`,
                                { tipo: "aviso" }
                            );
                        }
                    });
                } else {
                    setTimeout(() => { mapaDonacion.invalidateSize(); }, 200);
                }
            } else {
                contenedorMapa.style.display = 'none';
                btnSelectMap.textContent = "Seleccione una fundación en el mapa";
            }
        });
    }
});