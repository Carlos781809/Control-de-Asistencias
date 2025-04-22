//importamos librerias necesarias para el proyecto
const express = require("express");//Se usa para crear el servidor y gestionar las rutas
const mysql = require("mysql2");//Permite la conexión con la base de datos MySQL
const multer = require("multer");//Maneja la carga de archivos 
const cors = require("cors");//Permite que el servidor sea accesible desde otros dominios, por ejemplo el frontend
const bodyParser = require("body-parser");// Se usa para analizar los datos de las solicitudes HTTP
const fs = require("fs");// Permite trabajar con el sistema de archivos, como leer y escribir archivos
const path = require("path");//Proporciona utilidades para trabajar con rutas de archivos y directorios

const app = express();//Crea una aplicación web usando Express para manejar peticiones HTTP
app.use(cors());//habilita CORS, permitiendo que el servidor acepte solicitudes de otros dominios
app.use(bodyParser.json());//Configura el servidor para que pueda interpretar los datos en formato JSON

// Conexión a la base de datos MySQL
const db = mysql.createConnection({//creaa la conexion con MySQL
    host: "localhost",// determina que la base de datos se encuentra en el mismo servidor
    user: "root",// se especifica el nombre del usuario que se va a utilizar para acceder a la base de datos
    password: "123456789",// se indica cual es la contraseña asociada al usuario para poder acceder a la base de datos
    database: "control_asistencia"//especifica cual es el nombre de la base de datos que se va a utilizar
});

db.connect(err => {//conecta a la base de datos y maneja erores si los hay
    if (err) {
        console.error("Error al conectar a MySQL:", err);//verifica si hay un error, si lo hay muestra el siguiente mensaje de error en la consola 
        return;
    }
    console.log("Conectado a MySQL");// si no hay errores muestra el siguiente mensaje en la consola
});

// Configuración de `multer`
const storage = multer.diskStorage({//configura el almacenamiento de los archivos que se subirán, especificando cómo se deben guardar
    destination: (req, file, cb) => {//define el destino donde se guardará el archivo que se suba
        const tipoRegistro = req.body.tipoRegistro || "entrada";//obtiene el valor de tipoRegistro del cuerpo de la solicitud
        const carpetaDestino = tipoRegistro === "salida" ? "fotos" : "fotos";//guarda las fotos tomadas en la carpeta fotos
        console.log("Guardando en carpeta:", carpetaDestino);//indica un mensaje de que se efectivamente se guardo la foto en la carpeta correspondiente
        cb(null, carpetaDestino);//para indicar que no hubo errores en el proceso de destino
    },
    filename: (req, file, cb) => {//Esta línea establece cómo se debe nombrar el archivo guardado
        cb(null, `foto_${Date.now()}.jpg`);//Nombrar el archivo como "foto_" seguido de la fecha y hora actuales en milisegundos, con extensión ".jpg".
    }
});

const upload = multer({ storage });//Inicializa `multer` con la configuración de almacenamiento previamente definida.

// Ruta para obtener la hora del servidor en UTC-5
app.get("/hora", (req, res) => {//Define una ruta en el servidor para obtener la hora actual del servidor.
    const fechaHora = new Date(new Date().getTime() - 5 * 60 * 60 * 1000)//Obtiene la hora actual del servidor y ajusta la zona horaria restando 5 horas para que este con la hora actual de colombia
        .toISOString()//Convierte la fecha ajustada a formato ISO("2025-04-01T15:30:00.000Z")
        .slice(0, 19)//Corta la cadena de fecha ISO para dejar solo la parte de la fecha y hora("2025-04-01 15:30:00")
        .replace("T", " ");//Reemplaza la letra "T" entre la fecha y la hora con un espacio en blanco, para que el formato sea más legible
    res.json({ hora: fechaHora });//Envía la fecha y hora formateada como una respuesta JSON
});

// Ruta para guardar la foto y el registro en MySQL
app.post("/guardarRegistro", upload.single("foto"), (req, res) => {//Recibe la foto y los datos del formulario cuando se envían al servidor
    if (!req.file) {//Verifica si no se recibió una foto en la solicitud.
        return res.status(400).json({ error: "No se recibió ninguna imagen" });//Envía una respuesta de error si no se recibió ninguna foto
    }

    const { nombre, cedula, tipoRegistro } = req.body;//Extrae los valores de nombre, cédula y tipoRegistro del cuerpo de la solicitud
    const foto = req.file.filename;//Asigna el nombre del archivo de la foto recibida a la variable foto
    const hora = new Date(new Date().getTime() - 5 * 60 * 60 * 1000)//Obtiene la hora actual del servidor ajustada a la zona horaria
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    let sql;//Define una variable sql para guardar la consulta SQL
    let valores;//Define una variable valores para almacenar los datos que se insertarán o actualizarán en la base de datos

    if (tipoRegistro === "entrada") {//Verifica si el tipo de registro es "entrada". Si es así, prepara la consulta SQL para insertar los datos en la base de datos
        sql = `INSERT INTO registro_asistencia (foto, nombre, cedula, entrada, hora_entrada, salida, hora_salida)
               VALUES (?, ?, ?, CURDATE(), ?, NULL, NULL)`;//Prepara la consulta SQL para insertar los datos de la foto, nombre, cédula, entrada, hora de entrada, salida y hora de salida en la base de datos.
        valores = [foto, nombre, cedula, hora];//Asigna los valores de la foto, nombre, cédula y hora de entrada a una lista que se usará en la consulta SQL
    } else {
        sql = `UPDATE registro_asistencia SET foto = ?, salida = CURDATE(), hora_salida = ? WHERE cedula = ?`;
        valores = [foto, hora, cedula];//Si el registro es de salida, actualiza la foto, la fecha de salida y la hora de salida para el usuario con la cédula indicada
    }

    db.query(sql, valores, (err, result) => {//Ejecuta la consulta SQL con los valores proporcionados y maneja cualquier error que ocurra durante el proceso.
        if (err) {
            console.error("Error al guardar en MySQL:", err);
            return res.status(500).json({ error: "Error al guardar en MySQL" });//Si ocurre un error al guardar en la base de datos, muestra un mensaje de error en la consola y responde con un código de error 500 y un mensaje indicando que hubo un problema al guardar en MySQL.
        }
        res.json({ mensaje: " Registro guardado con éxito" });//Envía un mensaje de éxito al cliente.

    });
});

// Iniciar servidor
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");// muestra un mensaje en consola indicando que el servidor funcionando
});
