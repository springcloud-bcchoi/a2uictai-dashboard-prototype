// src/components/map/index.tsx

"use client"

import {MapContainer, TileLayer, Marker, Popup} from "react-leaflet";
import {LatLngExpression, LatLngTuple} from 'leaflet';

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import React, {useEffect, useState} from "react";
import { Divider, Text } from "@chakra-ui/react";


interface MapProps {
  locations: { id: string; latitude: number; longitude: number; name: string; addr: string }[];
  center: [number, number];
  zoom: number;
  initialMapType: 'site' | 'robot';
  scrollWheelZoom: boolean;
}


const Map: React.FC<MapProps> = ({locations, center, zoom, initialMapType}) => {
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
      {locations.map((location) => (
        <Marker key={location.id} position={[location.latitude, location.longitude]} draggable={false}>
          <Popup>
            <Text fontSize='sm' fontWeight='bold'>{location.name}</Text>
              <Divider/>
            <Text >{location.addr}</Text>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default Map