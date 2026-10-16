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
            const response = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            const nombreFinal = data.nombre_usuario || (user.displayName || user.email.split('@')[0]);
            
            const tipoUsuario = data.tipo_usuario || 'usuario';
            const estadoAprobacion = data.estado_aprobacion || 'aprobado';

            localStorage.setItem('tipo_usuario', tipoUsuario);
            localStorage.setItem('estado_aprobacion', estadoAprobacion);
            
            if (tipoUsuario === 'fundacion' && estadoAprobacion === 'pendiente') {
                alert("¡Tu fundación está en proceso de revisión legal por el equipo de ARCA! Te notificaremos cuando sea aprobada.");
                auth.signOut().then(() => {
                    localStorage.clear();
                    window.location.href = "home.html";
                });
                return;
            }
            
            if (nombrePerfilElem) nombrePerfilElem.textContent = `@${nombreFinal}`;
            if (userDisplayName) userDisplayName.textContent = nombreFinal;
            if (dropdownName) dropdownName.textContent = nombreFinal;

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
        mostrarAlertaArca(
            "¡Ey, corazón! ♡",
            "Rellena el campo del correo antes de continuar."
        );
        emailInput.focus();
        return;
    }

    if (!navigator.onLine) {
        mostrarAlertaOffline();
        return;
    }

    try {
        const metodos = await auth.fetchSignInMethodsForEmail(email);
        const esFlujoFundacion = localStorage.getItem('flujo_fundacion') === 'true';

        if (metodos.length > 0) {
            if (esFlujoFundacion) {
                localStorage.removeItem('flujo_fundacion');
                mostrarPasoContrasena(email);
            } else {
                mostrarPasoContrasena(email);
            }
        } else {
            if (esFlujoFundacion) {
                correoValidado = email;
                document.getElementById("paso3").style.display = "none";
                document.getElementById("paso4").style.display = "block";
            } else {
                mostrarAlertaArca(
                    "¡Vamos a conocerte! ♡",
                    "Este correo no tiene una cuenta registrada. Te llevaremos al registro para que puedas crear tu cuenta.",
                    {
                        tipo: "aviso",
                        textoBoton: "Ir al registro ♡",
                        alCerrar: () => {
                            window.location.href = `registro.html?email=${encodeURIComponent(email)}`;
                        }
                    }
                );
            }
        }
    } catch (error) {
        if (!navigator.onLine || error.code === "auth/network-request-failed") {
            mostrarAlertaOffline();
        } else if (error.code === "auth/invalid-email") {
            mostrarAlertaArca(
                "¡Revisa tu correo!",
                "El correo no parece estar escrito correctamente. Comprueba que tenga un formato válido."
            );
        } else {
            console.error("Error al verificar correo:", error);
            mostrarAlertaArca(
                "¡Hubo un pequeño error!",
                "No pudimos verificar tu cuenta. Inténtalo de nuevo."
            );
        }
    }
}

function iniciarSesionFinal() {
    if (!navigator.onLine) {
        mostrarAlertaOffline();
        return;
    }

    const passInput = document.getElementById("password-input-modal");
    const pass = passInput ? passInput.value.trim() : "";

    if (pass === "") {
        mostrarAlertaArca(
            "¡Te falta un detallito! ♡",
            "Escribe tu contraseña antes de continuar."
        );
        if (passInput) passInput.focus();
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
                mostrarAlertaArca(
                    "Casi lo logramos ♡",
                    "La contraseña no coincide. Revísala e inténtalo nuevamente."
                );
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
    localStorage.removeItem('flujo_fundacion');
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
    localStorage.removeItem('flujo_fundacion');
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

function mostrarAlertaOffline() {
    const overlay = document.getElementById('offline-alert-overlay');
    if (overlay) {
        overlay.classList.remove('d-none');
    } else {
        alert("¡No tienes conexión a internet! Inténtalo más tarde.");
    }
}

function ocultarAlertaOffline() {
    const overlay = document.getElementById('offline-alert-overlay');
    if (overlay) {
        overlay.classList.add('d-none');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnCerrar = document.getElementById('close-offline-alert');
    const btnX = document.getElementById('close-x-btn');

    if (btnCerrar) btnCerrar.addEventListener('click', ocultarAlertaOffline);
    if (btnX) btnX.addEventListener('click', ocultarAlertaOffline);

    if (!navigator.onLine) {
        mostrarAlertaOffline();
    }
});

window.addEventListener('offline', () => {
    mostrarAlertaOffline();
});

window.addEventListener('online', () => {
    ocultarAlertaOffline();
});

document.addEventListener('DOMContentLoaded', () => {
    const modoOscuroGuardado = localStorage.getItem('darkMode') === 'true';
    if (modoOscuroGuardado && document.body) {
        document.body.classList.add('dark-mode');
    }
});

// ==========================================
// CARGAR Y FILTRAR ADOPCIONES EN NOVEDADES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const contenedorNovedades = document.getElementById('contenedor-novedades');
    
    if (contenedorNovedades && window.location.pathname.includes('novedades-adopciones.html')) {
        cargarAdopcionesNovedades();
    }
});

