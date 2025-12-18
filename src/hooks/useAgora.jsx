import { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export default function useAgora(roomId, userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]); // Lista de usuarios
  const [isMuted, setIsMuted] = useState(false);

  const client = useRef(null);
  const localAudioTrack = useRef(null);

  useEffect(() => {
    if (!APP_ID || !roomId || !userId) return;

    // Usamos modo 'live' para compatibilidad con el móvil
    client.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

    const init = async () => {
      // ✅ NUEVO: Detectar cuando alguien ENTRA (Presencia)
      client.current.on("user-joined", (user) => {
        console.log("👤 Usuario entró (Web detectó):", user.uid);
        setRemoteUsers((prev) => {
          // Evitar duplicados por seguridad
          if (prev.find((u) => u.uid === user.uid)) return prev;
          return [...prev, user];
        });
      });

      // ✅ NUEVO: Detectar cuando alguien SALE
      client.current.on("user-left", (user) => {
        console.log("👋 Usuario salió:", user.uid);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      // 🎧 ESCUCHAR: Detectar cuando alguien HABLA (Audio)
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        console.log("🔊 Audio recibido de:", user.uid);

        if (mediaType === "audio") {
          user.audioTrack.play();
        }

        // (Opcional) Aseguramos que esté en la lista por si el evento 'joined' falló
        setRemoteUsers((prev) => {
          if (prev.find((u) => u.uid === user.uid)) return prev;
          return [...prev, user];
        });
      });

      client.current.on("user-unpublished", (user) => {
        // Aquí no lo sacamos de la lista, solo dejamos de escuchar
        console.log("🔇 Usuario dejó de transmitir:", user.uid);
      });

      try {
        await client.current.setClientRole("host");
        await client.current.join(APP_ID, roomId, null, userId);

        // Crear micro
        const track = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrack.current = track;

        await client.current.publish(track);
        setIsConnected(true);
      } catch (error) {
        console.error("Error Agora Web:", error);
      }
    };

    init();

    return () => {
      if (localAudioTrack.current) {
        localAudioTrack.current.stop();
        localAudioTrack.current.close();
      }
      if (client.current) {
        client.current.leave();
      }
      setIsConnected(false);
      setRemoteUsers([]);
    };
  }, [roomId, userId]);

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
