'use client';

import { useContext, useEffect, useState } from "react";
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss } from "@/components/Wss";

export default function Home() {
  const {
    isConnected,
    agrData,
    mqttData,
    agrDataDb,
    mqttDataDb,
  } = useContext(Wss);

  const [currentAgrData, setCurrentAgrData] = useState<AgrData[]>([]);
  const [currentMqttData, setCurrentMqttData] = useState<(ElicitData | RadarUsbData | RadarWifiData)[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  const toggleGroup = (prefix: string) => {
    setExpandedGroups((prev) => {
      const newExpandedGroups = new Set(prev);
      if (newExpandedGroups.has(prefix)) {
        newExpandedGroups.delete(prefix);
      } else {
        newExpandedGroups.add(prefix);
      }
      return newExpandedGroups;
    });
  };

  const groupedData = currentMqttData.reduce((groups, router) => {
    const prefix = router.topic_id.split('/')[0].slice(0, 4);
    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(router);
    return groups;
  }, {} as Record<string, (ElicitData | RadarUsbData | RadarWifiData)[]>);

  const renderTable = (data: Record<string, any>) => (
    <table className="min-w-full mb-4 text-xs">
      <thead>
      <tr>
        <th className="py-1">Key</th>
        <th className="py-1">Value</th>
      </tr>
      </thead>
      <tbody>
      {Object.entries(data).map(([key, value]) => (
        <tr key={key}>
          <td className="border px-2 py-1">{key}</td>
          <td className="border px-2 py-1">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</td>
        </tr>
      ))}
      </tbody>
    </table>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold mb-4">Zeta Satellite Router Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-3">
          {Object.entries(groupedData).map(([prefix, routers]) => {
            const relatedConnections = currentAgrData.filter(
              (connection) => connection.data.router_id.startsWith(prefix)
            );
            return (
              <div key={prefix} className="mb-4 p-4 border rounded shadow text-xs relative">
                <h2 className="text-lg font-semibold flex items-center justify-between">
                  <span onClick={() => toggleGroup(prefix)} style={{ cursor: 'pointer' }}>
                    {`Group: ${prefix}`}
                    <button className="ml-2">
                      {expandedGroups.has(prefix) ? '-' : '+'}
                    </button>
                  </span>
                </h2>
                {expandedGroups.has(prefix) && (
                  <div>
                    {routers.map((router) => (
                      <div key={router.topic_id} className="mb-4">
                        <h3>Router: {router.topic_id}</h3>
                        <pre>{JSON.stringify(router, null, 2)}</pre>
                      </div>
                    ))}
                    <h3>Related Connections</h3>
                    {relatedConnections.map((connection) => (
                      <div key={connection.connection_id} className="mb-4">
                        <h4>{`Router ID: ${connection.data.router_id} / Connection ID: ${connection.connection_id}`}</h4>
                        <h5>Docker Values</h5>
                        {renderTable(connection.data.docker_values)}
                        <h5>System Values</h5>
                        {renderTable(connection.data.system_values)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
