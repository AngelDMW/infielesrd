import { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export default function useAgora(roomId, userId) {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  const client = useRef(null);
  const localAudioTrack = useRef(null);

  useEffect(() => {
    if (!APP_ID || !roomId || !userId) return;

    // 🔴 CAMBIO 1: Cambiar mode 'rtc' a 'live'
    client.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

    const init = async () => {
      // Listeners
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack.play();
        setRemoteUsers((prev) => [...prev, user]);
      });

      client.current.on("user-unpublished", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      try {
        // 🔴 CAMBIO 2: Establecer rol como 'host' (Broadcaster)
        // Si no haces esto en modo 'live', serás solo audiencia y no se enviará tu audio.
        await client.current.setClientRole("host");

        // Unirse (Token null para testing)
        await client.current.join(APP_ID, roomId, null, userId);

        // Crear Audio (Micro)
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
