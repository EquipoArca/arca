
const convertirFotoPerfilBase64 = (archivo) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(archivo);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const MAX_ANCHO = 400;
                const MAX_ALTO = 400;
                let ancho = img.width;
                let alto = img.height;

                if (ancho > alto) {
                    if (ancho > MAX_ANCHO) {
                        alto = Math.round((alto * MAX_ANCHO) / ancho);
                        ancho = MAX_ANCHO;
                    }
                } else {
                    if (alto > MAX_ALTO) {
                        ancho = Math.round((ancho * MAX_ALTO) / alto);
                        alto = MAX_ALTO;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = ancho;
                canvas.height = alto;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, ancho, alto);

                const base64Comprimido = canvas.toDataURL('image/jpeg', 0.75);
                resolve(base64Comprimido);
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};

// ==========================================
// CONTROL VISUAL DE FOTO Y SILUETA
// ==========================================
function mostrarFotoUsuario(url) {
    const imgPrincipal = document.getElementById("foto-perfil-img");
    const imgPreview = document.getElementById("foto-preview-ampliada");
    const svgPrincipal = document.getElementById("svg-silueta");
    const svgPreview = document.getElementById("modal-svg-silueta");

    [imgPrincipal, imgPreview].forEach(img => {
        if (img) {
            img.src = url;
            img.style.display = "block";
        }
    });

    [svgPrincipal, svgPreview].forEach(svg => {
        if (svg) svg.style.display = "none";
    });
}

function mostrarSiluetaDefault() {
    const imgPrincipal = document.getElementById("foto-perfil-img");
    const imgPreview = document.getElementById("foto-preview-ampliada");
    const svgPrincipal = document.getElementById("svg-silueta");
    const svgPreview = document.getElementById("modal-svg-silueta");

    [imgPrincipal, imgPreview].forEach(img => {
        if (img) {
            img.src = "";
            img.style.display = "none";
        }
    });

    [svgPrincipal, svgPreview].forEach(svg => {
        if (svg) svg.style.display = "block";
    });
}

// ==========================================
// MODAL DE FOTO DE PERFIL
// ==========================================
function abrirModalFoto() {
    const modal = document.getElementById("modal-foto-perfil");
    const imgPrincipal = document.getElementById("foto-perfil-img");
    const imgPreview = document.getElementById("foto-preview-ampliada");
    const svgPreview = document.getElementById("modal-svg-silueta");

    if (modal) {
        if (imgPrincipal && imgPrincipal.style.display !== "none" && imgPrincipal.src) {
            if (imgPreview) {
                imgPreview.src = imgPrincipal.src;
                imgPreview.style.display = "block";
            }
            if (svgPreview) svgPreview.style.display = "none";
        } else {
            if (imgPreview) imgPreview.style.display = "none";
            if (svgPreview) svgPreview.style.display = "block";
        }
        modal.classList.add("activo");
    }
}

function cerrarModalFoto(event) {
    if (event && event.target.id === "modal-foto-perfil") {
        cerrarModalFotoDirecto();
    }
}

function cerrarModalFotoDirecto() {
    const modal = document.getElementById("modal-foto-perfil");
    if (modal) modal.classList.remove("activo");
}

function ejecutarCambiarFoto() {
    const input = document.getElementById("input-nueva-foto");
    if (input) input.click();
}

async function procesarNuevaFoto(event) {
    const archivo = event.target.files[0];
    const user = firebase.auth().currentUser;

    if (archivo && user) {
        try {
            const fotoBase64 = await convertirFotoPerfilBase64(archivo);
            mostrarFotoUsuario(fotoBase64);
            cerrarModalFotoDirecto();

            fetch('/guardar-foto-perfil', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correo_usuario: user.email,
                    fotoBase64: fotoBase64
                })
            })
            .then(res => res.json())
            .then(data => console.log("✅ Foto guardada en BD:", data.mensaje))
            .catch(err => console.error("❌ Error al guardar foto:", err));

        } catch (error) {
            console.error("Error al procesar la imagen:", error);
        }
    }
}

// ==========================================
// CARGAR DATOS DEL PERFIL AL INICIAR LA PÁGINA
// ==========================================
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const respuesta = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
            const data = await respuesta.json();

            if (respuesta.ok) {
                const elemNombre = document.getElementById('mostrar-nombre-usuario');
                if (elemNombre && data.nombre_usuario) {
                    elemNombre.textContent = `@${data.nombre_usuario}`;
                }

                if (data.foto_perfil) {
                    mostrarFotoUsuario(data.foto_perfil);
                } else {
                    mostrarSiluetaDefault();
                }
            }
        } catch (error) {
            console.error("❌ Error al cargar la información del perfil:", error);
        }
    }
});

