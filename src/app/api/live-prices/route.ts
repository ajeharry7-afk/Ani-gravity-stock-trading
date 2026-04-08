import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Price feed not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',').filter(Boolean) ?? [];

  if (symbols.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch quotes in parallel from Finnhub REST API
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
        { next: { revalidate: 0 } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      // Finnhub quote: { c: current, h: high, l: low, o: open, pc: prev close }
      return { symbol, price: data.c as number };
    })
  );

  const prices = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter((p): p is { symbol: string; price: number } => p !== null && p.price > 0);

  return NextResponse.json(prices);
}
