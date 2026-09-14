<<<<<<< HEAD
let formularioModificado = false;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-adoptante');

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            alert("Debes iniciar sesión para llenar el formulario.");
            window.location.href = "adopciones.html";
        } else {
            // Verificamos si venimos desde el botón de "Editar Perfil"
            const urlParams = new URLSearchParams(window.location.search);
            const esEdicion = urlParams.get('modo') === 'editar';

            if (esEdicion) {
                await cargarDatosCompletosAdoptante(user.email);
            } else {
                await cargarDatosRegistroUsuario(user.email);
            }
        }
    });

    if (form) {
        form.addEventListener('input', () => { formularioModificado = true; });
        form.addEventListener('change', () => { formularioModificado = true; });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Sesión no detectada.");
                return;
            }

            const getRadioValue = (name) => {
                const checked = document.querySelector(`input[name="${name}"]:checked`);
                return checked ? parseInt(checked.value, 10) : 0;
            };

            const tenencia = document.querySelector('input[name="tenencia_vivienda"]:checked')?.value;
            const inputVivienda = document.getElementById('id_tipo_vivienda');

            const datosGuardar = {
                correo: user.email,
                nombre_completo: document.getElementById('nombre_completo')?.value.trim() || '',
                fecha_nacimiento: document.getElementById('fecha_nacimiento')?.value || '',
                telefono: document.getElementById('telefono')?.value.trim() || '',
                ubicacion: document.getElementById('ubicacion')?.value.trim() || '',
                ocupacion: document.getElementById('ocupacion')?.value.trim() || '',
                id_tipo_vivienda: inputVivienda ? parseInt(inputVivienda.value, 10) : 1,
                vivienda_propia: tenencia === 'propia' ? 1 : 0,
                vivienda_arrendada: tenencia === 'arrendada' ? 1 : 0,
                mascotas_permitidas: getRadioValue('mascotas_permitidas'),
                hay_niños_en_casa: getRadioValue('hay_niños_en_casa'),
                con_quien_vives: document.getElementById('con_quien_vives')?.value.trim() || '',
                tiene_otras_mascotas: getRadioValue('tiene_otras_mascotas'),
                // CORREGIDO: Ahora lee correctamente el valor del radio (0 o 1) en lugar de buscar un ID inexistente
                prosupuesto_mensual: document.getElementById('prosupuesto_mensual')?.value.trim() || 'No definido',
                horas_ausente: parseInt(document.getElementById('horas_ausente')?.value || 0, 10),
                cuidador: document.getElementById('cuidador')?.value.trim() || '',
                motivacion: document.getElementById('motivacion')?.value.trim() || ''
            };

            try {
                const respuesta = await fetch('http://localhost:3000/api/guardar-adoptante', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosGuardar)
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    formularioModificado = false;
                    alert("¡Perfil de adoptante guardado con éxito!");
                    window.location.href = "perfil_adoptante.html";
                } else {
                    alert("Error al guardar: " + (data.mensaje || data.detalle || "Error en el servidor"));
                }
            } catch (error) {
                console.error("Error en la solicitud:", error);
                alert("Error al conectar con el servidor.");
            }
        });
    }
});

// Función para cargar datos cuando se presiona "Editar Perfil"
async function cargarDatosCompletosAdoptante(correo) {
    try {
        const resUser = await fetch(`http://localhost:3000/obtener-usuario?correo=${encodeURIComponent(correo)}`);
        if (!resUser.ok) return;
        const datosUser = await resUser.json();

        const resFicha = await fetch(`http://localhost:3000/api/obtener-ficha-adoptante/${datosUser.id_usuarios}`);
        if (!resFicha.ok) return;
        const ficha = await resFicha.json();

        // Rellenar cada campo con la información ya guardada
        document.getElementById('nombre_completo').value = ficha.nombre_completo || '';
        if (ficha.fecha_nacimiento) {
            document.getElementById('fecha_nacimiento').value = ficha.fecha_nacimiento.split('T')[0];
        }
        document.getElementById('telefono').value = ficha.telefono || '';
        document.getElementById('ubicacion').value = ficha.ubicacion || '';
        document.getElementById('ocupacion').value = ficha.ocupacion || '';

        if (ficha.id_tipo_vivienda) {
            document.getElementById('id_tipo_vivienda').value = ficha.id_tipo_vivienda;
        }

        if (ficha.vivienda_propia === 1) {
            document.querySelector('input[name="tenencia_vivienda"][value="propia"]').checked = true;
        } else if (ficha.vivienda_arrendada === 1) {
            document.querySelector('input[name="tenencia_vivienda"][value="arrendada"]').checked = true;
        }

        setRadio('mascotas_permitidas', ficha.mascotas_permitidas);
        setRadio('hay_niños_en_casa', ficha.hay_niños_en_casa);
        setRadio('tiene_otras_mascotas', ficha.tiene_otras_mascotas);
        setRadio('prosupuesto_mensual', ficha.prosupuesto_mensual);

        document.getElementById('con_quien_vives').value = ficha.con_quien_vives || '';
        document.getElementById('horas_ausente').value = ficha.horas_ausente || '';
        document.getElementById('cuidador').value = ficha.cuidador || '';
        document.getElementById('motivacion').value = ficha.motivacion || '';

        formularioModificado = false;
    } catch (error) {
        console.error("Error al cargar datos para editar:", error);
    }
}