function ejecutarBorrarFoto() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    mostrarSiluetaDefault();
    cerrarModalFotoDirecto();

    fetch('/guardar-foto-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            correo_usuario: user.email,
            fotoBase64: null
        })
    })
    .then(res => res.json())
    .then(data => console.log("✅ Foto eliminada de la BD:", data.mensaje))
    .catch(err => console.error("❌ Error al borrar foto:", err));
}

// ==========================================
// MODALES DE NOMBRE Y CORREO
// ==========================================
function abrirModalNombre() {
    const modal = document.getElementById('modal-cambiar-nombre');
    const nombreActualElem = document.getElementById('mostrar-nombre-usuario');
    const nombreActual = nombreActualElem ? nombreActualElem.textContent : '@usuario';
    
    const elemActual = document.getElementById('modal-nombre-actual');
    const inputNuevo = document.getElementById('input-nuevo-nombre');
    const msgError = document.getElementById('mensaje-estado-nombre');

    if (elemActual) elemActual.textContent = nombreActual;
    
    // 👇 ESTO ES LO CLAVE: Forzamos a que el input empiece vacío siempre
    if (inputNuevo) inputNuevo.value = ''; 
    
    if (msgError) {
        msgError.textContent = '';
        msgError.className = 'mensaje-validacion';
    }

    if (modal) modal.classList.add('activo');
}
function cerrarModalNombre() {
    const modal = document.getElementById('modal-cambiar-nombre');
    if (modal) modal.classList.remove('activo');
}

function cerrarModalNombreOverlay(event) {
    if (event.target.id === 'modal-cambiar-nombre') cerrarModalNombre();
}

function reiniciarModalCorreo() {
    const inputCorreo = document.getElementById('input-nuevo-correo');
    const pasoCorreo = document.getElementById('paso-nuevo-correo');
    const pasoOtp = document.getElementById('paso-codigo-otp');

    if (inputCorreo) inputCorreo.value = '';
    if (pasoCorreo) pasoCorreo.style.display = 'block';
    if (pasoOtp) pasoOtp.style.display = 'none';
    
    const errCorreo = document.getElementById('mensaje-error-correo');
    const errOtp = document.getElementById('mensaje-error-otp-correo');
    if (errCorreo) errCorreo.style.display = 'none';
    if (errOtp) errOtp.style.display = 'none';

    const inputsOtp = document.querySelectorAll('.otp-correo-input');
    inputsOtp.forEach(input => input.value = '');
}

function abrirModalCorreo() {
    const modal = document.getElementById('modal-cambiar-correo');
    const user = firebase.auth().currentUser;
    
    if (user) {
        const elemCorreo = document.getElementById('modal-correo-actual');
        if (elemCorreo) elemCorreo.textContent = user.email;
    }
    
    reiniciarModalCorreo();
    if (modal) modal.classList.add('activo');
}

function cerrarModalCorreo() {
    const modal = document.getElementById('modal-cambiar-correo');
    if (modal) modal.classList.remove('activo');
    reiniciarModalCorreo();
}

function cerrarModalCorreoOverlay(event) {
    if (event.target.id === 'modal-cambiar-correo') cerrarModalCorreo();
}

// ==========================================
// MODAL DE CAMBIAR TELÉFONO (DIRECTO A BD)
// ==========================================
function abrirModalTelefono() {
    const modal = document.getElementById('modal-cambiar-telefono');
    const user = firebase.auth().currentUser;
    
    if (user) {
        fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(data => {
                const elemTelActual = document.getElementById('modal-telefono-actual');
                const inputNuevoTel = document.getElementById('input-nuevo-telefono');
                const telefonoGuardado = data.telefono_usuario || "";
                
                if (elemTelActual) {
                    elemTelActual.textContent = telefonoGuardado ? telefonoGuardado : "No registrado";
                }
                if (inputNuevoTel) {
                    inputNuevoTel.value = telefonoGuardado;
                }
            })
            .catch(err => console.error("Error cargando teléfono:", err));
    }
    
    reiniciarModalTelefono();
    if (modal) modal.classList.add('activo');
}

function cerrarModalTelefono() {
    const modal = document.getElementById('modal-cambiar-telefono');
    if (modal) modal.classList.remove('activo');
    reiniciarModalTelefono();
}

function cerrarModalTelefonoOverlay(event) {
    if (event.target.id === 'modal-cambiar-telefono') cerrarModalTelefono();
}

function reiniciarModalTelefono() {
    const inputTel = document.getElementById('input-nuevo-telefono');
    if (inputTel) inputTel.value = '';
    
    const errTel = document.getElementById('mensaje-error-telefono');
    if (errTel) {
        errTel.style.display = 'none';
        errTel.textContent = '';
    }
}

