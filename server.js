require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

// ==========================================
// INICIALIZACIÓN DE FIREBASE CON ARCHIVO LOCAL
// ==========================================
let credentialCert;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credentialCert = cert(serviceAccount);
        console.log("✅ Credenciales de Firebase cargadas correctamente desde la variable JSON de Render.");
    } catch (e) {
        console.error("❌ ERROR: No se pudo parsear el FIREBASE_SERVICE_ACCOUNT de Render.", e.message);
    }
} else {
    try {
        const serviceAccount = require('./clave-firebase.json');
        credentialCert = cert(serviceAccount);
    } catch (e) {
        console.error("❌ ERROR: No se encontró la configuración de Firebase.");
    }
}

initializeApp({
    credential: credentialCert
});
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// ==========================================
// ARCHIVOS ESTÁTICOS
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de MySQL robusta adaptada a los datos de Aiven
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 24612,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos MySQL:', err);
        return;
    }
    console.log('✅ Conectado exitosamente a la base de datos MySQL en Aiven!');
});

const codigosOTP = {};

// ==========================================
// AUTENTICACIÓN Y REGISTRO
// ==========================================
app.post('/registrar-usuario', (req, res) => {
    const { Nombre_usuario, Fecha_nacimiento, Correo_usuario, Telefono_usuario } = req.body;
   
    if (!Nombre_usuario || !Correo_usuario) {
        return res.status(400).json({ error: "El nombre de usuario y correo son obligatorios." });
    }

    db.query('SELECT id_usuarios FROM usuarios WHERE nombre_usuario = ?', [Nombre_usuario], (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor: " + err.message });
       
        if (results.length > 0) {
            return res.status(400).json({ error: "Este nombre de usuario ya está ocupado. Intenta con otro." });
        }

        const sql = 'INSERT INTO usuarios(nombre_usuario, Fecha_nacimiento, correo_usuario, Telefono_usuario) VALUES (?, ?, ?, ?)';
        const valores = [Nombre_usuario, Fecha_nacimiento, Correo_usuario, Telefono_usuario];
       
        db.query(sql, valores, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: "El usuario o correo ya se encuentra registrado." });
                }
                return res.status(500).json({ error: "Error en el servidor: " + err.message });
            }
            res.status(201).json({ message: '¡Datos guardados con éxito!', id_usuario: result.insertId });
        });
    });
});

app.post('/enviar-codigo-otp', (req, res) => {
    const { correo } = req.body;
    if (!correo) {
        return res.status(400).json({ error: "El correo es requerido." });
    }

    const codigo = Math.floor(1000 + Math.random() * 9000).toString();
    
    codigosOTP[correo] = { 
        codigo: codigo, 
        expira: Date.now() + 2 * 60 * 1000 
    };

    res.json({ 
        exito: true, 
        codigo: codigo, 
        mensaje: "Código OTP generado correctamente." 
    });
});

app.post('/verificar-otp', (req, res) => {
    const { correo, codigo } = req.body;
    const registroOTP = codigosOTP[correo];

    if (!registroOTP) {
        return res.status(400).json({ valido: false, error: "No hay un código solicitado para este correo." });
    }

    if (Date.now() > registroOTP.expira) {
        delete codigosOTP[correo];
        return res.status(400).json({ valido: false, error: "El código ha expirado. Solicita uno nuevo." });
    }

    if (registroOTP.codigo === codigo) {
        delete codigosOTP[correo];
        return res.json({ valido: true });
    } else {
        return res.status(400).json({ valido: false, error: "El código ingresado es incorrecto." });
    }
});

// ==========================================
// CONSULTA Y EDICIÓN DE PERFIL
// ==========================================
app.get('/api/perfil', (req, res) => {
    const usuarioId = req.usuario ? req.usuario.id_usuarios : 7;
    const query = 'SELECT nombre_usuario FROM usuarios WHERE id_usuarios = ?';

    db.query(query, [usuarioId], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ error: 'Error al consultar la base de datos' });
        }

        if (results.length > 0) {
            res.json({
                status: 'success',
                nombre_usuario: results[0].nombre_usuario
            });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    });
});

