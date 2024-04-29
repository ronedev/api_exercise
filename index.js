const express = require("express");
const bodyParser = require("body-parser");
const winston = require("winston");
const prometheusMiddleware = require("express-prometheus-middleware");

const app = express();

app.use(bodyParser.json());

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs.log" }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

app.use(
  prometheusMiddleware({
    metricsPath: "/metrics",
    collectDefaultMetrics: true,
  })
);

//Uso set para no tener ID's de usuarios repetidos

const usuarios = new Set([1, 2, 3]);

//Uso map por la facilidad de poder acceder y/o modificar los datos de cada usuario sin la necesidad de iterar usando su id como key
//Usando un array de objetos seria mas complejo obtener o modificar los datos de cada usuario, ademas con Map nos garantizamos la unicidad de
//los usuarios ya que cada clave debe ser unica. También da flexibilidad a los datos, ya que podriamos asociar cualquier valor al ID del usuario.
const detallesUsuarios = new Map([
  [1, { nombre: "Edinson", edad: 30 }],
  [2, { nombre: "Miguel", edad: 25 }],
  [3, { nombre: "Cristian", edad: 35 }],
]);

app.get("/users", (req, res) => {
  const usuariosArray = Array.from(usuarios);
  res.json(usuariosArray);

  logger.info("GET /usuarios");
});

app.get("/user/:id", (req, res) => {
  const userId = parseInt(req.params.id);

  if (detallesUsuarios.has(userId)) {
    const userDetails = detallesUsuarios.get(userId);
    logger.debug(`Usuario obtenido: ${userDetails}`);
    res.json(userDetails);

    logger.info(`GET /usuarios/${userId}`);
  } else {
    res.status(404).json({ error: "Usuario no encontrado" });

    logger.warn(`No se encontró el usuario con ID ${userId}`);
  }
});

app.post("/user", (req, res) => {
  const { id, nombre, edad } = req.body;

  if (usuarios.has(id)) {
    logger.error(`Intento de crear un usuario existente con ID ${id}`);
    return res.status(400).json({ error: "El usuario ya existe" });
  }

  usuarios.add(id);

  detallesUsuarios.set(id, { nombre, edad });

  logger.debug(`ID del usuario creado: ${id}`);
  logger.verbose(`Usuario creado: ${id}, ${nombre}, ${edad}`);

  res.status(201).json({ message: "Usuario creado exitosamente" });

  logger.info(`Nuevo usuario creado con ID ${id}`);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor Express en ejecución en el puerto ${PORT}`);
  logger.info(`Servidor Express en ejecución en el puerto ${PORT}`);
});