// ==========================================
// GUARDAR CAMBIO DE TELÉFONO DIRECTO A BD
// ==========================================
const btnGuardarTel = document.getElementById('btn-guardar-y-verificar-tel');
if (btnGuardarTel) {
    btnGuardarTel.textContent = "Guardar número";

    btnGuardarTel.onclick = async () => {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("No hay una sesión activa.");
            return;
        }

        let nuevoTel = document.getElementById('input-nuevo-telefono').value.trim();
        const errorElem = document.getElementById('mensaje-error-telefono');

        if (!nuevoTel || nuevoTel.length < 7) {
            errorElem.textContent = "Ingresa un número de celular válido.";
            errorElem.style.display = 'block';
            return;
        }

        try {
            errorElem.style.display = 'none';

            const respuesta = await fetch('/actualizar-telefono-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    correo_usuario: user.email, 
                    nuevo_telefono: nuevoTel,
                    verificado: false 
                })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert("¡Número de celular actualizado con éxito!");
                cerrarModalTelefono();
                window.location.reload();
            } else {
                throw new Error(resultado.mensaje || "No se pudo actualizar el teléfono.");
            }

        } catch (err) {
            console.error("Error al actualizar teléfono:", err);
            errorElem.textContent = err.message || "Ocurrió un error al guardar en la base de datos.";
            errorElem.style.display = 'block';
        }
    };
}

// ==========================================
// VALIDACIÓN DE NOMBRE EN TIEMPO REAL
// ==========================================
let temporizadorValidacion = null;
const inputNombre = document.getElementById('input-nuevo-nombre');
const mensajeEstado = document.getElementById('mensaje-estado-nombre');

if (inputNombre && mensajeEstado) {
    inputNombre.addEventListener('input', (e) => {
        const nombreVal = e.target.value.trim();
        const user = firebase.auth().currentUser;

        clearTimeout(temporizadorValidacion);

        if (nombreVal.length < 3) {
            mensajeEstado.textContent = "El nombre debe tener al menos 3 caracteres.";
            mensajeEstado.className = "mensaje-validacion error";
            return;
        }

        mensajeEstado.textContent = "Comprobando disponibilidad...";
        mensajeEstado.className = "mensaje-validacion esperando";

        temporizadorValidacion = setTimeout(() => {
            const urlCorreo = user ? `&correo_actual=${encodeURIComponent(user.email)}` : '';
            
            fetch(`/validar-nombre-usuario?nombre=${encodeURIComponent(nombreVal)}${urlCorreo}`)
                .then(res => res.json())
                .then(data => {
                    if (data.disponible) {
                        mensajeEstado.textContent = "¡Nombre de usuario disponible!";
                        mensajeEstado.className = "mensaje-validacion exito";
                    } else {
                        mensajeEstado.textContent = "Este nombre ya está en uso.";
                        mensajeEstado.className = "mensaje-validacion error";
                    }
                })
                .catch(() => {
                    mensajeEstado.textContent = "Error comprobando el nombre.";
                    mensajeEstado.className = "mensaje-validacion error";
                });
        }, 500);
    });
}

// ==========================================
// GUARDAR CAMBIO DE NOMBRE DE USUARIO
// ==========================================
const btnGuardarNombre = document.getElementById('btn-guardar-nuevo-nombre');
if (btnGuardarNombre) {
    btnGuardarNombre.onclick = async () => {
        const user = firebase.auth().currentUser;
        const nuevoNombre = document.getElementById('input-nuevo-nombre').value.trim();
        const mensajeEstado = document.getElementById('mensaje-estado-nombre');

        if (!user) {
            alert("No hay una sesión activa.");
            return;
        }

        if (!nuevoNombre || nuevoNombre.length < 3) {
            mensajeEstado.textContent = "El nombre debe tener al menos 3 caracteres.";
            mensajeEstado.className = "mensaje-validacion error";
            return;
        }

        try {
            const respuesta = await fetch('/cambiar-nombre-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correo_usuario: user.email,
                    nuevo_nombre: nuevoNombre
                })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert("¡Nombre de usuario actualizado con éxito!");
                cerrarModalNombre();
                window.location.reload();
            } else {
                mensajeEstado.textContent = resultado.mensaje || "Error al actualizar el nombre.";
                mensajeEstado.className = "mensaje-validacion error";
            }
        } catch (err) {
            console.error("Error al actualizar nombre:", err);
            mensajeEstado.textContent = "Error de conexión con el servidor.";
            mensajeEstado.className = "mensaje-validacion error";
        }
    };
}

