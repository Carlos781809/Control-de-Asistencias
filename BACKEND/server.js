const express = require("express");
const mysql = require("mysql");
const multer = require("multer");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "adminsena",
    password: "123456789",
    database: "control_asistencia"
});

db.connect(err => {
    if (err) {
        console.error("❌ Error al conectar a MySQL:", err);
        return;
    }
    console.log("✅ Conectado a MySQL");
});

// Configuración de `multer`
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tipoRegistro = req.body.tipoRegistro || "entrada"; 
        const carpetaDestino = tipoRegistro === "salida" ? "fotos_salida" : "fotos_entrada";
        console.log("📂 Guardando en carpeta:", carpetaDestino);
        cb(null, carpetaDestino);
    },
    filename: (req, file, cb) => {
        cb(null, `foto_${Date.now()}.jpg`);
    }
});

const upload = multer({ storage });

// Ruta para obtener la hora del servidor en UTC-5
app.get("/hora", (req, res) => {
    const fechaHora = new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
    res.json({ hora: fechaHora });
});

// Ruta para guardar la foto y el registro en MySQL
app.post("/guardarRegistro", upload.single("foto"), (req, res) => { 
    if (!req.file) {
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    const { nombre, cedula, tipoRegistro } = req.body;
    const foto = req.file.filename;
    const hora = new Date(new Date().getTime() - 5 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    let sql;
    let valores;

    if (tipoRegistro === "entrada") {
        sql = `INSERT INTO registro_asistencia (foto, nombre, cedula, entrada, hora_entrada, salida, hora_salida) 
               VALUES (?, ?, ?, CURDATE(), ?, NULL, NULL)`;
        valores = [foto, nombre, cedula, hora];
    } else {
        sql = `UPDATE registro_asistencia SET foto = ?, salida = CURDATE(), hora_salida = ? WHERE cedula = ?`;
        valores = [foto, hora, cedula];
    }

    db.query(sql, valores, (err, result) => {
        if (err) {
            console.error("❌ Error al guardar en MySQL:", err);
            return res.status(500).json({ error: "Error al guardar en MySQL" });
        }
        res.json({ mensaje: "✅ Registro guardado con éxito" });

    });
});

// Iniciar servidor
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