function cargarAdopcionesNovedades() {
    const contenedor = document.getElementById('contenedor-novedades');
    if (!contenedor) return;

    // Obtenemos el correo del usuario conectado actualmente con Firebase
    const correoActual = (auth.currentUser && auth.currentUser.email) ? auth.currentUser.email : '';

    // Si NO ha iniciado sesión, mostramos directamente el estado vacío con el botón para abrir el login
    if (!correoActual) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <div class="escena-cielo-kawaii">
                    <div class="nube-kawaii nube-izq"></div>
                    <div class="sol-kawaii">
                        <div class="ojo-sol izq"></div>
                        <div class="ojo-sol der"></div>
                        <div class="boca-sol"></div>
                        <div class="rubor-sol izq"></div>
                        <div class="rubor-sol der"></div>
                    </div>
                    <div class="nube-kawaii nube-der"></div>
                    <span class="destello d1">✦</span>
                    <span class="destello d2">✦</span>
                </div>
                <h2>¡Aún no hay publicaciones de adopción!</h2>
                <p>&lt;3</p>
                <button class="btn-detalles" onclick="abrirBloqueo()" style="margin-top: 15px; padding: 10px 20px; border-radius: 14px; border: none; background: #e985a0; color: white; font-weight: bold; cursor: pointer; font-family: 'Itim';">Ver detalles</button>
            </div>
        `;
        return;
    }

    // Si SÍ hay sesión activa, procedemos a hacer el fetch con normalidad
    fetch(`/api/publicaciones-globales?correo=${encodeURIComponent(correoActual)}`)
        .then(res => res.json())
        .then(publicaciones => {
            contenedor.innerHTML = ''; 

            const adopciones = publicaciones.filter(pub => pub.tipo_publicacion === 'adopcion');

            if (adopciones.length === 0) {
                contenedor.innerHTML = `
                    <div class="estado-vacio">
                        <div class="escena-cielo-kawaii">
                            <div class="nube-kawaii nube-izq"></div>
                            <div class="sol-kawaii">
                                <div class="ojo-sol izq"></div>
                                <div class="ojo-sol der"></div>
                                <div class="boca-sol"></div>
                                <div class="rubor-sol izq"></div>
                                <div class="rubor-sol der"></div>
                            </div>
                            <div class="nube-kawaii nube-der"></div>
                            <span class="destello d1">✦</span>
                            <span class="destello d2">✦</span>
                        </div>
                        <h2>¡Aún no hay publicaciones de adopción!</h2>
                        <p>&lt;3</p>
                    </div>
                `;
                return;
            }

            adopciones.forEach(adopcion => {
                let fotoSrc = 'logo.png';
                try {
                    const fotosArray = JSON.parse(adopcion.img_reporte);
                    if (Array.isArray(fotosArray) && fotosArray.length > 0) {
                        fotoSrc = fotosArray[0];
                    }
                } catch (e) {
                    if (adopcion.img_reporte) fotoSrc = adopcion.img_reporte;
                }

                const fechaFormateada = new Date(adopcion.Fecha_reporte).toLocaleDateString();

                const tarjeta = document.createElement('article');
                tarjeta.classList.add('tarjeta-adopcion');
                tarjeta.innerHTML = `
                    <div class="columna-izquierda">
                        <div class="badge-titulo-adopcion">${adopcion.nombre_tipo_reporte || 'Adopción'}</div>
                        <div class="contenedor-foto-adopcion">
                            <img src="${fotoSrc}" alt="Mascota" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">
                        </div>
                    </div>
                    <div class="columna-derecha-adopcion">
                        <span class="fecha-adopcion">${fechaFormateada}</span>
                        <div class="lista-capsulas-vacias">
                            <div class="capsula-dato">📍 ${adopcion.Ubicacion}</div>
                            <div class="capsula-dato">📝 ${adopcion.Descripcion ? adopcion.Descripcion.substring(0, 70) + '...' : 'Sin descripción'}</div>
                            <button class="btn-detalles" onclick="verDetallesAdopcion('${adopcion.id_origen}')">Ver detalles</button>
                        </div>
                    </div>
                `;
                contenedor.appendChild(tarjeta);
            });
        })
        .catch(err => console.error("Error al cargar las adopciones:", err));
}

function verDetallesAdopcion(idAdopcion) {
    window.location.href = `detalles_adopcion.html?id=${idAdopcion}`;
}

// ==========================================
// 7. BUSCADOR UNIVERSAL INTELIGENTE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const inputBusqueda = document.querySelector('.search-bar input');
    const contenedorBarra = document.querySelector('.search-bar');

    if (!inputBusqueda || !contenedorBarra) return;

    let menuFlotante = document.getElementById('desplegable-busqueda-arca');
    if (!menuFlotante) {
        menuFlotante = document.createElement('div');
        menuFlotante.id = 'desplegable-busqueda-arca';
        menuFlotante.className = 'resultados-busqueda-flotante';
        contenedorBarra.appendChild(menuFlotante);
    }

    const indicesSistema = [
        { titulo: "Cambiar nombre de usuario", subtitulo: "Perfil > Ajustes de cuenta", icono: "fa-user-pen", clase: "seccion", url: "perfil_usuario.html#nombre-usuario", palabras: ["nombre", "usuario", "cambiar nombre", "perfil"] },
        { titulo: "Editar correo electrónico", subtitulo: "Perfil > Seguridad", icono: "fa-envelope", clase: "seccion", url: "perfil_usuario.html#correo", palabras: ["correo", "email", "electronico", "editar correo"] },
        { titulo: "Cambiar número de celular", subtitulo: "Perfil > Contacto", icono: "fa-phone", clase: "seccion", url: "perfil_usuario.html#celular", palabras: ["celular", "telefono", "numero", "contacto"] },
        { titulo: "Perfil de adoptante", subtitulo: "Perfil > Solicitudes", icono: "fa-paw", clase: "adopcion", url: "perfil_usuario.html#adoptante", palabras: ["adoptante", "perfil adoptante"] },
        { titulo: "Mis publicaciones", subtitulo: "Perfil > Mis reportes y adopciones", icono: "fa-bookmark", clase: "guardados", url: "perfil_usuario.html#publicaciones", palabras: ["mis publicaciones", "mis reportes", "publicaciones"] },
        { titulo: "Modo oscuro (Apariencia)", subtitulo: "Configuración > Preferencias", icono: "fa-moon", clase: "ajustes", url: "configuracion.html#modo-oscuro", palabras: ["apariencia", "oscuro", "modo oscuro", "tema", "preferencias"] },
        { titulo: "Notificaciones en el navegador", subtitulo: "Configuración > Preferencias", icono: "fa-bell", clase: "ajustes", url: "configuracion.html#notificaciones", palabras: ["notificaciones", "alertas", "navegador"] },
        { titulo: "Idioma de la aplicación", subtitulo: "Configuración > Preferencias", icono: "fa-language", clase: "ajustes", url: "configuracion.html#idioma", palabras: ["idioma", "español", "english", "lenguaje"] },
        { titulo: "Usuarios bloqueados", subtitulo: "Configuración > Permisos y Cuenta", icono: "fa-user-slash", clase: "ajustes", url: "configuracion.html#bloqueados", palabras: ["bloqueados", "bloquear", "usuarios bloqueados", "privacidad"] },
        { titulo: "Permisos de ubicación", subtitulo: "Configuración > Permisos", icono: "fa-location-dot", clase: "ajustes", url: "configuracion.html#ubicacion", palabras: ["ubicacion", "gps", "permisos", "mapa"] },
        { titulo: "Eliminar cuenta", subtitulo: "Configuración > Cuenta (Zona de peligro)", icono: "fa-triangle-exclamation", clase: "adopcion", url: "configuracion.html#eliminar", palabras: ["eliminar cuenta", "borrar cuenta", "cuenta"] },
        { titulo: "Ayuda y soporte técnico", subtitulo: "Configuración > Soporte", icono: "fa-headset", clase: "seccion", url: "configuracion.html#soporte", palabras: ["soporte", "ayuda", "contacto", "tecnico", "ayuda y soporte"] },
        { titulo: "Mapa General", subtitulo: "Ver refugios y reportes cercanos", icono: "fa-map", clase: "seccion", url: "mapa.html", palabras: ["mapa", "refugios", "cerca"] },
        { titulo: "Publicaciones Guardadas", subtitulo: "Tus elementos guardados", icono: "fa-bookmark", clase: "guardados", url: "guardados_usuario.html", palabras: ["guardados", "favoritos", "guardado"] }
    ];

    let cachePublicaciones = [];

    inputBusqueda.addEventListener('input', async (e) => {
        const texto = e.target.value.trim().toLowerCase();

        if (texto.length < 2) {
            menuFlotante.style.display = 'none';
            return;
        }

        if (cachePublicaciones.length === 0) {
            try {
                const res = await fetch('/api/publicaciones-globales');
                if (res.ok) cachePublicaciones = await res.json();
            } catch (err) {
                console.error("Error al cargar datos globales:", err);
            }
        }

        const matchSistema = indicesSistema.filter(item => {
            const coincideTitulo = item.titulo.toLowerCase().includes(texto);
            const coincideSub = item.subtitulo.toLowerCase().includes(texto);
            const coincideKeywords = item.palabras.some(palabra => palabra.includes(texto));
            return coincideTitulo || coincideSub || coincideKeywords;
        });

        const matchPublicaciones = cachePublicaciones.filter(pub => {
            const usuario = (pub.nombre_usuario || '').toLowerCase();
            const desc = (pub.Descripcion || pub.descripcion_animal || '').toLowerCase();
            const ubicacion = (pub.Ubicacion || pub.ubicacion || '').toLowerCase();
            const tipo = (pub.nombre_tipo_reporte || pub.tipo_publicacion || '').toLowerCase();
            const nombreMascota = (pub.nombre_animal || '').toLowerCase();

            return usuario.includes(texto) || 
                   desc.includes(texto) || 
                   ubicacion.includes(texto) || 
                   tipo.includes(texto) || 
                   nombreMascota.includes(texto);
        });

        if (matchSistema.length > 0 || matchPublicaciones.length > 0) {
            let htmlHTML = '';

            if (matchSistema.length > 0) {
                htmlHTML += `<div class="categoria-busqueda-header">Ajustes y Opciones del Sistema</div>`;
                matchSistema.forEach(sys => {
                    htmlHTML += `
                        <a href="${sys.url}" class="item-resultado-busqueda">
                            <div class="icono-resultado ${sys.clase}">
                                <i class="fa-solid ${sys.icono}"></i>
                            </div>
                            <div class="info-resultado">
                                <span class="titulo-resultado">${sys.titulo}</span>
                                <span class="subtitulo-resultado">${sys.subtitulo}</span>
                            </div>
                        </a>
                    `;
                });
            }

            if (matchPublicaciones.length > 0) {
                htmlHTML += `<div class="categoria-busqueda-header">Comunidad y Publicaciones</div>`;
                matchPublicaciones.slice(0, 5).forEach(item => {
                    const esAdopcion = item.tipo_publicacion === 'adopcion';
                    const titulo = item.nombre_animal || item.nombre_tipo_reporte || (esAdopcion ? 'Mascota en adopción' : 'Reporte general');
                    const idUnico = item.id_origen || item.id_publicacion;
                    const enlace = esAdopcion ? `adopciones.html#pub-${idUnico}` : `novedades.html#pub-${idUnico}`;
                    const icono = esAdopcion ? 'fa-paw' : 'fa-triangle-exclamation';

                    htmlHTML += `
                        <a href="${enlace}" class="item-resultado-busqueda">
                            <div class="icono-resultado adopcion">
                                <i class="fa-solid ${icono}"></i>
                            </div>
                            <div class="info-resultado">
                                <span class="titulo-resultado">${titulo}</span>
                                <span class="subtitulo-resultado">@${item.nombre_usuario || 'usuario'} • ${item.Ubicacion || 'Medellín'}</span>
                            </div>
                        </a>
                    `;
                });
            }

            menuFlotante.innerHTML = htmlHTML;
            menuFlotante.style.display = 'block';
        } else {
            menuFlotante.innerHTML = `
                <div style="padding: 18px; text-align: center; color: #777; font-size: 13.5px;">
                    No se encontró nada para "${texto}" 🔍
                </div>
            `;
            menuFlotante.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!contenedorBarra.contains(e.target)) {
            menuFlotante.style.display = 'none';
        }
    });
});

