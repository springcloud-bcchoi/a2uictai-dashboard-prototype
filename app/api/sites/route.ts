// /pages/api/sites.ts

import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sites = await db.site.findMany({
      select: {
        id: true,
        latitude: true,
        longitude: true,
        address: true,
        name: true,
        desc: true,
      },
    });

    return NextResponse.json({
      ok: true,
      sites,
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
