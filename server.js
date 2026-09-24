require('dotenv').config(); 
const mysql = require('mysql2'); 
const express = require('express'); 
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./clave-firebase.json');

initializeApp({
    credential: cert(serviceAccount)
});

const app = express();

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// ==========================================
// ARCHIVOS ESTÁTICOS (¡ESTO ES LO QUE FALTABA!)
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

// Conexión explícita con manejo detallado
db.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos MySQL:', err);
        return;
    }
    console.log('✅ Conectado exitosamente a la base de datos MySQL en Aiven!');
});

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'arcaoficial0@gmail.com',
        pass: process.env.EMAIL_PASS || 'darl pzpf sjgz aggx'
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4 // <-- ¡Esta línea es la clave para evitar el error ENETUNREACH!
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

app.post('/enviar-codigo-otp', async (req, res) => {
    const { correo } = req.body;

    if (!correo) {
        return res.status(400).json({ error: "El correo es requerido." });
    }

    const codigo = Math.floor(1000 + Math.random() * 9000).toString();
    
    codigosOTP[correo] = {
        codigo: codigo,
        expira: Date.now() + 2 * 60 * 1000
    };

    try {
        await transporter.sendMail({
            from: '"ARCA Cuidamos su vida, protegemos su alegría" <arcaoficial0@gmail.com>',
            to: correo,
            subject: 'Código de verificación - ARCA',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fde8e8; border-radius: 10px;">
                    <h2 style="color: #e57373;">¡Hola! Te damos la bienvenida a ARCA</h2>
                    <p>Tu código de verificación para completar el registro es:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; color: #222;">${codigo}</h1>
                    <p style="font-size: 0.9em; color: #666;">Este código vence en 2 minutos. No lo compartas con nadie.</p>
                </div>
            `
        });

        res.json({ exito: true, mensaje: "Código enviado correctamente." });
    } catch (error) {
        console.error("Error enviando correo:", error);
        res.status(500).json({ error: "No se pudo enviar el correo de verificación." });
    }
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

    db.query(query, [fotoBase64 || null, correo_usuario], (err, result) => {
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

    // 1. Verificar si el nombre ya pertenece a OTRA persona diferente a ti
    const queryVerificar = "SELECT correo_usuario FROM usuarios WHERE nombre_usuario = ? AND correo_usuario != ?";
    db.query(queryVerificar, [nombreLimpio, correo_usuario], (err, existentes) => {
        if (err) {
            console.error("❌ Error en consulta de verificación:", err.message);
            return res.status(500).json({ error: "Error en el servidor." });
        }

        // Si hay resultados aquí, significa que SÍ lo tiene otra persona real
        if (existentes.length > 0) {
            return res.status(400).json({ mensaje: "El nombre de usuario ya está en uso por otra cuenta." });
        }

        // 2. Validar restricción de los 30 días
        db.query("SELECT ultimo_cambio_nombre FROM usuarios WHERE correo_usuario = ?", [correo_usuario], (err, filas) => {
            if (err) {
                console.error("❌ Error buscando usuario:", err.message);
                return res.status(500).json({ error: "Error en el servidor." });
            }

            if (filas.length === 0) {
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

            // 3. Ejecutar la actualización limpia
            const queryUpdate = "UPDATE usuarios SET nombre_usuario = ?, ultimo_cambio_nombre = ? WHERE correo_usuario = ?";
            db.query(queryUpdate, [nombreLimpio, fechaActual, correo_usuario], (errUpdate) => {
                if (errUpdate) {
                    console.error("❌ Error al actualizar en MySQL:", errUpdate.message);
                    return res.status(500).json({ error: "Error al guardar en la base de datos." });
                }

                return res.json({ mensaje: "¡Nombre actualizado con éxito!", nuevo_nombre: nombreLimpio });
            });
        });
    });
});
app.get('/validar-nombre-usuario', (req, res) => {
    const { nombre, correo_actual } = req.query;

    if (!nombre) {
        return res.status(400).json({ error: "Nombre requerido" });
    }

    const nombreLimpio = nombre.trim();

    // Si nos pasan un correo, excluimos al usuario actual. 
    // Si no nos pasan correo, buscamos de forma global por si acaso.
    let sql = 'SELECT id_usuarios, correo_usuario FROM usuarios WHERE nombre_usuario = ?';
    let params = [nombreLimpio];

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Si no existe nadie con ese nombre, está libre de una
        if (results.length === 0) {
            return res.json({ disponible: true });
        }

        // Si el único que tiene ese nombre eres tú misma (comparando el correo), ¡sí está disponible para ti!
        if (correo_actual && results.length === 1 && results[0].correo_usuario.toLowerCase() === correo_actual.trim().toLowerCase()) {
            return res.json({ disponible: true });
        }

        // De lo contrario, le pertenece a otra persona
        res.json({ disponible: false });
    });
});
app.post('/actualizar-telefono-usuario', (req, res) => {
    const { correo_usuario, nuevo_telefono } = req.body;

    if (!correo_usuario || !nuevo_telefono) {
        return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    const query = "UPDATE usuarios SET Telefono_usuario = ?, telefono_verificado = 0 WHERE correo_usuario = ?";
    db.query(query, [nuevo_telefono, correo_usuario], (err, result) => {
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
    db.query(query, [correo_usuario], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al verificar en la base de datos." });
        }
        res.json({ mensaje: "¡Número de celular verificado con éxito!" });
    });
});

// ==========================================
// REPORTES Y ESTADÍSTICAS
// ==========================================

app.post('/crear-reporte', (req, res) => {
    const { 
        id_tipo_reporte, 
        Descripcion, 
        Ubicacion, 
        telefono_contacto, 
        correo_contacto, 
        img_reporte,
        correo_usuario 
    } = req.body;

    if (!id_tipo_reporte || !Descripcion || !Ubicacion || !correo_usuario) {
        return res.status(400).json({ error: "Faltan campos obligatorios para el reporte." });
    }

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
                img_reporte || null,
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

            console.log("✅ Adoptante guardado/actualizado con éxito en id_usuarios:", id_usuarios);
            return res.json({ mensaje: "Perfil de adoptante guardado con éxito." });
        });
    });
});

// ==========================================
// GESTIÓN DE PUBLICACIONES Y GUARDADOS
// ==========================================

app.get('/api/mis-reportes', (req, res) => {
    const correoUsuario = req.query.correo;

    if (!correoUsuario) {
        return res.status(400).json({ error: "Se requiere el correo del usuario" });
    }

    const sql = `
        SELECT r.*, p.id_publicacion, tr.Nombre_tipo_reporte AS nombre_tipo_reporte
        FROM reportes r
        INNER JOIN usuarios u ON r.id_usuarios = u.id_usuarios
        LEFT JOIN publicaciones p ON r.id_reporte = p.id_reporte
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))
        ORDER BY r.Fecha_reporte DESC
    `;

    db.query(sql, [correoUsuario], (err, rows) => {
        if (err) {
            console.error("❌ Error al consultar los reportes:", err);
            return res.status(500).json({ error: 'Hubo un error al obtener las publicaciones' });
        }
        res.json(rows);
    });
});

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

        db.query(query, [id_usuarios, id_publicacion], (errInsert, result) => {
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
        SELECT r.*, p.id_publicacion, tr.Nombre_tipo_reporte AS nombre_tipo_reporte 
        FROM guardados g
        INNER JOIN usuarios u ON g.id_usuarios = u.id_usuarios
        INNER JOIN publicaciones p ON g.id_publicacion = p.id_publicacion
        INNER JOIN reportes r ON p.id_reporte = r.id_reporte
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))
        ORDER BY r.Fecha_reporte DESC
    `;

    db.query(query, [correo], (err, results) => {
        if (err) {
            console.error("❌ ERROR AL OBTENER GUARDADOS:", err.message);
            return res.status(500).json({ error: "Error al obtener las publicaciones guardadas" });
        }

        res.json(results);
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

    db.query(query, [correo, id_publicacion], (err, result) => {
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

app.get('/api/publicaciones-globales', (req, res) => {
    const sql = `
        SELECT r.*, p.id_publicacion, tr.Nombre_tipo_reporte AS nombre_tipo_reporte, u.nombre_usuario, u.foto_perfil 
        FROM reportes r
        INNER JOIN usuarios u ON r.id_usuarios = u.id_usuarios
        LEFT JOIN publicaciones p ON r.id_reporte = p.id_reporte
        LEFT JOIN tipo_reporte tr ON r.id_tipo_reporte = tr.id_tipo_reporte
        ORDER BY r.Fecha_reporte DESC
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error("❌ Error al obtener publicaciones globales:", err);
            return res.status(500).json({ error: 'Hubo un error al obtener las novedades' });
        }
        res.json(rows);
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

// GET: Obtener rol de usuario por correo
app.get('/api/obtener-rol', (req, res) => {
    const { correo } = req.query;

    if (!correo) {
        return res.status(400).json({ error: "El correo es requerido." });
    }

    const query = `
        SELECT u.id_usuarios, u.nombre_usuario, u.correo_usuario, r.nombre_rol, u.id_rol
        FROM usuarios u
        LEFT JOIN roles r ON u.id_rol = r.id_rol
        WHERE LOWER(TRIM(u.correo_usuario)) = LOWER(TRIM(?))
    `;

    db.query(query, [correo], (err, results) => {
        if (err) {
            console.error("❌ Error al consultar rol de usuario:", err);
            return res.status(500).json({ error: "Error interno del servidor." });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        res.json({
            id_usuario: results[0].id_usuarios,
            nombre_usuario: results[0].nombre_usuario,
            correo: results[0].correo_usuario,
            id_rol: results[0].id_rol,
            rol: results[0].nombre_rol || 'Usuario' // Rol por defecto si es null
        });
    });
});

