/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { Check, Mail } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PUBLIC_PRICING_ANCHOR,
  PUBLIC_SUPPORT_EMAIL,
  PUBLIC_SUPPORT_MAILTO,
} from '@/lib/public-compliance'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import { AnimateInView } from '@/components/animate-in-view'

type LandingPricingRow = {
  name: string
  price: string
  description: string
  features: string[]
  cta?: string
}

function normalizeFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  return []
}

function parseLandingPricingTable(raw: unknown): LandingPricingRow[] {
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item): LandingPricingRow | null => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const name = typeof record.name === 'string' ? record.name.trim() : ''
        const price =
          typeof record.price === 'string' ? record.price.trim() : ''
        const description =
          typeof record.description === 'string'
            ? record.description.trim()
            : ''
        const cta = typeof record.cta === 'string' ? record.cta.trim() : ''
        const features = normalizeFeatures(record.features)

        if (!name || !price || !description) return null

        return {
          name,
          price,
          description,
          features,
          cta: cta || undefined,
        }
      })
      .filter((item): item is LandingPricingRow => item !== null)
  } catch {
    return []
  }
}

function buildDefaultPricingRows(
  t: (key: string) => string
): LandingPricingRow[] {
  return [
    {
      name: t('Self-hosted platform'),
      price: t('$0/month'),
      description: t(
        'Deploy the gateway yourself with no platform subscription fee.'
      ),
      features: [
        t('Unlimited local configuration'),
        t('Bring your own upstream provider keys'),
        t('AGPL community edition available'),
      ],
      cta: t('Open source'),
    },
    {
      name: t('Usage-based AI credits'),
      price: t('$0.002 / 1K tokens'),
      description: t(
        'Credits are consumed by model usage, with per-model rates shown before use.'
      ),
      features: [
        t('Preset credit packs start at 10 units'),
        t('Stripe top-up minimum is $1 when enabled'),
        t('Detailed model pricing remains visible in Model Square'),
      ],
      cta: t('Default rate'),
    },
    {
      name: t('Managed service and enterprise'),
      price: t('Custom quote'),
      description: t(
        'Managed deployment, dedicated routing, compliance support, and team onboarding.'
      ),
      features: [
        t('Volume pricing for production traffic'),
        t('Priority support and deployment guidance'),
        t('Custom terms for business requirements'),
      ],
      cta: t('For teams'),
    },
  ]
}

export function PricingOverview() {
  const { t } = useTranslation()
  const { status } = useStatus()

  const pricingRows = useMemo(() => {
    const configuredRows = parseLandingPricingTable(
      status?.landing_pricing_table
    )
    return configuredRows.length > 0
      ? configuredRows
      : buildDefaultPricingRows(t)
  }, [status?.landing_pricing_table, t])

  return (
    <section
      id={PUBLIC_PRICING_ANCHOR}
      className='border-border/40 bg-muted/10 relative z-10 border-y px-6 py-24 md:py-28'
    >
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-12 max-w-2xl'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
            {t('Public Pricing')}
          </p>
          <h2 className='text-2xl leading-tight font-bold tracking-tight md:text-3xl'>
            {t('Clear pricing before you create an account')}
          </h2>
          <p className='text-muted-foreground mt-4 text-sm leading-relaxed md:text-base'>
            {t(
              'VibeAPI is designed for developers, AI product teams, and platform operators who need one gateway for routing, access control, usage analytics, and billing visibility.'
            )}
          </p>
        </AnimateInView>

        <AnimateInView animation='fade-up'>
          <div className='border-border/50 bg-background/80 hidden overflow-hidden rounded-lg border md:block'>
            <table className='w-full table-fixed text-left text-sm'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th className='w-[22%] px-4 py-3 font-medium'>{t('Plan')}</th>
                  <th className='w-[18%] px-4 py-3 font-medium'>
                    {t('Price')}
                  </th>
                  <th className='w-[30%] px-4 py-3 font-medium'>
                    {t('Description')}
                  </th>
                  <th className='px-4 py-3 font-medium'>{t('Included')}</th>
                </tr>
              </thead>
              <tbody className='divide-border/50 divide-y'>
                {pricingRows.map((row) => (
                  <tr key={row.name} className='align-top'>
                    <td className='px-4 py-4'>
                      <div className='font-semibold'>{row.name}</div>
                      {row.cta ? (
                        <div className='text-muted-foreground mt-1 text-xs'>
                          {row.cta}
                        </div>
                      ) : null}
                    </td>
                    <td className='px-4 py-4 font-mono text-base font-semibold tabular-nums'>
                      {row.price}
                    </td>
                    <td className='text-muted-foreground px-4 py-4 leading-relaxed'>
                      {row.description}
                    </td>
                    <td className='px-4 py-4'>
                      <ul className='space-y-2'>
                        {row.features.map((feature) => (
                          <li key={feature} className='flex gap-2'>
                            <Check className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                            <span className='text-muted-foreground'>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='grid gap-4 md:hidden'>
            {pricingRows.map((row) => (
              <div
                key={row.name}
                className='border-border/50 bg-background/80 rounded-lg border p-4'
              >
                <div className='mb-3 flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold'>{row.name}</h3>
                    {row.cta ? (
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {row.cta}
                      </p>
                    ) : null}
                  </div>
                  <div className='font-mono text-base font-semibold tabular-nums'>
                    {row.price}
                  </div>
                </div>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {row.description}
                </p>
                <ul className='mt-4 space-y-2'>
                  {row.features.map((feature) => (
                    <li key={feature} className='flex gap-2 text-sm'>
                      <Check className='mt-0.5 size-4 shrink-0 text-emerald-500' />
                      <span className='text-muted-foreground'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AnimateInView>

        <AnimateInView
          animation='fade-up'
          className='mt-8 flex flex-col items-start justify-between gap-4 rounded-lg border bg-background/70 px-4 py-4 sm:flex-row sm:items-center'
        >
          <div className='space-y-1'>
            <p className='text-sm font-medium'>
              {t('Need help choosing a plan?')}
            </p>
            <p className='text-muted-foreground text-sm'>
              {t('Contact customer support at {{email}}.', {
                email: PUBLIC_SUPPORT_EMAIL,
              })}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              className='rounded-lg'
              render={<a href={PUBLIC_SUPPORT_MAILTO} />}
            >
              <Mail className='size-4' />
              {t('Email support')}
            </Button>
            <Button className='rounded-lg' render={<Link to='/sign-up' />}>
              {t('Create an account')}
            </Button>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
