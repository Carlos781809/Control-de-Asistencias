const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const capturarBtn = document.getElementById("capturar");
const salidaOEntrada = document.getElementById("salidaOEntrada");
const fotoCapturada = document.getElementById("fotoCapturada");
const ctx = canvas.getContext("2d");

// 💡 Esperar a que el video cargue antes de habilitar la cámara
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            console.log("✅ Cámara activada correctamente");
        };
    })
    .catch(error => {
        console.error("❌ Error al acceder a la cámara:", error);
        alert("No se pudo acceder a la cámara. Verifica los permisos.");
    });

// Cambiar el botón según el tipo de registro
salidaOEntrada.addEventListener("change", () => {
    capturarBtn.textContent = salidaOEntrada.value === "salida" ? "Tomar Foto" : "Tomar Foto";
});

// 📸 Función para capturar y guardar la foto
async function capturarFoto() {
    console.log("Intentando capturar la foto...");

    const tipoRegistro = salidaOEntrada.value;
    const nombre = document.getElementById("nombre").value;
    const cedula = document.getElementById("cedula").value;

    if (!nombre || !cedula) {
        alert("Nombre y Cédula son obligatorios");
        return;
    }

    // 💡 Verificar si el video está listo antes de capturar
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        alert("La cámara aún no está lista. Intenta de nuevo.");
        return;
    }

    // Configurar el tamaño del canvas y capturar la imagen
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Obtener la hora del servidor
    let fechaHora = new Date().toISOString().slice(0, 19).replace("T", " ");
    try {
        const respuesta = await fetch("http://localhost:3000/hora");
        const datos = await respuesta.json();
        fechaHora = datos.hora;
    } catch (error) {
        console.warn("No se pudo obtener la hora del servidor. Se usará la hora local.");
    }
 
    // 📝 Dibujar la hora en la imagen
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(fechaHora, 10, canvas.height - 20);

    // 🖼️ Mostrar la foto en pantalla por 3 segundos
    fotoCapturada.style.display = "block";
    setTimeout(() => { fotoCapturada.style.display = "none"; }, 3000);

    // 📤 Enviar la imagen al servidor
    canvas.toBlob(async (blob) => {
        if (!blob) {
            console.error("❌ No se pudo convertir la imagen a Blob.");
            alert("Hubo un error al capturar la foto.");
            return;
        }

        const formData = new FormData();
        formData.append("foto", blob, "foto.jpg");
        formData.append("nombre", nombre);
        formData.append("cedula", cedula);
        formData.append("tipoRegistro", tipoRegistro); // ✅ Ahora sí se envía correctamente

        try {
            const respuesta = await fetch(`http://localhost:3000/guardarRegistro`, {
                method: "POST",
                body: formData
            });

            const resultado = await respuesta.json();
            console.log("✅ Respuesta del servidor:", resultado);
            alert(`✅ Foto de ${tipoRegistro} guardada correctamente.`);
        } catch (error) {
            console.error("❌ Error al enviar la foto:", error);
            alert("Hubo un error al enviar la foto al servidor.");
        }
    }, "image/jpeg");
}

// 📌 Evento para capturar la foto
capturarBtn.addEventListener("click", capturarFoto);
