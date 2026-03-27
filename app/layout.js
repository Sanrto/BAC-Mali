import './globals.css'

export const metadata = {
  title: 'Résultats BAC Mali — Vérification officielle',
  description: 'Consultez vos résultats du Baccalauréat Malien. Entrez votre numéro de place pour accéder à vos résultats officiels.',
  keywords: 'BAC Mali, résultats baccalauréat, DNEC, résultats 2025',
  openGraph: {
    title: 'Résultats BAC Mali',
    description: 'Vérifiez vos résultats du Baccalauréat Malien en ligne.',
    locale: 'fr_ML',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
