'use client'

import { useState } from 'react'

const WHATSAPP_NUMBER = '22370000000' // ← Remplacer par le vrai numéro
const TELEGRAM_HANDLE = 'lordelsanto'  // ← Remplacer si nécessaire

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .fab-wrap {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; flex-direction: column; align-items: flex-end;
          gap: 10px; z-index: 200;
        }
        .fab-options {
          display: flex; flex-direction: column; gap: 8px;
          align-items: flex-end;
          opacity: 0; transform: translateY(12px) scale(0.95);
          pointer-events: none;
          transition: opacity .2s ease, transform .2s ease;
        }
        .fab-options.open {
          opacity: 1; transform: translateY(0) scale(1);
          pointer-events: all;
        }
        .fab-option {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 16px; border-radius: 100px;
          font-family: var(--font-body); font-size: 14px; font-weight: 600;
          text-decoration: none; color: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          transition: transform .15s, box-shadow .15s;
          white-space: nowrap;
        }
        .fab-option:hover { transform: scale(1.04); box-shadow: 0 6px 20px rgba(0,0,0,0.22); }
        .fab-wa  { background: #25D366; }
        .fab-tg  { background: #229ED9; }
        .fab-option-label { font-size: 13px; }
        .fab-main {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--green-700); color: white; border: none;
          cursor: pointer; font-size: 24px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 24px rgba(27,107,58,0.45);
          transition: transform .2s, background .15s;
        }
        .fab-main:hover { background: var(--green-800); transform: scale(1.06); }
        .fab-main.open { transform: rotate(45deg); }
        @media (max-width: 480px) {
          .fab-wrap { bottom: 16px; right: 16px; }
          .fab-option-label { display: none; }
        }
      `}</style>

      <div className="fab-wrap">
        <div className={`fab-options${open ? ' open' : ''}`}>
          <a
            className="fab-option fab-tg"
            href={`https://t.me/${TELEGRAM_HANDLE}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
            <span className="fab-option-label">Telegram</span>
          </a>
          <a
            className="fab-option fab-wa"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%2C%20j'ai%20une%20question%20sur%20le%20BAC%20Mali`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="fab-option-label">WhatsApp</span>
          </a>
        </div>

        <button
          className={`fab-main${open ? ' open' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label="Contact"
        >
          {open ? '✕' : '💬'}
        </button>
      </div>
    </>
  )
}
