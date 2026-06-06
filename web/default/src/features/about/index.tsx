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
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BarChart3,
  KeyRound,
  Mail,
  Route,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  PUBLIC_PRICING_ANCHOR,
  PUBLIC_SUPPORT_EMAIL,
  PUBLIC_SUPPORT_MAILTO,
} from '@/lib/public-compliance'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { getAboutContent } from './api'

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function EmptyAboutState() {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const audiences = [
    {
      title: t('Developers building AI apps'),
      description: t(
        'Use OpenAI-compatible routes to connect chat, agent, and automation clients without rewriting every integration.'
      ),
      icon: <Route className='size-5' />,
    },
    {
      title: t('Platform operators'),
      description: t(
        'Manage channels, API keys, rate limits, quotas, and routing policies from one operational console.'
      ),
      icon: <KeyRound className='size-5' />,
    },
    {
      title: t('Teams watching cost and reliability'),
      description: t(
        'Track model usage, request logs, billing records, and upstream health before costs drift.'
      ),
      icon: <BarChart3 className='size-5' />,
    },
  ]

  return (
    <div className='mx-auto max-w-6xl px-6 py-24'>
      <div className='grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center'>
        <div className='space-y-6'>
          <div className='space-y-4'>
            <p className='text-muted-foreground text-xs font-medium tracking-widest uppercase'>
              {t('Product Introduction')}
            </p>
            <h1 className='text-3xl leading-tight font-bold tracking-tight md:text-5xl'>
              {t('{{product}} helps teams operate AI APIs with control', {
                product: systemName,
              })}
            </h1>
            <p className='text-muted-foreground text-base leading-relaxed md:text-lg'>
              {t(
                'Route requests across providers, manage user access, observe model usage, and expose billing information from a single self-hostable gateway.'
              )}
            </p>
          </div>

          <div className='flex flex-wrap gap-3'>
            <Button className='rounded-lg' render={<a href='/sign-up' />}>
              {t('Create an account')}
              <ArrowRight className='size-4' />
            </Button>
            <Button
              variant='outline'
              className='rounded-lg'
              render={<a href={`/#${PUBLIC_PRICING_ANCHOR}`} />}
            >
              {t('View pricing')}
            </Button>
          </div>

          <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-sm'>
            <span>{t('Customer support:')}</span>
            <a
              href={PUBLIC_SUPPORT_MAILTO}
              className='text-primary inline-flex items-center gap-1.5 font-medium underline underline-offset-4'
            >
              <Mail className='size-4' />
              {PUBLIC_SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className='grid gap-4'>
          {audiences.map((item) => (
            <div
              key={item.title}
              className='border-border/50 bg-muted/20 flex gap-4 rounded-lg border p-5'
            >
              <div className='bg-background text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg border'>
                {item.icon}
              </div>
              <div className='space-y-1.5'>
                <h2 className='text-base font-semibold'>{item.title}</h2>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {item.description}
                </p>
              </div>
            </div>
          ))}

          <div className='border-border/50 bg-background rounded-lg border p-5'>
            <div className='mb-2 flex items-center gap-2'>
              <Users className='text-muted-foreground size-5' />
              <h2 className='text-base font-semibold'>
                {t('How registration works')}
              </h2>
            </div>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {t(
                'Create an account, review the public pricing and legal terms, then use the console to create API keys, choose available models, and monitor usage.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isValidUrl(rawContent)
  const isHtml = hasContent && !isUrl && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout>
        <EmptyAboutState />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-6xl px-4 py-8'>
        {isHtml ? (
          <div
            className='prose prose-neutral dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        ) : (
          <Markdown className='prose-neutral dark:prose-invert max-w-none'>
            {rawContent}
          </Markdown>
        )}
      </div>
    </PublicLayout>
  )
}
