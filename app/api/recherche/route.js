import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const CENTRES = [
  'BAMAKO RIVE DROITE',
  'BAMAKO RIVE GAUCHE',
  'BAMAKO NORD',
  'KAYES',
  'KOULIKORO',
  'SIKASSO',
  'SEGOU',
  'MOPTI',
  'TOMBOUCTOU',
  'GAO',
  'KIDAL',
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const numero = searchParams.get('numero')?.trim()
  const annee  = searchParams.get('annee')?.trim()
  const centre = searchParams.get('centre')?.trim()

  // Validation basique
  if (!numero || !annee || !centre) {
    return NextResponse.json(
      { error: 'Paramètres manquants.' },
      { status: 400 }
    )
  }

  if (!/^\d+$/.test(numero) || numero.length > 10) {
    return NextResponse.json(
      { error: 'Numéro de place invalide.' },
      { status: 400 }
    )
  }

  const anneeNum = parseInt(annee)
  if (anneeNum < 2015 || anneeNum > new Date().getFullYear()) {
    return NextResponse.json(
      { error: 'Année invalide.' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data, error } = await supabase
    .from('candidats')
    .select('nom, prenoms, serie, mention, statut, centre, annee')
    // On NE retourne jamais : date_naissance, lieu_naissance, etablissement, sexe
    .eq('numero_place', numero)
    .eq('annee', anneeNum)
    .eq('centre', centre.toUpperCase())
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur. Réessaie dans un instant.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { found: false },
      { status: 200 }
    )
  }

  return NextResponse.json({ found: true, candidat: data }, { status: 200 })
}
