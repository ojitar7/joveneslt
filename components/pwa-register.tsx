"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function PwaRegister() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestNotification() {
    if (!("Notification" in window)) return;
    const res = await Notification.requestPermission();
    setPermission(res);
    if (res === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("Jóvenes LT", {
        body: "¡Notificaciones activadas con éxito!",
        icon: "/logo.png"
      });
    }
  }

  if (permission === "granted" || permission === "denied") return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[92%] max-w-[520px] rounded-xl border border-[#BFB8AE]/20 bg-[#1E0308]/95 p-3.5 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Bell size={16} className="text-[#BFB8AE]" />
        <p className="text-xs font-light text-[#F2F2F2]">Activa los avisos de las reuniones</p>
      </div>
      <button onClick={requestNotification} className="btn btn-primary text-xs py-1 px-3 min-h-0">
        Activar
      </button>
    </div>
  );
}