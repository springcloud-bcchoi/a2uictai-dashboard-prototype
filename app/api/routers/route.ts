// /pages/api/robots.ts

import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const routers = await db.router.findMany({
      select: {
        routerId: true,
        name: true,
        desc: true,
        site: {
          select: {
            longitude: true,
            latitude: true,
            address: true,
            name: true,
            desc: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      routers,
    });
  } catch (error) {
    console.error('Error fetching robots:', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
 