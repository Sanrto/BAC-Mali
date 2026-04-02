import './globals.css'
import Navbar          from './components/Navbar'
import Footer          from './components/Footer'
import WhatsAppButton  from './components/WhatsAppButton'
import { AuthProvider } from './contexts/AuthContext'

export const metadata = {
  title: 'BAC Mali — Résultats, Orientation & Guide étudiant',
  description: "Consultez vos résultats du Baccalauréat Malien, explorez les filières d'orientation, vérifiez votre éligibilité CENOU et rejoignez la communauté étudiante.",
  keywords: 'BAC Mali, résultats baccalauréat, DNEC, orientation, CENOU, bourse, guide étudiant',
  openGraph: {
    title: 'BAC Mali',
    description: 'Résultats BAC, orientation post-bac et guide étudiant pour le Mali.',
    locale: 'fr_ML',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <WhatsAppButton />
        </AuthProvider>
      </body>
    </html>
  )
}