app.get('/api/obtener-usuario', (req, res) => {
    const { correo } = req.query;

    if (!correo) {
        return res.status(400).json({ error: "Se requiere el correo del usuario" });
    }

    const query = "SELECT * FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))";
   
    db.query(query, [correo], (err, results) => {
        if (err) {
            console.error("Error al consultar usuario:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json(results[0]);
    });
});

app.get('/api/mis-seguidores/:correo', (req, res) => {
    const correoUsuario = req.params.correo;

    const sql = `
        SELECT u.id_usuarios, u.nombre_usuario, u.foto_perfil, s.id_seguidor
        FROM seguidores s
        JOIN usuarios u ON s.id_usuario_seguidor = u.id_usuarios
        JOIN usuarios u_seguido ON s.id_usuario_seguido = u_seguido.id_usuarios
        WHERE LOWER(TRIM(u_seguido.correo_usuario)) = LOWER(TRIM(?))
    `;

    db.query(sql, [correoUsuario], (err, results) => {
        if (err) {
            console.error("❌ Error al obtener seguidores:", err.message);
            return res.status(500).json({ error: "Error en el servidor al obtener seguidores" });
        }
        res.json(results);
    });
});

app.delete('/api/remover-seguidor/:id_seguidor', (req, res) => {
    const idSeguidor = req.params.id_seguidor;

    const sql = "DELETE FROM seguidores WHERE id_seguidor = ?";
    db.query(sql, [idSeguidor], (err, result) => {
        if (err) {
            console.error("❌ Error al remover seguidor:", err.message);
            return res.status(500).json({ error: "Error al eliminar el seguidor de la base de datos" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No se encontró el registro del seguidor" });
        }

        res.json({ mensaje: "Seguidor eliminado con éxito" });
    });
});

app.get('/api/mis-seguidos/:correo', (req, res) => {
    const correoUsuario = req.params.correo;

    const sql = `
        SELECT u.id_usuarios, u.nombre_usuario, u.foto_perfil, s.id_seguidor
        FROM seguidores s
        JOIN usuarios u ON s.id_usuario_seguido = u.id_usuarios
        JOIN usuarios u_seguidor ON s.id_usuario_seguidor = u_seguidor.id_usuarios
        WHERE LOWER(TRIM(u_seguidor.correo_usuario)) = LOWER(TRIM(?))
    `;

    db.query(sql, [correoUsuario], (err, results) => {
        if (err) {
            console.error("❌ Error al obtener seguidos:", err.message);
            return res.status(500).json({ error: "Error en el servidor al obtener seguidos" });
        }
        res.json(results);
    });
});

app.get('/api/datos-usuario-registro', (req, res) => {
    let { correo } = req.query;

    if (!correo) {
        return res.status(400).json({ mensaje: "El correo es requerido." });
    }

    const correoLimpio = correo.trim().toLowerCase();

    const sql = `
        SELECT nombre_usuario, Fecha_nacimiento, Telefono_usuario, correo_usuario
        FROM usuarios
        WHERE LOWER(TRIM(correo_usuario)) = ?
    `;

    db.query(sql, [correoLimpio], (err, filas) => {
        if (err) {
            console.error("❌ Error en MySQL al obtener datos:", err);
            return res.status(500).json({ mensaje: "Error interno del servidor." });
        }

        if (!filas || filas.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado." });
        }

        return res.json({
            nombre_usuario: filas[0].nombre_usuario,
            fecha_nacimiento: filas[0].Fecha_nacimiento,
            telefono_usuario: filas[0].Telefono_usuario,
            correo_usuario: filas[0].correo_usuario
        });
    });
});

app.post('/guardar-foto-perfil', (req, res) => {
    const { correo_usuario, fotoBase64 } = req.body;

    if (!correo_usuario) {
        return res.status(400).json({ error: "El correo es requerido." });
    }

    const query = "UPDATE usuarios SET foto_perfil = ? WHERE correo_usuario = ?";

    db.query(query, [fotoBase64 || null, correo_usuario], (err) => {
        if (err) {
            console.error("❌ Error al guardar foto:", err.message);
            return res.status(500).json({ error: "Error al actualizar en la base de datos." });
        }

        res.json({ mensaje: "Foto de perfil actualizada correctamente" });
    });
});

app.post('/cambiar-nombre-usuario', (req, res) => {
    const { correo_usuario, nuevo_nombre } = req.body;

    if (!correo_usuario || !nuevo_nombre) {
        return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    const nombreLimpio = nuevo_nombre.trim();
    const correoLimpio = correo_usuario.trim().toLowerCase();

    const queryDueñoPropio = "SELECT id_usuarios FROM usuarios WHERE nombre_usuario = ? AND LOWER(TRIM(correo_usuario)) = ?";
   
    db.query(queryDueñoPropio, [nombreLimpio, correoLimpio], (errPropio, resPropio) => {
        if (errPropio) {
            console.error("❌ Error en consulta:", errPropio.message);
            return res.status(500).json({ error: "Error en el servidor." });
        }

        const esMismoUsuario = resPropio.length > 0;

        const continuarVerificacion = () => {
            const queryVerificar = "SELECT correo_usuario FROM usuarios WHERE nombre_usuario = ? AND LOWER(TRIM(correo_usuario)) != ?";
            db.query(queryVerificar, [nombreLimpio, correoLimpio], (err, existentes) => {
                if (err) {
                    console.error("❌ Error en consulta de verificación:", err.message);
                    return res.status(500).json({ error: "Error en el servidor." });
                }

                if (existentes.length > 0) {
                    return res.status(400).json({ mensaje: "El nombre de usuario ya está en uso por otra cuenta." });
                }

                ejecutarActualizacion();
            });
        };

        const ejecutarActualizacion = () => {
            db.query("SELECT ultimo_cambio_nombre FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = ?", [correoLimpio], (err, filas) => {
                if (err || filas.length === 0) {
                    return res.status(404).json({ mensaje: "Usuario no encontrado." });
                }

                const usuario = filas[0];
                const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');

                if (usuario.ultimo_cambio_nombre) {
                    const ultimaFecha = new Date(usuario.ultimo_cambio_nombre);
                    const diferenciaMs = new Date() - ultimaFecha;
                    const diasTranscurridos = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

                    if (diasTranscurridos < 30) {
                        const diasRestantes = 30 - diasTranscurridos;
                        return res.status(400).json({ mensaje: `Debes esperar ${diasRestantes} día(s) para volver a cambiar tu nombre.` });
                    }
                }

                const queryUpdate = "UPDATE usuarios SET nombre_usuario = ?, ultimo_cambio_nombre = ? WHERE LOWER(TRIM(correo_usuario)) = ?";
                db.query(queryUpdate, [nombreLimpio, fechaActual, correoLimpio], (errUpdate) => {
                    if (errUpdate) {
                        console.error("❌ Error al actualizar en MySQL:", errUpdate.message);
                        return res.status(500).json({ error: "Error al guardar en la base de datos." });
                    }

                    return res.json({ mensaje: "¡Nombre actualizado con éxito!", nuevo_nombre: nombreLimpio });
                });
            });
        };

        if (esMismoUsuario) {
            ejecutarActualizacion();
        } else {
            continuarVerificacion();
        }
    });
});

app.get('/validar-nombre-usuario', (req, res) => {
    const { nombre, correo_actual } = req.query;

    if (!nombre) {
        return res.status(400).json({ error: "Nombre requerido" });
    }

    const nombreLimpio = nombre.trim();
    const correoLimpio = correo_actual ? correo_actual.trim().toLowerCase() : '';

    let sql = `
        SELECT id_usuarios, correo_usuario
        FROM usuarios
        WHERE nombre_usuario = ?
        ${correoLimpio ? 'AND LOWER(TRIM(correo_usuario)) != ?' : ''}
    `;
   
    let params = correoLimpio ? [nombreLimpio, correoLimpio] : [nombreLimpio];

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length > 0) {
            return res.json({ disponible: false });
        }

        res.json({ disponible: true });
    });
});

app.post('/actualizar-telefono-usuario', (req, res) => {
    const { correo_usuario, nuevo_telefono } = req.body;

    if (!correo_usuario || !nuevo_telefono) {
        return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    const query = "UPDATE usuarios SET Telefono_usuario = ?, telefono_verificado = 0 WHERE correo_usuario = ?";
    db.query(query, [nuevo_telefono, correo_usuario], (err) => {
        if (err) {
            console.error("❌ Error al actualizar teléfono:", err.message);
            return res.status(500).json({ error: "Error al actualizar en la base de datos." });
        }
        res.json({ mensaje: "Número actualizado. Pendiente de verificación." });
    });
});

app.post('/verificar-telefono-usuario', (req, res) => {
    const { correo_usuario } = req.body;

    if (!correo_usuario) {
        return res.status(400).json({ error: "Correo requerido." });
    }

    const query = "UPDATE usuarios SET telefono_verificado = 1 WHERE correo_usuario = ?";
    db.query(query, [correo_usuario], (err) => {
        if (err) {
            return res.status(500).json({ error: "Error al verificar en la base de datos." });
        }
        res.json({ mensaje: "¡Número de celular verificado con éxito!" });
    });
});

app.post('/actualizar-correo-usuario', (req, res) => {
    const { correo_actual, nuevo_correo } = req.body;

    if (!correo_actual || !nuevo_correo) {
        return res.status(400).json({ success: false, mensaje: "Faltan datos requeridos." });
    }

    const correoActualLimpio = correo_actual.trim().toLowerCase();
    const nuevoCorreoLimpio = nuevo_correo.trim().toLowerCase();

    const sqlVerificar = "SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = ?";
    db.query(sqlVerificar, [nuevoCorreoLimpio], (errVerif, filas) => {
        if (errVerif) {
            console.error("❌ Error al verificar correo nuevo:", errVerif);
            return res.status(500).json({ success: false, mensaje: "Error en el servidor." });
        }

        if (filas.length > 0) {
            return res.status(400).json({ success: false, mensaje: "El nuevo correo ya está registrado en otra cuenta." });
        }

        const queryUpdate = 'UPDATE usuarios SET correo_usuario = ? WHERE LOWER(TRIM(correo_usuario)) = ?';
        db.query(queryUpdate, [nuevoCorreoLimpio, correoActualLimpio], (err, result) => {
            if (err) {
                console.error("❌ Error en base de datos al cambiar correo:", err);
                return res.status(500).json({ success: false, mensaje: "Error interno del servidor." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, mensaje: "No se encontró ningún usuario con el correo actual." });
            }

            db.query('UPDATE adoptante SET correo = ? WHERE LOWER(TRIM(correo)) = ?', [nuevoCorreoLimpio, correoActualLimpio], () => {
                res.json({ success: true, mensaje: "Correo actualizado con éxito en la base de datos." });
            });
        });
    });
});

app.delete('/api/eliminar-adoptante/:id_usuarios', (req, res) => {
    const idUsuarios = req.params.id_usuarios;

    if (!idUsuarios) {
        return res.status(400).json({ error: "ID de usuario inválido." });
    }

    const query = "DELETE FROM adoptante WHERE id_usuarios = ?";
    db.query(query, [idUsuarios], (err, result) => {
        if (err) {
            console.error("❌ Error al eliminar perfil de adoptante:", err.message);
            return res.status(500).json({ error: "Error en el servidor al eliminar el perfil." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No se encontró el perfil de adoptante." });
        }

        res.json({ mensaje: "¡Perfil de adoptante eliminado con éxito!" });
    });
});

// ==========================================
// REPORTES Y ESTADÍSTICAS
// ==========================================
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.post('/crear-reporte', upload.array('fotos_reporte[]', 3), (req, res) => {
    const {
        id_tipo_reporte,
        Descripcion,
        Ubicacion,
        telefono_contacto,
        correo_contacto,
        correo_usuario
    } = req.body;

    if (!id_tipo_reporte || !Descripcion || !Ubicacion || !correo_usuario) {
        return res.status(400).json({ error: "Faltan campos obligatorios para el reporte." });
    }

    let imagenesArray = [];
    if (req.files && req.files.length > 0) {
        imagenesArray = req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
    }
    const img_reporte = imagenesArray.length > 0 ? JSON.stringify(imagenesArray) : null;

    db.query("SELECT id_usuarios FROM usuarios WHERE correo_usuario = ?", [correo_usuario], (err, results) => {
        if (err || results.length === 0) {
            console.error("Error al buscar ID del usuario:", err);
            return res.status(500).json({ error: "No se pudo asociar el usuario al reporte." });
        }

        const id_usuarios = results[0].id_usuarios;
        const Fecha_reporte = new Date().toISOString().split('T')[0];

        const queryVerificarDuplicado = `
            SELECT id_reporte FROM reportes
            WHERE id_usuarios = ? AND Descripcion = ? AND Ubicacion = ?
            AND Fecha_reporte = ?
        `;

        db.query(queryVerificarDuplicado, [id_usuarios, Descripcion, Ubicacion, Fecha_reporte], (errDup, dupResults) => {
            if (!errDup && dupResults.length > 0) {
                return res.status(400).json({ error: "Ya has enviado este reporte recientemente. Evita duplicados." });
            }

            const queryInsertReporte = `
                INSERT INTO reportes
                (id_tipo_reporte, Descripcion, Ubicacion, telefono_contacto, correo_contacto, Fecha_reporte, img_reporte, id_usuarios)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const valores = [
                id_tipo_reporte,
                Descripcion,
                Ubicacion,
                telefono_contacto || null,
                correo_contacto || null,
                Fecha_reporte,
                img_reporte, 
                id_usuarios
            ];

            db.query(queryInsertReporte, valores, (errResult, result) => {
                if (errResult) {
                    console.error("❌ ERROR AL GUARDAR REPORTE:", errResult.message);
                    return res.status(500).json({ error: "Error al guardar en la base de datos: " + errResult.message });
                }

                const idReporteNuevo = result.insertId;
                const queryInsertPublicacion = `INSERT INTO publicaciones (id_reporte) VALUES (?)`;
               
                db.query(queryInsertPublicacion, [idReporteNuevo], (errPub) => {
                    if (errPub) {
                        console.error("⚠️ Advertencia: El reporte se creó pero falló al registrarse en publicaciones:", errPub.message);
                    }

                    res.status(201).json({
                        mensaje: "Reporte creado exitosamente",
                        id_reporte: idReporteNuevo
                    });
                });
            });
        });
    });
});

app.get('/reportes/balance-reportes', (req, res) => {
    const sql = `
        SELECT
            tr.Nombre_tipo_reporte AS tipo_emergencia,
            COUNT(r.id_reporte) AS total_casos,
            MONTH(r.Fecha_reporte) AS mes
        FROM reportes r
        INNER JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        GROUP BY tr.Nombre_tipo_reporte, MONTH(r.Fecha_reporte)
        ORDER BY total_casos DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/reportes/emergencias', (req, res) => {
    const sql = `
        SELECT
            tr.Nombre_tipo_reporte AS tipo_emergencia,
            COUNT(r.id_reporte) AS total_casos
        FROM reportes r
        INNER JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        GROUP BY tr.Nombre_tipo_reporte
        ORDER BY total_casos DESC;
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/reportes/usuarios-edad', (req, res) => {
    const sql = `
        SELECT
            CASE
                WHEN TIMESTAMPDIFF(YEAR, Fecha_nacimiento, CURDATE()) BETWEEN 18 AND 24 THEN '18-24 años'
                WHEN TIMESTAMPDIFF(YEAR, Fecha_nacimiento, CURDATE()) BETWEEN 25 AND 34 THEN '25-34 años'
                WHEN TIMESTAMPDIFF(YEAR, Fecha_nacimiento, CURDATE()) BETWEEN 35 AND 49 THEN '35-49 años'
                ELSE '50+ años'
            END AS rango_edad,
            COUNT(id_usuarios) AS total_usuarios
        FROM usuarios
        WHERE Fecha_nacimiento IS NOT NULL
        GROUP BY rango_edad
        ORDER BY total_usuarios DESC;
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// MÓDULO DE ADOPCIONES / ADOPTANTE
// ==========================================
app.get('/api/verificar-adoptante', (req, res) => {
    const { correo } = req.query;

    if (!correo) {
        return res.status(400).json({ error: "El correo es requerido." });
    }

    const query = `
        SELECT a.id_adoptante
        FROM adoptante a
        INNER JOIN usuarios u ON a.id_usuarios = u.id_usuarios
        WHERE u.correo_usuario = ?
    `;

    db.query(query, [correo], (err, results) => {
        if (err) return res.status(500).json({ error: "Error interno del servidor." });

        if (results.length > 0) {
            return res.json({ tienePerfil: true, id_adoptante: results[0].id_adoptante });
        } else {
            return res.json({ tienePerfil: false });
        }
    });
});

app.get('/api/obtener-ficha-adoptante/:id_usuarios', (req, res) => {
    const idUsuarios = req.params.id_usuarios;

    const query = `
        SELECT a.*, tv.tipo_vivienda AS tipo_vivienda_nombre
        FROM adoptante a
        LEFT JOIN tipo_vivienda tv ON a.id_tipo_vivienda = tv.id_tipo_vivienda
        WHERE a.id_usuarios = ?
    `;

    db.query(query, [idUsuarios], (err, results) => {
        if (err) {
            console.error("❌ Error al obtener ficha de adoptante:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Perfil de adoptante no encontrado" });
        }

        res.json(results[0]);
    });
});

app.post('/api/guardar-adoptante', (req, res) => {
    const {
        correo,
        nombre_completo,
        fecha_nacimiento,
        telefono,
        ubicacion,
        ocupacion,
        id_tipo_vivienda,
        vivienda_propia,
        vivienda_arrendada,
        mascotas_permitidas,
        hay_niños_en_casa,
        con_quien_vives,
        tiene_otras_mascotas,
        prosupuesto_mensual,
        horas_ausente,
        cuidador,
        motivacion
    } = req.body;

    if (!correo) {
        return res.status(400).json({ mensaje: "El correo del usuario es obligatorio." });
    }

    const sqlBuscarUsuario = "SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))";

    db.query(sqlBuscarUsuario, [correo], (err, resultados) => {
        if (err) {
            console.error("❌ Error al buscar usuario:", err);
            return res.status(500).json({ mensaje: "Error al consultar usuario en la BD." });
        }

        if (!resultados || resultados.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado en la base de datos." });
        }

        const id_usuarios = resultados[0].id_usuarios;

        const telLimpio = parseInt(telefono ? telefono.toString().replace(/\D/g, '') : '0', 10);
        const fechaValida = fecha_nacimiento ? fecha_nacimiento.split('T')[0] : '2000-01-01';

        const datosInsertar = [
            id_tipo_vivienda ? parseInt(id_tipo_vivienda, 10) : 1,
            vivienda_propia ? 1 : 0,
            vivienda_arrendada ? 1 : 0,
            mascotas_permitidas ? 1 : 0,
            hay_niños_en_casa ? 1 : 0,
            tiene_otras_mascotas ? 1 : 0,
            prosupuesto_mensual ? parseInt(prosupuesto_mensual, 10) : 0,
            nombre_completo || 'Sin nombre',
            ubicacion || 'No especificada',
            fechaValida,
            telLimpio,
            correo,
            ocupacion || 'No especificada',
            con_quien_vives || '',
            horas_ausente ? parseInt(horas_ausente, 10) : 0,
            cuidador || '',
            motivacion || '',
            id_usuarios
        ];

        const sqlGuardar = `
            INSERT INTO adoptante (
                id_tipo_vivienda, vivienda_propia, vivienda_arrendada,
                mascotas_permitidas, hay_niños_en_casa, tiene_otras_mascotas,
                prosupuesto_mensual, nombre_completo, ubicacion,
                fecha_nacimiento, telefono, correo, ocupacion,
                con_quien_vives, horas_ausente, cuidador, motivacion, id_usuarios
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                id_tipo_vivienda = VALUES(id_tipo_vivienda),
                vivienda_propia = VALUES(vivienda_propia),
                vivienda_arrendada = VALUES(vivienda_arrendada),
                mascotas_permitidas = VALUES(mascotas_permitidas),
                hay_niños_en_casa = VALUES(hay_niños_en_casa),
                tiene_otras_mascotas = VALUES(tiene_otras_mascotas),
                prosupuesto_mensual = VALUES(prosupuesto_mensual),
                nombre_completo = VALUES(nombre_completo),
                ubicacion = VALUES(ubicacion),
                fecha_nacimiento = VALUES(fecha_nacimiento),
                telefono = VALUES(telefono),
                correo = VALUES(correo),
                ocupacion = VALUES(ocupacion),
                con_quien_vives = VALUES(con_quien_vives),
                horas_ausente = VALUES(horas_ausente),
                cuidador = VALUES(cuidador),
                motivacion = VALUES(motivacion);
        `;

        db.query(sqlGuardar, datosInsertar, (errSave) => {
            if (errSave) {
                console.error("❌ Error de MySQL al guardar adoptante:", errSave.sqlMessage || errSave);
                return res.status(500).json({ mensaje: "Error al guardar el formulario.", detalle: errSave.sqlMessage });
            }

            return res.json({ mensaje: "Perfil de adoptante guardado con éxito." });
        });
    });
});

// ==========================================
// GESTIÓN DE PUBLICACIONES Y GUARDADOS
// ==========================================
app.post('/api/guardar-publicacion', (req, res) => {
    const { correo, id_publicacion } = req.body;

    if (!correo || !id_publicacion) {
        return res.status(400).json({ error: "Faltan datos requeridos (correo o id_publicacion)" });
    }

    db.query("SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))", [correo], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: "No se encontró el usuario en la base de datos." });
        }

        const id_usuarios = results[0].id_usuarios;
        const query = `INSERT INTO guardados (id_usuarios, id_publicacion) VALUES (?, ?)`;

        db.query(query, [id_usuarios, id_publicacion], (errInsert) => {
            if (errInsert) {
                if (errInsert.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: "Ya tienes esta publicación en tus guardados." });
                }
                console.error("❌ ERROR AL GUARDAR:", errInsert.message);
                return res.status(500).json({ error: "Error al guardar en la base de datos: " + errInsert.message });
            }

            res.status(201).json({ mensaje: "Publicación guardada exitosamente" });
        });
    });
});

app.get('/api/guardar-publicacion/:correo', (req, res) => {
    const correo = req.params.correo;

    const query = `
        SELECT
            p.id_publicacion,
            'reporte' AS tipo_publicacion,
            r.id_reporte AS id_origen,
            r.Descripcion,
            r.Ubicacion,
            r.img_reporte,
            r.Fecha_reporte,
            tr.Nombre_tipo_reporte AS nombre_tipo_reporte,
            r.telefono_contacto,
            r.correo_contacto,
            NULL AS nombre_animal
        FROM guardados g
        INNER JOIN usuarios u ON g.id_usuarios = u.id_usuarios
        INNER JOIN publicaciones p ON g.id_publicacion = p.id_publicacion
        INNER JOIN reportes r ON p.id_reporte = r.id_reporte
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))
          AND r.id_usuarios NOT IN (
              SELECT ub.id_usuario_bloqueado
              FROM usuarios_bloqueados ub
              INNER JOIN usuarios u_bloq ON ub.id_usuario_bloqueador = u_bloq.id_usuarios
              WHERE LOWER(TRIM(u_bloq.correo_usuario)) = LOWER(TRIM(?))
          )
       
        UNION ALL
       
        SELECT
            p.id_publicacion,
            'adopcion' AS tipo_publicacion,
            pa.id_publicaciones_adopcion AS id_origen,
            a.descripcion_animal AS Descripcion,
            CONCAT(a.ciudad, ', ', a.barrio) AS Ubicacion,
            a.fotos_animal AS img_reporte,
            NOW() AS Fecha_reporte,
            CONCAT('Adopción: ', a.nombre_animal) AS nombre_tipo_reporte,
            pa.telefono_contacto,
            pa.correo_contacto,
            a.nombre_animal
        FROM guardados g
        INNER JOIN usuarios u ON g.id_usuarios = u.id_usuarios
        INNER JOIN publicaciones p ON g.id_publicacion = p.id_publicacion
        INNER JOIN publicaciones_adopcion pa ON p.id_publicaciones_adopcion = pa.id_publicaciones_adopcion
        INNER JOIN animal a ON pa.id_animal = a.id_animal
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))
          AND pa.id_usuarios NOT IN (
              SELECT ub.id_usuario_bloqueado
              FROM usuarios_bloqueados ub
              INNER JOIN usuarios u_bloq ON ub.id_usuario_bloqueador = u_bloq.id_usuarios
              WHERE LOWER(TRIM(u_bloq.correo_usuario)) = LOWER(TRIM(?))
          )

        UNION ALL

        SELECT
            p.id_publicacion,
            'evento' AS tipo_publicacion,
            e.id_evento AS id_origen,
            e.detalles_adicionales AS Descripcion,
            e.ubicacion AS Ubicacion,
            NULL AS img_reporte,
            e.fecha_hora AS Fecha_reporte,
            CONCAT('Evento: ', e.nombre_evento) AS nombre_tipo_reporte,
            NULL AS telefono_contacto,
            f.Correo_fundacion AS correo_contacto,
            NULL AS nombre_animal
        FROM guardados g
        INNER JOIN usuarios u ON g.id_usuarios = u.id_usuarios
        INNER JOIN publicaciones p ON g.id_publicacion = p.id_publicacion
        INNER JOIN eventos e ON p.id_evento = e.id_evento
        INNER JOIN fundacion f ON e.id_fundacion = f.id_fundacion
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))

        ORDER BY id_publicacion DESC
    `;

    db.query(query, [correo, correo, correo, correo, correo], (err, results) => {
        if (err) {
            console.error("❌ ERROR AL OBTENER GUARDADOS:", err.message);
            return res.status(500).json({ error: "Error al obtener las publicaciones guardadas" });
        }

        res.json(results);
    });
});

app.post('/api/crear-notificacion-recordatorio', (req, res) => {
    const { correo, mensaje } = req.body;

    if (!correo || !mensaje) {
        return res.status(400).json({ error: "Faltan datos requeridos (correo o mensaje)." });
    }

    db.query("SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))", [correo], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado en la base de datos." });
        }

        const idUsuarioDestino = results[0].id_usuarios;

        const queryNotif = `
            INSERT INTO notificaciones (id_usuario_destino, id_usuario_origen, tipo, mensaje)
            VALUES (?, NULL, 'recordatorio_evento', ?)
        `;

        db.query(queryNotif, [idUsuarioDestino, mensaje], (errNotif) => {
            if (errNotif) {
                console.error("❌ Error al guardar la notificación de recordatorio:", errNotif.message);
                return res.status(500).json({ error: "Error al guardar el recordatorio en el servidor." });
            }

            res.status(201).json({ exito: true, mensaje: "¡Recordatorio registrado en las notificaciones con éxito!" });
        });
    });
});

app.post('/api/quitar-guardado', (req, res) => {
    const { correo, id_publicacion } = req.body;

    if (!correo || !id_publicacion) {
        return res.status(400).json({ error: "Faltan datos requeridos (correo o id_publicacion)" });
    }

    const query = `
        DELETE g FROM guardados g
        INNER JOIN usuarios u ON g.id_usuarios = u.id_usuarios
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?)) AND g.id_publicacion = ?
    `;

    db.query(query, [correo, id_publicacion], (err) => {
        if (err) {
            console.error("❌ ERROR AL ELIMINAR GUARDADO:", err.message);
            return res.status(500).json({ error: "Error al eliminar de la base de datos" });
        }

        res.json({ mensaje: "Publicación eliminada de guardados con éxito" });
    });
});

app.get('/api/guardados/ids/:correo', (req, res) => {
    const correo = req.params.correo;

    const query = `
        SELECT g.id_publicacion
        FROM guardados g
        INNER JOIN usuarios u ON g.id_usuarios = u.id_usuarios
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))
    `;

    db.query(query, [correo], (err, results) => {
        if (err) {
            console.error("❌ ERROR AL OBTENER IDS GUARDADOS:", err.message);
            return res.status(500).json({ error: "Error en el servidor" });
        }
        const idsGuardados = results.map(row => row.id_publicacion);
        res.json(idsGuardados);
    });
});

app.delete('/api/reportes/:id', (req, res) => {
    const idReporte = req.params.id;

    if (!idReporte || idReporte === 'undefined') {
        return res.status(400).json({ error: "ID de reporte inválido." });
    }

    db.query(`SELECT id_publicacion FROM publicaciones WHERE id_reporte = ?`, [idReporte], (err, rows) => {
        let idPub = rows && rows.length > 0 ? rows[0].id_publicacion : null;

        const ejecutarBorradoFinal = () => {
            db.query(`DELETE FROM publicaciones WHERE id_reporte = ?`, [idReporte], () => {
                db.query(`DELETE FROM reportes WHERE id_reporte = ?`, [idReporte], (err, result) => {
                    if (err) {
                        console.error("❌ Error al eliminar reporte:", err.message);
                        return res.status(500).json({ error: "Error al eliminar el reporte de la base de datos" });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ error: "No se encontró el reporte a eliminar" });
                    }

                    return res.json({ mensaje: "¡Reporte eliminado con éxito!" });
                });
            });
        };

        if (idPub) {
            db.query(`DELETE FROM guardados WHERE id_publicacion = ?`, [idPub], () => {
                ejecutarBorradoFinal();
            });
        } else {
            ejecutarBorradoFinal();
        }
    });
});

