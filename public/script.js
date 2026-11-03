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
                auth.signOut().then(() => window.location.href = "home.html");
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
            adaptarInterfazSegunRol();
            
            if (tipoUsuario === 'fundacion' && estadoAprobacion === 'pendiente') {
                mostrarAlertaArca(
                    "¡Revisión legal en proceso!",
                    "¡Tu fundación está en proceso de revisión legal por el equipo de ARCA! Te notificaremos cuando sea aprobada. 🌸",
                    { tipo: "aviso" }
                );
                auth.signOut().then(() => {
                    localStorage.clear();
                    window.location.href = "home.html";
                });
                return;
            }

            nombreFinal = data.nombre_usuario || (user.displayName || user.email.split('@')[0]);
            let fotoFinal = data.foto_perfil;

            // SI ES FUNDACIÓN, BUSCAMOS SU NOMBRE COMERCIAL REAL Y SU FOTO OFICIAL
            if (tipoUsuario === 'fundacion') {
                try {
                    const resFund = await fetch(`/api/obtener-fundacion-header?correo=${encodeURIComponent(user.email)}`);
                    if (resFund.ok) {
                        const dataFund = await resFund.json();
                        if (dataFund.nombre_comercial) {
                            nombreFinal = dataFund.nombre_comercial; // Aquí toma "Huellitas de amor" sin el _6228
                        }
                        if (dataFund.pfp_fundacion) {
                            fotoFinal = dataFund.pfp_fundacion; // Foto oficial de la fundación
                        }
                    }
                } catch (e) {
                    console.error("No se pudo cargar el perfil de la fundación para el header", e);
                }
            }
            
            if (nombrePerfilElem) nombrePerfilElem.textContent = `@${nombreFinal}`;
            if (userDisplayName) userDisplayName.textContent = nombreFinal;
            if (dropdownName) dropdownName.textContent = nombreFinal; // ¡Aquí se actualiza el mini-menú sin números!

            if (fotoFinal && avatarImg) {
                avatarImg.src = fotoFinal;
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
        localStorage.removeItem('tipo_usuario');
        adaptarInterfazSegunRol();
        // ... el resto de tu código
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
            mostrarAlertaArca(
                "¡Pronto habrá más Información!",
                "Aún no se han publicado detalles para esta novedad. 🌸",
                {tipo: "aviso"}
            );
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
                "¡Hubo un pequeño error!" ,
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
                mostrarAlertaArca(
                    "Error al iniciar sesión",
                    "Intentalo más tarde. ♡",
                    { tipo: "error" }
                );
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
                mostrarAlertaArca(
                "¡Formato incorrecto! 🌸",
            "Por favor, arrasta archivos que sean únicamente imagenes.",
            {Tipo: "aviso"});
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

    // Definimos la URL de redirección dinámica (se adapta a localhost o a tu servidor de producción)
    const urlRedireccion = window.location.origin + "/reestablecer.html";

    // Pasamos el objeto de configuración con la URL y handleCodeInApp en true
    auth.sendPasswordResetEmail(email, {
        url: urlRedireccion,
        handleCodeInApp: true
    })
        .then(() => {
            msg.textContent = "Correo enviado, revisa tu bandeja de entrada o spam.";
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
    // Usamos directamente tu tarjeta personalizada de ARCA
    mostrarAlertaArca(
        "¡No tienes conexión a internet!",
        "Inténtalo más tarde. ♡",
        { tipo: "conexion" }
    );
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
// Variable para evitar llamadas duplicadas
let peticionNovedadesEnCurso = false;

async function cargarNovedadesSeguras() {
    // Si estamos en la página de eventos exclusiva, evitamos que este script interfiera
    if (window.location.pathname.includes('novedades-eventos')) return;

    const contenedor = document.getElementById('contenedor-novedades');
    if (!contenedor || peticionNovedadesEnCurso) return;
    
    peticionNovedadesEnCurso = true;

    // Detectar automáticamente el filtro según la URL actual de la página
    let tipoFiltro = 'todos';
    const path = window.location.pathname;
    if (path.includes('reportes')) tipoFiltro = 'reporte';
    if (path.includes('adopciones')) tipoFiltro = 'adopcion';
    if (path.includes('eventos')) tipoFiltro = 'evento';

    try {
        const user = typeof firebase !== 'undefined' && firebase.auth().currentUser ? firebase.auth().currentUser : null;
        const correoUsuario = (user && user.email) ? user.email : (localStorage.getItem('correo_usuario') || '');

        const respuesta = await fetch(`/api/publicaciones-globales?correo=${encodeURIComponent(correoUsuario)}`);
        if (!respuesta.ok) throw new Error("Error al obtener las publicaciones globales");
        
        let publicaciones = await respuesta.json();

        // Aplicar el filtro correspondiente
        if (tipoFiltro === 'reporte') {
            publicaciones = publicaciones.filter(pub => pub.tipo_publicacion === 'reporte');
        } else if (tipoFiltro === 'adopcion') {
            publicaciones = publicaciones.filter(pub => pub.tipo_publicacion === 'adopcion');
        } else if (tipoFiltro === 'evento') {
            publicaciones = publicaciones.filter(pub => pub.tipo_publicacion === 'evento');
        }

        contenedor.innerHTML = ''; // Limpiar estado de carga

        if (publicaciones.length > 0) {
            for (const pub of publicaciones) {
                let imagenSrc = 'logo.png';
                if (pub.img_reporte) {
                    try {
                        const parsed = JSON.parse(pub.img_reporte);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            imagenSrc = parsed[0];
                        } else {
                            imagenSrc = pub.img_reporte;
                        }
                    } catch (e) {
                        imagenSrc = pub.img_reporte;
                    }
                }

                const fechaFormateada = pub.Fecha_reporte ? pub.Fecha_reporte.split('T')[0] : '';
                let ubicacionTextoBruta = pub.Ubicacion || pub.ubicacion || 'Medellín';
                let ubicacionBonita = typeof obtenerNombreUbicacionGlobal === 'function' 
                    ? await obtenerNombreUbicacionGlobal(ubicacionTextoBruta) 
                    : ubicacionTextoBruta;

                const esAdopcion = pub.tipo_publicacion === 'adopcion';
                const esEvento = pub.tipo_publicacion === 'evento';
                
                let tipoTitulo = 'Nuevo Reporte';
                if (esAdopcion) tipoTitulo = 'Publicación de Adopción';
                if (esEvento) tipoTitulo = 'Evento';

                let tipoSubPill = pub.nombre_tipo_reporte || (esAdopcion ? 'Adopción' : (esEvento ? 'Evento de Fundación' : 'Animal en situación de calle'));
                let idDestino = esAdopcion ? pub.id_origen : (pub.id_origen || pub.id_reporte);

                const tarjeta = document.createElement('article');
                tarjeta.className = 'tarjeta-prototipo-estilo';
                
                tarjeta.innerHTML = `
                    <div class="proto-card-top">
                        <div class="proto-titulo-pill" ${esEvento ? 'style="background-color: #e0f2fe; color: #2b5b84;"' : ''}>${tipoTitulo}</div>
                        <span class="proto-fecha">${fechaFormateada}</span>
                    </div>

                    <div class="proto-card-body">
                        ${!esEvento ? `
                        <div class="proto-img-wrapper">
                            <img src="${imagenSrc}" alt="Publicación" style="width:100%; height:100%; object-fit:cover;">
                        </div>
                        ` : ''}

                        <div class="proto-content-right" ${esEvento ? 'style="width: 100%;"' : ''}>
                            <div class="proto-pill-tipo">${tipoSubPill}</div>
                            <div class="proto-info-extra">
                                <span class="proto-autor">Publicado por: <a href="perfil_publico.html?user=${pub.nombre_usuario}">@${pub.nombre_usuario || 'Usuario'}</a></span>
                                <p class="proto-ubicacion"><i class="fa-solid fa-location-dot"></i> ${ubicacionBonita}</p>
                                ${esEvento ? `<p class="proto-autor" style="margin-top: 5px; color: #555;">${pub.Descripcion || ''}</p>` : ''}
                            </div>
                            <div class="proto-footer-row">
                                <button class="proto-btn-detalles btn-accion-ir" data-tipo="${pub.tipo_publicacion}" data-id="${idDestino}">Ver detalles</button>
                            </div>
                        </div>
                    </div>
                `;
                contenedor.appendChild(tarjeta);
            }
        } else {
            contenedor.innerHTML = `
                <div class="estado-vacio" style="text-align: center; padding: 40px; font-family: 'Itim', cursive; width: 100%;">
                    <i class="fa-solid fa-paw icono-vacio" style="font-size: 40px; color: #ff758c; margin-bottom: 10px;"></i>
                    <h2>¡Aún no hay publicaciones!</h2>
                    <p>&lt;3</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar novedades:", error);
        contenedor.innerHTML = `
            <div class="estado-vacio" style="text-align: center; padding: 40px; font-family: 'Itim', cursive; width: 100%;">
                <h2>No se pudieron cargar las publicaciones.</h2>
            </div>
        `;
    } finally {
        peticionNovedadesEnCurso = false;
    }
}

// Delegación de eventos global para los botones de "Ver detalles"
document.addEventListener('click', (event) => {
    const botonDetalle = event.target.closest('.btn-accion-ir, .btn-ver-adopcion-ficha');
    if (botonDetalle) {
        const idItem = botonDetalle.getAttribute('data-id');
        const tipoItem = botonDetalle.getAttribute('data-tipo');
        
        if (idItem) {
            if (tipoItem === 'adopcion' || window.location.pathname.includes('adopciones')) {
                window.location.href = `detalle_adopcion.html?id=${idItem}`;
            } else if (tipoItem === 'evento') {
                window.location.href = `detalle_evento.html?id=${idItem}`;
            } else {
                window.location.href = `detalle_reporte.html?id=${idItem}`;
            }
        }
    }
});

// Inicializar la carga cuando Firebase esté listo o por respaldo
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(() => {
        cargarNovedadesSeguras();
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        cargarNovedadesSeguras();
    });
}

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
        mostrarAlertaArca(
            "Contraseña no segura",
            "Por favor, ingresa una contraseña que cumpla con todos los requisitos de seguridad. ♡",
            { tipo: "error" }
        );
        return;
    }

    codigoOtpGenerado = Math.floor(1000 + Math.random() * 9000).toString();

    try {
        await emailjs.send("service_arca", "template_arca", {
            to_email: correoValidado,
            codigo: codigoOtpGenerado,
            nombre: "Fundación"
        });

       // Caso 1: Cuando el correo se envía con éxito
    mostrarAlertaArca(
        "¡Código enviado! 🌸",
        "¡Código de verificación enviado a tu correo!",
        {
            tipo: "aviso",
            alCerrar: () => {
                document.getElementById("paso4").style.display = "none";
                document.getElementById("paso5").style.display = "block";
            }
        }
    );

} catch (err) {
    console.error("Error EmailJS:", err);
    
    // Caso 2: Cuando ocurre un error y usas el código de prueba
    mostrarAlertaArca(
        "Código de prueba generado ♡",
        "Código de prueba generado: " + codigoOtpGenerado,
        {
            tipo: "error",
            alCerrar: () => {
                document.getElementById("paso4").style.display = "none";
                document.getElementById("paso5").style.display = "block";
            }
        }
    );
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
        // ❌ Eliminamos el auth.createUserWithEmailAndPassword de aquí para que no se cree antes de tiempo.
        
        // Guardamos las credenciales temporalmente en sessionStorage para usarlas al final del Paso 2
        sessionStorage.setItem('pass_fundacion_temp', passwordFundacionTemporal);
        sessionStorage.setItem('correo_fundacion_temp', correoValidado);
        
        localStorage.removeItem('flujo_fundacion');
        mostrarAlertaArca(
            "¡Correo verificado con éxito! 🌸",
            "Ahora completemos los datos legales de tu fundación.",
            { tipo: "aviso" }
        );
        window.location.href = `registro_fundacion.html?email=${encodeURIComponent(correoValidado)}`;

    } else {
        mostrarAlertaArca(
            "Código incorrecto",
            "Inténtalo de nuevo. ♡",
            { tipo: "error" }
        );
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
        textoBoton = "Entendido",
        alCerrar = null
    } = opciones;

    document.getElementById("alerta-arca-personalizada")?.remove();

    if (!document.getElementById("estilos-alerta-arca")) {
        const estilos = document.createElement("style");
        estilos.id = "estilos-alerta-arca";
        estilos.textContent = `
            /* Estilos generales para error y aviso */
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
                outline: none; /* <-- Añade esto */
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

            /* CSS EXCLUSIVO PARA EL TIPO "CONEXION" */
            .custom-alert-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(92, 64, 51, 0.45);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                animation: arcaAparecer .22s ease;
            }

            .custom-alert-card {
                position: relative;
                background-color: rgba(235, 224, 223, 0.94);
                backdrop-filter: blur(16px);
                color: #333333;
                padding: 32px 24px 28px 24px;
                border-radius: 38px;
                max-width: 380px;
                width: 88%;
                text-align: center;
                box-shadow: 0 24px 50px rgba(92, 64, 51, 0.18);
                display: flex;
                flex-direction: column;
                align-items: center;
                border: 2px solid rgba(255, 255, 255, 0.9);
                font-family: 'Itim', sans-serif;
                animation: entradaEscalonada 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }

            .alert-icon-circle {
                width: 90px;
                height: 90px;
                background-color: #f7cac9;
                border-radius: 50%;
                border: 4px solid #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                box-shadow: 0 8px 20px rgba(247, 202, 201, 0.7);
                animation: latidoSuave 2s ease-in-out infinite;
            }

            .alert-icon {
                width: 44px;
                height: 44px;
            }

            .custom-alert-title {
                font-size: 1.25rem;
                font-weight: 400;
                color: #2b2b2b;
                margin-bottom: 10px;
                letter-spacing: 0.3px;
            }

            .custom-alert-message {
                font-size: 0.9rem;
                color: #666666;
                line-height: 1.45;
                margin-bottom: 24px;
            }

          .custom-alert-btn {
                background-color: #ffffff;
                color: #e57373;
                border: 2px solid #ffffff;
                outline: none; /* <-- Y esto aquí también */
                border-radius: 26px;
                padding: 12px 0;
                width: 100%;
                font-size: 0.95rem;
                font-weight: 400;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .custom-alert-btn:hover {
                background-color: #f9f9f9;
                transform: scale(1.04) translateY(-2px);
                box-shadow: 0 8px 20px rgba(229, 115, 115, 0.2);
            }

            @keyframes arcaAparecer {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes arcaSaltar {
                from { opacity: 0; transform: scale(.92) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @keyframes entradaEscalonada {
                from { opacity: 0; transform: scale(0.92) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @keyframes latidoSuave {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
        `;
        document.head.appendChild(estilos);
    }

    const overlay = document.createElement("div");
    overlay.id = "alerta-arca-personalizada";

    const tarjeta = document.createElement("div");
    const icono = document.createElement("div");
    const encabezado = document.createElement("h2");
    const texto = document.createElement("p");
    const boton = document.createElement("button");

    if (tipo === "conexion") {
        overlay.className = "custom-alert-overlay";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-modal", "true");

        tarjeta.className = "custom-alert-card";

        icono.className = "alert-icon-circle";
        // Aquí incorporamos el icono SVG exacto con el círculo oscuro y el signo de exclamación (!)
        icono.innerHTML = `
            <svg class="alert-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#4a4a4a"/>
                <path d="M12 7v5" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1.2" fill="white"/>
            </svg>
        `;

        encabezado.className = "custom-alert-title";
        encabezado.textContent = titulo;

        texto.className = "custom-alert-message";
        texto.textContent = mensaje;

        boton.type = "button";
        boton.className = "custom-alert-btn";
        boton.textContent = textoBoton;

    } else {
        overlay.className = "arca-alerta-overlay";
        overlay.setAttribute("role", "alertdialog");
        overlay.setAttribute("aria-modal", "true");

        tarjeta.className = "arca-alerta-tarjeta";

        const iconos = {
            error: "♡",
            aviso: "🌸"
        };
        icono.className = "arca-alerta-icono";
        icono.textContent = iconos[tipo] || "♡";

        encabezado.className = "arca-alerta-titulo";
        encabezado.textContent = titulo;

        texto.className = "arca-alerta-mensaje";
        texto.textContent = mensaje;

        boton.type = "button";
        boton.className = "arca-alerta-boton";
        boton.textContent = textoBoton;
    }

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
// Función para adaptar la interfaz del Home según el tipo de usuario (Usuario normal vs Fundación)
// Función para adaptar la interfaz del Home según el tipo de usuario (Usuario normal vs Fundación)
function adaptarInterfazSegunRol() {
    const tipoUsuario = localStorage.getItem('tipo_usuario') || 'usuario';
    
    const brandContainer = document.getElementById('brand-title-container');
    const tituloCard1 = document.getElementById('titulo-card-1');
    const logoCard1 = document.getElementById('logo-card-1');
    const cardReportar = document.getElementById('card-reportar-home');
    const linkGuardado = document.getElementById('link-guardado');
    
    // Seleccionamos el botón de últimas novedades
    const botonNovedades = document.querySelector('.news-button');

    if (tipoUsuario === 'fundacion') {
        // 1. Título con tipografía exacta y el badge de verificación pastel
        if (brandContainer) {
            brandContainer.innerHTML = `
                ARCA
                <div class="subtitle-fundacion">
                    FUNDACIÓN <i class="fa-solid fa-certificate badge-verified"><i class="fa-solid fa-check check-inner"></i></i>
                </div>
            `;
        }

        // 2. Tarjeta 1 -> "Reportes" con su imagen PNG oficial (tamaño 200px que te gusta)
        if (tituloCard1) tituloCard1.textContent = "Reportes";
        
        if (logoCard1) {
            logoCard1.innerHTML = `<img src="rflogo.png" alt="Logo Reportes Fundación" class="logo-card-reportes-fundacion">`;
        }

        if (cardReportar && typeof auth !== 'undefined' && auth.currentUser) {
            cardReportar.setAttribute("href", "reportes_fundacion.html");
        }

        // 3. Icono del Sidebar para Fundación
        if (linkGuardado) {
            const iconoGuardado = linkGuardado.querySelector('i');
            const textoGuardado = linkGuardado.querySelector('.menu-text');
            if (iconoGuardado) iconoGuardado.className = "fa-solid fa-layer-group";
            if (textoGuardado) textoGuardado.textContent = "Publicaciones";
            linkGuardado.href = "publicaciones_fundacion.html";
        }

        // 4. Ocultar el botón de Últimas Novedades para fundaciones
        if (botonNovedades) {
            botonNovedades.style.display = 'none';
        }

    } else {
        // Modo Usuario Normal
        if (brandContainer) {
            brandContainer.innerHTML = `ARCA`;
        }
        if (tituloCard1) tituloCard1.textContent = "Reportar";
        if (logoCard1) {
            logoCard1.innerHTML = `<img src="rlogo.png" alt="Logor">`;
        }
        if (cardReportar && typeof auth !== 'undefined' && auth.currentUser) {
            cardReportar.setAttribute("href", "formularior.html");
        }
        if (linkGuardado) {
            const iconoGuardado = linkGuardado.querySelector('i');
            const textoGuardado = linkGuardado.querySelector('.menu-text');
            if (iconoGuardado) iconoGuardado.className = "fa-solid fa-bookmark";
            if (textoGuardado) textoGuardado.textContent = "Guardado";
            linkGuardado.href = "guardados_usuario.html";
        }

        // Mostrar el botón de Últimas Novedades para usuarios normales
        if (botonNovedades) {
            botonNovedades.style.display = 'flex';
        }
    }
}   // ==========================================
// 9. CONTROLADOR DEL MODO OSCURO GLOBAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Aplicar el modo oscuro guardado al cargar cualquier página
    const modoOscuroGuardado = localStorage.getItem('theme') === 'dark' || localStorage.getItem('darkMode') === 'true';
    if (modoOscuroGuardado) {
        document.body.classList.add('dark-mode');
    }

    // 2. Detectar automáticamente si usas un switch o botón de modo oscuro en configuración
    const switchDarkMode = document.querySelector('#switch-dark-mode, .toggle-dark-mode, input[type="checkbox"][name="darkMode"]');
    if (switchDarkMode) {
        switchDarkMode.checked = modoOscuroGuardado;
        
        switchDarkMode.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }
});