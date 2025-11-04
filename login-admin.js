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

/*
// Definición de la URL base con lógica de entorno
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BACKEND_BASE_URL = IS_LOCAL
    ? 'http://localhost:3001'
    : 'https://tienda-rompopes-backend-production.up.railway.app'; 

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // MODIFICADO: Usar la variable de entorno para construir la URL
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

    // MODIFICADO: Usar la variable de entorno para construir la URL
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
        
        // El backend siempre devolverá un cuerpo JSON (incluso con 401), 
        // así que primero leemos el JSON.
        const data = await response.json();
        console.log('Datos recibidos:', data);

        if (!response.ok || data.success === false) {
            // Maneja el 401 si bcrypt falla, o cualquier otro error del servidor
            // El backend envía el mensaje en data.message
            throw new Error(data.message || `Error HTTP: ${response.status}`);
        }

        // Si response.ok es true Y data.success es true (¡el caso que acabamos de confirmar!)
        if (data.success) {
            // Guarda el token y el estado de la sesión en localStorage
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminAuthenticated', 'true');
            // Redirige al panel de administración
            window.location.href = 'admin.html';
        }
        
    } catch (error) {
        console.error('Error en la solicitud de login:', error);
        
        // Muestra el error exacto que se capturó (ya sea de la API o de la conexión)
        errorMessage.textContent = error.message; 
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});