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

const useHighlightUpdate = (deps: any[]) => {
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (deps.length > 0) {
      setHighlight(true);
      const timeout = setTimeout(() => setHighlight(false), 500);
      return () => clearTimeout(timeout);
    }
  }, deps);

  return highlight;
};

export default function Home() {
  const { isConnected, agrDataDb, mqttDataDb, latestAgrData, latestMqttData } = useContext(Wss);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const groupedData = groupDataByRouterId(agrDataDb, mqttDataDb);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const agrHighlight = useHighlightUpdate([latestAgrData]);
  const mqttHighlight = useHighlightUpdate([latestMqttData]);

  return (
    <div className="font-sans">
      <h1 className="text-2xl font-bold mb-4">WebSocket Data Display</h1>
      <p className="mb-4">WebSocket Connected: {isConnected ? 'Yes' : 'No'}</p>

      <h2 className={`mb-4 ${agrHighlight ? 'text-red-500' : 'text-black'}`}>
        Latest AGR Data
      </h2>
      {latestAgrData && (
        <div className="mb-4">
          <p><strong>Connection ID:</strong> {latestAgrData.connection_id}</p>
          <p><strong>Docker Status:</strong> {JSON.stringify(latestAgrData.data.docker_values.value.state.map(docker => ({ name: docker.name, status: docker.ps.Status })), null, 2)}</p>
          <p><strong>System Status:</strong> {JSON.stringify(latestAgrData.data.system_values.value, null, 2)}</p>
        </div>
      )}

      <h2 className={`mb-4 ${mqttHighlight ? 'text-blue-500' : 'text-black'}`}>
        Latest MQTT Data
      </h2>
      {latestMqttData && (
        <div className="mb-4">
          <p><strong>Topic ID:</strong> {latestMqttData.topic_id}</p>
          <p><strong>Data:</strong> {JSON.stringify(latestMqttData.data, null, 2)}</p>
        </div>
      )}

      {Object.entries(groupedData).map(([router_id, data]) => (
        <div key={router_id} className="border-b border-gray-300 pb-4 mb-4">
          <h2
            onClick={() => toggleSection(router_id)}
            className="cursor-pointer text-xl font-semibold text-gray-800"
          >
            {expandedSections[router_id] ? '-' : '+'} Router ID: {router_id}
          </h2>

          {expandedSections[router_id] && (
            <div className="pl-6 border-l-2 border-gray-300 ml-4">
              <h3
                onClick={() => toggleSection(`${router_id}-agr`)}
                className="cursor-pointer text-lg font-semibold text-gray-600"
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
                className="cursor-pointer text-lg font-semibold text-gray-600"
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
          )}
        </div>
      ))}
    </div>
  );
}
