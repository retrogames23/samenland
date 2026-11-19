import { createEmailWebhookHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'

const BUG_DIGEST_TO = 'stephan.doerner@posteo.de'

export const Route = createFileRoute("/lovable/email/events")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }
        const handler = createEmailWebhookHandler({
          apiKey,
          on: {
            // Placeholder handlers — replace each log with the feature's reaction.
            // Throw on failure so the delivery is retried.
            'email.bounced': async (event) => {
              console.log('Email bounced', { event_id: event.event_id })
              // Fallback: a bounced Kummerkasten digest re-queues its reports for the next daily run.
              if (event.data.recipient?.toLowerCase() !== BUG_DIGEST_TO) return
              const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
              const since = new Date(Date.now() - 6 * 3600_000).toISOString()
              const { error } = await supabaseAdmin.from('bug_reports').update({ sent_at: null }).gte('sent_at', since)
              if (error) throw error
            },
            'email.complaint': async (event) => {
              console.log('Email complaint', { event_id: event.event_id })
            },
            'email.unsubscribed': async (event) => {
              console.log('Email unsubscribed', { event_id: event.event_id })
            },
          },
        })
        return handler(request)
      },
    },
  },
})
