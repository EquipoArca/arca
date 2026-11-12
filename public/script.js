if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado con éxito:', reg.scope))
            .catch(err => console.error('Error al registrar el Service Worker:', err));
    });
}

const firebaseConfig = {
    apiKey: "AIzaSyC-KetEpCzTu7AHp6OV7kcaM6rwxdbwaxs",
    authDomain: "arca-90c0f.firebaseapp.com",
    projectId: "arca-90c0f",
    storageBucket: "arca-90c0f.firebasestorage.app",
    messagingSenderId: "208516820997",
    appId: "1:208516820997:web:b610694c5ee7c8b8adac6c",
    measurementId: "G-22M1GJC6PZ"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// ==========================================
// 1. ESCUCHADOR DE SESIÓN MAESTRO (UNIFICADO)
// ==========================================
auth.onAuthStateChanged(async (user) => {
    // Referencias del Menú Lateral
    const linkInicio = document.getElementById('link-inicio');
    const linkPerfil = document.getElementById('link-perfil');
    const linkGuardado = document.getElementById('link-guardado');
    const linkMapa = document.getElementById('link-mapa');
    const linkConfig = document.getElementById('link-config');
    
    // Referencias del Nav y Mini Menú
    const userDisplayName = document.getElementById('user-display-name');
    const menuUsuario = document.getElementById('user-profile-menu');
    const dropdownName = document.getElementById('mini-menu-username');
    const avatarImg = document.getElementById('user-avatar-img');
    const avatarBtn = document.getElementById('user-avatar-btn');
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion-mini');
    const nombrePerfilElem = document.getElementById('mostrar-nombre-usuario');

    if (user) {
        console.log("Sesión detectada automáticamente para:", user.email);
        activarModoFull();

        // Mostrar contenedor del menú del usuario
        if (menuUsuario) menuUsuario.style.display = "block";

        // Evento del botón de cerrar sesión
        if (btnCerrarSesion) {
            btnCerrarSesion.onclick = () => {
                auth.signOut().then(() => window.location.reload());
            };
        }

        // Petición única a Node.js/MySQL para obtener datos del usuario
        try {
            const response = await fetch(`/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            const nombreFinal = data.nombre_usuario || (user.displayName || user.email.split('@')[0]);

            if (nombrePerfilElem) nombrePerfilElem.textContent = `@${nombreFinal}`;
            if (userDisplayName) userDisplayName.textContent = nombreFinal;
            if (dropdownName) dropdownName.textContent = nombreFinal;

            // Manejo de foto de perfil o silueta por defecto
            if (data.foto_perfil && avatarImg) {
                avatarImg.src = data.foto_perfil;
                avatarImg.style.display = 'block';
            } else if (avatarBtn) {
                avatarBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" class="icono-silueta-nav">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                `;
            }
        } catch (error) {
            console.error("Error al obtener el usuario de Node.js:", error);
            const nombreFallback = user.displayName || user.email.split('@')[0];

            if (nombrePerfilElem) nombrePerfilElem.textContent = `@${nombreFallback}`;
            if (userDisplayName) userDisplayName.textContent = nombreFallback;
            if (dropdownName) dropdownName.textContent = nombreFallback;
        }

        // Redirección de enlaces (Autenticado)
        if (linkInicio) linkInicio.href = "home.html";
        if (linkPerfil) linkPerfil.href = "perfil_usuario.html";
        if (linkGuardado) linkGuardado.href = "guardados_usuario.html";
        if (linkMapa) linkMapa.href = "mapa.html";
        if (linkConfig) linkConfig.href = "configuracion.html";

    } else {
        // MODO INVITADO
        if (userDisplayName) userDisplayName.textContent = "";
        if (menuUsuario) menuUsuario.style.display = "none";

        // Redirección de enlaces (Invitado)
        if (linkInicio) linkInicio.href = "home.html";
        if (linkPerfil) linkPerfil.href = "home.html?seccion=perfil";
        if (linkGuardado) linkGuardado.href = "home.html?seccion=guardado";
        if (linkMapa) linkMapa.href = "home.html?seccion=mapa";
        if (linkConfig) linkConfig.href = "home.html?seccion=configuracion";
    }
});

// ==========================================
// 2. FUNCIONES DE INTERFAZ Y MODOS
// ==========================================
function activarModoFull() {
    cerrarBloqueo();

    const cardReportar = document.querySelector(".card.report");
    const cardAdopciones = document.querySelector(".card.adopt");
    const cardDonaciones = document.querySelector(".card.donate");

    if (cardReportar) {
        cardReportar.removeAttribute("onclick");
        cardReportar.setAttribute("href", "formularior.html");
    }
    if (cardAdopciones) {
        cardAdopciones.removeAttribute("onclick");
        cardAdopciones.setAttribute("href", "adopciones.html");
    }
    if (cardDonaciones) {
        cardDonaciones.removeAttribute("onclick");
        cardDonaciones.setAttribute("href", "donaciones.html");
    }

    const iconoNotif = document.querySelector(".notif-circle a");
    if (iconoNotif) {
        iconoNotif.removeAttribute("onclick");
        iconoNotif.setAttribute("href", "notificaciones.html");
    }

    const botonesDetalles = document.querySelectorAll(".btn-detalles");
    botonesDetalles.forEach((boton) => {
        boton.removeAttribute("onclick");
        boton.onclick = function() {
            alert("Aún no se han publicado detalles para esta novedad.");
        };
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('sidebar-abierta');
    }
}

// Cerrar el sidebar al hacer clic fuera de él
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const menuButton = document.querySelector('#btn-toggle-menu');

    if (!sidebar || !menuButton) return;

    const sidebarEstaAbierto = sidebar.classList.contains('sidebar-abierta');
    const clicDentroSidebar = sidebar.contains(event.target);
    const clicEnBotonMenu = menuButton.contains(event.target);

    if (sidebarEstaAbierto && !clicDentroSidebar && !clicEnBotonMenu) {
        sidebar.classList.remove('sidebar-abierta');
    }
});

