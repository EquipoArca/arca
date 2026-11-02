document.addEventListener('DOMContentLoaded', () => {
    const formDonacion = document.getElementById('formDonacionArca'); // Asegúrate de que tu <form> tenga este ID (o cámbialo por el tuyo)
    const inputNombre = document.getElementById('nombre');
    const inputTelefono = document.getElementById('telefono');
    const inputCorreo = document.getElementById('correo');

    // 1. Autocompletar datos del usuario si ya ha iniciado sesión en Firebase
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                if (inputCorreo && user.email) {
                    inputCorreo.value = user.email;
                }
                if (inputNombre && user.displayName) {
                    inputNombre.value = user.displayName;
                }

                // Opcional: autocompletar teléfono desde tu base de datos MySQL (igual que hiciste en reportes)
                try {
                    const respuesta = await fetch(`/api/obtener-usuario?correo=${encodeURIComponent(user.email)}`);
                    if (respuesta.ok) {
                        const usuario = await respuesta.json();
                        if (inputTelefono) {
                            inputTelefono.value = usuario.Telefono_usuario || usuario.telefono_usuario || usuario.telefono || '';
                        }
                    }
                } catch (err) {
                    console.warn("No se pudo autocompletar el teléfono del usuario:", err);
                }
            }
        });
    }

    // 2. Manejar el envío del formulario de donaciones
    if (formDonacion) {
        formDonacion.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btnSubmit = formDonacion.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = "Registrando donación...";
            }

            try {
                // Capturar el tipo de donación seleccionado (Dinero, Juguetes, Comida, Ropa, Otro)
                const tipoSeleccionado = document.querySelector('input[name="tipo_donacion"]:checked');
                const tipoDonacion = tipoSeleccionado ? tipoSeleccionado.value : 'otro';

                // Capturar la descripción o cantidad
                const descripcion = document.getElementById('descripcion-donativo')?.value || '';

                // Capturar la fundación (según el input que tengan habilitado)
                const inputFundacion = document.getElementById('nombre-fundacion')?.value || '';

                // Forma de entrega (Llevar personalmente o solicitar recogida)
                const entregaSeleccionada = document.querySelector('input[name="forma_entrega"]:checked');
                const formaEntrega = entregaSeleccionada ? entregaSeleccionada.value : 'personal';

                // Datos del donante
                const nombre = inputNombre ? inputNombre.value : '';
                const telefono = inputTelefono ? inputTelefono.value : '';
                const correo = inputCorreo ? inputCorreo.value : '';

                // Consolidar el objeto de datos
                const datosDonacion = {
                    tipo_donacion: tipoDonacion,
                    descripcion: descripcion,
                    fundacion: inputFundacion,
                    forma_entrega: formaEntrega,
                    nombre_donante: nombre,
                    telefono_donante: telefono,
                    correo_donante: correo
                };

                // Enviar los datos al backend (Node.js / Express)
                const respuesta = await fetch('/api/crear-donacion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datosDonacion)
                });

                const resultado = await respuesta.json();

                if (respuesta.ok) {
                    // Usamos tu alerta personalizada con el alCerrar para limpiar y redirigir con elegancia 🌸
                    mostrarAlertaArca(
                        "¡Mil gracias por tu ayuda! 💖",
                        "Tu donación ha sido registrada con éxito. Estás haciendo una gran diferencia. ✨",
                        {
                            tipo: "aviso",
                            alCerrar: () => {
                                formDonacion.reset();
                                window.location.href = 'index.html'; // Cámbialo por la vista que prefieras mostrar después
                            }
                        }
                    );
                } else {
                    throw new Error(resultado.error || "No se pudo registrar la donación en el servidor.");
                }

            } catch (error) {
                console.error("Error al enviar la donación:", error);
                mostrarAlertaArca(
                    "Error al registrar",
                    "No pudimos procesar tu donación en este momento. Inténtalo más tarde. ♡",
                    { tipo: "error" }
                );
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Enviar Donación"; // El texto original de tu botón
                }
            }
        });
    }
});