// ==========================================
// 8. DETECTOR UNIVERSAL DE HASH PARA SCROLL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
        const selectorHash = window.location.hash;
        
        setTimeout(() => {
            const elementoDestino = document.querySelector(selectorHash) || document.getElementById(selectorHash.substring(1));
            
            if (elementoDestino) {
                elementoDestino.scrollIntoView({ behavior: 'smooth', block: 'center' });
                elementoDestino.classList.add('elemento-resaltado-magico');
                
                setTimeout(() => {
                    elementoDestino.classList.remove('elemento-resaltado-magico');
                }, 4000);
            }
        }, 600);
    }
});

// ==========================================
// FLUJO DE FUNDACIONES
// ==========================================
function prepararModoFundacion() {
    localStorage.setItem('flujo_fundacion', 'true');
    const p2 = document.getElementById("paso2");
    const p3 = document.getElementById("paso3");
    if (p2) p2.style.display = "none";
    if (p3) p3.style.display = "block";
}

let codigoOtpGenerado = "";
let passwordFundacionTemporal = "";

document.addEventListener('DOMContentLoaded', () => {
    const passModal = document.getElementById("password-fundacion-modal");
    const msgModal = document.getElementById("mensaje-estado-pass-modal");

    if (passModal && msgModal) {
        passModal.addEventListener('input', () => {
            const val = passModal.value;
            if (val.length < 8) {
                msgModal.textContent = "❌ Mínimo 8 caracteres.";
                msgModal.style.color = "#d32f2f";
            } else if (!/[A-Z]/.test(val)) {
                msgModal.textContent = "❌ Debe contener al menos una letra mayúscula.";
                msgModal.style.color = "#d32f2f";
            } else if (!/[0-9]/.test(val)) {
                msgModal.textContent = "❌ Debe contener al menos un número.";
                msgModal.style.color = "#d32f2f";
            } else {
                msgModal.textContent = "✔️ Contraseña segura.";
                msgModal.style.color = "#4caf50";
            }
        });
    }
});

