document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('form-donacion'); // Reemplaza por tu ID
  const modal = document.getElementById('modalExito');
  const btnCerrar = document.getElementById('btnCerrarModal');

  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Capturar los checkboxes seleccionados
    const checkboxes = document.querySelectorAll('input[name="tipos_donacion"]:checked');
    const tiposSeleccionados = Array.from(checkboxes).map(cb => cb.value);

    // Crear el objeto JSON para enviar
    const datosDonacion = {
      id_fundacion: document.getElementById('id_fundacion').value,
      nombre_donante: document.getElementById('nombre_donante').value,
      correo: document.getElementById('correo').value,
      detalle: document.getElementById('detalle').value,
      tipos_donacion: tiposSeleccionados
    };

    try {
      const respuesta = await fetch('http://localhost:3000/api/donaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosDonacion)
      });

      const resultado = await respuesta.json();

      if (resultado.status === 'success') {
        modal.style.display = 'flex';
        formulario.reset();
      } else {
        alert('Error: ' + resultado.message);
      }
    } catch (error) {
      console.error('Error de red:', error);
      alert('No se pudo conectar con el servidor.');
    }
  });

  btnCerrar.addEventListener('click', () => {
    modal.style.display = 'none';
  });
});