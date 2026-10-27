// Variable global para mantener la referencia del usuario de Firebase
let usuarioActual = null;

// Escuchar cambios de sesión en Firebase Auth
firebase.auth().onAuthStateChanged((user) => {
    usuarioActual = user;
    if (user) {
        console.log("Sesión de usuario detectada en Adopciones:", user.email);
    }
});

// Manejador para el botón "Ver animales en adopción"
async function alHacerClicVerAnimales() {
    const user = usuarioActual || firebase.auth().currentUser;

    if (!user) {
        if (typeof abrirBloqueo === "function") {
            abrirBloqueo();
        } else {
            alert("Por favor inicia sesión para continuar.");
        }
        return;
    }

    try {
        // Corregido: Usando query params (?correo=...) para que coincida con server.js
        const respuesta = await fetch(`/api/verificar-adoptante?correo=${encodeURIComponent(user.email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const data = await respuesta.json();

        if (data.tienePerfil) {
            // ¡Tiene perfil! Guardamos su ubicación en localStorage para calcular cercanía
            localStorage.setItem('ubicacion_adoptante', data.ubicacion || data.ciudad || '');
            
            // Abre el catálogo de animales y carga las mascotas ordenadas por cercanía
            mostrarSeccionAdopcion('seccion-catalogo-animales');
            if (typeof cargarMascotasAdopcionOrdenadas === 'function') {
                cargarMascotasAdopcionOrdenadas();
            }
        } else {
            // No tiene perfil -> Muestra el modal personalizado
            abrirModalAviso();
        }

    } catch (error) {
        console.error("❌ Error al verificar adoptante:", error);
        alert("Ocurrió un error al consultar tu perfil de adoptante. Revisa que el servidor Node.js esté corriendo.");
    }
}
function alHacerClicPonerEnAdopcion() {
    const user = usuarioActual || firebase.auth().currentUser;
    if (!user) {
        if (typeof abrirBloqueo === "function") {
            abrirBloqueo();
        } else {
            alert("Por favor inicia sesión para continuar.");
        }
        return;
    }
    
    // Redirige al formulario de adopción creado
    window.location.href = "formulario_adopcion.html";
}
// CONTROLADORES DEL MODAL Y REDIRECCIÓN
function abrirModalAviso() {
    const modal = document.getElementById('modal-aviso-adoptante');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalAviso() {
    const modal = document.getElementById('modal-aviso-adoptante');
    if (modal) modal.style.display = 'none';
}

function irAFormularioAdoptante() {
    cerrarModalAviso();
    // Redirección a la nueva página independiente
    window.location.href = "formulario_adoptante.html";
}

function mostrarSeccionAdopcion(idSeccion) {
    const pantallaOpciones = document.getElementById('pantalla-opciones-adopcion');
    const catalogoAnimales = document.getElementById('seccion-catalogo-animales');

    if (pantallaOpciones) {
        pantallaOpciones.style.setProperty('display', 'none', 'important');
    }
    
    if (catalogoAnimales) {
        // Lo mostramos como flex para que mantenga el contenedor centrado y ordenado
        catalogoAnimales.style.setProperty('display', 'flex', 'important');
        catalogoAnimales.style.setProperty('flex-direction', 'column', 'important');
    }

    const mainContainer = document.querySelector('.main-content.main-adopciones');
    if (mainContainer) {
        // Le devolvemos el diseño centrado que usa la vista principal para que luzca hermoso
        mainContainer.style.setProperty('display', 'flex', 'important');
        mainContainer.style.setProperty('align-items', 'center', 'important');
        mainContainer.style.setProperty('justify-content', 'center', 'important');
        mainContainer.classList.add('vista-opciones-centrada');
    }
}

function volverAOpciones() {
    const catalogoAnimales = document.getElementById('seccion-catalogo-animales');
    const pantallaOpciones = document.getElementById('pantalla-opciones-adopcion');

    if (catalogoAnimales) {
        catalogoAnimales.style.setProperty('display', 'none', 'important');
    }
    
    if (pantallaOpciones) {
        pantallaOpciones.style.setProperty('display', 'flex', 'important');
    }

    const mainContainer = document.querySelector('.main-content.main-adopciones');
    if (mainContainer) {
        mainContainer.style.setProperty('display', 'flex', 'important');
        mainContainer.style.setProperty('align-items', 'center', 'important');
        mainContainer.style.setProperty('justify-content', 'center', 'important');
        mainContainer.classList.add('vista-opciones-centrada');
    }
}