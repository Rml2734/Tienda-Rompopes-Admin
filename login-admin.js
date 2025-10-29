/*
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    const correctPassword = 'Osita2015%';

    if (password === correctPassword) {
        // Guarda el estado de la sesión en localStorage
        localStorage.setItem('adminAuthenticated', 'true');
        // Redirige al panel de administración
        window.location.href = 'admin.html';
    } else {
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});
*/
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Muestra la URL a la que se está haciendo la solicitud.
    const apiUrl = 'http://localhost:3001/api/admin/login';
    console.log('Realizando solicitud a la URL:', apiUrl);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password })
        });

        // Agregamos un console.log para ver el estado de la respuesta del servidor.
        console.log('Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            // Si la respuesta no es OK (por ejemplo, 404 o 401), lanzamos un error.
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Muestra los datos de la respuesta para verificar si son correctos.
        console.log('Datos recibidos:', data);

         if (data.success) {
            // Guarda el token y el estado de la sesión en localStorage
            localStorage.setItem('adminToken', data.token); // <-- NUEVO: Guardamos el token
            localStorage.setItem('adminAuthenticated', 'true');
            // Redirige al panel de administración
            window.location.href = 'admin.html';
        } else {
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Error en la solicitud de login:', error);
        errorMessage.textContent = 'Error de conexión. Intenta de nuevo.';
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});
