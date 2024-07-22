'use client';

import { useContext, useEffect, useState } from "react";
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss } from "@/components/Wss";

export default function Home() {
  const {
    agrData,
    mqttData,
    agrDataDb,
    mqttDataDb,
  } = useContext(Wss);

  const [currentAgrData, setCurrentAgrData] = useState<AgrData[]>([]);
  const [currentMqttData, setCurrentMqttData] = useState<(ElicitData | RadarUsbData | RadarWifiData)[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [isDayMode, setIsDayMode] = useState<boolean>(true);

  useEffect(() => {
    if (agrDataDb.length > 0) {
      setCurrentAgrData(agrDataDb);
    }
  }, [agrDataDb]);

  useEffect(() => {
    if (mqttDataDb.length > 0) {
      const filteredMqttData = mqttDataDb.filter((data) => data.topic_id !== "000000");
      setCurrentMqttData(filteredMqttData);
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
    }
  }, [mqttData]);

  const toggleGroup = (routerId: string) => {
    setExpandedGroups((prev) => {
      const newExpandedGroups = new Set(prev);
      if (newExpandedGroups.has(routerId)) {
        newExpandedGroups.delete(routerId);
      } else {
        newExpandedGroups.add(routerId);
      }
      return newExpandedGroups;
    });
  };

  const toggleDevice = (deviceId: string) => {
    setExpandedDevices((prev) => {
      const newExpandedDevices = new Set(prev);
      if (newExpandedDevices.has(deviceId)) {
        newExpandedDevices.delete(deviceId);
      } else {
        newExpandedDevices.add(deviceId);
      }
      return newExpandedDevices;
    });
  };

  const groupedData = currentMqttData.reduce((groups, device) => {
    const [routerId, deviceAndStatus] = device.topic_id.split('/');
    const [deviceId, status] = deviceAndStatus.includes('AT+') ? deviceAndStatus.split('=') : [deviceAndStatus, ''];

    if (!groups[routerId]) {
      groups[routerId] = {
        devices: {},
        connections: currentAgrData.filter((connection) => connection.data.router_id === routerId),
      };
    }
    if (!groups[routerId].devices[deviceId]) {
      groups[routerId].devices[deviceId] = {};
    }
    groups[routerId].devices[deviceId][status] = device;
    return groups;
  }, {} as Record<string, { devices: Record<string, Record<string, ElicitData | RadarUsbData | RadarWifiData>>, connections: AgrData[] }>);

  const renderDataList = (data: Record<string, any>) => (
    <ul className="list-none p-0">
      {Object.entries(data).map(([key, value]) => (
        <li key={key} className="mb-1">
          <strong>{key}:</strong> {value.toString()}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`container mx-auto p-4 ${isDayMode ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold mb-4">Zeta Satellite Router Dashboard</h1>
        <button
          className={`px-2 py-1 rounded ${isDayMode ? 'bg-black text-white' : 'bg-white text-black'}`}
          onClick={() => setIsDayMode(!isDayMode)}
        >
          {isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-3">
          {Object.entries(groupedData).map(([routerId, { devices, connections }]) => (
            <div key={routerId} className="mb-4 p-4 border rounded shadow text-xs relative">
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <span onClick={() => toggleGroup(routerId)} style={{ cursor: 'pointer' }}>
                  {`Router ID: ${routerId} / Connection ID: ${connections.length > 0 ? connections[0].connection_id : 'No Connection'}`}
                  <button className="ml-2">
                    {expandedGroups.has(routerId) ? '-' : '+'}
                  </button>
                </span>
              </h2>
              {expandedGroups.has(routerId) && (
                <div>
                  <h3>Devices</h3>
                  {Object.entries(devices).map(([deviceId, statuses]) => (
                    <div key={deviceId} className="mb-4">
                      <h4 className="flex justify-between items-center">
                        <span onClick={() => toggleDevice(deviceId)} style={{ cursor: 'pointer' }}>
                          {`Device ID: ${deviceId}`}
                          <button className="ml-2">
                            {expandedDevices.has(deviceId) ? '-' : '+'}
                          </button>
                        </span>
                      </h4>
                      {expandedDevices.has(deviceId) && (
                        <div>
                          {Object.entries(statuses).map(([status, device]) => (
                            <div key={status}>
                              {status && <h5>Status: {status}</h5>}
                              {renderDataList(device.data)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <h3>Related Connections</h3>
                  {connections.map((connection) => (
                    <div key={connection.connection_id} className="mb-4">
                      <h4>{`Connection ID: ${connection.connection_id}`}</h4>
                      <h5>Docker Values</h5>
                      {renderDataList(connection.data.docker_values.value)}
                      <h5>System Values</h5>
                      {renderDataList(connection.data.system_values.value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
