"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminNotificationMonitor() {
  const { status } = useSession()
  const previousCountRef = useRef<number>(0)
  const hasInitializedRef = useRef<boolean>(false)

  // SWR con refresco cada 5 segundos - se mantiene activo mientras la sesión esté autenticada
  const { data } = useSWR(
    status === "authenticated" ? "/api/bookings" : null,
    fetcher,
    {
      refreshInterval: 5000, // 5 segundos
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshWhenHidden: true, // CLAVE: continuar refrescando cuando la pestaña está oculta
      refreshWhenOffline: false,
    }
  )

  const bookings = data?.bookings || []

  // Detectar nuevas reservas y reproducir sonido
  useEffect(() => {
    if (!hasInitializedRef.current && bookings.length > 0) {
      // Primera carga, solo guardar el conteo inicial
      previousCountRef.current = bookings.length
      hasInitializedRef.current = true
      return
    }

    if (hasInitializedRef.current && bookings.length > previousCountRef.current) {
      // Nueva reserva detectada
      const newBookingsCount = bookings.length - previousCountRef.current
      
      console.log('🔔 Nueva reserva detectada!', { newBookingsCount, permission: Notification.permission })
      
      // Reproducir sonido de notificación
      const audio = new Audio('/assets/audio/notificacion.mp3')
      audio.volume = 0.5
      audio.play().catch(e => console.log('Error al reproducir sonido:', e))
      
      // Mostrar notificación del navegador
      if ('Notification' in window) {
        console.log('Notification API disponible, permission:', Notification.permission)
        
        if (Notification.permission === 'granted') {
          try {
            const notification = new Notification('¡Nueva reserva!', {
              body: `${newBookingsCount} nueva${newBookingsCount > 1 ? 's' : ''} reserva${newBookingsCount > 1 ? 's' : ''} recibida${newBookingsCount > 1 ? 's' : ''}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'new-booking-' + Date.now(), // Usar timestamp para que cada notificación sea única
              requireInteraction: false,
              silent: false, // Asegurar que no sea silenciosa
            })
            
            console.log('✅ Notificación creada')
            
            notification.onclick = () => {
              console.log('Click en notificación')
              window.focus()
              // Navegar al admin si no está ahí
              if (!window.location.pathname.includes('/admin')) {
                window.location.href = '/admin'
              }
              notification.close()
            }
            
            // Auto cerrar después de 8 segundos
            setTimeout(() => {
              notification.close()
              console.log('Notificación cerrada automáticamente')
            }, 8000)
          } catch (error) {
            console.error('Error al crear notificación:', error)
          }
        } else if (Notification.permission === 'default') {
          console.log('⚠️ Solicitando permiso para notificaciones...')
          Notification.requestPermission().then(permission => {
            console.log('Permiso otorgado:', permission)
          })
        } else {
          console.log('❌ Notificaciones bloqueadas por el usuario')
        }
      } else {
        console.log('❌ Notification API no disponible en este navegador')
      }
      
      // Mostrar notificación toast solo si estamos en la página de admin
      if (window.location.pathname.includes('/admin')) {
        toast.success('¡Nueva reserva!', {
          description: `${newBookingsCount} nueva${newBookingsCount > 1 ? 's' : ''} reserva${newBookingsCount > 1 ? 's' : ''} recibida${newBookingsCount > 1 ? 's' : ''}`,
          duration: 5000,
        })
      }
      
      previousCountRef.current = bookings.length
    } else if (bookings.length < previousCountRef.current) {
      // Se eliminó una reserva
      previousCountRef.current = bookings.length
    }
  }, [bookings.length])

  // Solicitar permiso para notificaciones cuando el usuario se autentique
  useEffect(() => {
    if (status === "authenticated" && 'Notification' in window) {
      console.log('Estado de autenticación:', status)
      console.log('Permiso de notificaciones actual:', Notification.permission)
      
      if (Notification.permission === 'default') {
        console.log('Solicitando permiso de notificaciones...')
        Notification.requestPermission().then(permission => {
          console.log('Permiso de notificaciones:', permission)
          if (permission === 'granted') {
            // Mostrar notificación de prueba
            new Notification('Notificaciones activadas', {
              body: 'Recibirás alertas cuando lleguen nuevas reservas',
              icon: '/favicon.ico',
            })
          }
        })
      }
    }
  }, [status])

  // Este componente no renderiza nada visible
  return null
}