// Control del Mini Menú Desplegable del Avatar
function toggleMiniMenu() {
    const card = document.getElementById('mini-menu-card');
    if (card) card.classList.toggle('show');
}

document.addEventListener('click', (e) => {
    const avatarBtn = document.getElementById('user-avatar-btn');
    const card = document.getElementById('mini-menu-card');
    if (card && avatarBtn && !avatarBtn.contains(e.target) && !card.contains(e.target)) {
        card.classList.remove('show');
    }
});

// ==========================================
// 3. AUTENTICACIÓN Y NAVEGACIÓN
// ==========================================
let correoValidado = "";

async function ejecutarLoginEmail() {
    const emailInput = document.getElementById("email-input");
    if (!emailInput) return;
    const email = emailInput.value.trim();

    if (email === "") {
        alert("Por favor, ingresa tu correo electrónico.");
        return;
    }

    // 1. Verificación previa de conexión
    if (!navigator.onLine) {
        mostrarAlertaOffline();
        return;
    }

    try {
        const metodos = await auth.fetchSignInMethodsForEmail(email);
        if (metodos.length > 0) {
            mostrarPasoContrasena(email);
        } else {
            alert("Este correo no tiene una cuenta creada. Te redirigiremos para registrarte.");
            window.location.href = `registro.html?email=${encodeURIComponent(email)}`;
        }
    } catch (error) {
        // Si hay error de red o de conexión en Firebase -> Muestra TU modal
        if (!navigator.onLine || error.code === 'auth/network-request-failed') {
            mostrarAlertaOffline();
        } else if (error.code === 'auth/invalid-email') {
            alert("Por favor, ingresa un correo electrónico válido.");
        } else {
            console.error("Error al verificar correo:", error);
            alert("Ocurrió un error al verificar la cuenta: " + error.message);
        }
    }
}

