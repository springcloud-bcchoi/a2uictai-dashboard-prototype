'use client';

import { useContext, useState } from "react";
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

export default function Home() {
  const { isConnected, agrDataDb, mqttDataDb } = useContext(Wss);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const groupedData = groupDataByRouterId(agrDataDb, mqttDataDb);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      <h1>WebSocket Data Display</h1>
      <p>WebSocket Connected: {isConnected ? 'Yes' : 'No'}</p>

      {Object.entries(groupedData).map(([router_id, data]) => (
        <div key={router_id}>
          <h2 onClick={() => toggleSection(router_id)}>
            {expandedSections[router_id] ? '-' : '+'} Router ID: {router_id}
          </h2>

          {expandedSections[router_id] && (
            <>
              <h3 onClick={() => toggleSection(`${router_id}-agr`)}>
                {expandedSections[`${router_id}-agr`] ? '-' : '+'} AGR Data
              </h3>
              {expandedSections[`${router_id}-agr`] && data.agrData.map((agr, index) => (
                <div key={index}>
                  <p>Connection ID: {agr.connection_id}</p>
                  <h4>Docker Status</h4>
                  {agr.data.docker_values.value.state.map((docker, i) => (
                    <p key={i}>{docker.name}: {docker.ps.Status} (Running: {docker.ps.Running ? 'Yes' : 'No'})</p>
                  ))}
                  <h4>System Status</h4>
                  <p>CPU Usage: {agr.data.system_values.value.cpu_usage}</p>
                  <p>Memory Usage: {agr.data.system_values.value.mem_usage}</p>
                  <p>Uptime: {agr.data.system_values.value.uptime}</p>
                </div>
              ))}

              <h3 onClick={() => toggleSection(`${router_id}-mqtt`)}>
                {expandedSections[`${router_id}-mqtt`] ? '-' : '+'} MQTT Data
              </h3>
              {expandedSections[`${router_id}-mqtt`] && data.mqttData.map((mqtt, index) => (
                <div key={index}>
                  <p>Topic ID: {mqtt.topic_id}</p>
                  <p>Data: {JSON.stringify(mqtt.data, null, 2)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
