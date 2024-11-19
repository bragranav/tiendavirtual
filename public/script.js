// Manejo de formularios
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Cambiar la URL para apuntar a tu backend en Render
    const response = await fetch('https://tiendavirtual-t0ub.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Asegúrate de incluir las cookies si usas autenticación basada en cookies
    });
    
    const message = document.getElementById("message");
    if (response.ok) {
        message.textContent = "Inicio de sesión exitoso.";
        message.style.color = "green";
        // Redirigir a index.html
        window.location.href = "/index.html";
    } else {
        message.textContent = "Usuario o contraseña incorrectos.";
        message.style.color = "red";
    }

    const errorText = await response.text();
message.textContent = errorText || "Error inesperado. Intenta de nuevo.";
message.style.color = "red";
});

document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Cambiar la URL para apuntar a tu backend en Render
    const response = await fetch('https://tiendavirtual-t0ub.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include', // Asegúrate de incluir las cookies si usas autenticación basada en cookies
    });

    const message = document.getElementById("message");
    if (response.ok) {
        message.textContent = "Registro exitoso.";
        message.style.color = "green";
    } else {
        const errorText = await response.text();
        message.textContent = errorText;
        message.style.color = "red";
    }

    const errorText = await response.text();
message.textContent = errorText || "Error inesperado. Intenta de nuevo.";
message.style.color = "red";
});



