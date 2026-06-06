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
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  PUBLIC_PRICING_ANCHOR,
  PUBLIC_SUPPORT_EMAIL,
  PUBLIC_SUPPORT_MAILTO,
} from '@/lib/public-compliance'
import { useSystemConfig } from '@/hooks/use-system-config'

function LegalSection(props: { title: string; children: ReactNode }) {
  return (
    <section className='space-y-3'>
      <h2 className='text-xl font-semibold tracking-tight'>{props.title}</h2>
      <div className='text-muted-foreground space-y-3 text-sm leading-7'>
        {props.children}
      </div>
    </section>
  )
}

function ContactLink() {
  return (
    <a
      href={PUBLIC_SUPPORT_MAILTO}
      className='text-primary font-medium underline underline-offset-4'
    >
      {PUBLIC_SUPPORT_EMAIL}
    </a>
  )
}

export function DefaultPrivacyPolicy() {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()

  return (
    <article className='space-y-8'>
      <p className='text-muted-foreground text-sm'>
        {t('Last updated: June 6, 2026')}
      </p>

      <LegalSection title={t('Who we are')}>
        <p>
          {t(
            '{{product}} is an AI API gateway for routing model requests, managing API access, monitoring usage, and presenting billing information for users and teams.',
            { product: systemName }
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Information we process')}>
        <p>
          {t(
            'We may process account identifiers, usernames, email addresses, authentication and session data, API keys created by users, usage logs, request metadata, billing and top-up records, and support communications.'
          )}
        </p>
        <p>
          {t(
            'Depending on administrator settings, usage logs may include request or response metadata needed for troubleshooting, billing, abuse prevention, and service quality analysis.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('How we use information')}>
        <p>
          {t(
            'We use this information to provide the service, authenticate users, route API traffic, calculate usage and charges, prevent abuse, improve reliability, respond to support requests, and comply with legal obligations.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Sharing and subprocessors')}>
        <p>
          {t(
            'We do not sell personal information. We may share data with upstream AI providers, payment processors, infrastructure providers, analytics or monitoring tools, and professional advisers when required to operate the service or comply with law.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Retention and security')}>
        <p>
          {t(
            'We retain information for as long as needed to operate the service, maintain billing records, resolve disputes, enforce terms, and satisfy legal requirements. We use reasonable technical and organizational safeguards to protect service data.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Your choices')}>
        <p>
          {t(
            'You may access, update, export, or request deletion of your account information where supported by the service and applicable law. Some records may be retained when required for security, fraud prevention, billing, or legal compliance.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Contact us')}>
        <p>
          {t('For privacy questions, contact customer support at')}{' '}
          <ContactLink />.
        </p>
      </LegalSection>
    </article>
  )
}

export function DefaultUserAgreement() {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()

  return (
    <article className='space-y-8'>
      <p className='text-muted-foreground text-sm'>
        {t('Last updated: June 6, 2026')}
      </p>

      <LegalSection title={t('Service description')}>
        <p>
          {t(
            '{{product}} provides an AI API gateway for model routing, API key management, user access control, usage analytics, quota management, and billing visibility.',
            { product: systemName }
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Accounts and credentials')}>
        <p>
          {t(
            'You are responsible for keeping your account, password, API keys, and access tokens secure. You must provide accurate information and promptly update information that becomes outdated.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Acceptable use')}>
        <p>
          {t(
            'You must use the service in compliance with applicable laws, upstream provider policies, and this agreement. You may not use the service for illegal activity, abuse, security attacks, unauthorized access, malware, spam, or attempts to disrupt service availability.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Pricing and billing')}>
        <p>
          {t(
            'Self-hosted platform access is $0/month. Default usage accounting is $0.002 / 1K tokens. Preset credit packs start at 10 units, and Stripe top-up minimum is $1 when enabled.'
          )}
        </p>
        <p>
          {t(
            'Actual charges depend on selected models, configured providers, user group ratios, payment method settings, and administrator configuration. Detailed model prices are shown in Model Square or before use after sign-in.'
          )}{' '}
          <a
            href={`/#${PUBLIC_PRICING_ANCHOR}`}
            className='text-primary font-medium underline underline-offset-4'
          >
            {t('View public pricing')}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title={t('Availability and changes')}>
        <p>
          {t(
            'The service may depend on third-party upstream providers, payment processors, infrastructure, and network availability. Features, models, prices, and limits may change as providers or administrator settings change.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Disclaimers and limitations')}>
        <p>
          {t(
            'The service is provided as configured and may not be error-free or uninterrupted. AI model outputs can be inaccurate or inappropriate, and users are responsible for reviewing outputs before relying on them.'
          )}
        </p>
      </LegalSection>

      <LegalSection title={t('Privacy and support')}>
        <p>
          {t('Please review our')}{' '}
          <Link
            to='/privacy-policy'
            className='text-primary font-medium underline underline-offset-4'
          >
            {t('Privacy Policy')}
          </Link>{' '}
          {t('to understand how we process data. For support, contact')}{' '}
          <ContactLink />.
        </p>
      </LegalSection>
    </article>
  )
}
