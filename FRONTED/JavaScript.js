const video = document.getElementById("video");//busca el elemento de video en la página y lo guarda en la variable video
const canvas = document.getElementById("canvas");//busca el elemento <canvas> en la página y lo guarda en la variable canvas 
const capturarBtn = document.getElementById("capturar");// busca el botón con el id "capturar" en la página y lo guarda en la variable capturarBtn
const salidaOEntrada = document.getElementById("salidaOEntrada");//busca el elemento con el id "salidaOEntrada" en la página y lo guarda en la variable salidaOEntrada, que es el selector donde se elige si el registro es de entrada o salida
const fotoCapturada = document.getElementById("fotoCapturada");// busca el elemento con el id "fotoCapturada" en la página y lo guarda en la variable fotoCapturada, que es donde se muestra la foto después de tomarla
const ctx = canvas.getContext("2d");//obtiene el "lienzo de dibujo" del canvas, permitiendo dibujar imágenes, texto y formas en él

// Esperar a que el video cargue antes de habilitar la cámara

navigator.mediaDevices.getUserMedia({ video: true })//pide permiso al navegador para usar la cámara. Si el usuario acepta, activará la cámara y permitirá mostrar el video en la página
    .then(stream => {//si la cámara se ha activado con éxito, se recibe un "flujo" de datos de video
        video.srcObject = stream;//se toma el flujo de datos de video y se le asigna al elemento de video en la página web
        video.onloadedmetadata = () => {
            console.log(" Cámara activada correctamente");//cuando la cámara está lista para empezar a grabar, se ejecuta esta función y muestra un mensaje en la consola diciendo Cámara activada correctamente
        };
    })
    .catch(error => {// forma de capturar cualquier error que ocurra durante la solicitud de acceso a la cámara
        console.error(" Error al acceder a la cámara:", error);//Si hay un error, se muestra un mensaje en la consola con información sobre el error que ocurrió
        alert("No se pudo acceder a la cámara. Verifica los permisos.");//También se muestra un mensaje emergente en la pantalla para el usuario, indicándole que no se pudo acceder a la cámara y sugiriéndole que verifique si ha dado los permisos adecuados
    });

// Cambiar el botón según el tipo de registro

salidaOEntrada.addEventListener("change", () => {
    capturarBtn.textContent = salidaOEntrada.value === "salida" ? "Tomar Foto" : "Tomar Foto";
});// está pendiente de que el usuario cambie la opción en un menú de selección. Cada vez que cambias lo que está seleccionado, el código reacciona a ese cambio

