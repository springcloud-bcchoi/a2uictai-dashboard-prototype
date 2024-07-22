'use client';

import { useContext, useState, useEffect } from "react";
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss } from '@/components/Wss';

interface GroupedData {
  [router_id: string]: {
    agrData: AgrData[];
    mqttData: (ElicitData | RadarUsbData | RadarWifiData)[];
  };
}

const groupDataByRouterId = (agrDataDb: AgrData[], mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData)[]): GroupedData => {
  const groupedData: GroupedData = {};

  agrDataDb.forEach(data => {
    const { router_id } = data.data;
    if (!groupedData[router_id]) {
      groupedData[router_id] = { agrData: [], mqttData: [] };
    }
    groupedData[router_id].agrData.push(data);
  });

  mqttDataDb.forEach(data => {
    const router_id = data.topic_id.split('/')[0]; // Assuming the topic_id format is router_id/device_id
    if (!groupedData[router_id]) {
      groupedData[router_id] = { agrData: [], mqttData: [] };
    }
    groupedData[router_id].mqttData.push(data);
  });

  return groupedData;
};

const useHighlightUpdate = (
  agrDataDb: AgrData[],
  mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData)[]
): { [key: string]: { agr: boolean; mqtt: boolean } } => {
  const [highlightedRouters, setHighlightedRouters] = useState<{ [key: string]: { agr: boolean; mqtt: boolean } }>({});

  useEffect(() => {
    if (agrDataDb.length > 0) {
      const lastAgrData = agrDataDb[agrDataDb.length - 1];
      const routerId = lastAgrData.data.router_id;
      setHighlightedRouters(prev => ({
        ...prev,
        [routerId]: { ...prev[routerId], agr: true }
      }));
      const timeout = setTimeout(() => {
        setHighlightedRouters(prev => ({
          ...prev,
          [routerId]: { ...prev[routerId], agr: false }
        }));
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [agrDataDb]);

  useEffect(() => {
    if (mqttDataDb.length > 0) {
      const lastMqttData = mqttDataDb[mqttDataDb.length - 1];
      const routerId = lastMqttData.topic_id.split('/')[0];
      setHighlightedRouters(prev => ({
        ...prev,
        [routerId]: { ...prev[routerId], mqtt: true }
      }));
      const timeout = setTimeout(() => {
        setHighlightedRouters(prev => ({
          ...prev,
          [routerId]: { ...prev[routerId], mqtt: false }
        }));
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [mqttDataDb]);

  return highlightedRouters;
};

export default function Home() {
  const { isConnected, agrDataDb, mqttDataDb } = useContext(Wss);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const groupedData = groupDataByRouterId(agrDataDb, mqttDataDb);
  const highlightedRouters = useHighlightUpdate(agrDataDb, mqttDataDb);

  useEffect(() => {
    const handleUpdates = (routerId: string, type: 'agr' | 'mqtt') => {
      setExpandedSections(prev => ({
        ...prev,
        [`${routerId}-${type}`]: true,
      }));
      const timeout = setTimeout(() => {
        setExpandedSections(prev => ({
          ...prev,
          [`${routerId}-${type}`]: false,
        }));
      }, 500);
      return () => clearTimeout(timeout);
    };

    const agrRouterId = agrDataDb.length > 0 ? agrDataDb[agrDataDb.length - 1].data.router_id : null;
    if (agrRouterId && highlightedRouters[agrRouterId]?.agr) {
      handleUpdates(agrRouterId, 'agr');
    }

    const mqttRouterId = mqttDataDb.length > 0 ? mqttDataDb[mqttDataDb.length - 1].topic_id.split('/')[0] : null;
    if (mqttRouterId && highlightedRouters[mqttRouterId]?.mqtt) {
      handleUpdates(mqttRouterId, 'mqtt');
    }
  }, [agrDataDb, mqttDataDb, highlightedRouters]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="font-sans">
      <h1 className="text-2xl font-bold mb-4">WebSocket Data Display</h1>
      <p className="mb-4">WebSocket Connected: {isConnected ? 'Yes' : 'No'}</p>

      {Object.entries(groupedData).map(([router_id, data]) => {
        const isHighlightedAgr = highlightedRouters[router_id]?.agr;
        const isHighlightedMqtt = highlightedRouters[router_id]?.mqtt;
        const highlightClass = isHighlightedAgr ? 'text-red-500' : isHighlightedMqtt ? 'text-blue-500' : 'text-gray-800';

        return (
          <div key={router_id} className="border-b border-gray-300 pb-4 mb-4">
            <h2 className={`cursor-pointer text-xl font-semibold ${highlightClass}`}>
              Router ID: {router_id}
            </h2>

            <h3
              onClick={() => toggleSection(`${router_id}-agr`)}
              className={`cursor-pointer text-lg font-semibold ${expandedSections[`${router_id}-agr`] ? 'text-red-500' : 'text-gray-600'}`}
            >
              {expandedSections[`${router_id}-agr`] ? '-' : '+'} AGR Data
            </h3>
            {expandedSections[`${router_id}-agr`] && data.agrData.map((agr, index) => (
              <div key={index} className="pl-6 border-l-2 border-gray-200 ml-4">
                <p><strong>Connection ID:</strong> {agr.connection_id}</p>
                <h4 className="font-semibold text-gray-700">Docker Status</h4>
                {agr.data.docker_values.value.state.map((docker, i) => (
                  <p key={i}>{docker.name}: {docker.ps.Status} (Running: {docker.ps.Running ? 'Yes' : 'No'})</p>
                ))}
                <h4 className="font-semibold text-gray-700">System Status</h4>
                <p>CPU Usage: {agr.data.system_values.value.cpu_usage}</p>
                <p>Memory Usage: {agr.data.system_values.value.mem_usage}</p>
                <p>Uptime: {agr.data.system_values.value.uptime}</p>
              </div>
            ))}

            <h3
              onClick={() => toggleSection(`${router_id}-mqtt`)}
              className={`cursor-pointer text-lg font-semibold ${expandedSections[`${router_id}-mqtt`] ? 'text-blue-500' : 'text-gray-600'}`}
            >
              {expandedSections[`${router_id}-mqtt`] ? '-' : '+'} MQTT Data
            </h3>
            {expandedSections[`${router_id}-mqtt`] && data.mqttData.map((mqtt, index) => (
              <div key={index} className="pl-6 border-l-2 border-gray-200 ml-4">
                <p><strong>Topic ID:</strong> {mqtt.topic_id}</p>
                <p>Data: {JSON.stringify(mqtt.data, null, 2)}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