function iniciarSesionFinal() {
    // Verificación de red antes de intentar autenticar
    if (!navigator.onLine) {
        mostrarAlertaOffline();
        return;
    }

    const passInput = document.getElementById("password-input-modal");
    const pass = passInput ? passInput.value.trim() : "";

    if (pass === "") {
        alert("Por favor, ingresa tu contraseña.");
        return;
    }

    auth.signInWithEmailAndPassword(correoValidado, pass)
        .then(() => {
            activarModoFull();
        })
        .catch((error) => {
            if (!navigator.onLine || error.code === 'auth/network-request-failed') {
                mostrarAlertaOffline();
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                alert("Contraseña incorrecta. Inténtalo de nuevo.");
            } else {
                alert("Error al iniciar sesión: " + error.message);
            }
        });
}

function mostrarPasoContrasena(email) {
    correoValidado = email;
    const emailInput = document.getElementById("email-input");
    if (!emailInput) return;
    
    emailInput.style.display = "none";

    let passInput = document.getElementById("password-input-modal");
    if (!passInput) {
        passInput = document.createElement("input");
        passInput.type = "password";
        passInput.id = "password-input-modal";
        passInput.placeholder = "Ingresa tu contraseña";
        passInput.className = emailInput.className; 
        emailInput.parentNode.insertBefore(passInput, emailInput.nextSibling);
    }
    passInput.style.display = "block";
    passInput.focus();

    const btnEntrar = document.querySelector("#paso3 button") || document.querySelector("#paso3 .btn-entrar");
    if (btnEntrar) {
        btnEntrar.setAttribute("onclick", "iniciarSesionFinal()");
    }
}

function iniciarSesionFinal() {
    const passInput = document.getElementById("password-input-modal");
    const pass = passInput ? passInput.value.trim() : "";

    if (pass === "") {
        alert("Por favor, ingresa tu contraseña.");
        return;
    }

    auth.signInWithEmailAndPassword(correoValidado, pass)
        .then(() => {
            activarModoFull();
        })
        .catch((error) => {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                alert("Contraseña incorrecta. Inténtalo de nuevo.");
            } else {
                alert("Error al iniciar sesión: " + error.message);
            }
        });
}

function mostrarFormularioCorreo() {
    const p2 = document.getElementById("paso2");
    const p3 = document.getElementById("paso3");
    if (p2) p2.style.display = "none";
    if (p3) p3.style.display = "block";
}

function volverAlPaso2() {
    const p2 = document.getElementById("paso2");
    const p3 = document.getElementById("paso3");
    if (p3) p3.style.display = "none";
    if (p2) p2.style.display = "block";
}

function abrirBloqueo() {
    const elemento = document.getElementById("miOverlay"); 
    if (elemento) elemento.classList.add("overlay-active");
}

function cerrarBloqueo() {
    const elemento = document.getElementById("miOverlay");
    if (elemento) elemento.classList.remove("overlay-active");
}

function mostrarOpcionesSociales() {
    const p1 = document.getElementById("paso1");
    const p2 = document.getElementById("paso2");
    if (p1) p1.style.display = "none";
    if (p2) p2.style.display = "block";
}

function volverAlPaso1() {
    const p1 = document.getElementById("paso1");
    const p2 = document.getElementById("paso2");
    if (p2) p2.style.display = "none";
    if (p1) p1.style.display = "block";
}

