// Variable global para mantener la referencia del usuario de Firebase
let usuarioActual = null;

// Escuchar cambios de sesión en Firebase Auth
firebase.auth().onAuthStateChanged((user) => {
    usuarioActual = user;
    if (user) {
        console.log("✅ Sesión de usuario detectada en Adopciones:", user.email);
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
        const respuesta = await fetch(`http://localhost:3000/api/verificar-adoptante?correo=${encodeURIComponent(user.email)}`, {
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
            // Caso A: Ya tiene perfil -> Abre el catálogo de animales
            mostrarSeccionAdopcion('seccion-catalogo-animales');
        } else {
            // Caso B: No tiene perfil -> Muestra el modal personalizado
            abrirModalAviso();
        }

    } catch (error) {
        console.error("❌ Error al verificar adoptante:", error);
        alert("Ocurrió un error al consultar tu perfil de adoptante. Revisa que el servidor Node.js esté corriendo.");
    }
}

// Manejador para el botón "Poner animal en adopción"
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
    alert("Próximamente: Formulario para registrar un animal en adopción.");
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

// MOSTRAR Y OCULTAR VISTAS INTERNAS
function mostrarSeccionAdopcion(idSeccion) {
    const pantallaOpciones = document.getElementById('pantalla-opciones-adopcion');
    const catalogoAnimales = document.getElementById('seccion-catalogo-animales');

    if (pantallaOpciones) pantallaOpciones.style.display = 'none';
    if (catalogoAnimales) catalogoAnimales.style.display = 'none';

    const seccionObjetivo = document.getElementById(idSeccion);
    if (seccionObjetivo) {
        seccionObjetivo.style.display = 'block';
    }
}

function volverAOpciones() {
    const catalogoAnimales = document.getElementById('seccion-catalogo-animales');
    const pantallaOpciones = document.getElementById('pantalla-opciones-adopcion');

    if (catalogoAnimales) catalogoAnimales.style.display = 'none';
    if (pantallaOpciones) pantallaOpciones.style.display = 'flex';
}