

const DB_NAME = "Nebuloz_Documento_DB";
const DB_VERSION = 1;
const STORE_NAME = "documentos";

let db;


const integrantes = {
    "Valery Muñoz": {
        color: "#db2777",
        fondo: "#fce7f3",
        rolId: "rolValery",
        inputId: "rolInputValery"
    },

    "Anderson Zapata": {
        color: "#2563eb",
        fondo: "#dbeafe",
        rolId: "rolAnderson",
        inputId: "rolInputAnderson"
    },

    "Matias Betancourth": {
        color: "#7c3aed",
        fondo: "#ede9fe",
        rolId: "rolMatias",
        inputId: "rolInputMatias"
    },

    "Sergio Rios": {
        color: "#16a34a",
        fondo: "#dcfce7",
        rolId: "rolSergio",
        inputId: "rolInputSergio"
    },

    "Juliana Parra": {
        color: "#ea580c",
        fondo: "#ffedd5",
        rolId: "rolJuliana",
        inputId: "rolInputJuliana"
    }
};

function iniciarBaseDatos() {

    return new Promise((resolve, reject) => {

        const solicitud = indexedDB.open(DB_NAME, DB_VERSION);

        solicitud.onupgradeneeded = function (evento) {

            const base = evento.target.result;

            if (!base.objectStoreNames.contains(STORE_NAME)) {

                const almacen = base.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id",
                        autoIncrement: true
                    }
                );

                almacen.createIndex("nombre", "nombre", {
                    unique: false
                });

                almacen.createIndex("integrante", "integrante", {
                    unique: false
                });
            }
        };

        solicitud.onsuccess = function (evento) {

            db = evento.target.result;

            resolve(db);
        };

        solicitud.onerror = function () {

            reject(solicitud.error);
        };
    });
}

function guardarDocumento(documento) {

    return new Promise((resolve, reject) => {

        const transaccion = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const almacen = transaccion.objectStore(STORE_NAME);

        const solicitud = almacen.add(documento);

        solicitud.onsuccess = function () {

            resolve(solicitud.result);
        };

        solicitud.onerror = function () {

            reject(solicitud.error);
        };
    });
}

function obtenerDocumentos() {

    return new Promise((resolve, reject) => {

        const transaccion = db.transaction(
            STORE_NAME,
            "readonly"
        );

        const almacen = transaccion.objectStore(STORE_NAME);

        const solicitud = almacen.getAll();

        solicitud.onsuccess = function () {

            resolve(solicitud.result);
        };

        solicitud.onerror = function () {

            reject(solicitud.error);
        };
    });
}

function eliminarDocumento(id) {

    return new Promise((resolve, reject) => {

        const transaccion = db.transaction(
            STORE_NAME,
            "readwrite"
        );

        const almacen = transaccion.objectStore(STORE_NAME);

        const solicitud = almacen.delete(Number(id));

        solicitud.onsuccess = function () {

            resolve();
        };

        solicitud.onerror = function () {

            reject(solicitud.error);
        };
    });
}

const formularioDocumento = document.getElementById("formDocumento");

formularioDocumento.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    const nombre = document
        .getElementById("nombreDocumento")
        .value
        .trim();

    const integrante = document
        .getElementById("integranteDocumento")
        .value;

    const categoria = document
        .getElementById("categoriaDocumento")
        .value;

    const descripcion = document
        .getElementById("descripcionDocumento")
        .value
        .trim();

    const archivoInput = document.getElementById("archivoDocumento");

    const archivo = archivoInput.files[0];

    if (!nombre || !integrante || !categoria || !archivo) {

        alert("Por favor completa los campos obligatorios.");

        return;
    }

    const documento = {

        nombre: nombre,

        integrante: integrante,

        categoria: categoria,

        descripcion: descripcion,

        archivo: archivo,

        nombreOriginal: archivo.name,

        tipoArchivo: archivo.type,

        tamaño: archivo.size,

        fecha: new Date().toISOString()
    };

    try {

        await guardarDocumento(documento);

        alert("¡Documento guardado correctamente!");

        formularioDocumento.reset();

        await mostrarDocumentos();

    } catch (error) {

        console.error("Error al guardar:", error);

        alert(
            "No se pudo guardar el documento. " +
            "Puede que el almacenamiento del navegador esté lleno."
        );
    }
});