function mostrarSeccion(seccion) {
    const usuarioConectado = auth.currentUser;

    if (usuarioConectado) {
        switch (seccion) {
            case 'inicio':
                window.location.href = "home.html";
                break;
            case 'perfil':
                window.location.href = "perfil_usuario.html";
                break;
            case 'guardado':
                window.location.href = "guardados_usuario.html";
                break;
            case 'mapa':
                window.location.href = "mapa.html";
                break;
            case 'configuracion':
                window.location.href = "configuracion.html";
                break;
            default:
                break;
        }
        return;
    }

    const inicio = document.getElementById('pantalla-inicio');
    const perfil = document.getElementById('pantalla-perfil');
    const titulo = document.getElementById('titulo-pagina');
    const guardado = document.getElementById('guardados-invitado');
    const map = document.getElementById('mapa-i');
    const configuracion = document.getElementById('configuracion-i');
    
    if (inicio) inicio.style.display = 'none';
    if (perfil) perfil.style.display = 'none';
    if (guardado) guardado.style.display = 'none';
    if (map) map.style.display = 'none';
    if (configuracion) configuracion.style.display = 'none';

    if (seccion === 'perfil' && perfil) {
        perfil.style.display = 'block';
        if (titulo) titulo.innerText = 'Perfil';
    } else if (seccion === 'guardado' && guardado) {
        guardado.style.display = 'flex';
        if (titulo) titulo.innerText = 'Publicaciones Guardadas';
    } else if (seccion === 'mapa' && map) {
        map.style.display = 'block';
        if (titulo) titulo.innerText = 'Mapa';
    } else if (seccion === 'configuracion' && configuracion) {
        configuracion.style.display = 'flex';
        if (titulo) titulo.innerText = 'Configuración';
    } else if (inicio) {
        inicio.style.display = 'block';
        if (titulo) titulo.innerText = 'Inicio';
    }
}

// ==========================================
// 4. ARRASTRE Y SUBIDA DE ARCHIVOS
// ==========================================
const zonaArrastre = document.getElementById('zona-arrastre');
const inputOculto = document.getElementById('input-archivo-oculto');
const btnSubir = document.getElementById('btn-subir-archivo');
const btnCirculo = document.getElementById('btn-circulo');

let archivosSeleccionados = [];

function activarSelector() {
    if (inputOculto) inputOculto.click(); 
}

if (zonaArrastre && inputOculto && btnSubir) {
    btnSubir.addEventListener('click', activarSelector);
    if (btnCirculo) btnCirculo.addEventListener('click', activarSelector);

    inputOculto.addEventListener('change', (evento) => {
        const archivos = evento.target.files;
        if (archivos.length > 0) {
            procesarArchivosMultiples(archivos);
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(nombreEvento => {
        zonaArrastre.addEventListener(nombreEvento, (e) => e.preventDefault());
    });

    ['dragenter', 'dragover'].forEach(nombreEvento => {
        zonaArrastre.addEventListener(nombreEvento, () => {
            zonaArrastre.style.border = "2px dashed #fbc2c4";
            zonaArrastre.style.backgroundColor = "rgba(251, 194, 196, 0.2)";
        });
    });

    ['dragleave', 'drop'].forEach(nombreEvento => {
        zonaArrastre.addEventListener(nombreEvento, () => {
            zonaArrastre.style.border = "none";
            zonaArrastre.style.backgroundColor = "transparent";
        });
    });

    zonaArrastre.addEventListener('drop', (evento) => {
        const datosTransferidos = evento.dataTransfer;
        const archivos = datosTransferidos.files;

        if (archivos.length > 0) {
            const soloImagenes = Array.from(archivos).filter(arc => arc.type.startsWith('image/'));
            if (soloImagenes.length > 0) {
                procesarArchivosMultiples(soloImagenes);
            } else {
                alert("Por favor, arrastra solo archivos de imagen.");
            }
        }
    });
}

function procesarArchivosMultiples(nuevosArchivos) {
    Array.from(nuevosArchivos).forEach(archivo => {
        archivosSeleccionados.push(archivo);
    });

    const textoEstadoReal = document.querySelector('.texto-arrastra') || document.getElementById('texto-arrastra');
    
    if (textoEstadoReal) {
        textoEstadoReal.innerText = `${archivosSeleccionados.length} imágenes listas para subir`;
        textoEstadoReal.style.color = "#4caf50";
    }
}

// ==========================================
// 5. CARGA DE REPORTES Y GRÁFICAS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const parametrosURL = new URLSearchParams(window.location.search);
    const seccionSolicitada = parametrosURL.get('seccion');

    if (typeof mostrarSeccion === 'function') {
        mostrarSeccion(seccionSolicitada);
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.opacity = '1';
        mainContent.style.visibility = 'visible';
    }

    if (document.getElementById('tabla-usuarios')) cargarReporteEdad();
    if (document.getElementById('tabla-emergencias')) cargarReporteEmergencias();
});

async function cargarReporteEdad() {
    try {
        const res = await fetch('/api/reportes/usuarios-edad');
        const data = await res.json();

        const tbody = document.getElementById('tabla-usuarios');
        if (!tbody) return;

        tbody.innerHTML = '';
        const labels = [];
        const valores = [];

        data.forEach(row => {
            labels.push(row.rango_edad);
            valores.push(row.total_usuarios);

            tbody.innerHTML += `
                <tr>
                    <td><strong>${row.rango_edad}</strong></td>
                    <td>${row.total_usuarios} usuario(s)</td>
                </tr>
            `;
        });

        const canvas = document.getElementById('graficoUsuarios');
        if (canvas) {
            new Chart(canvas.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: valores,
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
                    }]
                },
                options: { responsive: true }
            });
        }
    } catch (err) {
        console.error("❌ Error al cargar reporte de usuarios:", err);
    }
}

