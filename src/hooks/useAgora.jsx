import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID; 

export default function useAgora(roomId, userId) {
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const client = useRef(null);

  useEffect(() => {
    if (!APP_ID) return;

    client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    const init = async () => {
      client.current.on("user-published", async (user, mediaType) => {
        await client.current.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack.play();
        setRemoteUsers(prev => [...prev, user]);
      });

      client.current.on("user-unpublished", (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        await client.current.join(APP_ID, roomId, null, userId);
        const track = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(track);
        await client.current.publish(track);
        setIsConnected(true);
      } catch (error) { console.error("Error Agora:", error); }
    };

    init();

    // CLEANUP OBLIGATORIO: Libera el micrófono al salir
    return () => {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close(); // <--- ESTO APAGA LA LUZ DEL MICRO
      }
      if (client.current) {
        client.current.leave();
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  const toggleMute = () => {
    if (localAudioTrack) {
      const isMuted = localAudioTrack.muted;
      localAudioTrack.setMuted(!isMuted);
      return !isMuted;
    }
    return false;
  };

  return { isConnected, toggleMute, remoteUsers };
}