// Función para capturar y guardar la foto
async function capturarFoto() {//esta función es para capturar una foto, pero tiene que hacer varias cosas de manera ordenada y puede tardar un poco, por eso le decimos que es async
    console.log("Intentando capturar la foto...");//una señal de que la acción de tomar la foto ya está en marcha y puedes ver si algo sale bien o mal

    const tipoRegistro = salidaOEntrada.value;//guarda si el usuario está registrando una entrada o salida para usar esa información más adelante cuando se esté capturando la foto
    const nombre = document.getElementById("nombre").value;//obtiene lo que el usuario escribió en el campo "nombre" y lo guarda en una variable para usarlo más adelante en el proceso
    const cedula = document.getElementById("cedula").value;// obtiene lo que el usuario escribió en el campo "cedula" y lo guarda en una variable para usarlo más adelante en el proceso

    if (!nombre || !cedula) {// esta línea está comprobando si el nombre o la cédula están vacíos
        alert("Nombre y Cédula son obligatorios");//a mostrará una ventana emergente que le informará que esos campos son obligatorios para continuar
        return;//si los campos obligatorios están vacíos, el código no seguirá adelante y no intentará tomar la foto
    }

    // Verificar si el video está listo antes de capturar
    if (video.videoWidth === 0 || video.videoHeight === 0) {//verifica si la cámara no ha cargado correctamente
        alert("La cámara aún no está lista. Intenta de nuevo.");//si la camara no carga correctamente se mostrara el siguiente mensaje
        return;// return; evita que el código siga ejecutándose y evita que se intente tomar una foto cuando la cámara no está funcionando correctamente
    }

    // Configurar el tamaño del canvas y capturar la imagen
    canvas.width = video.videoWidth;// ajusta el ancho del lienzo canvas al mismo tamaño del video
    canvas.height = video.videoHeight;//ajusta la altura del lienzo canvas para que sea igual a la altura del video que se está mostrando
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);// captura el contenido del video en ese momento y lo dibuja en el canvas con el mismo tamaño que el video

    // Obtener la hora del servidor
    let fechaHora = new Date().toISOString().slice(0, 19).replace("T", " ");//crea una cadena con la fecha y hora actual, en formato YYYY-MM-DD HH:mm:ss.

    try {//Aquí pones el código que podría generar un error
        const respuesta = await fetch("http://localhost:3000/hora");// es un servidor que se está ejecutando en tu computadora local en el puerto 3000
        const datos = await respuesta.json();//Convierte la respuesta del servidor en un formato que JavaScript pueda entender JSON y la guarda en datos
        fechaHora = datos.hora;//Guarda la hora recibida del servidor
    } catch (error) {
        console.warn("No se pudo obtener la hora del servidor. Se usará la hora local.");
    }//Si hay un error al obtener la hora del servidor, muestra un mensaje de advertencia y usa la hora local en su lugar
 
    // Dibujar la hora en la imagen
    ctx.fillStyle = "white";//Define el color blanco para el texto que se dibujará en la imagen
    ctx.font = "20px Arial";//define el el tamaño y el estilo de la letra que se quedara capturada en la imagen 
    ctx.fillText(fechaHora, 10, canvas.height - 20);//Dibuja la fecha y hora en la imagen capturada, colocándola en la parte inferior izquierda

    // Mostrar la foto en pantalla por 3 segundos
    fotoCapturada.style.display = "block";//Muestra la foto capturada en la pantalla.
    setTimeout(() => { fotoCapturada.style.display = "none"; }, 3000);//Oculta la foto capturada después de 3 segundos.

    //  Enviar la imagen al servidor
    canvas.toBlob(async (blob) => {//Convierte la imagen del *canvas* en un archivo (*blob*) para poder enviarla al servidor.
        if (!blob) {//verifica si la variable blob no tiene un valor válido. Si no tiene un valor correcto, ejecuta el código dentro de las llaves {}
            console.error(" No se pudo convertir la imagen a Blob.");//Muestra un mensaje de error si no se pudo convertir la imagen a un blob.
            alert("Hubo un error al capturar la foto.");//Muestra un mensaje de alerta si hubo un error al capturar la foto.
            return;//Detiene la ejecución de la función y no continúa con el resto del código
        }

        const formData = new FormData();//Crea un nuevo objeto FormData vacío, que se usará para enviar datos como archivos o información
        formData.append("foto", blob, "foto.jpg");//Añade el archivo de imagen blob al objeto formData con el nombre de campo foto y lo nombra foto.jpg.
        formData.append("nombre", nombre);//Añade el valor de la variable nombre al objeto formData con el nombre de campo nombre
        formData.append("cedula", cedula);//Añade el valor de la variable cedula al objeto formData con el nombre de campo cedula
        formData.append("tipoRegistro", tipoRegistro);//Añade el valor de la variable tipoRegistro al objeto formData con el nombre de campo tipoRegistro

        try {
            const respuesta = await fetch(`http://localhost:3000/guardarRegistro`, {//Hace una solicitud al servidor en la dirección http://localhost:3000/guardarRegistro usando fetch
                method: "POST",//Indica que la solicitud que se está enviando al servidor es de tipo "POST", lo que significa que se están enviando datos al servidor en lugar de solo solicitarlos
                body: formData//Envía los datos que están en el objeto `formData` como el cuerpo de la solicitud al servidor.
            });

            const resultado = await respuesta.json();//Convierte la respuesta del servidor, que está en formato JSON, en un objeto JavaScript para poder usarlo en el código.
            console.log("Respuesta del servidor:", resultado);//Muestra en la consola del navegador la respuesta que recibe del servidor
            alert(`Foto de ${tipoRegistro} guardada correctamente.`);//Muestra un mensaje emergente (alerta) en el navegador indicando que la foto de entrada o salida se guardó correctamente
        } catch (error) {//Inicia un bloque de manejo de errores, que se ejecuta si ocurre un problema en el bloque `try` anterior.
            console.error("Error al enviar la foto:", error);
            alert("Hubo un error al enviar la foto al servidor.");
        }
    }, "image/jpeg");//Especifica que el tipo de archivo que se está enviando es una imagen en formato JPEG.
}

// Evento para capturar la foto
capturarBtn.addEventListener("click", capturarFoto);//cuando el usuario haga clic en el botón, se ejecutará la función capturarFoto
