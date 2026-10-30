import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface DigestItem {
  kind: string
  body: string
  at: string
  who: string
  context: string
  shots: string[]
}

const KIND: Record<string, string> = { bug: 'Fehler', idea: 'Idee', other: 'Sonstiges' }

const BugDigest = ({ items = [] }: { items?: DigestItem[] }) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>{`${items.length} neue Meldungen aus dem Kummerkasten`}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Heading style={h1}>Kummerkasten – {items.length} neue Meldungen</Heading>
        {items.map((it, i) => (
          <Section key={i} style={card}>
            <Text style={meta}>{KIND[it.kind] ?? it.kind} · {it.at} · {it.who}</Text>
            <Text style={text}>{it.body}</Text>
            {it.shots.length > 0 && (
              <Text style={meta}>
                Bilder (7 Tage gültig):{' '}
                {it.shots.map((u, j) => (<React.Fragment key={j}><Link href={u} style={link}>Bild {j + 1}</Link>{' '}</React.Fragment>))}
              </Text>
            )}
            <Text style={small}>{it.context}</Text>
            <Hr />
          </Section>
        ))}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BugDigest,
  subject: (d: Record<string, any>) => `Samenland Kummerkasten: ${(d['items'] ?? []).length} neue Meldungen`,
  displayName: 'Kummerkasten (täglich)',
  to: 'stephan.doerner@posteo.de',
  previewData: { items: [{ kind: 'bug', body: 'Der Chat ist auf dem Handy abgeschnitten.', at: '30.10.2026 22:10', who: 'Pferderich (Roggenfeld)', context: 'europe · de · 393x852@3', shots: ['https://samenland.app'] }] },
} satisfies TemplateEntry

const serif = "Georgia, 'Times New Roman', serif"
const main = { backgroundColor: '#ffffff', fontFamily: serif, margin: 0, padding: '24px 0' }
const outer = { maxWidth: '600px', margin: '0 auto', padding: '0 12px' }
const h1 = { fontSize: '20px', color: '#3b2a1a', margin: '0 0 16px' }
const card = { margin: '0 0 8px' }
const meta = { fontSize: '13px', color: '#7a5c3a', margin: '0 0 4px' }
const text = { fontSize: '15px', color: '#2b2118', whiteSpace: 'pre-wrap' as const, margin: '0 0 6px' }
const small = { fontSize: '11px', color: '#9a8a78', margin: '0 0 6px' }
const link = { color: '#8a4b14' }
