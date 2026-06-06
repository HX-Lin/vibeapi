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
import {
  BarChart3,
  CreditCard,
  Mail,
  Route as RouteIcon,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PUBLIC_PRICING_ANCHOR,
  PUBLIC_SUPPORT_EMAIL,
  PUBLIC_SUPPORT_MAILTO,
} from '@/lib/public-compliance'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'

type AuthLayoutProps = {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()
  const highlights = [
    {
      title: t('Unified model routing'),
      description: t(
        'Connect OpenAI-compatible clients to multiple upstream AI providers through one gateway.'
      ),
      icon: <RouteIcon className='size-4' />,
    },
    {
      title: t('Access and budget controls'),
      description: t(
        'Create keys, assign user groups, set rate limits, and keep spend predictable.'
      ),
      icon: <ShieldCheck className='size-4' />,
    },
    {
      title: t('Usage analytics and billing'),
      description: t(
        'Track requests, token usage, model costs, and recharge records in one console.'
      ),
      icon: <BarChart3 className='size-4' />,
    },
  ]

  return (
    <div className='bg-background relative min-h-svh max-w-none'>
      <Link
        to='/'
        className='absolute top-4 left-4 z-10 flex items-center gap-2 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
      >
        <div className='relative h-8 w-8'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-full' />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='h-8 w-8 rounded-full object-cover'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1 className='text-xl font-medium'>{systemName}</h1>
        )}
      </Link>
      <div className='grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]'>
        <aside className='border-border/40 bg-muted/20 hidden min-h-svh border-r px-10 pt-28 pb-10 lg:flex lg:flex-col lg:justify-between'>
          <div className='max-w-xl space-y-8'>
            <div className='space-y-4'>
              <p className='text-muted-foreground text-xs font-medium tracking-widest uppercase'>
                {t('Product Overview')}
              </p>
              <div className='space-y-3'>
                <h2 className='text-3xl leading-tight font-bold tracking-tight'>
                  {t('One AI API gateway for teams that need control')}
                </h2>
                <p className='text-muted-foreground leading-relaxed'>
                  {t(
                    'VibeAPI helps developers, AI product teams, and platform operators route model traffic, manage access, observe usage, and expose transparent billing from a single console.'
                  )}
                </p>
              </div>
            </div>

            <div className='grid gap-3'>
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className='border-border/50 bg-background/70 flex gap-3 rounded-lg border p-4'
                >
                  <div className='bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg border'>
                    {item.icon}
                  </div>
                  <div className='min-w-0 space-y-1'>
                    <h3 className='text-sm font-semibold'>{item.title}</h3>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='border-border/50 bg-background/70 rounded-lg border p-4'>
              <div className='mb-3 flex items-center gap-2'>
                <CreditCard className='text-muted-foreground size-4' />
                <p className='text-sm font-semibold'>{t('Public pricing')}</p>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {t(
                  'Self-hosted platform access is $0/month. Default usage accounting is $0.002 / 1K tokens, with detailed model prices shown before use.'
                )}
              </p>
              <a
                href={`/#${PUBLIC_PRICING_ANCHOR}`}
                className='text-primary mt-3 inline-flex text-sm font-medium underline underline-offset-4'
              >
                {t('View public pricing')}
              </a>
            </div>
          </div>

          <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-xs'>
            <a
              href={PUBLIC_SUPPORT_MAILTO}
              className='hover:text-foreground inline-flex items-center gap-1.5 transition-colors'
            >
              <Mail className='size-3.5' />
              {PUBLIC_SUPPORT_EMAIL}
            </a>
            <span aria-hidden='true'>·</span>
            <Link
              to='/privacy-policy'
              className='hover:text-foreground transition-colors'
            >
              {t('Privacy Policy')}
            </Link>
            <span aria-hidden='true'>·</span>
            <Link
              to='/user-agreement'
              className='hover:text-foreground transition-colors'
            >
              {t('User Agreement')}
            </Link>
          </div>
        </aside>

        <div className='container flex items-center pt-16 sm:pt-0'>
          <div className='mx-auto flex w-full flex-col justify-center space-y-6 px-4 py-8 sm:w-[480px] sm:p-8'>
            <div className='border-border/50 bg-muted/20 rounded-lg border p-4 lg:hidden'>
              <div className='mb-3 flex items-center gap-2'>
                <Users className='text-muted-foreground size-4' />
                <p className='text-sm font-semibold'>
                  {t('AI gateway for developers and teams')}
                </p>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {t(
                  'Route model requests, manage API access, track usage, and review public pricing before you register.'
                )}
              </p>
              <div className='mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs'>
                <a
                  href={`/#${PUBLIC_PRICING_ANCHOR}`}
                  className='text-primary font-medium underline underline-offset-4'
                >
                  {t('Pricing')}
                </a>
                <a
                  href={PUBLIC_SUPPORT_MAILTO}
                  className='text-primary font-medium underline underline-offset-4'
                >
                  {PUBLIC_SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
