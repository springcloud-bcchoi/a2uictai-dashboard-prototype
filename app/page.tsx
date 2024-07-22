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
  const [expandedDockerValues, setExpandedDockerValues] = useState<Set<string>>(new Set());
  const [expandedSystemValues, setExpandedSystemValues] = useState<Set<string>>(new Set());
  const [isDayMode, setIsDayMode] = useState<boolean>(false); // 기본을 Night 모드로 설정
  const [blinkGroups, setBlinkGroups] = useState<Set<string>>(new Set()); // 추가: 깜빡임 상태를 관리합니다.

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
      setBlinkGroups((prev) => {
        const newBlinkGroups = new Set(prev);
        newBlinkGroups.add(agrData.data.router_id);
        setTimeout(() => {
          newBlinkGroups.delete(agrData.data.router_id);
          setBlinkGroups(new Set(newBlinkGroups));
        }, 1000); // 1초 동안 깜빡임
        return newBlinkGroups;
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
      const routerId = mqttData.topic_id.split('/')[0];
      setBlinkGroups((prev) => {
        const newBlinkGroups = new Set(prev);
        newBlinkGroups.add(routerId);
        setTimeout(() => {
          newBlinkGroups.delete(routerId);
          setBlinkGroups(new Set(newBlinkGroups));
        }, 1000); // 1초 동안 깜빡임
        return newBlinkGroups;
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

  const toggleDockerValues = (connectionId: string) => {
    setExpandedDockerValues((prev) => {
      const newExpandedDockerValues = new Set(prev);
      if (newExpandedDockerValues.has(connectionId)) {
        newExpandedDockerValues.delete(connectionId);
      } else {
        newExpandedDockerValues.add(connectionId);
      }
      return newExpandedDockerValues;
    });
  };

  const toggleSystemValues = (connectionId: string) => {
    setExpandedSystemValues((prev) => {
      const newExpandedSystemValues = new Set(prev);
      if (newExpandedSystemValues.has(connectionId)) {
        newExpandedSystemValues.delete(connectionId);
      } else {
        newExpandedSystemValues.add(connectionId);
      }
      return newExpandedSystemValues;
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
          <strong>{key}:</strong> {value !== undefined ? (typeof value === 'object' ? JSON.stringify(value) : value.toString()) : ''}
        </li>
      ))}
    </ul>
  );

  const renderDockerValues = (dockerValues: any) => (
    <div>
      {dockerValues.state && Array.isArray(dockerValues.state) && (
        <div>
          {dockerValues.state.map((stateItem: any, index: number) => (
            <div key={index} className="mb-2">
              <h5>State {index + 1}</h5>
              {renderDataList(stateItem)}
            </div>
          ))}
        </div>
      )}
      {Object.entries(dockerValues).filter(([key]) => key !== 'state').map(([key, value]) => (
        <div key={key} className="mb-1">
          <strong>{key}:</strong> {value !== undefined ? (typeof value === 'object' ? JSON.stringify(value) : value.toString()) : ''}
        </div>
      ))}
    </div>
  );

  return (
    <div className={`container mx-auto p-4 ${isDayMode ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold mb-4">A2UICT Router Dashboard</h1>
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
            <div key={routerId} className={`mb-4 p-4 border rounded shadow text-xs relative ${isDayMode ? 'bg-gray-200' : 'bg-gray-800 text-white'}`}>
              <h2 className={`text-lg font-semibold flex items-center justify-between ${blinkGroups.has(routerId) ? 'blink' : ''}`}>
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
                  {connections.map((connection) => (
                    <div key={connection.connection_id} className="mb-4">
                      <h4 className="flex justify-between items-center">
                        <span onClick={() => toggleDockerValues(connection.connection_id)} style={{ cursor: 'pointer' }}>
                          Docker Values
                          <button className="ml-2">
                            {expandedDockerValues.has(connection.connection_id) ? '-' : '+'}
                          </button>
                        </span>
                      </h4>
                      {expandedDockerValues.has(connection.connection_id) && (
                        <div>{renderDockerValues(connection.data.docker_values.value)}</div>
                      )}
                      <h4 className="flex justify-between items-center">
                        <span onClick={() => toggleSystemValues(connection.connection_id)} style={{ cursor: 'pointer' }}>
                          System Values
                          <button className="ml-2">
                            {expandedSystemValues.has(connection.connection_id) ? '-' : '+'}
                          </button>
                        </span>
                      </h4>
                      {expandedSystemValues.has(connection.connection_id) && (
                        <div>{renderDataList(connection.data.system_values.value)}</div>
                      )}
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
