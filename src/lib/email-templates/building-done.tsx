import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { DICT, RTL, type Lang } from '@/game/i18n'

interface Props {
  lang?: Lang
  mayor?: string
  town?: string
  building?: string
}

const pick = (l?: string): Lang => (l && l in DICT ? (l as Lang) : 'de')

const BuildingDone = ({ lang, mayor, town, building }: Props) => {
  const l = pick(lang), m = DICT[l].guide.mail
  const b = building || '…', t = town || 'Samenland'
  return (
    <Html lang={l} dir={RTL[l] ? 'rtl' : 'ltr'}>
      <Head />
      <Preview>{m.subject(b, t)}</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Section style={parchment}>
            <Img src="https://samenland.app/favicon.png" width="56" height="56" alt="Samenland" style={{ margin: '0 auto 8px' }} />
            <Heading style={h1}>{m.subject(b, t)}</Heading>
            <Text style={rule}>❦</Text>
            <Text style={text}>{m.hello(mayor || '')}</Text>
            <Text style={text}>{m.body(b, t)}</Text>
            <Section style={{ textAlign: 'center', margin: '24px 0 8px' }}>
              <Button href="https://samenland.app" style={button}>{m.cta}</Button>
            </Section>
            <Text style={sign}>— {m.sign}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BuildingDone,
  subject: (d: Record<string, any>) => DICT[pick(d.lang)].guide.mail.subject(d.building || '…', d.town || 'Samenland'),
  displayName: 'Gebäude fertig',
  previewData: { lang: 'de', mayor: 'Stephan', town: 'Roggenfeld', building: 'Kräuterhütte' },
} satisfies TemplateEntry

const serif = "Georgia, 'Times New Roman', serif"
const main = { backgroundColor: '#ffffff', fontFamily: serif, margin: 0, padding: '24px 0' }
const outer = { maxWidth: '520px', margin: '0 auto', padding: '0 12px' }
const parchment = {
  backgroundColor: '#f3e6c4',
  backgroundImage: 'radial-gradient(circle at 50% 40%, #f8eed4 0%, #efdcb0 70%, #e2c891 100%)',
  border: '2px solid #8a5a2b',
  borderRadius: '6px',
  boxShadow: 'inset 0 0 40px rgba(120,80,30,0.35)',
  padding: '32px 28px',
  textAlign: 'center' as const,
}
const h1 = { color: '#4a2c14', fontFamily: serif, fontSize: '26px', fontStyle: 'italic', margin: '0 0 4px' }
const rule = { color: '#8a5a2b', fontSize: '20px', margin: '0 0 12px' }
const text = { color: '#3b2a1a', fontSize: '16px', lineHeight: '1.6', margin: '0 0 12px' }
const sign = { color: '#6b4a2a', fontSize: '15px', fontStyle: 'italic', margin: '16px 0 0' }
const button = { backgroundColor: '#5b3a1e', color: '#f8eed4', borderRadius: '4px', padding: '12px 22px', fontSize: '16px', fontFamily: serif, textDecoration: 'none' }
