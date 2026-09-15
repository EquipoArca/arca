// ==========================================
// FUNCIÓN PARA COMPRIMIR Y CONVERTIR A BASE64
// ==========================================
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

            fetch('http://localhost:3000/guardar-foto-perfil', {
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
            // Hacemos la petición a tu servidor para obtener los datos del usuario
            const respuesta = await fetch(`http://localhost:3000/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
            const data = await respuesta.json();

            if (respuesta.ok) {
                // 1. Cargar el nombre de usuario si existe el elemento
                const elemNombre = document.getElementById('mostrar-nombre-usuario');
                if (elemNombre && data.nombre_usuario) {
                    elemNombre.textContent = `@${data.nombre_usuario}`;
                }

                // 2. Cargar la foto de perfil si está guardada en la base de datos
                if (data.foto_perfil) {
                    // Usamos la función que ya tienes creada para mostrar la foto
                    mostrarFotoUsuario(data.foto_perfil);
                } else {
                    // Si no tiene foto, aseguramos que se vea la silueta por defecto
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

    fetch('http://localhost:3000/guardar-foto-perfil', {
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
    if (inputNuevo) inputNuevo.value = '';
    if (msgError) msgError.textContent = '';

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
        fetch(`http://localhost:3000/obtener-usuario?correo=${encodeURIComponent(user.email)}`)
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

        // Restricciones básicas: longitud mínima
        if (!nuevoTel || nuevoTel.length < 7) {
            errorElem.textContent = "Ingresa un número de celular válido.";
            errorElem.style.display = 'block';
            return;
        }

        try {
            errorElem.style.display = 'none';

            // Petición directa a tu servidor para actualizar en la base de datos
            const respuesta = await fetch('http://localhost:3000/actualizar-telefono-usuario', {
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
            
            fetch(`http://localhost:3000/validar-nombre-usuario?nombre=${encodeURIComponent(nombreVal)}${urlCorreo}`)
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