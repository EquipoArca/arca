// Configuración de Firebase para ARCA
const firebaseConfig = {
  apiKey: "AIzaSyC-KetEpCzTu7AHp6OV7kcaM6rwxdbwaxs",
  authDomain: "arca-90c0f.firebaseapp.com",
  projectId: "arca-90c0f",
  storageBucket: "arca-90c0f.firebasestorage.app",
  messagingSenderId: "208516820997",
  appId: "1:208516820997:web:b610694c5ee7c8b8adac6c",
  measurementId: "G-22M1GJC6PZ"
};

// Inicialización de Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const auth = firebase.auth();

// Obtener parámetros de la URL e inyectarlo en el input oculto
const urlParams = new URLSearchParams(window.location.search);
const emailTemporal = urlParams.get('email');

document.addEventListener('DOMContentLoaded', () => {
    if (emailTemporal) {
        const inputEmailOculto = document.getElementById('emailRegistro');
        if (inputEmailOculto) {
            inputEmailOculto.value = emailTemporal;
        }
    }
});

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

// ==========================================
// BANDERAS DE VALIDACIÓN Y ELEMENTOS
// ==========================================
let temporizadorValidacion = null;
let esNombreValido = false;
let esPasswordValida = false;
let esEdadValida = false;

// Expresión regular: Mínimo 8 caracteres, al menos 1 mayúscula y al menos 1 número
const regExPassword = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const inputNombreReg = document.getElementById('Nombre_usuario');
const mensajeEstadoReg = document.getElementById('mensaje-estado-nombre');

const inputPassReg = document.getElementById('passwordRegistro');
const mensajeEstadoPass = document.getElementById('mensaje-estado-pass');

const inputFechaNac = document.getElementById('Fecha_nacimiento');
const mensajeEstadoFecha = document.getElementById('mensaje-estado-fecha');

// ==========================================
// 1. RESTRICCIÓN Y VALIDACIÓN DE EDAD (18+)
// ==========================================
if (inputFechaNac && mensajeEstadoFecha) {
    const hoy = new Date();
    const hace18Anos = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    const maxFechaStr = hace18Anos.toISOString().split('T')[0];
    
    inputFechaNac.setAttribute('max', maxFechaStr);

    inputFechaNac.addEventListener('change', (e) => {
        const valorInput = e.target.value;

        if (!valorInput) {
            mensajeEstadoFecha.textContent = "";
            mensajeEstadoFecha.className = "mensaje-validacion";
            esEdadValida = false;
            return;
        }

        const fechaSeleccionada = new Date(valorInput);
        let edad = hoy.getFullYear() - fechaSeleccionada.getFullYear();
        const mes = hoy.getMonth() - fechaSeleccionada.getMonth();

        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaSeleccionada.getDate())) {
            edad--;
        }

        if (edad < 18) {
            mensajeEstadoFecha.textContent = "Debes tener al menos 18 años para registrarte en ARCA.";
            mensajeEstadoFecha.className = "mensaje-validacion error";
            esEdadValida = false;
        } else {
            mensajeEstadoFecha.textContent = "¡Edad verificada correctamente!";
            mensajeEstadoFecha.className = "mensaje-validacion exito";
            esEdadValida = true;
        }
    });
}

