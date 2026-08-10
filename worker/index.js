const routes = [
  { prefix: '/api/data-go', origin: 'https://data.go.th', replacement: '/api/3/action', maxAge: 3600 },
  { prefix: '/api/catalog-oae', origin: 'https://catalog.oae.go.th', replacement: '/api/3/action', maxAge: 43200 },
  { prefix: '/api/catalog-acfs', origin: 'https://catalog-acfs.data.go.th', replacement: '/api/3/action', maxAge: 21600 },
  { prefix: '/api/nasa-power', origin: 'https://power.larc.nasa.gov', replacement: '/api', maxAge: 604800 },
]

function apiTarget(url) {
  const route = routes.find((candidate) => url.pathname.startsWith(candidate.prefix))
  if (!route) return null
  const target = new URL(route.origin)
  target.pathname = `${route.replacement}${url.pathname.slice(route.prefix.length)}`
  target.search = url.search
  return { target, route }
}

async function withAbsoluteMetadata(response, origin) {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('text/html')) return response
  const html = (await response.text()).replaceAll('__SITE_ORIGIN__', origin)
  const headers = new Headers(response.headers)
  headers.delete('Content-Length')
  return new Response(html, { status: response.status, headers })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const api = apiTarget(url)

    if (api) {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
      }
      const response = await fetch(api.target, {
        method: request.method,
        headers: { Accept: 'application/json' },
      })
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') ?? 'application/json; charset=utf-8',
          'Cache-Control': `public, max-age=${api.route.maxAge}, stale-while-revalidate=86400`,
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    const asset = await env.ASSETS.fetch(request)
    if (asset.status !== 404 || request.method !== 'GET') return withAbsoluteMetadata(asset, url.origin)
    const accept = request.headers.get('Accept') ?? ''
    if (!accept.includes('text/html')) return asset
    const fallback = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
    return withAbsoluteMetadata(fallback, url.origin)
  },
}