// Función auxiliar para marcar los botones de opción (radios)
function setRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) radio.checked = true;
}

async function cargarDatosRegistroUsuario(correo) {
    if (!correo) return;

    try {
        const res = await fetch(`http://localhost:3000/api/datos-usuario-registro?correo=${encodeURIComponent(correo)}`);
        if (!res.ok) return;
        const usuario = await res.json();

        if (usuario.nombre_usuario) {
            const campoNombre = document.getElementById('nombre_completo');
            if (campoNombre) campoNombre.value = usuario.nombre_usuario;
        }
        if (usuario.telefono_usuario) {
            const campoTelefono = document.getElementById('telefono');
            if (campoTelefono) campoTelefono.value = usuario.telefono_usuario;
        }
        if (usuario.fecha_nacimiento) {
            const campoFecha = document.getElementById('fecha_nacimiento');
            if (campoFecha) {
                campoFecha.value = usuario.fecha_nacimiento.toString().split('T')[0];
            }
        }
        formularioModificado = false;
    } catch (error) {
        console.error("Error al autocompletar datos de registro:", error);
    }
}

function intentarVolver() {
    if (formularioModificado) {
        const modal = document.getElementById('modal-confirmar-volver');
        if (modal) modal.style.display = 'flex';
    } else {
        window.location.href = "perfil_adoptante.html";
    }
}

function cerrarModalVolver() {
    document.getElementById('modal-confirmar-volver').style.display = 'none';
}

function confirmarSalida() {
    window.location.href = "perfil_adoptante.html";
}
=======
let formularioModificado = false;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-adoptante');

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            alert("Debes iniciar sesión para llenar el formulario.");
            window.location.href = "adopciones.html";
        } else {
            // Verificamos si venimos desde el botón de "Editar Perfil"
            const urlParams = new URLSearchParams(window.location.search);
            const esEdicion = urlParams.get('modo') === 'editar';

            if (esEdicion) {
                await cargarDatosCompletosAdoptante(user.email);
            } else {
                await cargarDatosRegistroUsuario(user.email);
            }
        }
    });

    if (form) {
        form.addEventListener('input', () => { formularioModificado = true; });
        form.addEventListener('change', () => { formularioModificado = true; });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Sesión no detectada.");
                return;
            }

            const getRadioValue = (name) => {
                const checked = document.querySelector(`input[name="${name}"]:checked`);
                return checked ? parseInt(checked.value, 10) : 0;
            };

            const tenencia = document.querySelector('input[name="tenencia_vivienda"]:checked')?.value;
            const inputVivienda = document.getElementById('id_tipo_vivienda');

            const datosGuardar = {
                correo: user.email,
                nombre_completo: document.getElementById('nombre_completo')?.value.trim() || '',
                fecha_nacimiento: document.getElementById('fecha_nacimiento')?.value || '',
                telefono: document.getElementById('telefono')?.value.trim() || '',
                ubicacion: document.getElementById('ubicacion')?.value.trim() || '',
                ocupacion: document.getElementById('ocupacion')?.value.trim() || '',
                id_tipo_vivienda: inputVivienda ? parseInt(inputVivienda.value, 10) : 1,
                vivienda_propia: tenencia === 'propia' ? 1 : 0,
                vivienda_arrendada: tenencia === 'arrendada' ? 1 : 0,
                mascotas_permitidas: getRadioValue('mascotas_permitidas'),
                hay_niños_en_casa: getRadioValue('hay_niños_en_casa'),
                con_quien_vives: document.getElementById('con_quien_vives')?.value.trim() || '',
                tiene_otras_mascotas: getRadioValue('tiene_otras_mascotas'),
                // CORREGIDO: Ahora lee correctamente el valor del radio (0 o 1) en lugar de buscar un ID inexistente
                prosupuesto_mensual: document.getElementById('prosupuesto_mensual')?.value.trim() || 'No definido',
                horas_ausente: parseInt(document.getElementById('horas_ausente')?.value || 0, 10),
                cuidador: document.getElementById('cuidador')?.value.trim() || '',
                motivacion: document.getElementById('motivacion')?.value.trim() || ''
            };

            try {
                const respuesta = await fetch('http://localhost:3000/api/guardar-adoptante', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosGuardar)
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    formularioModificado = false;
                    alert("¡Perfil de adoptante guardado con éxito!");
                    window.location.href = "perfil_adoptante.html";
                } else {
                    alert("Error al guardar: " + (data.mensaje || data.detalle || "Error en el servidor"));
                }
            } catch (error) {
                console.error("Error en la solicitud:", error);
                alert("Error al conectar con el servidor.");
            }
        });
    }
});

