# Configuración CORS

Este proyecto tiene CORS habilitado en todas las APIs para permitir solicitudes desde cualquier origen.

## Configuración Aplicada

### 1. Helper de CORS (`lib/cors.ts`)
- Headers CORS centralizados
- Función para manejar requests OPTIONS (preflight)

### 2. APIs Actualizadas
Todas las rutas de API incluyen:
- ✅ Headers CORS en todas las respuestas
- ✅ Handler OPTIONS para preflight requests
- ✅ Manejo correcto de errores con CORS

**Rutas actualizadas:**
- `/api/availability` (GET, POST, PUT, DELETE)
- `/api/bookings` (GET, POST, PUT, DELETE)
- `/api/config` (GET, PUT)
- `/api/slots` (GET)
- `/api/slots/available` (GET)
- `/api/slots/sync` (POST)
- `/api/users` (GET, POST, PUT, DELETE)

### 3. Configuración Global

**next.config.mjs:**
- Headers CORS aplicados a todas las rutas `/api/*`

**middleware.ts:**
- Headers CORS agregados en el middleware de autenticación

## Headers CORS Configurados

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Ejemplo de Uso desde Cliente Externo

```javascript
// Realizar una petición GET
fetch('http://localhost:3000/api/bookings', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => response.json())
.then(data => console.log(data))

// Realizar una petición POST
fetch('http://localhost:3000/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '123456789',
    date: '2025-11-20',
    time: '10:00'
  })
})
.then(response => response.json())
.then(data => console.log(data))
```

## Nota de Seguridad

Actualmente CORS está configurado con `Access-Control-Allow-Origin: *` (permite todos los orígenes).

**Para producción, se recomienda:**
1. Cambiar `*` por dominios específicos
2. Configurar variables de entorno para orígenes permitidos
3. Implementar validación adicional según sea necesario

```typescript
// Ejemplo para producción en lib/cors.ts:
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://tu-dominio.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```