async function cargarReporteEmergencias() {
    try {
        const res = await fetch('/api/reportes/emergencias');
        const data = await res.json();

        const tbody = document.getElementById('tabla-emergencias');
        if (!tbody) return;

        tbody.innerHTML = '';
        const labels = [];
        const valores = [];

        data.forEach(row => {
            labels.push(row.tipo_emergencia);
            valores.push(row.total_casos);

            tbody.innerHTML += `
                <tr>
                    <td><strong>${row.tipo_emergencia}</strong></td>
                    <td>${row.total_casos} caso(s)</td>
                </tr>
            `;
        });

        const canvas = document.getElementById('graficoEmergencias');
        if (canvas) {
            new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: valores,
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
                    }]
                },
                options: { responsive: true }
            });
        }
    } catch (err) {
        console.error("❌ Error al cargar reporte de emergencias:", err);
    }
}

// ==========================================
// 6. RECUPERACIÓN DE CONTRASEÑA
// ==========================================
function abrirModalRecuperar() {
    const emailLogin = document.getElementById("email-input");
    const emailRecuperar = document.getElementById("email-recuperar");
    const msg = document.getElementById("mensaje-estado-recuperar");

    if (msg) msg.textContent = "";

    if (emailRecuperar) {
        if (correoValidado) {
            emailRecuperar.value = correoValidado;
        } else if (emailLogin && emailLogin.value) {
            emailRecuperar.value = emailLogin.value.trim();
        }
    }

    const modalRecuperar = document.getElementById("modal-recuperar-pass");
    if (modalRecuperar) {
        modalRecuperar.classList.remove("hidden");
        modalRecuperar.style.display = "flex"; 
        modalRecuperar.style.zIndex = "99999"; 
    }
}

function cerrarModalRecuperar() {
    const modalRecuperar = document.getElementById("modal-recuperar-pass");
    if (modalRecuperar) {
        modalRecuperar.classList.add("hidden");
        modalRecuperar.style.display = "none";
    }
}