app.get('/api/publicaciones-globales', (req, res) => {
    const correoVisitante = req.query.correo;

    let sql = `
        SELECT
            p.id_publicacion,
            'reporte' AS tipo_publicacion,
            r.id_reporte AS id_origen,
            r.Descripcion,
            r.Ubicacion,
            r.img_reporte,
            r.Fecha_reporte,
            tr.Nombre_tipo_reporte AS nombre_tipo_reporte,
            r.telefono_contacto,
            r.correo_contacto,
            r.estado,
            NULL AS nombre_animal,
            u.nombre_usuario AS nombre_usuario,
            u.tipo_usuario AS tipo_usuario,
            r.id_usuarios
        FROM publicaciones p
        INNER JOIN reportes r ON p.id_reporte = r.id_reporte
        INNER JOIN usuarios u ON r.id_usuarios = u.id_usuarios
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        WHERE r.id_usuarios NOT IN (
            SELECT ub.id_usuario_bloqueado FROM usuarios_bloqueados ub
            INNER JOIN usuarios u_bloq ON ub.id_usuario_bloqueador = u_bloq.id_usuarios
            WHERE LOWER(TRIM(u_bloq.correo_usuario)) = LOWER(TRIM(?))
            UNION
            SELECT ub.id_usuario_bloqueador FROM usuarios_bloqueados ub
            INNER JOIN usuarios u_bloq ON ub.id_usuario_bloqueado = u_bloq.id_usuarios
            WHERE LOWER(TRIM(u_bloq.correo_usuario)) = LOWER(TRIM(?))
        )
       
        UNION ALL
       
        SELECT
            p.id_publicacion,
            'adopcion' AS tipo_publicacion,
            pa.id_publicaciones_adopcion AS id_origen,
            a.descripcion_animal AS Descripcion,
            CONCAT(a.ciudad, ', ', a.barrio) AS Ubicacion,
            a.fotos_animal AS img_reporte,
            NOW() AS Fecha_reporte,
            CONCAT('Adopción: ', a.nombre_animal) AS nombre_tipo_reporte,
            pa.telefono_contacto,
            pa.correo_contacto,
            NULL AS estado,
            a.nombre_animal,
            u.nombre_usuario AS nombre_usuario,
            u.tipo_usuario AS tipo_usuario,
            pa.id_usuarios
        FROM publicaciones p
        INNER JOIN publicaciones_adopcion pa ON p.id_publicaciones_adopcion = pa.id_publicaciones_adopcion
        INNER JOIN animal a ON pa.id_animal = a.id_animal
        INNER JOIN usuarios u ON pa.id_usuarios = u.id_usuarios
        WHERE pa.id_usuarios NOT IN (
            SELECT ub.id_usuario_bloqueado FROM usuarios_bloqueados ub
            INNER JOIN usuarios u_bloq ON ub.id_usuario_bloqueador = u_bloq.id_usuarios
            WHERE LOWER(TRIM(u_bloq.correo_usuario)) = LOWER(TRIM(?))
            UNION
            SELECT ub.id_usuario_bloqueador FROM usuarios_bloqueados ub
            INNER JOIN usuarios u_bloq ON ub.id_usuario_bloqueado = u_bloq.id_usuarios
            WHERE LOWER(TRIM(u_bloq.correo_usuario)) = LOWER(TRIM(?))
        )

        UNION ALL

        SELECT
            p.id_publicacion,
            'evento' AS tipo_publicacion,
            e.id_evento AS id_origen,
            e.detalles_adicionales AS Descripcion,
            e.ubicacion AS Ubicacion,
            NULL AS img_reporte,
            e.fecha_hora AS Fecha_reporte,
            CONCAT('Evento: ', e.nombre_evento) AS nombre_tipo_reporte,
            NULL AS telefono_contacto,
            f.Correo_fundacion AS correo_contacto,
            NULL AS estado,
            NULL AS nombre_animal,
            f.Nombre_Comercial AS nombre_usuario,
            'fundacion' AS tipo_usuario,
            NULL AS id_usuarios
        FROM publicaciones p
        INNER JOIN eventos e ON p.id_evento = e.id_evento
        INNER JOIN fundacion f ON e.id_fundacion = f.id_fundacion

        ORDER BY id_publicacion DESC
    `;

    const correoParam = correoVisitante || '';
    db.query(sql, [correoParam, correoParam, correoParam, correoParam], (err, rows) => {
        if (err) {
            console.error("❌ ERROR AL OBTENER PUBLICACIONES GLOBALES:", err.message);
            return res.status(500).json({ error: 'Hubo un error al obtener las publicaciones globales', detalle: err.message });
        }
        res.json(rows);
    });
});

