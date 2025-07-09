"use client";
import { useState } from "react";

export default function SecurityPage() {
  const [show2FA, setShow2FA] = useState(false);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Two-factor authentication</h1>
      <div className="bg-gray-900 p-6 rounded mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">Authenticator app</h2>
            <p className="text-gray-400 text-sm">Use your authenticator app to verify your identity</p>
          </div>
          <button
            className={`ml-4 w-12 h-6 rounded-full flex items-center transition-colors duration-200 ${show2FA ? "bg-green-500" : "bg-gray-700"}`}
            onClick={() => setShow2FA(v => !v)}
            aria-label="Enable 2FA"
          >
            <span
              className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${show2FA ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
        {show2FA && (
          <div className="mt-6">
            {/* Ici viendra le composant/processus d'enrollment 2FA (QR code, code, validation) */}
            <p className="text-gray-300">Processus d'activation 2FA à implémenter ici.</p>
          </div>
        )}
      </div>
      {/* Gestion des devices à ajouter plus tard */}
    </div>
  );
}
