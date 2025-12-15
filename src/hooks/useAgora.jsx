import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID; 

export default function useAgora(roomId, userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  
  // Usamos useRef para mantener persistencia del cliente y el track
  // sin depender de los renderizados de React. Esto es CRUCIAL para el cleanup.
  const client = useRef(null);
  const localAudioTrack = useRef(null);

  useEffect(() => {
    if (!APP_ID) return;

    // 1. Crear Cliente
    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    const init = async () => {
      // Listeners de eventos
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack.play();
        setRemoteUsers(prev => [...prev, user]);
      });

      client.current.on("user-unpublished", (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        // 2. Unirse
        await client.current.join(APP_ID, roomId, null, userId);
        
        // 3. Crear Audio (Micro)
        const track = await AgoraRTC.createMicrophoneAudioTrack();
        
        // Guardamos en la Referencia (NO en estado) para asegurar el cierre
        localAudioTrack.current = track;
        
        // Publicar
        await client.current.publish(track);
        setIsConnected(true);
        
      } catch (error) { 
        console.error("Error Agora:", error); 
      }
    };

    init();

    // --- LIMPIEZA TOTAL (Al salir de la sala) ---
    return () => {
      // 1. Detener y Cerrar el Micro (Apaga la luz del hardware)
      if (localAudioTrack.current) {
        localAudioTrack.current.stop();
        localAudioTrack.current.close(); 
        localAudioTrack.current = null;
      }
      // 2. Desconectar Cliente
      if (client.current) {
        client.current.leave();
        client.current = null;
      }
      setIsConnected(false);
    };
  }, [roomId, userId]);

  // Función Mute
  const toggleMute = () => {
    if (localAudioTrack.current) {
      const isMuted = localAudioTrack.current.muted;
      localAudioTrack.current.setMuted(!isMuted);
      return !isMuted;
    }
    return false;
  };

  return { isConnected, toggleMute, remoteUsers };
}