export function parseListString(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  const text = String(value).trim()
  if (!text) return []

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(item => String(item).trim()).filter(Boolean)
  } catch {}

  const regex = /"([^"]*)"|'([^']*)'/g
  const items = []
  let match
  while ((match = regex.exec(text)) !== null) {
    const item = (match[1] ?? match[2] ?? '').trim()
    if (item) items.push(cleanText(item))
  }
  if (items.length) return items

  return text
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(/\s*[,;]\s*/)
    .map(part => cleanText(part))
    .filter(Boolean)
}

export function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^['"]|['"]$/g, '')
    .trim()
}

export function formatFcfa(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `${num.toLocaleString('fr-FR')} FCFA`
}

export function humanizeModeAcces(mode) {
  const map = {
    selection_dossier: 'Sélection de dossier',
    concours: 'Concours',
    sans_concours: 'Sans concours',
  }
  return map[mode] || cleanText(mode)
}

export function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isScientificOrTechnicalSerie(value, knownSeries = []) {
  const serie = cleanText(value).toUpperCase()
  if (!serie) return false
  if (knownSeries.some(item => cleanText(item).toUpperCase() === serie)) return true
  return /(MTI|MTE|MTGC|GENIE|G[ÉE]NIE|TECHNIQUE|INDUSTRIELLE?|INDUSTRIELLES?|ELECTRONIQUE|ÉLECTRONIQUE|TSE|TSEXP|TSECO)/i.test(serie)
}

export function computeCenouScore({
  isMalian,
  isRegularStudent,
  moyenneBac,
  dureeLycee,
  genre,
  isOrphan,
  serieBac,
  knownScientificSeries = [],
}) {
  const breakdown = []
  let total = 0

  if (!isMalian || !isRegularStudent) {
    return { isEligibleToApply: false, total, breakdown, notes: [] }
  }

  const moyenne = Number(moyenneBac)
  let pointsMoyenne = 0
  if (!Number.isNaN(moyenne)) {
    if (moyenne >= 13.51) pointsMoyenne = 5
    else if (moyenne >= 11.51) pointsMoyenne = 3
    else if (moyenne >= 10.51) pointsMoyenne = 2
    else if (moyenne >= 10.0) pointsMoyenne = 0
    breakdown.push({ label: 'Performance au baccalauréat', value: `${moyenne.toFixed(2)} / 20`, points: pointsMoyenne })
    total += pointsMoyenne
  }

  let pointsDuree = 0
  if (String(dureeLycee) === '3') pointsDuree = 5
  if (String(dureeLycee) === '4') pointsDuree = 3
  if (String(dureeLycee) === '5') pointsDuree = 0
  if (dureeLycee) {
    breakdown.push({ label: 'Durée des études au lycée', value: `${dureeLycee} ans`, points: pointsDuree })
    total += pointsDuree
  }

  const genreValue = cleanText(genre).toLowerCase()
  if (genreValue === 'feminin' || genreValue === 'féminin') {
    breakdown.push({ label: 'Bonification genre', value: 'Étudiante', points: 1 })
    total += 1
  }

  if (isOrphan) {
    breakdown.push({ label: 'Bonification situation sociale', value: 'Orphelin(e) de père ou de mère', points: 2 })
    total += 2
  }

  if (isScientificOrTechnicalSerie(serieBac, knownScientificSeries)) {
    breakdown.push({ label: 'Bonus filière scientifique / technique', value: cleanText(serieBac), points: 2 })
    total += 2
  }

  return { isEligibleToApply: true, total, breakdown, notes: [] }
}