app.delete('/api/adopciones/:id', (req, res) => {
    const idAdopcion = req.params.id;

    if (!idAdopcion || idAdopcion === 'undefined') {
        return res.status(400).json({ error: "ID de adopción inválido." });
    }

    db.query(`SELECT id_animal FROM publicaciones_adopcion WHERE id_publicaciones_adopcion = ?`, [idAdopcion], (err, rows) => {
        if (err) {
            console.error("❌ Error al buscar adopción:", err.message);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        let idAnimal = rows && rows.length > 0 ? rows[0].id_animal : null;

        const ejecutarBorradoAdopcionFinal = () => {
            db.query(`DELETE FROM publicaciones WHERE id_publicaciones_adopcion = ? OR id_animal = ?`, [idAdopcion, idAnimal], () => {
                db.query(`DELETE FROM publicaciones_adopcion WHERE id_publicaciones_adopcion = ?`, [idAdopcion], () => {
                    const queryDeleteAnimal = idAnimal ? `DELETE FROM animal WHERE id_animal = ?` : null;
                    const callbackBorrado = (errDel) => {
                        if (errDel) {
                            console.error("❌ Error al eliminar el animal:", errDel.message);
                            return res.status(500).json({ error: "Error al eliminar los datos de la mascota" });
                        }
                        return res.json({ mensaje: "¡Publicación de adopción eliminada con éxito!" });
                    };

                    if (queryDeleteAnimal) {
                        db.query(queryDeleteAnimal, [idAnimal], callbackBorrado);
                    } else {
                        res.json({ mensaje: "¡Publicación de adopción eliminada con éxito!" });
                    }
                });
            });
        };

        if (idAnimal) {
            db.query(`DELETE g FROM guardados g INNER JOIN publicaciones p ON g.id_publicacion = p.id_publicacion WHERE p.id_animal = ?`, [idAnimal], () => {
                ejecutarBorradoAdopcionFinal();
            });
        } else {
            ejecutarBorradoAdopcionFinal();
        }
    });
});

app.get('/api/reportes/:id', (req, res) => {
    const idReporte = req.params.id;

    const query = `
        SELECT r.*, tr.Nombre_tipo_reporte
        FROM reportes r
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        WHERE r.id_reporte = ?
    `;

    db.query(query, [idReporte], (err, results) => {
        if (err) {
            console.error("❌ Error al consultar el reporte:", err);
            return res.status(500).json({ error: "Error en el servidor" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Reporte no encontrado" });
        }

        res.json(results[0]);
    });
});

app.put('/api/reportes/:id', (req, res) => {
    const idReporte = req.params.id;
    const {
        id_tipo_reporte,
        descripcion_reporte,
        Descripcion,
        direccion_reporte,
        Ubicacion,
        telefono_contacto,
        correo_contacto,
        img_reporte
    } = req.body;

    const descFinal = descripcion_reporte || Descripcion;
    const ubiFinal = direccion_reporte || Ubicacion;

    const sql = `
        UPDATE reportes
        SET id_tipo_reporte = ?,
            Descripcion = ?,
            Ubicacion = ?,
            telefono_contacto = ?,
            correo_contacto = ?,
            img_reporte = ?
        WHERE id_reporte = ?
    `;

    const valores = [
        id_tipo_reporte,
        descFinal,
        ubiFinal,
        telefono_contacto || null,
        correo_contacto || null,
        img_reporte || null,
        idReporte
    ];

    db.query(sql, valores, (err, result) => {
        if (err) {
            console.error("❌ Error al actualizar el reporte:", err);
            return res.status(500).json({ error: "Error al actualizar en la base de datos: " + err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Reporte no encontrado" });
        }

        res.json({ mensaje: "¡Reporte actualizado con éxito!" });
    });
});

// ==========================================
// MÓDULO CREACIÓN DE ADOPCIONES
// ==========================================
app.post('/api/crear-adopcion', (req, res) => {
    const {
        nombre_animal,
        id_especie,
        otro_especie,
        sexo_animal,
        edad_aprox,
        id_raza,
        otro_raza,
        id_tamaño,
        descripcion_adopcion,
        ubicacion_adopcion,
        fotos_animal,
        correo_usuario,
        correo_contacto,
        telefono_contacto
    } = req.body;

    let ciudad = "Medellín";
    let barrio = "Desconocido";
    if (ubicacion_adopcion && ubicacion_adopcion.includes(',')) {
        const partes = ubicacion_adopcion.split(',');
        ciudad = partes[0].trim();
        barrio = partes[1].trim();
    } else if (ubicacion_adopcion) {
        barrio = ubicacion_adopcion.trim();
    }

    if (!nombre_animal || !id_especie || !correo_usuario) {
        return res.status(400).json({ error: "Faltan campos obligatorios para registrar la adopción." });
    }

    db.query("SELECT id_usuarios, correo_usuario AS correo_bd, telefono_usuario AS telefono_bd FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))", [correo_usuario], (err, results) => {
        if (err || results.length === 0) {
            console.error("❌ Error al buscar el usuario:", err);
            return res.status(500).json({ error: "No se pudo asociar el usuario a la adopción." });
        }

        const id_usuarios = results[0].id_usuarios;
        const correoRegistrado = results[0].correo_bd;
        const telefonoRegistrado = results[0].telefono_bd;
       
        const correoFinal = (correo_contacto && correo_contacto.trim() !== "") ? correo_contacto : correoRegistrado;
        const telefonoFinal = (telefono_contacto && telefono_contacto.trim() !== "") ? telefono_contacto : telefonoRegistrado;
        const id_estado = 2;

        db.beginTransaction(errTrans => {
            if (errTrans) {
                return res.status(500).json({ error: "Error al iniciar la transacción." });
            }

            const queryAnimal = `
                INSERT INTO animal
                (nombre_animal, id_especie, otro_especie, id_estado, sexo_animal, fecha_nacimiento_animal_aprox, id_raza, otro_raza, id_tamaño, descripcion_animal, ciudad, barrio, fotos_animal, id_usuarios)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
           
            db.query(queryAnimal, [
                nombre_animal,
                id_especie,
                otro_especie || null,
                id_estado,
                sexo_animal,
                edad_aprox,
                id_raza,
                otro_raza || null,
                id_tamaño,
                descripcion_adopcion,
                ciudad,
                barrio,
                fotos_animal || '',
                id_usuarios
            ], (errAnim, resultadoAnimal) => {
                if (errAnim) {
                    return db.rollback(() => {
                        res.status(500).json({ error: "Error al guardar el animal: " + errAnim.message });
                    });
                }
               
                const idAnimalGenerado = resultadoAnimal.insertId;
                const queryAdopcion = "INSERT INTO publicaciones_adopcion (id_animal, id_usuarios, telefono_contacto, correo_contacto) VALUES (?, ?, ?, ?)";
               
                db.query(queryAdopcion, [idAnimalGenerado, id_usuarios, telefonoFinal, correoFinal], (errAdop, resultadoAdopcion) => {
                    if (errAdop) {
                        return db.rollback(() => {
                            res.status(500).json({ error: "Error al guardar la adopción: " + errAdop.message });
                        });
                    }

                    const idAdopcionGenerado = resultadoAdopcion.insertId;
                    const queryPublicacion = "INSERT INTO publicaciones (id_animal, id_publicaciones_adopcion) VALUES (?, ?)";
                   
                    db.query(queryPublicacion, [idAnimalGenerado, idAdopcionGenerado], (errPub) => {
                        if (errPub) {
                            return db.rollback(() => {
                                res.status(500).json({ error: "Error al registrar la publicación general: " + errPub.message });
                            });
                        }

                        db.commit(errCommit => {
                            if (errCommit) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: "Error al confirmar la transacción." });
                                });
                            }
                            res.status(200).json({ mensaje: "¡Adopción publicada con éxito!" });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/mis-reportes', (req, res) => {
    const correoUsuario = req.query.correo;

    if (!correoUsuario) {
        return res.status(400).json({ error: "Se requiere el correo del usuario" });
    }

    const sql = `
        SELECT
            p.id_publicacion,
            'reporte' AS tipo_publicacion,
            r.id_reporte AS id_origen,
            r.Descripcion,
            r.Ubicacion,
            r.img_reporte,
            r.Fecha_reporte,
            tr.Nombre_tipo_reporte AS nombre_tipo_reporte,
            r.telefono_contacto,
            r.correo_contacto,
            NULL AS nombre_animal
        FROM publicaciones p
        INNER JOIN reportes r ON p.id_reporte = r.id_reporte
        INNER JOIN usuarios u ON r.id_usuarios = u.id_usuarios
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))
       
        UNION ALL
       
        SELECT
            p.id_publicacion,
            'adopcion' AS tipo_publicacion,
            pa.id_publicaciones_adopcion AS id_origen,
            a.descripcion_animal AS Descripcion,
            CONCAT(a.ciudad, ', ', a.barrio) AS Ubicacion,
            a.fotos_animal AS img_reporte,
            NOW() AS Fecha_reporte,
            CONCAT('Adopción: ', a.nombre_animal) AS nombre_tipo_reporte,
            pa.telefono_contacto,
            pa.correo_contacto,
            a.nombre_animal
        FROM publicaciones p
        INNER JOIN publicaciones_adopcion pa ON p.id_publicaciones_adopcion = pa.id_publicaciones_adopcion
        INNER JOIN animal a ON pa.id_animal = a.id_animal
        INNER JOIN usuarios u ON pa.id_usuarios = u.id_usuarios
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))

        UNION ALL

        SELECT
            p.id_publicacion,
            'evento' AS tipo_publicacion,
            e.id_evento AS id_origen,
            e.detalles_adicionales AS Descripcion,
            e.ubicacion AS Ubicacion,
            NULL AS img_reporte,
            NOW() AS Fecha_reporte,
            CONCAT('Evento: ', e.nombre_evento) AS nombre_tipo_reporte,
            NULL AS telefono_contacto,
            f.Correo_fundacion AS correo_contacto,
            NULL AS nombre_animal
        FROM publicaciones p
        INNER JOIN eventos e ON p.id_evento = e.id_evento
        INNER JOIN fundacion f ON e.id_fundacion = f.id_fundacion
        WHERE LOWER(TRIM(f.Correo_fundacion)) = LOWER(TRIM(?))

        ORDER BY id_publicacion DESC
    `;

    db.query(sql, [correoUsuario, correoUsuario, correoUsuario], (err, rows) => {
        if (err) {
            console.error("❌ ERROR AL OBTENER PUBLICACIONES Y EVENTOS:", err.message);
            return res.status(500).json({ error: 'Hubo un error al obtener las publicaciones', detalle: err.message });
        }
        res.json(rows);
    });
});

app.get('/api/adopciones/:id', (req, res) => {
    const idAdopcion = req.params.id;

    const sql = `
        SELECT
            pa.id_publicaciones_adopcion,
            pa.telefono_contacto,
            pa.correo_contacto,
            a.*,
            u.nombre_usuario AS nombre_usuario,
            u.tipo_usuario AS tipo_usuario,
            u.correo_usuario AS correo_usuario
        FROM publicaciones_adopcion pa
        INNER JOIN animal a ON pa.id_animal = a.id_animal
        INNER JOIN usuarios u ON pa.id_usuarios = u.id_usuarios
        WHERE pa.id_publicaciones_adopcion = ?
    `;

    db.query(sql, [idAdopcion], (err, results) => {
        if (err) {
            console.error("❌ Error al consultar la adopción:", err);
            return res.status(500).json({ error: "Error en el servidor", detalle: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Publicación de adopción no encontrada" });
        }

        res.json(results[0]);
    });
});

app.put('/api/actualizar-adopcion/:id', (req, res) => {
    const idAdopcion = req.params.id;
    const {
        nombre_animal,
        id_especie,
        otro_especie,
        sexo_animal,
        edad_aprox,
        id_raza,
        otro_raza,
        id_tamaño,
        descripcion_adopcion,
        ubicacion_adopcion,
        fotos_animal,
        correo_contacto,
        telefono_contacto
    } = req.body;

    if (!idAdopcion || !nombre_animal || !id_especie) {
        return res.status(400).json({ error: "Faltan campos obligatorios para actualizar la adopción." });
    }

    let ciudad = "Medellín";
    let barrio = "Desconocido";
    if (ubicacion_adopcion && ubicacion_adopcion.includes(',')) {
        const partes = ubicacion_adopcion.split(',');
        ciudad = partes[0].trim();
        barrio = partes[1].trim();
    } else if (ubicacion_adopcion) {
        barrio = ubicacion_adopcion.trim();
    }

    db.query("SELECT id_animal FROM publicaciones_adopcion WHERE id_publicaciones_adopcion = ?", [idAdopcion], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ error: "No se encontró la adopción a actualizar." });
        }

        const idAnimal = rows[0].id_animal;

        db.beginTransaction(errTrans => {
            if (errTrans) return res.status(500).json({ error: "Error en la transacción." });

            const queryUpdateAnimal = `
                UPDATE animal
                SET nombre_animal = ?, id_especie = ?, otro_especie = ?, sexo_animal = ?,
                    fecha_nacimiento_animal_aprox = ?, id_raza = ?, otro_raza = ?, id_tamaño = ?,
                    descripcion_animal = ?, ciudad = ?, barrio = ?, fotos_animal = ?
                WHERE id_animal = ?
            `;

            db.query(queryUpdateAnimal, [
                nombre_animal, id_especie, otro_especie || null, sexo_animal,
                edad_aprox, id_raza, otro_raza || null, id_tamaño,
                descripcion_adopcion, ciudad, barrio, fotos_animal || '', idAnimal
            ], (errAnim) => {
                if (errAnim) {
                    return db.rollback(() => res.status(500).json({ error: "Error al actualizar el animal: " + errAnim.message }));
                }

                const queryUpdatePub = `
                    UPDATE publicaciones_adopcion
                    SET telefono_contacto = ?, correo_contacto = ?
                    WHERE id_publicaciones_adopcion = ?
                `;

                db.query(queryUpdatePub, [telefono_contacto || null, correo_contacto || null, idAdopcion], (errPub) => {
                    if (errPub) {
                        return db.rollback(() => res.status(500).json({ error: "Error al actualizar el contacto: " + errPub.message }));
                    }

                    db.commit(errCommit => {
                        if (errCommit) {
                            return db.rollback(() => res.status(500).json({ error: "Error al confirmar los cambios." }));
                        }
                        res.json({ mensaje: "¡Adopción actualizada con éxito!" });
                    });
                });
            });
        });
    });
});

app.get('/api/perfil-publico/:parametro', (req, res) => {
    const parametro = decodeURIComponent(req.params.parametro).trim();
    const correoVisitante = req.query.correo_visitante;

    const sql = `
        SELECT u.id_usuarios, u.nombre_usuario, u.foto_perfil, u.correo_usuario, u.Telefono_usuario
        FROM usuarios u
        WHERE u.nombre_usuario LIKE ?
           OR u.correo_usuario LIKE ?
    `;

    db.query(sql, [`%${parametro}%`, `%${parametro}%`], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const usuario = results[0];

        if (!correoVisitante) {
            return res.json({ ...usuario, siguiendo: false, estado_solicitud: 'ninguna' });
        }

        const sqlBloqueo = `
            SELECT COUNT(*) AS bloqueado FROM usuarios_bloqueados ub
            JOIN usuarios u1 ON ub.id_usuario_bloqueador = u1.id_usuarios
            JOIN usuarios u2 ON ub.id_usuario_bloqueado = u2.id_usuarios
            WHERE (LOWER(TRIM(u1.correo_usuario)) = LOWER(TRIM(?)) AND u2.id_usuarios = ?)
               OR (LOWER(TRIM(u2.correo_usuario)) = LOWER(TRIM(?)) AND u1.id_usuarios = ?)
        `;

        db.query(sqlBloqueo, [correoVisitante, usuario.id_usuarios, correoVisitante, usuario.id_usuarios], (errB, resB) => {
            if (resB && resB[0].bloqueado > 0) {
                return res.status(404).json({ error: "Perfil no disponible" });
            }

            const sqlVerificaciones = `
                SELECT
                    (SELECT COUNT(*) FROM seguidores WHERE id_usuario_seguidor = (SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))) AND id_usuario_seguido = ?) AS siguiendo,
                    (SELECT estado FROM solicitudes_adoptante WHERE id_solicitante = (SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))) AND id_propietario = ?) AS estado_solicitud
            `;

            db.query(sqlVerificaciones, [correoVisitante, usuario.id_usuarios, correoVisitante, usuario.id_usuarios], (errVerif, resVerif) => {
                const estadoFinal = (resVerif && resVerif.length > 0 && resVerif[0].estado_solicitud) ? resVerif[0].estado_solicitud : 'ninguna';
                res.json({
                    ...usuario,
                    siguiendo: resVerif && resVerif.length > 0 && resVerif[0].siguiendo > 0,
                    estado_solicitud: estadoFinal
                });
            });
        });
    });
});

app.post('/api/alternar-seguimiento', (req, res) => {
    const { correo_seguidor, id_seguido } = req.body;

    db.query("SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))", [correo_seguidor], (err, rows) => {
        if (err || rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });
        const idSeguidor = rows[0].id_usuarios;

        db.query("SELECT id_seguidor FROM seguidores WHERE id_usuario_seguidor = ? AND id_usuario_seguido = ?", [idSeguidor, id_seguido], (errExist, exist) => {
            if (exist.length > 0) {
                db.query("DELETE FROM seguidores WHERE id_seguidor = ?", [exist[0].id_seguidor], () => {
                    res.json({ siguiendo: false, mensaje: "Has dejado de seguir a este usuario." });
                });
            } else {
                db.query("INSERT INTO seguidores (id_usuario_seguidor, id_usuario_seguido) VALUES (?, ?)", [idSeguidor, id_seguido], () => {
                    db.query("INSERT INTO notificaciones (id_usuario_destino, id_usuario_origen, tipo, mensaje) VALUES (?, ?, 'nuevo_seguidor', 'comenzó a seguirte.')", [id_seguido, idSeguidor]);
                    res.json({ siguiendo: true, mensaje: "Ahora sigues a este usuario" });
                });
            }
        });
    });
});

app.post('/api/solicitar-ver-adoptante', (req, res) => {
    const { correo_solicitante, id_propietario } = req.body;

    db.query("SELECT id_usuarios, nombre_usuario FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))", [correo_solicitante], (err, rows) => {
        if (err || rows.length === 0) return res.status(400).json({ error: "Error de usuario" });
       
        const idSolicitante = rows[0].id_usuarios;
        const nombreSolicitante = rows[0].nombre_usuario;

        if (Number(idSolicitante) === Number(id_propietario)) {
            return res.status(400).json({ error: "No puedes solicitar ver tu propio perfil." });
        }

        db.query("SELECT estado FROM solicitudes_adoptante WHERE id_solicitante = ? AND id_propietario = ?", [idSolicitante, id_propietario], (errExist, exist) => {
            if (exist && exist.length > 0) {
                const est = exist[0].estado;
                if (est === 'pendiente') return res.json({ exito: true, mensaje: "Ya tienes una solicitud pendiente.", estado: 'pendiente' });
                if (est === 'aceptada') return res.json({ exito: true, mensaje: "Ya tienes permiso para ver este perfil.", estado: 'aceptada' });
            }

            const sql = "INSERT INTO solicitudes_adoptante (id_solicitante, id_propietario, estado) VALUES (?, ?, 'pendiente') ON DUPLICATE KEY UPDATE estado='pendiente'";
            db.query(sql, [idSolicitante, id_propietario], () => {
                const msg = `@${nombreSolicitante} quiere ver tu perfil de adoptante.`;
                const checkNotif = "SELECT id_notificacion FROM notificaciones WHERE id_usuario_destino = ? AND id_usuario_origen = ? AND tipo = 'solicitud_adoptante' AND leida = 0";
               
                db.query(checkNotif, [id_propietario, idSolicitante], (errN, resN) => {
                    if (!resN || resN.length === 0) {
                        db.query("INSERT INTO notificaciones (id_usuario_destino, id_usuario_origen, tipo, mensaje) VALUES (?, ?, 'solicitud_adoptante', ?)", [id_propietario, idSolicitante, msg]);
                    }
                    res.json({ exito: true, mensaje: "Solicitud enviada correctamente.", estado: 'pendiente' });
                });
            });
        });
    });
});

app.post('/api/responder-solicitud-adoptante', (req, res) => {
    const { id_solicitud, accion, correo_propietario } = req.body;
    const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada';

    const sqlUpdate = "UPDATE solicitudes_adoptante SET estado = ? WHERE id_solicitud = ?";
    db.query(sqlUpdate, [nuevoEstado, id_solicitud], (err) => {
        if (err) return res.status(500).json({ error: "Error al actualizar solicitud" });

        if (nuevoEstado === 'aceptada') {
            const sqlNotif = `
                INSERT INTO notificaciones (id_usuario_destino, id_usuario_origen, tipo, mensaje)
                SELECT s.id_solicitante, s.id_propietario, 'solicitud_aceptada', 'aceptó tu solicitud para ver su perfil de adoptante.'
                FROM solicitudes_adoptante s
                WHERE s.id_solicitud = ?
                  AND NOT EXISTS (
                      SELECT 1 FROM notificaciones n
                      WHERE n.id_usuario_destino = s.id_solicitante
                        AND n.id_usuario_origen = s.id_propietario
                        AND n.tipo = 'solicitud_aceptada'
                  )
            `;
            db.query(sqlNotif, [id_solicitud]);
        }

        res.json({ exito: true, mensaje: `Solicitud ${nuevoEstado} con éxito.` });
    });
});

app.delete('/api/notificaciones/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM notificaciones WHERE id_notificacion = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Error al borrar notificación" });
        res.json({ exito: true });
    });
});

app.get('/api/ficha-adoptante-publica/:username', (req, res) => {
    const { username } = req.params;
    const correoSolicitante = req.query.correo_solicitante;

    const sqlUsuario = "SELECT id_usuarios, nombre_usuario, correo_usuario, Telefono_usuario FROM usuarios WHERE LOWER(TRIM(nombre_usuario)) = LOWER(TRIM(?))";
    db.query(sqlUsuario, [username], (err, resUser) => {
        if (err || resUser.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

        const usuarioTarget = resUser[0];

        const sqlVerificarPermiso = `
            SELECT estado FROM solicitudes_adoptante
            WHERE id_solicitante = (SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?)))
              AND id_propietario = ? AND estado = 'aceptada'
        `;

        db.query(sqlVerificarPermiso, [correoSolicitante, usuarioTarget.id_usuarios], (errPerm, resPerm) => {
            if (errPerm || resPerm.length === 0) {
                return res.status(403).json({ error: "No tienes permiso para ver esta ficha de adoptante." });
            }

            const sqlFicha = "SELECT * FROM adoptante WHERE id_usuarios = ?";
            db.query(sqlFicha, [usuarioTarget.id_usuarios], (errFicha, resFicha) => {
                if (errFicha || resFicha.length === 0) {
                    return res.status(404).json({ error: "El usuario aún no ha completado su ficha de adoptante." });
                }

                res.json({
                    usuario: usuarioTarget,
                    ficha: resFicha[0]
                });
            });
        });
    });
});

// ==========================================
// MÓDULO DE REGISTRO DE FUNDACIONES
// ==========================================

app.post('/api/registrar-fundacion', express.json({ limit: '20mb' }), async (req, res) => {
    const {
        correo_fundacion, password,
        nombre_legal, nombre_comercial, nit_rut,
        pais, ciudad, direccion, telefono_fundacion, pagina_web,
        rep_nombre, rep_documento, rep_cargo, rep_telefono, rep_correo, metodos_donacion,
        descripcion_mision, descripcion_vision, programas_proyectos, pfp_fundacion, foto_portada, enfoque_otro,
        certificado_existencia, estatuto, registro_oficial, estado_financiero
    } = req.body;

    if (!correo_fundacion || !password) {
        return res.status(400).json({ exito: false, mensaje: "El correo y la contraseña son obligatorios." });
    }

    const parseBase64ToBuffer = (base64Str) => {
        if (!base64Str) return null;
        if (base64Str.includes(',')) {
            base64Str = base64Str.split(',')[1];
        }
        return Buffer.from(base64Str, 'base64');
    };

    const certBuffer = parseBase64ToBuffer(certificado_existencia);
    const estatutoBuffer = parseBase64ToBuffer(estatuto);
    const registroBuffer = parseBase64ToBuffer(registro_oficial);
    const financieroBuffer = parseBase64ToBuffer(estado_financiero);

    try {
        let firebaseUser;
        try {
            firebaseUser = await getAuth().createUser({
                email: correo_fundacion,
                password: password,
                emailVerified: false
            });
        } catch (firebaseErr) {
            if (firebaseErr.code === 'auth/email-already-exists') {
                return res.status(400).json({ exito: false, mensaje: "Este correo ya está registrado en el sistema." });
            }
            throw firebaseErr;
        }

        const queryDocumentacion = `
            INSERT INTO documentacion (certificado_existencia, estatuto, estado_financiero, registro_oficial)
            VALUES (?, ?, ?, ?)
        `;
       
        db.query(queryDocumentacion, [certBuffer, estatutoBuffer, financieroBuffer, registroBuffer], (errDoc, resultadoDoc) => {
            if (errDoc) {
                console.error("❌ Error al guardar documentación:", errDoc.sqlMessage || errDoc);
                getAuth().deleteUser(firebaseUser.uid).catch(() => {});
                return res.status(500).json({ exito: false, mensaje: "Error al guardar los documentos legales." });
            }

            const idDocumentacionGenerado = resultadoDoc.insertId;
            let nombreBase = (nombre_comercial || nombre_legal || 'Fundacion').substring(0, 40);
            const nombreUsuarioFinal = `${nombreBase}_${Math.floor(1000 + Math.random() * 9000)}`;

            const queryUsuarios = `
                INSERT INTO usuarios (tipo_usuario, estado_aprobacion, correo_usuario, nombre_usuario)
                VALUES ('fundacion', 'pendiente', ?, ?)
            `;

            db.query(queryUsuarios, [correo_fundacion, nombreUsuarioFinal], (errUsr, resultadoUsuario) => {
                if (errUsr) {
                    console.error("❌ Error al registrar en usuarios:", errUsr.sqlMessage || errUsr);
                    getAuth().deleteUser(firebaseUser.uid).catch(() => {});
                    return res.status(500).json({ exito: false, mensaje: "Error al registrar en usuarios." });
                }

                const queryFundacion = `
                    INSERT INTO fundacion (
                        id_documentacion, Nombre_Legal, Nombre_Comercial, Nit_Rut, Pais, Ciudad, Direccion,
                        Telefono_fundacion, Pagina_web, Descripcion_mision, Descripcion_vision,
                        PFP_Fundacion, Foto_Portada, Programas_Proyectos_Actuales, enfoque_otro, Correo_fundacion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const valoresFundacion = [
                    idDocumentacionGenerado,
                    nombre_legal || '',
                    nombre_comercial || '',
                    nit_rut || '',
                    pais || 'Colombia',
                    ciudad || 'Medellín',
                    direccion || '',
                    telefono_fundacion || '',
                    pagina_web || '',
                    descripcion_mision || '',
                    descripcion_vision || '',
                    pfp_fundacion || '',
                    foto_portada || '',
                    programas_proyectos || '',
                    enfoque_otro || '',
                    correo_fundacion
                ];

                db.query(queryFundacion, valoresFundacion, (errFund, resultadoFundacion) => {
                    if (errFund) {
                        console.error("❌ Error al registrar en la tabla fundacion:", errFund.sqlMessage || errFund);
                        getAuth().deleteUser(firebaseUser.uid).catch(() => {});
                        return res.status(500).json({ exito: false, mensaje: "Error al registrar la fundación." });
                    }

                    const idFundacionGenerado = resultadoFundacion.insertId;
                    const queryRepresentante = `
                        INSERT INTO representante (nombre_completo, documento, telefono, correo, id_fundacion)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                   
                    db.query(queryRepresentante, [rep_nombre || '', rep_documento || '', rep_telefono || '', rep_correo || '', idFundacionGenerado], () => {
                        res.json({ exito: true, mensaje: "¡Fundación registrada con éxito!" });
                    });
                });
            });
        });

    } catch (error) {
        console.error("Error crítico en registro de fundación:", error);
        res.status(500).json({ exito: false, mensaje: "Error interno del servidor: " + error.message });
    }
});

app.post('/api/bloquear-usuario', (req, res) => {
    const { correo_bloqueador, id_usuario_bloqueado } = req.body;

    if (!correo_bloqueador || !id_usuario_bloqueado) {
        return res.status(400).json({ error: "Faltan datos requeridos para bloquear." });
    }

    db.query('SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))', [correo_bloqueador], (err, usuarioBloqueador) => {
        if (err || usuarioBloqueador.length === 0) {
            return res.status(404).json({ error: "Usuario bloqueador no encontrado" });
        }

        const idBloqueador = usuarioBloqueador[0].id_usuarios;

        if (Number(idBloqueador) === Number(id_usuario_bloqueado)) {
            return res.status(400).json({ error: "No puedes bloquearte a ti mismo" });
        }

        db.query('INSERT IGNORE INTO usuarios_bloqueados (id_usuario_bloqueador, id_usuario_bloqueado) VALUES (?, ?)', [idBloqueador, id_usuario_bloqueado], (errInsert) => {
            if (errInsert) {
                return res.status(500).json({ error: "Error en el servidor al bloquear usuario" });
            }
            res.json({ mensaje: "Usuario bloqueado exitosamente" });
        });
    });
});

app.get('/api/usuarios-bloqueados/:correo', (req, res) => {
    const correoBloqueador = req.params.correo;

    const sql = `
        SELECT u.id_usuarios, u.nombre_usuario, u.foto_perfil, u.correo_usuario
        FROM usuarios_bloqueados ub
        JOIN usuarios u ON ub.id_usuario_bloqueado = u.id_usuarios
        JOIN usuarios u_bloq ON ub.id_usuario_bloqueador = u_bloq.id_usuarios
        WHERE LOWER(TRIM(u_bloq.correo_usuario)) = LOWER(TRIM(?))
    `;

    db.query(sql, [correoBloqueador], (err, results) => {
        if (err) return res.status(500).json({ error: "Error al obtener bloqueados" });
        res.json(results);
    });
});

app.post('/api/desbloquear-usuario', (req, res) => {
    const { correo_bloqueador, id_usuario_bloqueado } = req.body;

    if (!correo_bloqueador || !id_usuario_bloqueado) {
        return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    db.query('SELECT id_usuarios FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))', [correo_bloqueador], (err, usuario) => {
        if (err || usuario.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

        const idBloqueador = usuario[0].id_usuarios;
        db.query('DELETE FROM usuarios_bloqueados WHERE id_usuario_bloqueador = ? AND id_usuario_bloqueado = ?', [idBloqueador, id_usuario_bloqueado], () => {
            res.json({ mensaje: "Usuario desbloqueado exitosamente" });
        });
    });
});

app.get('/api/admin/fundaciones-pendientes', (req, res) => {
    const query = `
        SELECT f.*, u.estado_aprobacion, d.certificado_existencia, d.estatuto, d.registro_oficial, d.estado_financiero
        FROM fundacion f
        JOIN usuarios u ON f.Correo_fundacion = u.correo_usuario
        JOIN documentacion d ON f.id_documentacion = d.id_documentacion
        WHERE u.estado_aprobacion = 'pendiente'
    `;
    db.query(query, (err, resultados) => {
        if (err) return res.status(500).json({ exito: false, mensaje: "Error al obtener solicitudes" });
        res.json({ exito: true, fundaciones: resultados });
    });
});

app.post('/api/admin/aprobar-fundacion', async (req, res) => {
    const { id_fundacion, correo_fundacion, nombre_comercial } = req.body;

    const queryUpdate = `
        UPDATE usuarios u
        JOIN fundacion f ON u.correo_usuario = f.Correo_fundacion
        SET u.estado_aprobacion = 'aprobado'
        WHERE f.id_fundacion = ?
    `;

    db.query(queryUpdate, [id_fundacion], async (err) => {
        if (err) return res.status(500).json({ exito: false, mensaje: "Error en base de datos" });

        res.json({ exito: true, mensaje: "Fundación aprobada con éxito." });
    });
});

app.get('/api/obtener-fundacion-header', (req, res) => {
    const { correo } = req.query;
    if (!correo) return res.status(400).json({ error: "Correo requerido" });

    const query = `
        SELECT Nombre_Comercial AS nombre_comercial, PFP_Fundacion AS pfp_fundacion
        FROM fundacion
        WHERE LOWER(TRIM(Correo_fundacion)) = LOWER(TRIM(?))
    `;
    db.query(query, [correo], (err, results) => {
        if (err || results.length === 0) {
            return res.json({ nombre_comercial: null, pfp_fundacion: null });
        }
        res.json(results[0]);
    });
});

app.put('/api/reportes/:id/estado', (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) return res.status(400).json({ error: 'El estado es requerido' });

    const query = 'UPDATE reportes SET estado = ? WHERE id_reporte = ?';
    db.query(query, [estado, id], (err, result) => {
        if (err || result.affectedRows === 0) {
            return res.status(500).json({ error: 'Error al actualizar el estado' });
        }
        res.json({ success: true, message: 'Estado actualizado correctamente' });
    });
});

app.get('/api/fundaciones-lista', (req, res) => {
    const query = `
        SELECT f.id_fundacion, f.Nombre_Comercial, f.Nombre_Legal, f.Correo_fundacion
        FROM fundacion f
        JOIN usuarios u ON f.Correo_fundacion = u.correo_usuario
        WHERE u.estado_aprobacion = 'aprobado' OR u.estado_aprobacion = 'pendiente'
    `;
    db.query(query, (err, resultados) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        res.json(resultados);
    });
});

// ==========================================
// MÓDULO PERFIL Y EDICIÓN DE FUNDACIÓN
// ==========================================
app.get('/api/obtener-fundacion', (req, res) => {
    const { correo } = req.query;

    if (!correo) {
        return res.status(400).json({ error: "Se requiere el correo de la fundación." });
    }

    const query = `
        SELECT f.*, u.nombre_usuario
        FROM fundacion f
        LEFT JOIN usuarios u ON LOWER(TRIM(f.Correo_fundacion)) = LOWER(TRIM(u.correo_usuario))
        WHERE LOWER(TRIM(f.Correo_fundacion)) = LOWER(TRIM(?))
    `;

    db.query(query, [correo], (err, results) => {
        if (err) {
            console.error("❌ Error al obtener la fundación:", err.message);
            return res.status(500).json({ error: "Error en el servidor al consultar la fundación." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "No se encontró un perfil de fundación asociado a este correo." });
        }

        res.json(results[0]);
    });
});

app.put('/api/actualizar-fundacion', express.json({ limit: '50mb' }), express.urlencoded({ limit: '50mb', extended: true }), (req, res) => {
    const {
        correo_fundacion,
        nombre_comercial,
        descripcion_mision,
        descripcion_vision,
        programas_proyectos,
        telefono_fundacion,
        instagram,
        facebook,
        tiktok,
        pagina_web,
        foto_portada,
        pfp_fundacion
    } = req.body;

    if (!correo_fundacion) {
        return res.status(400).json({ exito: false, mensaje: "El correo es obligatorio." });
    }

    let campos = [
        "Nombre_Comercial = ?",
        "Descripcion_mision = ?",
        "Descripcion_vision = ?",
        "Programas_Proyectos_Actuales = ?",
        "Telefono_fundacion = ?",
        "Instagram = ?",
        "Facebook = ?",
        "TikTok = ?",
        "Pagina_web = ?"
    ];

    let valores = [
        nombre_comercial || '',
        descripcion_mision || '',
        descripcion_vision || '',
        programas_proyectos || '',
        telefono_fundacion || '',
        instagram || '',
        facebook || '',
        tiktok || '',
        pagina_web || ''
    ];

    if (foto_portada && foto_portada.startsWith('data:image')) {
        campos.push("Foto_Portada = ?");
        valores.push(foto_portada);
    }

    if (pfp_fundacion && pfp_fundacion.startsWith('data:image')) {
        campos.push("PFP_Fundacion = ?");
        valores.push(pfp_fundacion);
    }

    const query = `UPDATE fundacion SET ${campos.join(', ')} WHERE LOWER(TRIM(Correo_fundacion)) = LOWER(TRIM(?))`;
    valores.push(correo_fundacion);

    db.query(query, valores, (err, resultado) => {
        if (err) {
            console.error("❌ Error exacto en MySQL al actualizar la fundación:", err.sqlMessage || err.message);
            return res.status(500).json({ exito: false, mensaje: "Error en el servidor al actualizar la base de datos: " + (err.sqlMessage || err.message) });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ exito: false, mensaje: "No se encontró ninguna fundación registrada con el correo: " + correo_fundacion });
        }

        res.json({ exito: true, mensaje: "Perfil actualizado con éxito" });
    });
});

// ==========================================
// MÓDULO DE CREACIÓN Y GESTIÓN DE EVENTOS
// ==========================================
app.post('/api/crear-evento', (req, res) => {
    const {
        nombre_evento,
        ubicacion,
        lugar,
        fecha_hora,
        detalles_adicionales,
        correo_fundacion
    } = req.body;

    if (!nombre_evento || !lugar || !fecha_hora || !correo_fundacion) {
        return res.status(400).json({ error: "Faltan campos obligatorios para registrar el evento." });
    }

    db.query("SELECT id_fundacion FROM fundacion WHERE LOWER(TRIM(Correo_fundacion)) = LOWER(TRIM(?))", [correo_fundacion], (errF, resFund) => {
        if (errF || resFund.length === 0) {
            return res.status(404).json({ error: "No se encontró la fundación asociada a este correo." });
        }

        const id_fundacion = resFund[0].id_fundacion;

        const queryEvento = `
            INSERT INTO eventos (id_fundacion, nombre_evento, ubicacion, lugar, fecha_hora, detalles_adicionales)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(queryEvento, [
            id_fundacion,
            nombre_evento,
            ubicacion || 'Medellín',
            lugar,
            fecha_hora,
            detalles_adicionales || ''
        ], (err, resultado) => {
            if (err) {
                console.error("❌ Error al guardar el evento en MySQL:", err.sqlMessage || err.message);
                return res.status(500).json({ error: "Error en el servidor al guardar el evento: " + (err.sqlMessage || err.message) });
            }

            const idEventoGenerado = resultado.insertId;

            const queryPub = `INSERT INTO publicaciones (id_evento) VALUES (?)`;
            db.query(queryPub, [idEventoGenerado], (errPub) => {
                if (errPub) {
                    console.error("⚠️ Advertencia: El evento se creó pero falló en publicaciones:", errPub.message);
                }

                const mensajeNotif = `¡Nueva fundación organizó el evento '${nombre_evento}'!`;
                const queryUsuariosNormales = `SELECT id_usuarios FROM usuarios WHERE tipo_usuario = 'usuario' OR tipo_usuario IS NULL`;
               
                db.query(queryUsuariosNormales, (errU, usuarios) => {
                    if (!errU && usuarios && usuarios.length > 0) {
                        db.query("SELECT id_usuarios FROM usuarios WHERE correo_usuario = ?", [correo_fundacion], (errUsr, resUsr) => {
                            const idOrigen = (resUsr && resUsr.length > 0) ? resUsr[0].id_usuarios : 1;

                            usuarios.forEach(u => {
                                db.query(
                                    "INSERT INTO notificaciones (id_usuario_destino, id_usuario_origen, tipo, mensaje) VALUES (?, ?, 'nuevo_evento', ?)",
                                    [u.id_usuarios, idOrigen, mensajeNotif]
                                );
                            });
                        });
                    }
                });

                res.status(201).json({ mensaje: "¡Evento publicado con éxito y notificaciones enviadas!", id_evento: idEventoGenerado });
            });
        });
    });
});

