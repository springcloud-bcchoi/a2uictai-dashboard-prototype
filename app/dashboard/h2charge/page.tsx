"use client"

import { SiteData } from '@/app/service/site';
import Site from '@/components/Site';
import SkeletonLoader from '@/components/SkeletonLoader';
import { lusitana } from '@/public/fonts/fonts';
// import { getRouters } from '@/app/lib/actions';
// import { RevenueChartSkeleton } from '@/app/ui/skeletons';
import dynamic from 'next/dynamic';
// import { Router } from 'next/router';
import { Suspense, useEffect, useState } from 'react';

// Map 컴포넌트를 동적으로 임포트하고 SSR을 비활성화
const DynamicMap = dynamic(() => import('@/components/Map'), {
    ssr: false
  });

export default function Page(){
  const siteData:SiteData[] = [
    { 
      id: 1,
      latitude: 37.45892066780336,
      longitude: 129.17304731072605,
      address: '삼척시 교동 산209번지 일원',
      name: '삼척교동 수소충전생산기지',
      desc: ''
    }, 
  ];

    // const [routers, setRouters] = useState<Site[]>(siteData);
    // const [routersLoading, setRoutersLoading] = useState(true);

    // useEffect(() => {
    //     async function fetchRoutersData() {
    //       try {
    //         // const routersData = await getRouters();
    //         // console.log('getRouters', routersData)
    //         // setRouters(routersData);
    //         setRouters(initialRouters);
    //         setRoutersLoading(false);
    //       } catch (error) {
    //         console.error('Failed to fetch routers data:', error);
    //       } finally {
    //         setRoutersLoading(false);
    //       }
    //     }
    
    //     fetchRoutersData().then(r => null);
    //   }, []);

    return (
        <main>
            <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
                수소충전생산기지
            </h1>
            
                <div className="rounded-xl bg-gray-50 p-2 mt-4">
                <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
                    지점
                </h2>
                <div className="bg-white-700 mx-auto my-5 w-[98%] h-[480px]">
                <Suspense fallback={<SkeletonLoader width="100%" height="100%" />}>
                    <Site siteData={siteData} />
                </Suspense>
                </div>
                </div>
      
        </main>
    );
}