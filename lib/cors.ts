// Configuración de CORS para las APIs
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Función para manejar OPTIONS (preflight)
export function handleCorsOptions() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}