app.get('/api/eventos', (req, res) => {
    const query = `
        SELECT e.*, f.Nombre_Comercial AS entidad_organizadora, f.PFP_Fundacion AS foto_fundacion
        FROM eventos e
        LEFT JOIN fundacion f ON e.id_fundacion = f.id_fundacion
        ORDER BY e.id_evento DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error al obtener eventos:", err.message);
            return res.status(500).json({ error: "Error al obtener los eventos." });
        }
        res.json(results);
    });
});

app.put('/api/eventos/:id', (req, res) => {
    const idEvento = req.params.id;
    const {
        nombre_evento,
        lugar,
        ubicacion,
        fecha_hora,
        detalles_adicionales,
        correo_fundacion
    } = req.body;

    if (!nombre_evento || !lugar || !fecha_hora) {
        return res.status(400).json({ error: "Faltan campos obligatorios para actualizar el evento." });
    }

    db.query("SELECT id_fundacion FROM fundacion WHERE LOWER(TRIM(Correo_fundacion)) = LOWER(TRIM(?))", [correo_fundacion], (errF, resFund) => {
        if (errF || resFund.length === 0) {
            return res.status(404).json({ error: "No se encontró la fundación asociada." });
        }

        const id_fundacion = resFund[0].id_fundacion;

        const queryUpdate = `
            UPDATE eventos
            SET nombre_evento = ?, lugar = ?, ubicacion = ?, fecha_hora = ?, detalles_adicionales = ?
            WHERE id_evento = ? AND id_fundacion = ?
        `;

        db.query(queryUpdate, [
            nombre_evento,
            lugar,
            ubicacion || 'Medellín',
            fecha_hora,
            detalles_adicionales || '',
            idEvento,
            id_fundacion
        ], (err, resultado) => {
            if (err) {
                console.error("❌ Error al actualizar el evento en MySQL:", err.message);
                return res.status(500).json({ error: "Error en el servidor al actualizar el evento." });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ error: "No se encontró el evento o no tienes permisos para editarlo." });
            }

            res.json({ mensaje: "¡Evento actualizado con éxito!" });
        });
    });
});

app.get('/api/novedades', (req, res) => {
    const query = `
        SELECT
            p.id_publicacion,
            'reporte' AS tipo_publicacion,
            r.id_reporte AS id_origen,
            r.Descripcion AS descripcion,
            r.Ubicacion AS ubicacion,
            r.img_reporte AS imagen,
            r.Fecha_reporte AS fecha,
            tr.Nombre_tipo_reporte AS subtitulo,
            u.nombre_usuario AS autor
        FROM publicaciones p
        INNER JOIN reportes r ON p.id_reporte = r.id_reporte
        INNER JOIN usuarios u ON r.id_usuarios = u.id_usuarios
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
       
        UNION ALL
       
        SELECT
            p.id_publicacion,
            'adopcion' AS tipo_publicacion,
            pa.id_publicaciones_adopcion AS id_origen,
            a.descripcion_animal AS descripcion,
            CONCAT(a.ciudad, ', ', a.barrio) AS ubicacion,
            a.fotos_animal AS imagen,
            NOW() AS fecha,
            CONCAT('Adopción: ', a.nombre_animal) AS subtitulo,
            u.nombre_usuario AS autor
        FROM publicaciones p
        INNER JOIN publicaciones_adopcion pa ON p.id_publicaciones_adopcion = pa.id_publicaciones_adopcion
        INNER JOIN animal a ON pa.id_animal = a.id_animal
        INNER JOIN usuarios u ON pa.id_usuarios = u.id_usuarios

        UNION ALL

        SELECT
            p.id_publicacion,
            'evento' AS tipo_publicacion,
            e.id_evento AS id_origen,
            e.detalles_adicionales AS descripcion,
            e.ubicacion AS ubicacion,
            NULL AS imagen,
            e.fecha_hora AS fecha,
            CONCAT('Evento: ', e.nombre_evento) AS subtitulo,
            f.Nombre_Comercial AS autor
        FROM publicaciones p
        INNER JOIN eventos e ON p.id_evento = e.id_evento
        INNER JOIN fundacion f ON e.id_fundacion = f.id_fundacion

        ORDER BY id_publicacion DESC
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("❌ Error al obtener las novedades globales:", err.message);
            return res.status(500).json({ error: "Error en el servidor al cargar novedades" });
        }
        res.json(rows);
    });
});