// ==========================================
// 2. VALIDACIÓN EN TIEMPO REAL DEL NOMBRE
// ==========================================
if (inputNombreReg && mensajeEstadoReg) {
    inputNombreReg.addEventListener('input', (e) => {
        const nombreVal = e.target.value.trim();

        clearTimeout(temporizadorValidacion);

        if (nombreVal.length < 3) {
            mensajeEstadoReg.textContent = "El nombre debe tener al menos 3 caracteres.";
            mensajeEstadoReg.className = "mensaje-validacion error";
            esNombreValido = false;
            return;
        }

        mensajeEstadoReg.textContent = "Comprobando disponibilidad...";
        mensajeEstadoReg.className = "mensaje-validacion esperando";

        temporizadorValidacion = setTimeout(() => {
            fetch(`/validar-nombre-usuario?nombre=${encodeURIComponent(nombreVal)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.disponible) {
                        mensajeEstadoReg.textContent = "¡Nombre de usuario disponible!";
                        mensajeEstadoReg.className = "mensaje-validacion exito";
                        esNombreValido = true;
                    } else {
                        mensajeEstadoReg.textContent = "Este nombre ya está ocupado. Intenta con otro.";
                        mensajeEstadoReg.className = "mensaje-validacion error";
                        esNombreValido = false;
                    }
                })
                .catch(() => {
                    mensajeEstadoReg.textContent = "Error al verificar el nombre.";
                    mensajeEstadoReg.className = "mensaje-validacion error";
                    esNombreValido = false;
                });
        }, 400);
    });
}

// ==========================================
// 3. VALIDACIÓN EN TIEMPO REAL DE CONTRASEÑA
// ==========================================
if (inputPassReg && mensajeEstadoPass) {
    inputPassReg.addEventListener('input', (e) => {
        const passVal = e.target.value;

        if (passVal.length === 0) {
            mensajeEstadoPass.textContent = "";
            mensajeEstadoPass.className = "mensaje-validacion";
            esPasswordValida = false;
            return;
        }

        if (!regExPassword.test(passVal)) {
            mensajeEstadoPass.textContent = "Debe tener al menos 8 caracteres, una mayúscula y un número.";
            mensajeEstadoPass.className = "mensaje-validacion error";
            esPasswordValida = false;
        } else {
            mensajeEstadoPass.textContent = "¡Contraseña segura!";
            mensajeEstadoPass.className = "mensaje-validacion exito";
            esPasswordValida = true;
        }
    });
}

// ==========================================
// 4. MOSTRAR / OCULTAR CONTRASEÑA (OJITO)
// ==========================================
const btnTogglePass = document.getElementById('togglePassword');
const iconoOjito = document.getElementById('iconoOjito');

if (btnTogglePass && inputPassReg && iconoOjito) {
    btnTogglePass.addEventListener('click', () => {
        const esPassword = inputPassReg.type === 'password';
        inputPassReg.type = esPassword ? 'text' : 'password';

        iconoOjito.classList.toggle('fa-eye', !esPassword);
        iconoOjito.classList.toggle('fa-eye-slash', esPassword);
    });
}

// ==========================================
// 5. ENVÍO DEL FORMULARIO Y MANEJO DE OTP
// ==========================================
const formRegistro = document.getElementById('formRegistroArca');
const modalOtp = document.getElementById('modal-otp');
const btnOtpBack = document.getElementById('btn-otp-back');

if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!esNombreValido) {
            mostrarAlertaArca("¡Nombre no válido! 🌸", "Por favor elige un nombre de usuario disponible antes de continuar.", { tipo: "aviso" });
            inputNombreReg.focus();
            return;
        }

        if (!esEdadValida) {
            mostrarAlertaArca("¡Verificación de edad! 🌸", "Debes confirmar que tienes 18 años o más para crear una cuenta en ARCA.", { tipo: "aviso" });
            if (inputFechaNac) inputFechaNac.focus();
            return;
        }

        if (!esPasswordValida) {
            mostrarAlertaArca("¡Contraseña insegura! ♡", "La contraseña no cumple con los requisitos de seguridad mínimos.", { tipo: "error" });
            inputPassReg.focus();
            return;
        }

        if (!emailTemporal) {
            mostrarAlertaArca("¡Correo no detectado! ☁️", "No se detectó un correo válido. Te llevaremos a la pantalla principal.", {
                tipo: "conexion",
                alCerrar: () => { window.location.href = "home.html"; }
            });
            return;
        }

        try {
            // 1. Generar código OTP de 4 dígitos en el navegador
            const codigoGenerado = Math.floor(1000 + Math.random() * 9000).toString();
            sessionStorage.setItem('otp_temporal', codigoGenerado);

            // 2. Parámetros que irán a tu plantilla de EmailJS
            const templateParams = {
                to_email: emailTemporal,
                email: emailTemporal,
                to_name: emailTemporal,
                passcode: codigoGenerado
            };

            // 3. Enviar correo directo con EmailJS
            await emailjs.send('service_93j9cwn', 'template_bqczg41', templateParams);

            // 4. Si todo sale bien, abrir el modal de OTP
            if (modalOtp) modalOtp.classList.remove('hidden');

        } catch (error) {
            console.error("Error al enviar con EmailJS:", error);
            mostrarAlertaArca("¡Hubo un problema! ☁️", "Hubo un problema al enviar el código de verificación por correo.", { tipo: "conexion" });
        }
    });
}

// Botón para cerrar el modal
if (btnOtpBack && modalOtp) {
    btnOtpBack.addEventListener('click', () => {
        modalOtp.classList.add('hidden');
    });
}

// ==========================================
// 6. VALIDACIÓN Y CREACIÓN DE CUENTA TRAS OTP
// ==========================================
const otpInputs = document.querySelectorAll(".otp-input");
const formOtp = document.getElementById("form-otp");

// Auto-foco y pegado entre casillas
otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
        input.value = input.value.replace(/[^0-9]/g, "");
        if (input.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").trim();
        if (/^\d{4}$/.test(pasteData)) {
            pasteData.split("").forEach((char, i) => {
                if (otpInputs[i]) otpInputs[i].value = char;
            });
            otpInputs[3].focus();
        }
    });
});

// Verificar el código ingresado y crear cuenta
if (formOtp) {
    formOtp.addEventListener("submit", async (e) => {
        e.preventDefault();
        const codigoCompleto = Array.from(otpInputs).map(i => i.value).join("");

        if (codigoCompleto.length !== 4) {
            mostrarAlertaArca("¡Faltan dígitos! ♡", "Por favor ingresa los 4 dígitos completos del código de verificación.", { tipo: "aviso" });
            return;
        }

        try {
            // 1. Validar el código localmente comparándolo con el guardado
            const codigoGuardado = sessionStorage.getItem('otp_temporal');

            if (codigoCompleto !== codigoGuardado) {
                mostrarAlertaArca("¡Código incorrecto! ♡", "El código de verificación ingresado no coincide. Inténtalo de nuevo.", { tipo: "error" });
                return;
            }

            // 2. Si el código es correcto -> Crear cuenta en Firebase Auth
            const telElement = document.getElementById('Telefono_usuario');
            const passInput = inputPassReg ? inputPassReg.value.trim() : "";

            await firebase.auth().createUserWithEmailAndPassword(emailTemporal, passInput);

            // 3. Guardar en MySQL
            const datosUsuario = {
                Correo_usuario: emailTemporal,
                Nombre_usuario: inputNombreReg ? inputNombreReg.value.trim() : "",
                Fecha_nacimiento: inputFechaNac ? inputFechaNac.value : "",
                Telefono_usuario: telElement ? telElement.value : "",
            };

            const resMySQL = await fetch('/registrar-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosUsuario)
            });

            if (resMySQL.ok) {
                mostrarAlertaArca("¡Bienvenida a ARCA! 🌸", "¡Cuenta verificada y creada con éxito!", {
                    tipo: "aviso",
                    textoBoton: "Empezar ♡",
                    alCerrar: () => { window.location.href = "home.html?modo=full"; }
                });
            } else {
                mostrarAlertaArca("¡Error de base de datos! ☁️", "Ocurrió un error al guardar la información en la base de datos.", { tipo: "error" });
            }
        } catch (error) {
            console.error("Error en la verificación/registro:", error);
            if (error.code === 'auth/email-already-in-use') {
                mostrarAlertaArca("¡Cuenta existente! 🌸", "Este correo ya tiene una cuenta activa en ARCA.", { tipo: "aviso" });
            } else {
                mostrarAlertaArca("¡Error en el registro! ☁️", "Ocurrió un error inesperado al procesar tu registro.", { tipo: "error" });
            }
        }
    });
}