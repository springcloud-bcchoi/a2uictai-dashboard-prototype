// src/components/map/index.tsx

"use client"

import {MapContainer, TileLayer, Marker, Popup} from "react-leaflet";
import {LatLngExpression, LatLngTuple} from 'leaflet';

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import React, {useEffect, useState} from "react";
import { Divider, Text } from "@chakra-ui/react";
import Link from "next/link";


interface MapProps {
  locations: { id: string; latitude: number; longitude: number; name: string; addr: string }[];
  center: [number, number];
  zoom: number;
  initialMapType: 'site' | 'robot';
  scrollWheelZoom: boolean;
  path?:{base: string, rest?: string};
}


const Map: React.FC<MapProps> = ({locations, center, zoom, initialMapType, path}) => {
  const [mapType, setMapType] = useState<'site' | 'robot'>(initialMapType);
  const url =
    mapType === 'site'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{height: "100%", width: "100%"}}
    >
      <TileLayer
        url={url}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors <a href="https://a2uictai-dashboard-prototype.vercel.app/">A2UICT</a>'
      />
      {locations.map((location) => {
        const popupContent = (
          <>
            <Text
              css={{
                fontSize: 'sm !important',
                fontWeight: 'bold !important',
                marginTop: '5px !important',
                marginBottom: '5px !important'
              }}
            >
              {location.name}
            </Text>
            <Divider />
            <Text>{location.addr}</Text>
          </>
        );

        return(
          <Marker 
            key={location.id} 
            position={[location.latitude, location.longitude]} 
            draggable={false}
          >
            <Popup>
            {path ? (  // path가 있을 때는 Link로 감쌈
                <Link
                  href={`${path.base}/${location.name}${path.rest ? `/${path.rest}` : ''}`}
                  className="rounded-md p-2 hover:bg-gray-100"
                >
                  {popupContent}
                </Link>
              ) : (  // path가 없을 때는 Link 없이 텍스트만 출력
                popupContent
              )}
            </Popup>
          </Marker>
          )
      })}
    </MapContainer>
  )
}

export default Map