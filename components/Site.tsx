import { SiteData } from "@/app/service/site";
import dynamic from "next/dynamic";
import React from "react";

const DynamicMap = dynamic(() => import('../components/Map'), { ssr: false });


interface SiteProps {
  siteData: SiteData[];
}

const Site: React.FC<SiteProps> = ({ siteData }) => {
  return (
        <DynamicMap
          locations={siteData.map(site => ({
            id: site.id.toString(),
            latitude: site.latitude,
            longitude: site.longitude,
            name: site.name,
            addr: site.address
          }))}
          center={[siteData[0].latitude, siteData[0].longitude]}
          zoom={10}
          initialMapType="site"
          scrollWheelZoom={true}
        />
  );
};

export default Site;
