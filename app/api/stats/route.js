import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // 1. Trouver l'année la plus récente dans la base
    const { data: anneeData, error: anneeError } = await supabase
      .from('candidats')
      .select('annee')
      .order('annee', { ascending: false })
      .limit(1)
      .single()

    if (anneeError) throw anneeError

    const anneeRecente = anneeData?.annee

    // 2. Compter les ADMIS pour cette année
    const { count, error: countError } = await supabase
      .from('candidats')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'ADMIS')
      .eq('annee', anneeRecente)

    if (countError) throw countError

    return NextResponse.json({ count: count ?? 0, annee: anneeRecente })
  } catch (error) {
    console.error('[/api/stats]', error.message)
    return NextResponse.json({ error: 'Erreur stats' }, { status: 500 })
  }
}