function enviarEnlaceRecuperacion() {
    const emailInput = document.getElementById("email-recuperar");
    const msg = document.getElementById("mensaje-estado-recuperar");

    if (!emailInput) return;
    const email = emailInput.value.trim();

    if (email === "") {
        msg.textContent = "Por favor ingresa tu correo electrónico.";
        msg.style.color = "#d32f2f";
        return;
    }

    msg.textContent = "Enviando correo...";
    msg.style.color = "#333";

    auth.sendPasswordResetEmail(email)
        .then(() => {
            msg.textContent = "¡Correo enviado! Revisa tu bandeja de entrada o spam.";
            msg.style.color = "#4caf50";
            
            setTimeout(() => {
                cerrarModalRecuperar();
            }, 3000);
        })
        .catch((error) => {
            console.error("Error al enviar enlace de recuperación:", error);
            if (error.code === 'auth/user-not-found') {
                msg.textContent = "No hay ninguna cuenta registrada con este correo.";
            } else if (error.code === 'auth/invalid-email') {
                msg.textContent = "Por favor ingresa un correo válido.";
            } else {
                msg.textContent = "Error: " + error.message;
            }
            msg.style.color = "#d32f2f";
        });
}

async function obtenerNombreUbicacionGlobal(textoUbicacionOriginal) {
    if (!textoUbicacionOriginal) return "Ubicación no especificada";
    
    let textoLimpio = textoUbicacionOriginal.replace('Ubicación GPS:', '').trim();

    if (textoLimpio.includes(',')) {
        const partes = textoLimpio.split(',');
        const lat = parseFloat(partes[0].trim());
        const lon = parseFloat(partes[1].trim());

        if (!isNaN(lat) && !isNaN(lon)) {
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
                const respuesta = await fetch(url, {
                    headers: { 'Accept-Language': 'es', 'User-Agent': 'ARCA-App-Mascotas' }
                });
                
                if (!respuesta.ok) throw new Error("Error en el servidor de mapas");
                
                const datos = await respuesta.json();
                
                if (datos && datos.address) {
                    const addr = datos.address;
                    const calle = addr.road || addr.pedestrian || addr.footway || "";
                    const numero = addr.house_number || "";
                    const barrio = addr.neighbourhood || addr.suburb || addr.city_district || "";
                    const ciudad = addr.town || addr.city || addr.state || "Medellín";
                    
                    if (calle) {
                        let direccionExacta = numero ? `${calle} #${numero}` : calle;
                        if (barrio && barrio !== calle) {
                            direccionExacta += `, ${barrio}`;
                        }
                        return direccionExacta;
                    }
                    
                    return barrio && barrio !== ciudad ? `${barrio}, ${ciudad}` : ciudad;
                }
            } catch (error) {
                console.warn("No se pudo conectar al mapa, usando respaldo.");
            }
            return "San Cristóbal, Medellín (Ubicación aproximada)";
        }
    }
    
    return textoUbicacionOriginal;
}
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("modo_oscuro") === "true") {
        document.body.classList.add("dark-mode");
    }
});

// Muestra el modal de alerta offline o lanza un alert si no existe en el HTML
function mostrarAlertaOffline() {
    const overlay = document.getElementById('offline-alert-overlay');
    if (overlay) {
        overlay.classList.remove('d-none');
    } else {
        alert("¡No tienes conexión a internet! Inténtalo más tarde.");
    }
}

// Oculta el modal de alerta offline
function ocultarAlertaOffline() {
    const overlay = document.getElementById('offline-alert-overlay');
    if (overlay) {
        overlay.classList.add('d-none');
    }
}

// Configura los eventos de los botones de cierre al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const btnCerrar = document.getElementById('close-offline-alert');
    const btnX = document.getElementById('close-x-btn');

    if (btnCerrar) btnCerrar.addEventListener('click', ocultarAlertaOffline);
    if (btnX) btnX.addEventListener('click', ocultarAlertaOffline);

    // Si al cargar la página el dispositivo no tiene internet, muestra la alerta
    if (!navigator.onLine) {
        mostrarAlertaOffline();
    }
});

// Escuchadores en tiempo real para cuando se desconecta o conecta internet
window.addEventListener('offline', () => {
    mostrarAlertaOffline();
});

window.addEventListener('online', () => {
    ocultarAlertaOffline();
});

// Ejemplo de cómo usar la validación dentro de cualquier función de tu archivo
function miFuncion() {
    if (!navigator.onLine) {
        mostrarAlertaOffline();
        return;
    }

}