// ==========================================
// MÓDULO DE SOPORTE TÉCNICO (REPORTE DE ERRORES)
// ==========================================
const uploadSoporte = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.post('/api/enviar-reporte-error', uploadSoporte.single('imagen_error'), (req, res) => {
    try {
        const { lugar_error, descripcion, nombre_usuario, correo_usuario } = req.body;

        if (!descripcion) {
            return res.status(400).json({ exito: false, error: "La descripción del error es requerida." });
        }

        return res.status(200).json({
            exito: true,
            mensaje: "Reporte de error recibido y registrado con éxito."
        });

    } catch (error) {
        console.error("❌ Error al procesar el reporte técnico:", error);
        return res.status(500).json({
            exito: false,
            error: "Hubo un problema al procesar el reporte de error en el servidor."
        });
    }
});

// 1. Registrar una donación nueva (desde el usuario) y notificar dentro de la app a la fundación
app.post('/api/crear-donacion', (req, res) => {
    const { correo_usuario, id_fundacion, tipo_donacion, descripcion_donacion } = req.body;

    if (!correo_usuario || !id_fundacion || !tipo_donacion) {
        return res.status(400).json({ error: "Faltan datos obligatorios para registrar la donación." });
    }

    db.query("SELECT id_usuarios, nombre_usuario FROM usuarios WHERE LOWER(TRIM(correo_usuario)) = LOWER(TRIM(?))", [correo_usuario], (err, userRes) => {
        if (err || userRes.length === 0) {
            return res.status(404).json({ error: "Usuario donante no encontrado." });
        }

        const id_usuario_donante = userRes[0].id_usuarios;
        const nombreDonante = userRes[0].nombre_usuario;

        const queryInsert = `
            INSERT INTO donaciones (id_usuario, id_fundacion, tipo_donacion, descripcion_donacion, estado)
            VALUES (?, ?, ?, ?, 'pendiente')
        `;

        db.query(queryInsert, [id_usuario_donante, id_fundacion, tipo_donacion, descripcion_donacion || ''], (errInsert, result) => {
            if (errInsert) {
                console.error("❌ Error al registrar donación en BD:", errInsert.message);
                return res.status(500).json({ error: "Error en el servidor al guardar la donación." });
            }

            // Búsqueda directa y blindada del id de usuario de la fundación
            const queryUsuarioFundacion = `
                SELECT id_usuarios 
                FROM usuarios 
                WHERE LOWER(TRIM(correo_usuario)) = (
                    SELECT LOWER(TRIM(Correo_fundacion)) 
                    FROM fundacion 
                    WHERE id_fundacion = ?
                )
            `;

            db.query(queryUsuarioFundacion, [id_fundacion], (errF, fundRes) => {
                if (errF || fundRes.length === 0) {
                    console.error("⚠️ Donación guardada, pero no se encontró la cuenta de usuario de la fundación ID:", id_fundacion);
                } else {
                    const idDestinoFundacion = fundRes[0].id_usuarios;
                    const mensajeNotif = `@${nombreDonante} ha realizado una nueva donación de (${tipo_donacion}). ¡Ingresa a tu panel para gestionarla!`;

                    const queryNotif = `
                        INSERT INTO notificaciones (id_usuario_destino, id_usuario_origen, tipo, mensaje)
                        VALUES (?, ?, 'nueva_donacion', ?)
                    `;

                    db.query(queryNotif, [idDestinoFundacion, id_usuario_donante, mensajeNotif], (errN) => {
                        if (errN) {
                            console.error("❌ Error al insertar notificación interna:", errN.message);
                        } else {
                            console.log("✅ ¡Notificación de donación guardada con éxito en la cuenta de la fundación!");
                        }
                    });
                }
            });

            res.status(201).json({ mensaje: "¡Donación registrada con éxito!", id_donacion: result.insertId });
        });
    });
});
// Endpoint blindado para notificaciones (compatible con adoptantes, donaciones y eventos)
app.get('/api/notificaciones/:correo', (req, res) => {
    const correoUsuario = req.params.correo;

    if (!correoUsuario) {
        return res.status(400).json({ error: "El correo es requerido." });
    }

    const sql = `
        SELECT 
            n.id_notificacion,
            n.id_usuario_destino,
            n.id_usuario_origen,
            n.tipo,
            n.mensaje,
            n.leida,
            n.fecha_creacion,
            n.fecha_creacion AS fecha_notificacion,
            COALESCE(u_orig.nombre_usuario, 'Sistema ARCA') AS origen_nombre,
            u_orig.foto_perfil AS origen_foto,
            s.id_solicitud,
            s.estado AS estado_solicitud
        FROM notificaciones n
        INNER JOIN usuarios u_dest ON n.id_usuario_destino = u_dest.id_usuarios
        LEFT JOIN usuarios u_orig ON n.id_usuario_origen = u_orig.id_usuarios
        LEFT JOIN solicitudes_adoptante s ON (
            n.tipo = 'solicitud_adoptante' 
            AND s.id_solicitante = n.id_usuario_origen 
            AND s.id_propietario = n.id_usuario_destino
        )
        WHERE LOWER(TRIM(u_dest.correo_usuario)) = LOWER(TRIM(?))
        ORDER BY n.id_notificacion DESC
    `;

    db.query(sql, [correoUsuario], (err, results) => {
        if (err) {
            console.error("❌ Error al obtener notificaciones:", err.message);
            return res.status(500).json({ error: "Error en el servidor al obtener notificaciones: " + err.message });
        }
        res.json(results);
    });
});
// 2. Obtener las donaciones de una fundación
app.get('/api/donaciones/fundacion', (req, res) => {
    const { correo_fundacion, estado } = req.query;

    if (!correo_fundacion) {
        return res.status(400).json({ error: "Se requiere el correo de la fundación." });
    }

    db.query("SELECT id_fundacion FROM fundacion WHERE LOWER(TRIM(Correo_fundacion)) = LOWER(TRIM(?))", [correo_fundacion], (errF, fundRes) => {
        if (errF || fundRes.length === 0) {
            return res.status(404).json({ error: "Fundación no encontrada." });
        }

        const id_fundacion = fundRes[0].id_fundacion;

        let query = `
            SELECT d.*, u.nombre_usuario AS nombre_donante, u.foto_perfil AS foto_donante, u.Telefono_usuario AS telefono_donante
            FROM donaciones d
            JOIN usuarios u ON d.id_usuario = u.id_usuarios
            WHERE d.id_fundacion = ?
        `;
        let params = [id_fundacion];

        if (estado && estado !== 'todas') {
            query += ` AND d.estado = ?`;
            params.push(estado);
        }

        query += ` ORDER BY d.fecha_donacion DESC`;

        db.query(query, params, (errDon, donaciones) => {
            if (errDon) {
                console.error("❌ Error al obtener donaciones:", errDon.message);
                return res.status(500).json({ error: "Error al consultar las donaciones." });
            }

            res.json(donaciones);
        });
    });
});

// 3. Actualizar el estado de la donación
app.put('/api/donaciones/:id/estado', (req, res) => {
    const idDonacion = req.params.id;
    const { estado } = req.body;

    if (!estado) {
        return res.status(400).json({ error: "El estado es requerido." });
    }

    const query = "UPDATE donaciones SET estado = ? WHERE id_donacion = ?";
    db.query(query, [estado, idDonacion], (err, result) => {
        if (err || result.affectedRows === 0) {
            return res.status(500).json({ error: "Error al actualizar el estado de la donación." });
        }

        res.json({ mensaje: "Estado de la donación actualizado con éxito." });
    });
});

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});