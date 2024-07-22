'use client';

import React, { useContext, useEffect, useState } from 'react';
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss } from '@/components/Wss';

export default function Home() {
  const {
    isConnected,
    agrData,
    mqttData,
    agrDataDb,
    mqttDataDb,
    notifyDataDb,
    alertDataDb,
    elicitData,
    radarUsbData,
    radarWifiData,
  } = useContext(Wss);

  const [currentAgrData, setCurrentAgrData] = useState<AgrData[]>([]);
  const [currentMqttData, setCurrentMqttData] = useState<(ElicitData | RadarUsbData | RadarWifiData)[]>([]);

  useEffect(() => {
    if (agrDataDb.length > 0) {
      setCurrentAgrData(agrDataDb);
      // console.log('dashboard agrDataDb:', agrDataDb);
    }
  }, [agrDataDb]);

  useEffect(() => {
    if (mqttDataDb.length > 0) {
      const filteredMqttData = mqttDataDb.filter((data) => data.topic_id !== "000000");
      setCurrentMqttData(filteredMqttData);
      // console.log('dashboard mqttDataDb:', filteredMqttData);
    }
  }, [mqttDataDb]);

  useEffect(() => {
    if (agrData) {
      setCurrentAgrData((prevData) => {
        const existingIndex = prevData.findIndex((data) => data.connection_id === agrData.connection_id);
        if (existingIndex !== -1) {
          prevData[existingIndex] = agrData;
          return [...prevData];
        } else {
          return [...prevData, agrData];
        }
      });
      // console.log('dashboard agrData:', agrData);
    }
  }, [agrData]);

  useEffect(() => {
    if (mqttData) {
      setCurrentMqttData((prevData) => {
        const existingIndex = prevData.findIndex((data) => data.topic_id === mqttData.topic_id);
        if (existingIndex !== -1) {
          prevData[existingIndex] = mqttData;
          return [...prevData];
        } else {
          return [...prevData, mqttData];
        }
      });
      // console.log('dashboard mqttData:', mqttData);
    }
  }, [mqttData]);

  return (
    <div>
      <h1>Home Page</h1>
      <p>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <div>
        <h2>AGR Data</h2>
        <pre>{JSON.stringify(currentAgrData, null, 2)}</pre>
      </div>
      <div>
        <h2>MQTT Data</h2>
        <pre>{JSON.stringify(currentMqttData, null, 2)}</pre>
      </div>
      <div>
        <h2>AGR Data DB</h2>
        <pre>{JSON.stringify(agrDataDb, null, 2)}</pre>
      </div>
      <div>
        <h2>MQTT Data DB</h2>
        <pre>{JSON.stringify(mqttDataDb, null, 2)}</pre>
      </div>
      <div>
        <h2>Notify Data DB</h2>
        <pre>{JSON.stringify(notifyDataDb, null, 2)}</pre>
      </div>
      <div>
        <h2>Alert Data DB</h2>
        <pre>{JSON.stringify(alertDataDb, null, 2)}</pre>
      </div>
      <div>
        <h2>Elicit Data</h2>
        <pre>{JSON.stringify(elicitData, null, 2)}</pre>
      </div>
      <div>
        <h2>Radar USB Data</h2>
        <pre>{JSON.stringify(radarUsbData, null, 2)}</pre>
      </div>
      <div>
        <h2>Radar WiFi Data</h2>
        <pre>{JSON.stringify(radarWifiData, null, 2)}</pre>
      </div>
    </div>
  );
}
