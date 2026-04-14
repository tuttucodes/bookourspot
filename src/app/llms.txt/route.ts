export async function GET() {
  const content = `
# BookOurSpot

BookOurSpot is an appointment booking platform focused on Malaysia.

## Public Pages
- https://bookourspot.com/
- https://bookourspot.com/explore
- https://bookourspot.com/skbarber

## Product Summary
Users can discover local salons, barbershops, spas, and car washes, compare options, and book available slots online.

## Crawling Guidance
- Public discovery pages may be indexed.
- User dashboards and authenticated account areas should not be indexed.
`.trim();

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
