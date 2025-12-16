import { useState, useEffect } from "react";
import { FaDownload, FaTimes, FaApple, FaAndroid } from "react-icons/fa";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Verificar si ya se instaló o se cerró recientemente
    if (localStorage.getItem("install_prompt_dismissed")) return;

    // Detectar iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Detectar Android/Chrome (Evento standard)
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    });

    // Mostrar en iOS también (manual)
    if (isIosDevice && !window.navigator.standalone) {
       setTimeout(() => setShow(true), 3000); // Esperar un poco
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // No mostrar de nuevo por una semana (simulado con flag simple por ahora)
    localStorage.setItem("install_prompt_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fade-in" style={{
        position: 'fixed', bottom: '85px', left: '20px', right: '20px',
        background: 'var(--text-main)', color: 'var(--surface)',
        padding: '15px 20px', borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '500px', margin: '0 auto'
    }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <div style={{
                width: 40, height: 40, background: 'var(--primary)', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
               {isIOS ? <FaApple size={24} color="white" /> : <FaAndroid size={24} color="white" />}
            </div>
            <div>
                <h4 style={{margin: 0, fontSize: '0.95rem'}}>Instalar InfielesRD</h4>
                <p style={{margin: 0, fontSize: '0.75rem', opacity: 0.8}}>
                    {isIOS ? "Pulsa 'Compartir' y luego 'Agregar a Inicio'" : "Acceso rápido y mejor experiencia"}
                </p>
            </div>
        </div>

        {isIOS ? (
             <button onClick={handleDismiss} style={{background: 'none', border: 'none', color: 'white', opacity: 0.7}}>
                <FaTimes />
             </button>
        ) : (
             <div style={{display: 'flex', gap: '10px'}}>
                 <button onClick={handleInstallClick} style={{
                     background: 'var(--surface)', color: 'var(--text-main)', border: 'none',
                     padding: '8px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                 }}>
                    Instalar
                 </button>
                 <button onClick={handleDismiss} style={{background: 'none', border: 'none', color: 'white', opacity: 0.7, cursor: 'pointer'}}>
                    <FaTimes />
                 </button>
             </div>
        )}
    </div>
  );
}