// ==========================================
// FUNCIÓN AUXILIAR PARA CARGAR EMAILJS AL VUELO
// ==========================================
function cargarEmailJS() {
    return new Promise((resolve, reject) => {
        if (window.emailjs) {
            resolve(window.emailjs);
            return;
        }
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
        script.onload = () => {
            emailjs.init("AVpXUrYdpwa9oh438");
            resolve(window.emailjs);
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
}

// ==========================================
// ENVÍO DE CÓDIGO OTP PARA CAMBIAR CORREO (CON EMAILJS)
// ==========================================
const btnEnviarCodigoCorreo = document.getElementById('btn-enviar-codigo-correo');
if (btnEnviarCodigoCorreo) {
    btnEnviarCodigoCorreo.onclick = async () => {
        const user = firebase.auth().currentUser;
        const nuevoCorreoInput = document.getElementById('input-nuevo-correo');
        const nuevoCorreo = nuevoCorreoInput ? nuevoCorreoInput.value.trim() : '';
        const errorCorreo = document.getElementById('mensaje-error-correo');

        if (!user) {
            alert("No hay sesión activa.");
            return;
        }

        if (!nuevoCorreo || !nuevoCorreo.includes('@')) {
            if (errorCorreo) {
                errorCorreo.textContent = "Ingresa un correo electrónico válido.";
                errorCorreo.style.display = 'block';
            }
            return;
        }

        if (errorCorreo) errorCorreo.style.display = 'none';
        btnEnviarCodigoCorreo.textContent = "Enviando código...";
        btnEnviarCodigoCorreo.disabled = true;

        try {
            // 1. Asegurarnos de que EmailJS esté cargado en el navegador
            const emailjsLib = await cargarEmailJS();

            // 2. Generar código OTP de 4 dígitos
            const codigoGenerado = Math.floor(1000 + Math.random() * 9000).toString();
            sessionStorage.setItem('otp_cambio_correo', codigoGenerado);
            sessionStorage.setItem('nuevo_correo_temporal', nuevoCorreo);

            // 3. Parámetros para tu plantilla de EmailJS
            const templateParams = {
                to_email: nuevoCorreo,
                email: nuevoCorreo,
                to_name: user.email,
                passcode: codigoGenerado
            };

            // 4. Envío mediante la librería asegurada
            await emailjsLib.send('service_93j9cwn', 'template_bqczg41', templateParams);

            // 5. Cambiar de vista en el modal hacia los inputs OTP
            const pasoCorreo = document.getElementById('paso-nuevo-correo');
            const pasoOtp = document.getElementById('paso-codigo-otp');
            if (pasoCorreo) pasoCorreo.style.display = 'none';
            if (pasoOtp) pasoOtp.style.display = 'block';

        } catch (err) {
            console.error("Error al enviar código con EmailJS:", err);
            if (errorCorreo) {
                errorCorreo.textContent = "Hubo un problema al enviar el código de verificación.";
                errorCorreo.style.display = 'block';
            }
        } finally {
            btnEnviarCodigoCorreo.textContent = "Enviar código de verificación";
            btnEnviarCodigoCorreo.disabled = false;
        }
    };
}
// ==========================================
// VERIFICAR EL CÓDIGO OTP E INSERTAR EL CAMBIO
// ==========================================
const btnVerificarCorreo = document.getElementById('btn-verificar-cambio-correo');
if (btnVerificarCorreo) {
    btnVerificarCorreo.onclick = async () => {
        const otpInputs = document.querySelectorAll('.otp-correo-input');
        const codigoIngresado = Array.from(otpInputs).map(i => i.value).join('');
        const codigoGuardado = sessionStorage.getItem('otp_cambio_correo');
        const nuevoCorreoDestino = sessionStorage.getItem('nuevo_correo_temporal');
        const errorOtp = document.getElementById('mensaje-error-otp-correo');
        const user = firebase.auth().currentUser;

        if (codigoIngresado.length !== 4) {
            if (errorOtp) {
                errorOtp.textContent = "Por favor ingresa los 4 dígitos completos.";
                errorOtp.style.display = 'block';
            }
            return;
        }

        if (codigoIngresado !== codigoGuardado) {
            if (errorOtp) {
                errorOtp.textContent = "El código de verificación es incorrecto.";
                errorOtp.style.display = 'block';
            }
            return;
        }

        try {
            const respuesta = await fetch('/actualizar-correo-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    correo_actual: user.email,
                    nuevo_correo: nuevoCorreoDestino
                })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert("¡Correo electrónico actualizado con éxito!");
                sessionStorage.removeItem('otp_cambio_correo');
                sessionStorage.removeItem('nuevo_correo_temporal');
                window.location.reload();
            } else {
                throw new Error(resultado.mensaje || "No se pudo actualizar el correo en la base de datos.");
            }

        } catch (error) {
            console.error("Error al actualizar correo:", error);
            if (errorOtp) {
                errorOtp.textContent = error.message || "Error al procesar el cambio.";
                errorOtp.style.display = 'block';
            }
        }
    };
}