<<<<<<< HEAD
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

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const emailTemporal = urlParams.get('email');

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
            fetch(`http://localhost:3000/validar-nombre-usuario?nombre=${encodeURIComponent(nombreVal)}`)
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
            mensajeEstadoReg.textContent = "Por favor elige un nombre de usuario disponible.";
            mensajeEstadoReg.className = "mensaje-validacion error";
            inputNombreReg.focus();
            return;
        }

        if (!esEdadValida) {
            mensajeEstadoFecha.textContent = "Debes confirmar que tienes 18 años o más para crear una cuenta.";
            mensajeEstadoFecha.className = "mensaje-validacion error";
            if (inputFechaNac) inputFechaNac.focus();
            return;
        }

        if (!esPasswordValida) {
            mensajeEstadoPass.textContent = "La contraseña no cumple con los requisitos de seguridad.";
            mensajeEstadoPass.className = "mensaje-validacion error";
            inputPassReg.focus();
            return;
        }

        if (!emailTemporal) {
            alert("No se detectó un correo válido. Por favor inicia desde la pantalla principal.");
            window.location.href = "home.html";
            return;
        }

        try {
            // Solicitar al backend que envíe el código OTP al correo
            const resOtp = await fetch('http://localhost:3000/enviar-codigo-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: emailTemporal })
            });

            const dataOtp = await resOtp.json();

            if (resOtp.ok) {
                // Abrir modal si el correo fue enviado exitosamente
                if (modalOtp) modalOtp.classList.remove('hidden');
            } else {
                alert(dataOtp.error || "Error al enviar el código de verificación.");
            }

        } catch (error) {
            console.error("Error al solicitar OTP:", error);
            alert("Hubo un problema de conexión con el servidor.");
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
            alert("Por favor ingresa los 4 dígitos del código.");
            return;
        }

        try {
            // 1. Validar código con el servidor
            const resVerif = await fetch('http://localhost:3000/verificar-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: emailTemporal, codigo: codigoCompleto })
            });

            const dataVerif = await resVerif.json();

            if (!resVerif.ok) {
                alert(dataVerif.error || "Código incorrecto.");
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

            const resMySQL = await fetch('http://localhost:3000/registrar-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosUsuario)
            });

            if (resMySQL.ok) {
                alert("¡Cuenta verificada y creada con éxito! Bienvenido a ARCA.");
                window.location.href = "home.html?modo=full";
            } else {
                alert("Error al guardar la información en la base de datos.");
            }

        } catch (error) {
            console.error("Error en la verificación/registro:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("Este correo ya tiene una cuenta activa.");
            } else {
                alert("Ocurrió un error al procesar el registro.");
            }
        }
    });
=======
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

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const emailTemporal = urlParams.get('email');

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
            fetch(`http://localhost:3000/validar-nombre-usuario?nombre=${encodeURIComponent(nombreVal)}`)
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
            mensajeEstadoReg.textContent = "Por favor elige un nombre de usuario disponible.";
            mensajeEstadoReg.className = "mensaje-validacion error";
            inputNombreReg.focus();
            return;
        }

        if (!esEdadValida) {
            mensajeEstadoFecha.textContent = "Debes confirmar que tienes 18 años o más para crear una cuenta.";
            mensajeEstadoFecha.className = "mensaje-validacion error";
            if (inputFechaNac) inputFechaNac.focus();
            return;
        }

        if (!esPasswordValida) {
            mensajeEstadoPass.textContent = "La contraseña no cumple con los requisitos de seguridad.";
            mensajeEstadoPass.className = "mensaje-validacion error";
            inputPassReg.focus();
            return;
        }

        if (!emailTemporal) {
            alert("No se detectó un correo válido. Por favor inicia desde la pantalla principal.");
            window.location.href = "home.html";
            return;
        }

        try {
            // Solicitar al backend que envíe el código OTP al correo
            const resOtp = await fetch('http://localhost:3000/enviar-codigo-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: emailTemporal })
            });

            const dataOtp = await resOtp.json();

            if (resOtp.ok) {
                // Abrir modal si el correo fue enviado exitosamente
                if (modalOtp) modalOtp.classList.remove('hidden');
            } else {
                alert(dataOtp.error || "Error al enviar el código de verificación.");
            }

        } catch (error) {
            console.error("Error al solicitar OTP:", error);
            alert("Hubo un problema de conexión con el servidor.");
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
            alert("Por favor ingresa los 4 dígitos del código.");
            return;
        }

        try {
            // 1. Validar código con el servidor
            const resVerif = await fetch('http://localhost:3000/verificar-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: emailTemporal, codigo: codigoCompleto })
            });

            const dataVerif = await resVerif.json();

            if (!resVerif.ok) {
                alert(dataVerif.error || "Código incorrecto.");
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

            const resMySQL = await fetch('http://localhost:3000/registrar-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosUsuario)
            });

            if (resMySQL.ok) {
                alert("¡Cuenta verificada y creada con éxito! Bienvenido a ARCA.");
                window.location.href = "home.html?modo=full";
            } else {
                alert("Error al guardar la información en la base de datos.");
            }

        } catch (error) {
            console.error("Error en la verificación/registro:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("Este correo ya tiene una cuenta activa.");
            } else {
                alert("Ocurrió un error al procesar el registro.");
            }
        }
    });
>>>>>>> 73ad380385be04225f0aeedc8f01200318850109
}