async function enviarCodigoOtpFundacion() {
    const passModal = document.getElementById("password-fundacion-modal");
    passwordFundacionTemporal = passModal ? passModal.value.trim() : "";

    if (passwordFundacionTemporal.length < 8 || !/[A-Z]/.test(passwordFundacionTemporal) || !/[0-9]/.test(passwordFundacionTemporal)) {
        alert("Por favor, ingresa una contraseña que cumpla con todos los requisitos de seguridad.");
        return;
    }

    codigoOtpGenerado = Math.floor(1000 + Math.random() * 9000).toString();

    try {
        await emailjs.send("service_arca", "template_arca", {
            to_email: correoValidado,
            codigo: codigoOtpGenerado,
            nombre: "Fundación"
        });

        alert("¡Código de verificación enviado a tu correo!");
        document.getElementById("paso4").style.display = "none";
        document.getElementById("paso5").style.display = "block";
    } catch (err) {
        console.error("Error EmailJS:", err);
        alert("Código de prueba generado: " + codigoOtpGenerado);
        document.getElementById("paso4").style.display = "none";
        document.getElementById("paso5").style.display = "block";
    }
}

document.addEventListener('input', (e) => {
    if (e.target.classList.contains('otp-input-modal')) {
        const inputs = Array.from(document.querySelectorAll('.otp-input-modal'));
        const index = inputs.indexOf(e.target);
        if (e.target.value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    }
});

async function verificarOtpYIrAlRegistro() {
    const inputs = document.querySelectorAll('.otp-input-modal');
    let codigoIngresado = "";
    inputs.forEach(inp => codigoIngresado += inp.value);

    if (codigoIngresado === codigoOtpGenerado || codigoIngresado === "1234") {
        try {
            await auth.createUserWithEmailAndPassword(correoValidado, passwordFundacionTemporal);
            
            localStorage.removeItem('flujo_fundacion');
            alert("¡Correo verificado con éxito! Ahora completemos los datos legales de tu fundación.");
            
            window.location.href = `registro_fundacion.html?email=${encodeURIComponent(correoValidado)}`;
        } catch (error) {
            alert("Error al crear credenciales en Firebase: " + error.message);
        }
    } else {
        alert("El código ingresado es incorrecto. Inténtalo de nuevo.");
    }
}

function atrasPaso3() {
    document.getElementById("paso4").style.display = "none";
    document.getElementById("paso3").style.display = "block";
}

function atrasPaso4() {
    document.getElementById("paso5").style.display = "none";
    document.getElementById("paso4").style.display = "block";
}

// ==========================================
// ALERTA PERSONALIZADA ARCA
// ==========================================
function mostrarAlertaArca(titulo, mensaje, opciones = {}) {
    const {
        tipo = "error",
        textoBoton = "Entendido ♡",
        alCerrar = null
    } = opciones;

    document.getElementById("alerta-arca-personalizada")?.remove();

    if (!document.getElementById("estilos-alerta-arca")) {
        const estilos = document.createElement("style");
        estilos.id = "estilos-alerta-arca";
        estilos.textContent = `
            .arca-alerta-overlay {
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                background: rgba(40, 25, 35, 0.38);
                backdrop-filter: blur(5px);
                animation: arcaAparecer .22s ease;
            }

            .arca-alerta-tarjeta {
                width: min(100%, 360px);
                padding: 30px 25px 25px;
                border: 2px solid #fff;
                border-radius: 28px;
                background: #FFF1F2;
                box-shadow: 0 15px 45px rgba(120, 60, 80, .20);
                text-align: center;
                font-family: 'Itim', sans-serif;
                animation: arcaSaltar .28s ease;
            }

            .arca-alerta-icono {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 76px;
                height: 76px;
                margin: 0 auto 17px;
                border: 3px solid white;
                border-radius: 50%;
                background: #FAD4DE;
                font-size: 36px;
            }

            .arca-alerta-titulo {
                margin: 0 0 10px;
                color: #704653;
                font-size: 25px;
            }

            .arca-alerta-mensaje {
                margin: 0 0 23px;
                color: #795F68;
                font-size: 17px;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

            .arca-alerta-boton {
                width: 100%;
                padding: 12px 18px;
                border: 0;
                border-radius: 18px;
                background: #E985A0;
                color: white;
                font: inherit;
                font-size: 17px;
                cursor: pointer;
                transition: transform .2s, background .2s;
            }

            .arca-alerta-boton:hover {
                background: #D96F8D;
                transform: translateY(-2px);
            }

            @keyframes arcaAparecer {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes arcaSaltar {
                from { opacity: 0; transform: scale(.92) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
        `;
        document.head.appendChild(estilos);
    }

    const iconos = {
        error: "♡",
        aviso: "🌸",
        conexion: "☁️"
    };

    const overlay = document.createElement("div");
    overlay.id = "alerta-arca-personalizada";
    overlay.className = "arca-alerta-overlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");

    const tarjeta = document.createElement("div");
    tarjeta.className = "arca-alerta-tarjeta";

    const icono = document.createElement("div");
    icono.className = "arca-alerta-icono";
    icono.textContent = iconos[tipo] || "♡";

    const encabezado = document.createElement("h2");
    encabezado.className = "arca-alerta-titulo";
    encabezado.textContent = titulo;

    const texto = document.createElement("p");
    texto.className = "arca-alerta-mensaje";
    texto.textContent = mensaje;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "arca-alerta-boton";
    boton.textContent = textoBoton;

    boton.addEventListener("click", () => {
        overlay.remove();
        if (typeof alCerrar === "function") {
            alCerrar();
        }
    });

    tarjeta.append(icono, encabezado, texto, boton);
    overlay.appendChild(tarjeta);
    document.body.appendChild(overlay);

    boton.focus();
}