// Función para cargar datos cuando se presiona "Editar Perfil"
async function cargarDatosCompletosAdoptante(correo) {
    try {
        const resUser = await fetch(`http://localhost:3000/obtener-usuario?correo=${encodeURIComponent(correo)}`);
        if (!resUser.ok) return;
        const datosUser = await resUser.json();

        const resFicha = await fetch(`http://localhost:3000/api/obtener-ficha-adoptante/${datosUser.id_usuarios}`);
        if (!resFicha.ok) return;
        const ficha = await resFicha.json();

        // Rellenar cada campo con la información ya guardada
        document.getElementById('nombre_completo').value = ficha.nombre_completo || '';
        if (ficha.fecha_nacimiento) {
            document.getElementById('fecha_nacimiento').value = ficha.fecha_nacimiento.split('T')[0];
        }
        document.getElementById('telefono').value = ficha.telefono || '';
        document.getElementById('ubicacion').value = ficha.ubicacion || '';
        document.getElementById('ocupacion').value = ficha.ocupacion || '';

        if (ficha.id_tipo_vivienda) {
            document.getElementById('id_tipo_vivienda').value = ficha.id_tipo_vivienda;
        }

        if (ficha.vivienda_propia === 1) {
            document.querySelector('input[name="tenencia_vivienda"][value="propia"]').checked = true;
        } else if (ficha.vivienda_arrendada === 1) {
            document.querySelector('input[name="tenencia_vivienda"][value="arrendada"]').checked = true;
        }

        setRadio('mascotas_permitidas', ficha.mascotas_permitidas);
        setRadio('hay_niños_en_casa', ficha.hay_niños_en_casa);
        setRadio('tiene_otras_mascotas', ficha.tiene_otras_mascotas);
        setRadio('prosupuesto_mensual', ficha.prosupuesto_mensual);

        document.getElementById('con_quien_vives').value = ficha.con_quien_vives || '';
        document.getElementById('horas_ausente').value = ficha.horas_ausente || '';
        document.getElementById('cuidador').value = ficha.cuidador || '';
        document.getElementById('motivacion').value = ficha.motivacion || '';

        formularioModificado = false;
    } catch (error) {
        console.error("Error al cargar datos para editar:", error);
    }
}

// Función auxiliar para marcar los botones de opción (radios)
function setRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) radio.checked = true;
}

async function cargarDatosRegistroUsuario(correo) {
    if (!correo) return;

    try {
        const res = await fetch(`http://localhost:3000/api/datos-usuario-registro?correo=${encodeURIComponent(correo)}`);
        if (!res.ok) return;
        const usuario = await res.json();

        if (usuario.nombre_usuario) {
            const campoNombre = document.getElementById('nombre_completo');
            if (campoNombre) campoNombre.value = usuario.nombre_usuario;
        }
        if (usuario.telefono_usuario) {
            const campoTelefono = document.getElementById('telefono');
            if (campoTelefono) campoTelefono.value = usuario.telefono_usuario;
        }
        if (usuario.fecha_nacimiento) {
            const campoFecha = document.getElementById('fecha_nacimiento');
            if (campoFecha) {
                campoFecha.value = usuario.fecha_nacimiento.toString().split('T')[0];
            }
        }
        formularioModificado = false;
    } catch (error) {
        console.error("Error al autocompletar datos de registro:", error);
    }
}

function intentarVolver() {
    if (formularioModificado) {
        const modal = document.getElementById('modal-confirmar-volver');
        if (modal) modal.style.display = 'flex';
    } else {
        window.location.href = "perfil_adoptante.html";
    }
}

function cerrarModalVolver() {
    document.getElementById('modal-confirmar-volver').style.display = 'none';
}

function confirmarSalida() {
    window.location.href = "perfil_adoptante.html";
}
>>>>>>> 73ad380385be04225f0aeedc8f01200318850109
