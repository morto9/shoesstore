import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n/i18n'

export type GCCCountry = 'BH' | 'SA' | 'KW' | 'QA' | 'AE' | 'OM'

export type Region = {
  country: GCCCountry
  currency: 'BHD' | 'SAR' | 'KWD' | 'QAR' | 'AED' | 'OMR'
  localeEn: string
  localeAr: string
}

const STORAGE_KEY = 'catchy.region.v1'

const REGION_BY_COUNTRY: Record<GCCCountry, Region> = {
  BH: { country: 'BH', currency: 'BHD', localeEn: 'en-BH', localeAr: 'ar-BH' },
  SA: { country: 'SA', currency: 'SAR', localeEn: 'en-SA', localeAr: 'ar-SA' },
  KW: { country: 'KW', currency: 'KWD', localeEn: 'en-KW', localeAr: 'ar-KW' },
  QA: { country: 'QA', currency: 'QAR', localeEn: 'en-QA', localeAr: 'ar-QA' },
  AE: { country: 'AE', currency: 'AED', localeEn: 'en-AE', localeAr: 'ar-AE' },
  OM: { country: 'OM', currency: 'OMR', localeEn: 'en-OM', localeAr: 'ar-OM' },
}

// Base prices are stored in BHD. Rates are approximate for demo UI.
const FX_FROM_BHD: Record<Region['currency'], number> = {
  BHD: 1,
  SAR: 9.95,
  AED: 9.75,
  QAR: 9.65,
  OMR: 0.97,
  KWD: 0.82,
}

function detectDefaultCountry(): GCCCountry {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { country?: unknown } | null
      const c = parsed?.country
      if (c === 'BH' || c === 'SA' || c === 'KW' || c === 'QA' || c === 'AE' || c === 'OM') return c
    }
  } catch {
    // ignore
  }
  return 'BH'
}

type RegionApi = {
  country: GCCCountry
  setCountry: (c: GCCCountry) => void
  region: Region
  formatMoney: (amountBHD: number) => string
  convertFromBHD: (amountBHD: number) => number
}

const RegionContext = createContext<RegionApi | null>(null)

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState<GCCCountry>(() => detectDefaultCountry())
  const { lang } = useI18n()

  const api = useMemo<RegionApi>(() => {
    const region = REGION_BY_COUNTRY[country]
    const rate = FX_FROM_BHD[region.currency]
    const locale = lang === 'ar' ? region.localeAr : region.localeEn
    const convertFromBHD = (amountBHD: number) => {
      const n = Number.isFinite(amountBHD) ? amountBHD : 0
      return n * rate
    }
    const formatMoney = (amountBHD: number) => {
      const value = convertFromBHD(amountBHD)
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: region.currency,
        maximumFractionDigits: 2,
      })
      return formatter.format(value)
    }
    return { country, setCountry, region, formatMoney, convertFromBHD }
  }, [country, lang])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ country }))
  }, [country])

  return <RegionContext.Provider value={api}>{children}</RegionContext.Provider>
}

export function useRegion() {
  const ctx = useContext(RegionContext)
  if (!ctx) throw new Error('useRegion must be used within RegionProvider')
  return ctx
}

