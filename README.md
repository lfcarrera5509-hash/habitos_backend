# Proyecto Hábitos - Semana 2

Aplicación full-stack para gestión de hábitos.

---

## Estructura del proyecto

habitos_backend/
│
├── backend/   → Express + MongoDB Atlas + Mongoose
└── frontend/  → NextJS + Redux

---

## Backend

Tecnologías:
- Express
- MongoDB Atlas
- Mongoose
- Dotenv
- Nodemon

### Instalación

cd backend
npm install

Crear archivo `.env` dentro de backend:

PORT=3000
MONGODB_URI=tu_uri_de_mongodb

### Ejecutar

npm run dev

Servidor corre en:
http://localhost:3000

Endpoints disponibles:

GET /api/habits
POST /api/habits
PATCH /api/habits/:id
DELETE /api/habits/:id

---

## Frontend

Tecnologías:
- NextJS
- Redux Toolkit
- React Redux

### Instalación

cd frontend
npm install

### Ejecutar

npm run dev

Aplicación corre en:
http://localhost:3001

---

## Funcionalidad implementada en Semana 2

- Configuración inicial de NextJS
- Integración de Redux
- Conexión GET con backend
- Renderizado de hábitos en pantalla
- Separación de carpetas backend y frontend
