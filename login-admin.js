/*
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
*/

// Definición de la URL base con lógica de entorno
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BACKEND_BASE_URL = IS_LOCAL
    ? 'http://localhost:3001'
    : 'https://tienda-rompopes-backend-production.up.railway.app'; 

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // MODIFICADO: Usamos la variable de entorno para construir la URL
    const apiUrl = `${BACKEND_BASE_URL}/api/admin/login`; 
    console.log('Realizando solicitud a la URL:', apiUrl);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password })
        });

        console.log('Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Datos recibidos:', data);

         if (data.success) {
            // Guarda el token y el estado de la sesión en localStorage
            localStorage.setItem('adminToken', data.token);
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