/* =========================================
   MOSTRAR DOCUMENTOS
========================================= */

async function mostrarDocumentos() {

    const contenedor = document.getElementById("listaDocumentos");

    const contador = document.getElementById("totalDocumentos");

    const documentos = await obtenerDocumentos();

    contador.textContent = documentos.length;

    const busqueda = document
        .getElementById("buscarDocumento")
        .value
        .trim()
        .toLowerCase();

    const filtroIntegrante = document
        .getElementById("filtroIntegrante")
        .value;

    const documentosFiltrados = documentos.filter(documento => {

        const coincideNombre = documento.nombre
            .toLowerCase()
            .includes(busqueda);

        const coincideIntegrante =
            filtroIntegrante === "Todos" ||
            documento.integrante === filtroIntegrante;

        return coincideNombre && coincideIntegrante;
    });

    contenedor.innerHTML = "";

    if (documentosFiltrados.length === 0) {

        contenedor.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-folder-open"></i>

                <h3>No se encontraron documentos</h3>

                <p>
                    Sube un archivo o cambia los filtros de búsqueda.
                </p>

            </div>
        `;

        return;
    }

    documentosFiltrados.sort((a, b) =>
        new Date(b.fecha) - new Date(a.fecha)
    );

    documentosFiltrados.forEach(documento => {

        const integrante = integrantes[documento.integrante];

        const color = integrante
            ? integrante.color
            : "#475569";

        const fondo = integrante
            ? integrante.fondo
            : "#f1f5f9";

        const fecha = new Date(documento.fecha)
            .toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        const icono = obtenerIcono(documento.nombreOriginal);

        const tarjeta = document.createElement("article");

        tarjeta.className = "document-card";

        tarjeta.innerHTML = `

            <div class="document-top">

                <div class="document-icon">

                    <i class="${icono}"></i>

                </div>

                <i class="fa-solid fa-file-lines document-menu"></i>

            </div>

            <h3>${escaparHTML(documento.nombre)}</h3>

            <p class="document-description">

                ${escaparHTML(
                    documento.descripcion || "Sin descripción"
                )}

            </p>

            <div class="document-meta">

                <span class="document-category">

                    ${escaparHTML(documento.categoria)}

                </span>

                <span class="document-author"
                    style="color:${color}; background:${fondo}">

                    <i class="fa-solid fa-user"></i>

                    &nbsp;${escaparHTML(documento.integrante)}

                </span>

                <span class="document-date">

                    <i class="fa-regular fa-calendar"></i>

                    ${fecha}

                </span>

                <span class="document-date">

                    <i class="fa-solid fa-paperclip"></i>

                    ${formatearTamaño(documento.tamaño)}

                </span>

            </div>

            <div class="document-actions">

                <button class="btn-open" data-action="open">

                    <i class="fa-solid fa-eye"></i>

                    Abrir

                </button>

                <button class="btn-download" data-action="download">

                    <i class="fa-solid fa-download"></i>

                    Descargar

                </button>

                <button class="btn-delete" data-action="delete">

                    <i class="fa-solid fa-trash"></i>

                    Eliminar

                </button>

            </div>
        `;

        tarjeta
            .querySelector('[data-action="open"]')
            .addEventListener("click", () => {
                abrirDocumento(documento);
            });

        tarjeta
            .querySelector('[data-action="download"]')
            .addEventListener("click", () => {
                descargarDocumento(documento);
            });

        tarjeta
            .querySelector('[data-action="delete"]')
            .addEventListener("click", () => {
                confirmarEliminar(documento.id);
            });

        contenedor.appendChild(tarjeta);
    });
}

function abrirDocumento(documento) {

    const archivo = documento.archivo;

    if (!archivo) {

        alert("No se encontró el archivo.");

        return;
    }

    const url = URL.createObjectURL(archivo);

    const nuevaVentana = window.open(url, "_blank");

    if (!nuevaVentana) {

        alert(
            "El navegador bloqueó la ventana. " +
            "Permite las ventanas emergentes."
        );
    }

    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 60000);
}

function descargarDocumento(documento) {

    const archivo = documento.archivo;

    if (!archivo) {

        alert("No se encontró el archivo.");

        return;
    }

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = documento.nombreOriginal;

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 1000);
}



async function confirmarEliminar(id) {

    const confirmacion = confirm(
        "¿Estás seguro de que deseas eliminar este documento?"
    );

    if (!confirmacion) {

        return;
    }

    try {

        await eliminarDocumento(id);

        alert("Documento eliminado correctamente.");

        await mostrarDocumentos();

    } catch (error) {

        console.error(error);

        alert("No se pudo eliminar el documento.");
    }
}

document
    .getElementById("buscarDocumento")
    .addEventListener("input", mostrarDocumentos);

document
    .getElementById("filtroIntegrante")
    .addEventListener("change", mostrarDocumentos);

function obtenerIcono(nombreArchivo) {

    const extension = nombreArchivo
        .split(".")
        .pop()
        .toLowerCase();

    const iconos = {

        pdf: "fa-solid fa-file-pdf",

        doc: "fa-solid fa-file-word",

        docx: "fa-solid fa-file-word",

        xls: "fa-solid fa-file-excel",

        xlsx: "fa-solid fa-file-excel",

        ppt: "fa-solid fa-file-powerpoint",

        pptx: "fa-solid fa-file-powerpoint",

        jpg: "fa-solid fa-file-image",

        jpeg: "fa-solid fa-file-image",

        png: "fa-solid fa-file-image",

        zip: "fa-solid fa-file-zipper",

        txt: "fa-solid fa-file-lines"
    };

    return iconos[extension] || "fa-solid fa-file";
}

function formatearTamaño(bytes) {

    if (bytes < 1024) {

        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {

        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function escaparHTML(texto) {

    return String(texto)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}

const formularioRoles = document.getElementById("formRoles");

formularioRoles.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const roles = {};

    Object.keys(integrantes).forEach(nombre => {

        const inputId = integrantes[nombre].inputId;

        const input = document.getElementById(inputId);

        roles[nombre] = input.value.trim() || "Por asignar";
    });

    localStorage.setItem(
        "SIPE_Roles",
        JSON.stringify(roles)
    );

    mostrarRoles();

    alert("¡Los roles del equipo se guardaron correctamente!");
});



function mostrarRoles() {

    const rolesGuardados = localStorage.getItem("Nebuloz_Roles");

    if (!rolesGuardados) {

        return;
    }

    const roles = JSON.parse(rolesGuardados);

    Object.keys(integrantes).forEach(nombre => {

        const integrante = integrantes[nombre];

        const rol = roles[nombre] || "Por asignar";

        document.getElementById(integrante.rolId).textContent = rol;

        document.getElementById(integrante.inputId).value =
            rol === "Por asignar" ? "" : rol;
    });
}

function mostrarFecha() {

    const fecha = new Date();

    const opciones = {

        weekday: "long",

        day: "numeric",

        month: "long",

        year: "numeric"
    };

    document.getElementById("fechaActual").textContent =
        fecha.toLocaleDateString("es-CO", opciones);
}

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
menuToggle.addEventListener("click", function () {

    sidebar.classList.toggle("show");
});

document.querySelectorAll(".nav-link").forEach(enlace => {

    enlace.addEventListener("click", function () {

        document.querySelectorAll(".nav-link").forEach(link => {

            link.classList.remove("active");
        });

        this.classList.add("active");

        sidebar.classList.remove("show");
    });
});


async function iniciarNebuloz() {

    mostrarFecha();

    mostrarRoles();

    try {

        await iniciarBaseDatos();

        await mostrarDocumentos();

    } catch (error) {

        console.error("Error al iniciar SIPE:", error);

        alert(
            "No fue posible iniciar el almacenamiento. " +
            "Abre Nebuloz desde un navegador compatible."
        );
    }
}

iniciarNebuloz();