CREATE TABLE `adoptante` (
  `id_adoptante` int(11) NOT NULL,
  `id_tipo_vivienda` int(11) DEFAULT NULL,
  `vivienda_propia` tinyint(1) DEFAULT NULL,
  `vivienda_arrendada` tinyint(1) DEFAULT NULL,
  `mascotas_permitidas` tinyint(1) DEFAULT NULL,
  `hay_niños_en_casa` tinyint(1) DEFAULT NULL,
  `tiene_otras_mascotas` tinyint(1) DEFAULT NULL,
  `prosupuesto_mensual` varchar(100) DEFAULT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) NOT NULL,
  `ocupacion` varchar(100) NOT NULL,
  `con_quien_vives` varchar(100) DEFAULT NULL,
  `horas_ausente` int(11) NOT NULL,
  `cuidador` text DEFAULT NULL,
  `motivacion` varchar(200) DEFAULT NULL,
  `id_usuarios` int(11) NOT NULL,
  PRIMARY KEY (`id_adoptante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `adoptante`
--

INSERT INTO `adoptante` (`id_adoptante`, `id_tipo_vivienda`, `vivienda_propia`, `vivienda_arrendada`, `mascotas_permitidas`, `hay_niños_en_casa`, `tiene_otras_mascotas`, `prosupuesto_mensual`, `nombre_completo`, `ubicacion`, `fecha_nacimiento`, `telefono`, `correo`, `ocupacion`, `con_quien_vives`, `horas_ausente`, `cuidador`, `motivacion`, `id_usuarios`) VALUES
(4, 5, 0, 1, 1, 0, 1, '120000', 'Dulce Benítez', 'Medellín, Robledo', '2008-02-15', '3017340402', 'dulcemariabenitezbenitez@gmail.com', 'Manicurista', 'Mi pareja Anthony', 3, 'Mi pareja o mi mamá', 'Mi pareja y yo somos esteriles jeje entonces almenos queremos un perrijo', 14);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `animal`
--

CREATE TABLE `animal` (
  `id_animal` int(11) NOT NULL,
  `nombre_animal` varchar(50) DEFAULT NULL,
  `id_especie` int(11) DEFAULT NULL,
  `otro_especie` varchar(50) DEFAULT NULL,
  `id_estado` int(11) DEFAULT NULL,
  `sexo_animal` tinyint(1) DEFAULT NULL,
  `fecha_nacimiento_animal_aprox` date DEFAULT NULL,
  `id_raza` int(11) DEFAULT NULL,
  `otro_raza` varchar(50) DEFAULT NULL,
  `id_tamaño` int(11) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `ciudad` varchar(50) DEFAULT NULL,
  `barrio` varchar(50) DEFAULT NULL,
  `foto_animal` text DEFAULT NULL,
  `id_fundacion` int(11) DEFAULT NULL,
  `id_usuarios` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_animal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `animales_aplicables`
--

CREATE TABLE `animales_aplicables` (
  `id_animales_aplicables` int(11) NOT NULL,
  `animales_aplicables` text DEFAULT NULL,
  PRIMARY KEY (`id_animales_aplicables`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `animales_aplicables`
--

INSERT INTO `animales_aplicables` (`id_animales_aplicables`, `animales_aplicables`) VALUES
(1, 'Gatos'),
(2, 'Perros'),
(3, 'Ambos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cargo`
--

CREATE TABLE `cargo` (
  `id_cargo` int(11) NOT NULL,
  `nombre_cargo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_cargo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cargo`
--

INSERT INTO `cargo` (`id_cargo`, `nombre_cargo`) VALUES
(1, 'Director ejecutivo'),
(2, 'Presidente'),
(3, 'Gerente general'),
(4, 'Otro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `documentacion`
--

CREATE TABLE `documentacion` (
  `id_documentacion` int(11) NOT NULL,
  `certificado_existencia` tinyblob NOT NULL,
  `estatuto` tinyblob NOT NULL,
  `estado_financiero` tinyblob NOT NULL,
  `registro_oficial` tinyblob NOT NULL,
  `id_fundacion` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_documentacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `enfoque_principal`
--

CREATE TABLE `enfoque_principal` (
  `id_enfoque_principal` int(11) NOT NULL,
  `Nombre_enfoque_principal` tinytext DEFAULT NULL,
  PRIMARY KEY (`id_enfoque_principal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `enfoque_principal`
--

INSERT INTO `enfoque_principal` (`id_enfoque_principal`, `Nombre_enfoque_principal`) VALUES
(1, 'Rescate/Adopción'),
(2, 'Esterilizacion y control poblacional'),
(3, 'Rehabilitacion de animales maltratados'),
(4, 'Otro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especies`
--

CREATE TABLE `especies` (
  `id_especie` int(11) NOT NULL,
  `nombre_especie` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_especie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `especies`
--

INSERT INTO `especies` (`id_especie`, `nombre_especie`) VALUES
(1, 'perro'),
(2, 'gato'),
(3, 'conejo'),
(4, 'ave'),
(5, 'Otro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_animal`
--

CREATE TABLE `estado_animal` (
  `id_estado` int(11) NOT NULL,
  `tipo_estado` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_animal`
--

INSERT INTO `estado_animal` (`id_estado`, `tipo_estado`) VALUES
(1, 'Reportado'),
(2, 'En adopcion'),
(3, 'Adoptado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evento`
--

CREATE TABLE `evento` (
  `id_evento` int(11) NOT NULL,
  `id_fundacion` int(11) DEFAULT NULL,
  `id_tipo_evento` int(11) DEFAULT NULL,
  `id_animales_aplicables` int(11) DEFAULT NULL,
  `nombre_evento` varchar(200) NOT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `lugar` varchar(200) NOT NULL,
  `fecha_hora` date DEFAULT NULL,
  `detalles_adicionales` text NOT NULL,
  PRIMARY KEY (`id_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fundacion`
--

CREATE TABLE `fundacion` (
  `id_fundacion` int(11) NOT NULL,
  `id_documentacion` int(11) DEFAULT NULL,
  `Nombre_Legal` varchar(100) NOT NULL,
  `Nombre_Comercial` varchar(100) NOT NULL,
  `id_representante` int(11) DEFAULT NULL,
  `Nit_Rut` int(20) NOT NULL,
  `Pais` varchar(50) NOT NULL,
  `Ciudad` varchar(50) NOT NULL,
  `Direccion` varchar(200) NOT NULL,
  `Telefono_fundacion` varchar(20) NOT NULL,
  `Correo_fundacion` varchar(100) NOT NULL,
  `Pagina_web` text NOT NULL,
  `Fecha_registro` date DEFAULT NULL,
  `Descripcion_mision` text NOT NULL,
  `Descripcion_vision` text NOT NULL,
  `PFP_Fundacion` text NOT NULL,
  `Foto_Portada` text NOT NULL,
  `Programas_Proyectos_Actuales` text NOT NULL,
  `id_enfoque_principal` int(11) DEFAULT NULL,
  `enfoque_otro` varchar(100) DEFAULT NULL,
  `id_tipo_donacion` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_fundacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `guardados`
--

CREATE TABLE `guardados` (
  `id_guardado` int(11) NOT NULL,
  `id_usuarios` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `fecha_guardado` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_guardado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `guardados`
--

INSERT INTO `guardados` (`id_guardado`, `id_usuarios`, `id_publicacion`, `fecha_guardado`) VALUES
(28, 14, 32, '2026-09-12 20:07:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicaciones`
--

CREATE TABLE `publicaciones` (
  `id_publicacion` int(11) NOT NULL,
  `id_reporte` int(11) DEFAULT NULL,
  `id_animal` int(11) DEFAULT NULL,
  `id_publicaciones_adopcion` int(11) DEFAULT NULL,
  `id_evento` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_publicacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `publicaciones`
--

INSERT INTO `publicaciones` (`id_publicacion`, `id_reporte`, `id_animal`, `id_publicaciones_adopcion`, `id_evento`) VALUES
(32, 33, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicaciones_adopcion`
--

CREATE TABLE `publicaciones_adopcion` (
  `id_publicaciones_adopcion` int(11) NOT NULL,
  `id_animal` int(11) DEFAULT NULL,
  `id_usuarios` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_publicaciones_adopcion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `razas`
--

CREATE TABLE `razas` (
  `id_raza` int(11) NOT NULL,
  `nombre_raza` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_raza`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `razas`
--

INSERT INTO `razas` (`id_raza`, `nombre_raza`) VALUES
(1, 'Criollo'),
(2, 'Pitbull'),
(3, 'Golden'),
(4, 'Labrador'),
(5, 'Angoro'),
(6, 'Esfinge'),
(7, 'Canario'),
(8, 'Perico'),
(9, 'Otro'),
(10, 'No sabe');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id_reporte` int(11) NOT NULL,
  `id_tipo_reporte` int(11) DEFAULT NULL,
  `otro_reporte` varchar(100) DEFAULT NULL,
  `Descripcion` text DEFAULT NULL,
  `Ubicacion` varchar(100) NOT NULL,
  `telefono_contacto` varchar(20) DEFAULT NULL,
  `correo_contacto` varchar(100) DEFAULT NULL,
  `Fecha_reporte` date DEFAULT NULL,
  `id_fundacion` int(10) DEFAULT NULL,
  `img_reporte` text DEFAULT NULL,
  `id_usuarios` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_reporte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reportes`
--

INSERT INTO `reportes` (`id_reporte`, `id_tipo_reporte`, `otro_reporte`, `Descripcion`, `Ubicacion`, `telefono_contacto`, `correo_contacto`, `Fecha_reporte`, `id_fundacion`, `img_reporte`, `id_usuarios`) VALUES
(33, 2, NULL, 'hay un perrito blanco al lado de una iglesia siempre en el barrio este, esta muy enfermito, alguien deberia ayudarlo, descarados egh', 'Ubicación GPS: 6.280265981271742, -75.61926025464577', '3017340402', 'dulcemariabenitezbenitez@gmail.com', '2026-09-12', NULL, 'data:image/jpeg;base64,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', 14);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `representante_legal`
--

CREATE TABLE `representante_legal` (
  `id_representante` int(11) NOT NULL,
  `nombre_completo` int(50) DEFAULT NULL,
  `documento` tinyint(1) DEFAULT NULL,
  `id_cargo` int(50) DEFAULT NULL,
  `id_tipo_donacion` int(11) DEFAULT NULL,
  `otro_cargo` int(11) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(50) NOT NULL,
  `id_fundacion` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_representante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tamaño`
--

CREATE TABLE `tamaño` (
  `id_tamaño` int(11) NOT NULL,
  `tipo_tamaño` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_tamaño`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tamaño`
--

INSERT INTO `tamaño` (`id_tamaño`, `tipo_tamaño`) VALUES
(1, 'Pequeño'),
(2, 'Mediano'),
(3, 'Grande');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_donacion`
--

CREATE TABLE `tipo_donacion` (
  `id_tipo_donacion` int(11) NOT NULL,
  `nombre_tipo_donacion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_donacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_donacion`
--

INSERT INTO `tipo_donacion` (`id_tipo_donacion`, `nombre_tipo_donacion`) VALUES
(1, 'Transferencia'),
(2, 'Efectivo'),
(3, 'Jueguetes'),
(4, 'Comida'),
(5, 'Ropa'),
(6, 'Otros');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_evento`
--

CREATE TABLE `tipo_evento` (
  `id_tipo_evento` int(11) NOT NULL,
  `tipo_evento` text DEFAULT NULL,
  PRIMARY KEY (`id_tipo_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_evento`
--

INSERT INTO `tipo_evento` (`id_tipo_evento`, `tipo_evento`) VALUES
(1, 'Vacunación'),
(2, 'Esterilización'),
(3, 'Otro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_reporte`
--

CREATE TABLE `tipo_reporte` (
  `id_tipo_reporte` int(11) NOT NULL,
  `Nombre_tipo_reporte` text DEFAULT NULL,
  PRIMARY KEY (`id_tipo_reporte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_reporte`
--

INSERT INTO `tipo_reporte` (`id_tipo_reporte`, `Nombre_tipo_reporte`) VALUES
(1, 'Animal en situacion de calle'),
(2, 'Animal en peligro'),
(3, 'Animal herido'),
(4, 'Maltrato animal'),
(5, 'Otro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_vivienda`
--

CREATE TABLE `tipo_vivienda` (
  `id_tipo_vivienda` int(11) NOT NULL,
  `tipo_vivienda` text DEFAULT NULL,
  PRIMARY KEY (`id_tipo_vivienda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_vivienda`
--

INSERT INTO `tipo_vivienda` (`id_tipo_vivienda`, `tipo_vivienda`) VALUES
(5, 'Casa'),
(6, 'Apartamento'),
(7, 'Finca');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuarios` int(11) NOT NULL,
  `nombre_usuario` varchar(20) NOT NULL,
  `Fecha_nacimiento` date DEFAULT NULL,
  `telefono_usuario` varchar(20) DEFAULT NULL,
  `correo_usuario` varchar(50) NOT NULL,
  `foto_perfil` longtext DEFAULT NULL,
  `ultimo_cambio_nombre` datetime DEFAULT NULL,
  `telefono_verificado` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id_usuarios`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuarios`, `nombre_usuario`, `Fecha_nacimiento`, `telefono_usuario`, `correo_usuario`, `foto_perfil`, `ultimo_cambio_nombre`, `telefono_verificado`) VALUES
(14, 'Dulce Benítez', '2008-02-15', '3017340402', 'dulcemariabenitezbenitez@gmail.com', 'data:image/jpeg;base64,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', NULL, 0),
(15, 'Mariana Pérez', '2008-03-19', '3025678932', 'littlerockstar1522@gmail.com', NULL, NULL, 0);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `adoptante`
--
ALTER TABLE `adoptante`
    ADD UNIQUE KEY `unique_usuario` (`id_usuarios`),
  ADD UNIQUE KEY `unique_id_usuarios` (`id_usuarios`),
  ADD KEY `id_tipo_vivienda` (`id_tipo_vivienda`),
  ADD KEY `user_adoptante_fk` (`id_usuarios`);

--
-- Indices de la tabla `animal`
--
ALTER TABLE `animal`
    ADD KEY `id_especie` (`id_especie`),
  ADD KEY `id_estado` (`id_estado`),
  ADD KEY `id_tamaño` (`id_tamaño`),
  ADD KEY `id_raza` (`id_raza`),
  ADD KEY `fk_animal_fundacion` (`id_fundacion`),
  ADD KEY `user_animal_fk` (`id_usuarios`);

--
-- Indices de la tabla `animales_aplicables`
--

--
-- Indices de la tabla `cargo`
--

--
-- Indices de la tabla `documentacion`
--
ALTER TABLE `documentacion`
    ADD KEY `fk_documentacion_fundacion` (`id_fundacion`);

--
-- Indices de la tabla `enfoque_principal`
--

--
-- Indices de la tabla `especies`
--

--
-- Indices de la tabla `estado_animal`
--

--
-- Indices de la tabla `evento`
--
ALTER TABLE `evento`
    ADD KEY `id_fundacion` (`id_fundacion`),
  ADD KEY `id_tipo_evento` (`id_tipo_evento`),
  ADD KEY `id_animales_aplicables` (`id_animales_aplicables`);

--
-- Indices de la tabla `fundacion`
--
ALTER TABLE `fundacion`
    ADD UNIQUE KEY `Nit_Rut` (`Nit_Rut`),
  ADD KEY `id_documentacion` (`id_documentacion`),
  ADD KEY `id_representante` (`id_representante`),
  ADD KEY `id_enfoque_principal` (`id_enfoque_principal`),
  ADD KEY `fk_tdonacion_fundacion` (`id_tipo_donacion`);

--
-- Indices de la tabla `guardados`
--
ALTER TABLE `guardados`
    ADD KEY `id_usuarios` (`id_usuarios`),
  ADD KEY `id_publicacion` (`id_publicacion`);

--
-- Indices de la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
    ADD KEY `id_reporte` (`id_reporte`),
  ADD KEY `fk_animal_publicaciones` (`id_animal`),
  ADD KEY `fk_publicaciones_adopcion_publicaciones` (`id_publicaciones_adopcion`),
  ADD KEY `fk_publicaciones_evento` (`id_evento`);

--
-- Indices de la tabla `publicaciones_adopcion`
--
ALTER TABLE `publicaciones_adopcion`
    ADD KEY `id_animal` (`id_animal`),
  ADD KEY `user_padopcion_fk` (`id_usuarios`);

--
-- Indices de la tabla `razas`
--

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
    ADD KEY `id_tipo_reporte` (`id_tipo_reporte`),
  ADD KEY `fk_reportes_fundacion` (`id_fundacion`),
  ADD KEY `user_reportes_fk` (`id_usuarios`);

--
-- Indices de la tabla `representante_legal`
--
ALTER TABLE `representante_legal`
    ADD KEY `id_cargo` (`id_cargo`),
  ADD KEY `fk_rlegal_fundacion` (`id_fundacion`);

--
-- Indices de la tabla `tamaño`
--

--
-- Indices de la tabla `tipo_donacion`
--

--
-- Indices de la tabla `tipo_evento`
--

--
-- Indices de la tabla `tipo_reporte`
--

--
-- Indices de la tabla `tipo_vivienda`
--

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
    ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `adoptante`
--
ALTER TABLE `adoptante`
  MODIFY `id_adoptante` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `guardados`
--
ALTER TABLE `guardados`
  MODIFY `id_guardado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  MODIFY `id_publicacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuarios` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `adoptante`
--
ALTER TABLE `adoptante`
  ADD CONSTRAINT `adoptante_ibfk_1` FOREIGN KEY (`id_tipo_vivienda`) REFERENCES `tipo_vivienda` (`id_tipo_vivienda`),
  ADD CONSTRAINT `fk_adoptante_usuario` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_adoptante_fk` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id_usuarios`);

--
-- Filtros para la tabla `animal`
--
ALTER TABLE `animal`
  ADD CONSTRAINT `animal_ibfk_2` FOREIGN KEY (`id_especie`) REFERENCES `especies` (`id_especie`),
  ADD CONSTRAINT `animal_ibfk_3` FOREIGN KEY (`id_estado`) REFERENCES `estado_animal` (`id_estado`),
  ADD CONSTRAINT `animal_ibfk_4` FOREIGN KEY (`id_tamaño`) REFERENCES `tamaño` (`id_tamaño`),
  ADD CONSTRAINT `animal_ibfk_5` FOREIGN KEY (`id_raza`) REFERENCES `razas` (`id_raza`),
  ADD CONSTRAINT `fk_animal_fundacion` FOREIGN KEY (`id_fundacion`) REFERENCES `fundacion` (`id_fundacion`),
  ADD CONSTRAINT `user_animal_fk` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id_usuarios`);

--
-- Filtros para la tabla `documentacion`
--
ALTER TABLE `documentacion`
  ADD CONSTRAINT `fk_documentacion_fundacion` FOREIGN KEY (`id_fundacion`) REFERENCES `fundacion` (`id_fundacion`);

--
-- Filtros para la tabla `evento`
--
ALTER TABLE `evento`
  ADD CONSTRAINT `evento_ibfk_1` FOREIGN KEY (`id_fundacion`) REFERENCES `fundacion` (`id_fundacion`),
  ADD CONSTRAINT `evento_ibfk_2` FOREIGN KEY (`id_tipo_evento`) REFERENCES `tipo_evento` (`id_tipo_evento`),
  ADD CONSTRAINT `evento_ibfk_3` FOREIGN KEY (`id_animales_aplicables`) REFERENCES `animales_aplicables` (`id_animales_aplicables`);

--
-- Filtros para la tabla `fundacion`
--
ALTER TABLE `fundacion`
  ADD CONSTRAINT `fk_tdonacion_fundacion` FOREIGN KEY (`id_tipo_donacion`) REFERENCES `tipo_donacion` (`id_tipo_donacion`),
  ADD CONSTRAINT `fundacion_ibfk_1` FOREIGN KEY (`id_documentacion`) REFERENCES `documentacion` (`id_documentacion`),
  ADD CONSTRAINT `fundacion_ibfk_2` FOREIGN KEY (`id_representante`) REFERENCES `representante_legal` (`id_representante`),
  ADD CONSTRAINT `fundacion_ibfk_3` FOREIGN KEY (`id_enfoque_principal`) REFERENCES `enfoque_principal` (`id_enfoque_principal`);

--
-- Filtros para la tabla `guardados`
--
ALTER TABLE `guardados`
  ADD CONSTRAINT `guardados_ibfk_1` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE CASCADE,
  ADD CONSTRAINT `guardados_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicaciones` (`id_publicacion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  ADD CONSTRAINT `fk_animal_publicaciones` FOREIGN KEY (`id_animal`) REFERENCES `animal` (`id_animal`),
  ADD CONSTRAINT `fk_publicaciones_adopcion_publicaciones` FOREIGN KEY (`id_publicaciones_adopcion`) REFERENCES `publicaciones_adopcion` (`id_publicaciones_adopcion`),
  ADD CONSTRAINT `fk_publicaciones_evento` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`),
  ADD CONSTRAINT `publicaciones_ibfk_1` FOREIGN KEY (`id_reporte`) REFERENCES `reportes` (`id_reporte`);

--
-- Filtros para la tabla `publicaciones_adopcion`
--
ALTER TABLE `publicaciones_adopcion`
  ADD CONSTRAINT `publicaciones_adopcion_ibfk_2` FOREIGN KEY (`id_animal`) REFERENCES `animal` (`id_animal`),
  ADD CONSTRAINT `user_padopcion_fk` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id_usuarios`);

--
-- Filtros para la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD CONSTRAINT `fk_reportes_fundacion` FOREIGN KEY (`id_fundacion`) REFERENCES `fundacion` (`id_fundacion`),
  ADD CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`id_tipo_reporte`) REFERENCES `tipo_reporte` (`id_tipo_reporte`),
  ADD CONSTRAINT `user_reportes_fk` FOREIGN KEY (`id_usuarios`) REFERENCES `usuarios` (`id_usuarios`);

--
-- Filtros para la tabla `representante_legal`
--
ALTER TABLE `representante_legal`
  ADD CONSTRAINT `fk_rlegal_fundacion` FOREIGN KEY (`id_fundacion`) REFERENCES `fundacion` (`id_fundacion`),
  ADD CONSTRAINT `representante_legal_ibfk_1` FOREIGN KEY (`id_cargo`) REFERENCES `cargo` (`id_cargo`);
COMMIT;

