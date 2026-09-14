-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-08-2026 a las 14:20:18
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `basearca`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `adoptante`
--

CREATE TABLE `adoptante` (
  `id_adoptante` int(11) NOT NULL,
  `id_tipo_vivienda` int(11) DEFAULT NULL,
  `vivienda_propia` tinyint(1) DEFAULT NULL,
  `vivienda_arrendada` tinyint(1) DEFAULT NULL,
  `mascotas_permitidas` tinyint(1) DEFAULT NULL,
  `hay_niños_en_casa` tinyint(1) DEFAULT NULL,
  `tiene_otras_mascotas` tinyint(1) DEFAULT NULL,
  `prosupuesto_mensual` tinyint(1) DEFAULT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `telefono` int(11) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `ocupacion` varchar(100) NOT NULL,
  `con_quien_vives` varchar(100) DEFAULT NULL,
  `horas_ausente` int(11) NOT NULL,
  `cuidador` text DEFAULT NULL,
  `motivacion` varchar(200) DEFAULT NULL,
  `id_usuarios` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `id_usuarios` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `animales_aplicables`
--

CREATE TABLE `animales_aplicables` (
  `id_animales_aplicables` int(11) NOT NULL,
  `animales_aplicables` text DEFAULT NULL
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
  `nombre_cargo` varchar(50) DEFAULT NULL
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
  `id_fundacion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `enfoque_principal`
--

CREATE TABLE `enfoque_principal` (
  `id_enfoque_principal` int(11) NOT NULL,
  `Nombre_enfoque_principal` tinytext DEFAULT NULL
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
  `nombre_especie` varchar(100) DEFAULT NULL
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
  `tipo_estado` varchar(100) DEFAULT NULL
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
  `detalles_adicionales` text NOT NULL
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
  `id_tipo_donacion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicaciones`
--

CREATE TABLE `publicaciones` (
  `id_publicacion` int(11) NOT NULL,
  `id_reporte` int(11) DEFAULT NULL,
  `id_animal` int(11) DEFAULT NULL,
  `id_publicaciones_adopcion` int(11) DEFAULT NULL,
  `id_evento` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicaciones_adopcion`
--

CREATE TABLE `publicaciones_adopcion` (
  `id_publicaciones_adopcion` int(11) NOT NULL,
  `id_animal` int(11) DEFAULT NULL,
  `id_usuarios` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `razas`
--

CREATE TABLE `razas` (
  `id_raza` int(11) NOT NULL,
  `nombre_raza` varchar(50) DEFAULT NULL
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
  `id_usuarios` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reportes`
--

INSERT INTO `reportes` (`id_reporte`, `id_tipo_reporte`, `otro_reporte`, `Descripcion`, `Ubicacion`, `telefono_contacto`, `correo_contacto`, `Fecha_reporte`, `id_fundacion`, `img_reporte`, `id_usuarios`) VALUES
(0, 1, NULL, 'ayuda', 'werdfghj', '3017340402', 'dulcemariabenitezbenitez@gmail.com', '2026-08-14', NULL, NULL, 7);

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
  `id_fundacion` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tamaño`
--

CREATE TABLE `tamaño` (
  `id_tamaño` int(11) NOT NULL,
  `tipo_tamaño` varchar(50) DEFAULT NULL
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
  `nombre_tipo_donacion` varchar(50) DEFAULT NULL
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
  `tipo_evento` text DEFAULT NULL
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
  `Nombre_tipo_reporte` text DEFAULT NULL
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
  `tipo_vivienda` text DEFAULT NULL
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
  `Telefono_usuario` varchar(15) NOT NULL,
  `correo_usuario` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuarios`, `nombre_usuario`, `Fecha_nacimiento`, `Telefono_usuario`, `correo_usuario`) VALUES
(7, 'Dulce Benítez', '2008-02-15', '3017340402', 'dulcemariabenitezbenitez@gmail.com');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `adoptante`
--
ALTER TABLE `adoptante`
  ADD PRIMARY KEY (`id_adoptante`),
  ADD KEY `id_tipo_vivienda` (`id_tipo_vivienda`),
  ADD KEY `user_adoptante_fk` (`id_usuarios`);

--
-- Indices de la tabla `animal`
--
ALTER TABLE `animal`
  ADD PRIMARY KEY (`id_animal`),
  ADD KEY `id_especie` (`id_especie`),
  ADD KEY `id_estado` (`id_estado`),
  ADD KEY `id_tamaño` (`id_tamaño`),
  ADD KEY `id_raza` (`id_raza`),
  ADD KEY `fk_animal_fundacion` (`id_fundacion`),
  ADD KEY `user_animal_fk` (`id_usuarios`);

--
-- Indices de la tabla `animales_aplicables`
--
ALTER TABLE `animales_aplicables`
  ADD PRIMARY KEY (`id_animales_aplicables`);

--
-- Indices de la tabla `cargo`
--
ALTER TABLE `cargo`
  ADD PRIMARY KEY (`id_cargo`);

--
-- Indices de la tabla `documentacion`
--
ALTER TABLE `documentacion`
  ADD PRIMARY KEY (`id_documentacion`),
  ADD KEY `fk_documentacion_fundacion` (`id_fundacion`);

--
-- Indices de la tabla `enfoque_principal`
--
ALTER TABLE `enfoque_principal`
  ADD PRIMARY KEY (`id_enfoque_principal`);

--
-- Indices de la tabla `especies`
--
ALTER TABLE `especies`
  ADD PRIMARY KEY (`id_especie`);

--
-- Indices de la tabla `estado_animal`
--
ALTER TABLE `estado_animal`
  ADD PRIMARY KEY (`id_estado`);

--
-- Indices de la tabla `evento`
--
ALTER TABLE `evento`
  ADD PRIMARY KEY (`id_evento`),
  ADD KEY `id_fundacion` (`id_fundacion`),
  ADD KEY `id_tipo_evento` (`id_tipo_evento`),
  ADD KEY `id_animales_aplicables` (`id_animales_aplicables`);

--
-- Indices de la tabla `fundacion`
--
ALTER TABLE `fundacion`
  ADD PRIMARY KEY (`id_fundacion`),
  ADD UNIQUE KEY `Nit_Rut` (`Nit_Rut`),
  ADD KEY `id_documentacion` (`id_documentacion`),
  ADD KEY `id_representante` (`id_representante`),
  ADD KEY `id_enfoque_principal` (`id_enfoque_principal`),
  ADD KEY `fk_tdonacion_fundacion` (`id_tipo_donacion`);

--
-- Indices de la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  ADD PRIMARY KEY (`id_publicacion`),
  ADD KEY `id_reporte` (`id_reporte`),
  ADD KEY `fk_animal_publicaciones` (`id_animal`),
  ADD KEY `fk_publicaciones_adopcion_publicaciones` (`id_publicaciones_adopcion`),
  ADD KEY `fk_publicaciones_evento` (`id_evento`);

--
-- Indices de la tabla `publicaciones_adopcion`
--
ALTER TABLE `publicaciones_adopcion`
  ADD PRIMARY KEY (`id_publicaciones_adopcion`),
  ADD KEY `id_animal` (`id_animal`),
  ADD KEY `user_padopcion_fk` (`id_usuarios`);

--
-- Indices de la tabla `razas`
--
ALTER TABLE `razas`
  ADD PRIMARY KEY (`id_raza`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `id_tipo_reporte` (`id_tipo_reporte`),
  ADD KEY `fk_reportes_fundacion` (`id_fundacion`),
  ADD KEY `user_reportes_fk` (`id_usuarios`);

--
-- Indices de la tabla `representante_legal`
--
ALTER TABLE `representante_legal`
  ADD PRIMARY KEY (`id_representante`),
  ADD KEY `id_cargo` (`id_cargo`),
  ADD KEY `fk_rlegal_fundacion` (`id_fundacion`);

--
-- Indices de la tabla `tamaño`
--
ALTER TABLE `tamaño`
  ADD PRIMARY KEY (`id_tamaño`);

--
-- Indices de la tabla `tipo_donacion`
--
ALTER TABLE `tipo_donacion`
  ADD PRIMARY KEY (`id_tipo_donacion`);

--
-- Indices de la tabla `tipo_evento`
--
ALTER TABLE `tipo_evento`
  ADD PRIMARY KEY (`id_tipo_evento`);

--
-- Indices de la tabla `tipo_reporte`
--
ALTER TABLE `tipo_reporte`
  ADD PRIMARY KEY (`id_tipo_reporte`);

--
-- Indices de la tabla `tipo_vivienda`
--
ALTER TABLE `tipo_vivienda`
  ADD PRIMARY KEY (`id_tipo_vivienda`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuarios`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `adoptante`
--
ALTER TABLE `adoptante`
  MODIFY `id_adoptante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuarios` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `adoptante`
--
ALTER TABLE `adoptante`
  ADD CONSTRAINT `adoptante_ibfk_1` FOREIGN KEY (`id_tipo_vivienda`) REFERENCES `tipo_vivienda` (`id_tipo_vivienda`),
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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
