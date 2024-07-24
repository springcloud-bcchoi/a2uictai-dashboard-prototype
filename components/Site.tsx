import dynamic from "next/dynamic";
import React from "react";

const DynamicMap = dynamic(() => import('../components/Map'), { ssr: false });

export interface SiteData {
  id: number;
  latitude: number;
  longitude: number;
  address: string;
  name: string;
  desc: string;
}

interface SiteProps {
  siteData: SiteData[];
}

const Site: React.FC<SiteProps> = ({ siteData }) => {
  return (
    <div className="col-span-3">
      <div className="h-[700px] overflow-y-scroll">
        <DynamicMap
          routers={siteData.map(site => ({
            id: site.id.toString(),
            latitude: site.latitude,
            longitude: site.longitude,
            name: site.name
          }))}
          center={[35.395, 127.8197222]}
          zoom={7}
          initialMapType="site"
        />
      </div>
    </div>
  );
};

export default Site;
