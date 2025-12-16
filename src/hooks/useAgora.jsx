import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID; 

export default function useAgora(roomId, userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false); // Nuevo estado
  
  const client = useRef(null);
  const localAudioTrack = useRef(null);

  useEffect(() => {
    if (!APP_ID || !roomId || !userId) return;

    // 1. Crear Cliente
    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    const init = async () => {
      // Listeners
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
        localAudioTrack.current = track;
        
        // Publicar
        await client.current.publish(track);
        setIsConnected(true);
        
      } catch (error) { 
        console.error("Error Agora:", error); 
      }
    };

    init();

    // Cleanup
    return () => {
      if (localAudioTrack.current) {
        localAudioTrack.current.stop();
        localAudioTrack.current.close(); 
        localAudioTrack.current = null;
      }
      if (client.current) {
        client.current.leave();
        client.current = null;
      }
      setIsConnected(false);
      setRemoteUsers([]);
    };
  }, [roomId, userId]);

  // ✅ Nueva Función: Alternar Mute
  const toggleMute = async () => {
    if (localAudioTrack.current) {
      const currentMuted = localAudioTrack.current.muted;
      await localAudioTrack.current.setMuted(!currentMuted);
      setIsMuted(!currentMuted);
      return !currentMuted;
    }
    return false;
  };

  return { isConnected, remoteUsers, toggleMute, isMuted };
}