const API_BASE = "http://localhost:8080/api";

let selectedBookId = null;

function showAlert(message, type = "success") {
    const html = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    $("#alertPlaceholder").html(html);
}

function getToken() {
    return localStorage.getItem("jwt");
}

function getUsername() {
    return localStorage.getItem("username");
}

function updateNavbar() {
    const username = getUsername();
    if (username) {
        $("#currentUser").text(username);
        $("#navUser").removeClass("d-none");
        $("#btnLoginNav").parent().addClass("d-none");
        $("#btnRegisterNav").parent().addClass("d-none");
    } else {
        $("#navUser").addClass("d-none");
        $("#btnLoginNav").parent().removeClass("d-none");
        $("#btnRegisterNav").parent().removeClass("d-none");
    }
}

function loadBooks() {
    $.get(`${API_BASE}/libros`)
        .done(books => {
            const container = $("#booksContainer");
            container.empty();
            if (!books || books.length === 0) {
                container.append("<p>No hay libros registrados.</p>");
                return;
            }
            books.forEach(book => {
                const img = book.imagenUrl || "https://via.placeholder.com/200x200?text=Libro";
                const card = $(`
                    <div class="col-md-3 mb-4">
                        <div class="card h-100 shadow-sm">
                            <img src="${img}" class="card-img-top" alt="${book.titulo}">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${book.titulo}</h5>
                                <p class="card-text text-muted">${book.autor}</p>
                                <p class="card-text"><small>${book.categoria ? book.categoria.nombre : ""}</small></p>
                                <p class="card-text"><small>Disponibles: ${book.cantidadDisponible}</small></p>
                                <button class="btn btn-outline-primary mt-auto btn-detalle" data-id="${book.id}">
                                    Ver detalle
                                </button>
                            </div>
                        </div>
                    </div>
                `);
                container.append(card);
            });
        })
        .fail(() => {
            showAlert("Error al cargar los libros.", "danger");
        });
}

function openBookModal(id) {
    $.get(`${API_BASE}/libros/${id}`)
        .done(book => {
            selectedBookId = book.id;
            $("#bookTitle").text(book.titulo);
            $("#bookAuthor").text(book.autor);
            $("#bookDescription").text(book.descripcion || "");
            $("#bookAvailable").text(book.cantidadDisponible);
            $("#bookImage").attr("src", book.imagenUrl || "https://via.placeholder.com/200x200?text=Libro");
            const modal = new bootstrap.Modal(document.getElementById("bookModal"));
            modal.show();
        })
        .fail(() => {
            showAlert("Error al cargar el detalle del libro.", "danger");
        });
}

function prestarLibro() {
    if (!getToken()) {
        const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
        loginModal.show();
        showAlert("Debes iniciar sesión para prestar un libro.", "warning");
        return;
    }
    $.ajax({
        url: `${API_BASE}/libros/${selectedBookId}/prestar`,
        type: "POST",
        headers: {
            "Authorization": "Bearer " + getToken()
        }
    }).done(() => {
        showAlert("Libro prestado correctamente.", "success");
        loadBooks();
        const bm = bootstrap.Modal.getInstance(document.getElementById("bookModal"));
        if (bm) bm.hide();
    }).fail(err => {
        const msg = err.responseJSON && err.responseJSON.message
            ? err.responseJSON.message
            : "Error al prestar el libro.";
        showAlert(msg, "danger");
    });
}

$(document).ready(function () {
    updateNavbar();
    loadBooks();

    $(document).on("click", ".btn-detalle", function () {
        const id = $(this).data("id");
        openBookModal(id);
    });

    $("#btnPrestar").click(prestarLibro);

    $("#btnLoginNav").click(() => {
        const modal = new bootstrap.Modal(document.getElementById("loginModal"));
        modal.show();
    });

    $("#btnRegisterNav").click(() => {
        const modal = new bootstrap.Modal(document.getElementById("registerModal"));
        modal.show();
    });

    $("#btnLogout").click(() => {
        localStorage.removeItem("jwt");
        localStorage.removeItem("username");
        updateNavbar();
        showAlert("Sesión cerrada.");
    });

    $("#loginForm").submit(function (e) {
        e.preventDefault();
        const data = {
            username: $("#loginUsername").val(),
            password: $("#loginPassword").val()
        };
        $.ajax({
            url: `${API_BASE}/auth/login`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data)
        }).done(res => {
            localStorage.setItem("jwt", res.token);
            localStorage.setItem("username", res.username);
            updateNavbar();
            showAlert("Login exitoso.");
            const modal = bootstrap.Modal.getInstance(document.getElementById("loginModal"));
            if (modal) modal.hide();
        }).fail(() => {
            showAlert("Credenciales inválidas.", "danger");
        });
    });

    $("#registerForm").submit(function (e) {
        e.preventDefault();
        const data = {
            username: $("#regUsername").val(),
            nombre: $("#regNombre").val(),
            apellido: $("#regApellido").val(),
            email: $("#regEmail").val(),
            password: $("#regPassword").val()
        };
        $.ajax({
            url: `${API_BASE}/auth/register`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(data)
        }).done(() => {
            showAlert("Registro exitoso, ahora puedes iniciar sesión.");
            const modal = bootstrap.Modal.getInstance(document.getElementById("registerModal"));
            if (modal) modal.hide();
        }).fail(err => {
            const msg = err.responseJSON && err.responseJSON.message
                ? err.responseJSON.message
                : "Error al registrar usuario.";
            showAlert(msg, "danger");
        });
    });
});


