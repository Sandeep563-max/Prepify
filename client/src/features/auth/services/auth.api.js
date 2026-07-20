import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
});


// This runs automatically before every single request (register, login, getMe, etc.)
api.interceptors.request.use(
    (config) => {
        // Grab the token from Local Storage
        const token = localStorage.getItem('token');
        
        // If a token exists, attach it to the Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        });
        return response.data;
    } catch (err) {
        console.error("Register Error:", err);
        throw err;
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post('/api/auth/login', {
            email, password
        });
        return response.data;
    } catch (err) {
        console.error("Login Error:", err);
        throw err;
    }
}

export async function logout() {
    try {
        const response = await api.get('/api/auth/logout');
        return response.data;
    } catch (err) {
        console.error("Logout Error:", err);
        throw err;
    }
}

export async function getMe() {
    try {
        const response = await api.get('/api/auth/get-me');
        return response.data;
    } catch (err) {
        console.error("GetMe Error:", err);
        throw err;
    }
}