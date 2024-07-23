'use client';

import { useContext, useState, useEffect } from "react";
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss } from '@/components/Wss';
import Site from "@/components/Site";
import AlertTable from "@/components/AlertTable";

const sites = [
  {
    id: 1,
    latitude: 37.5665,
    longitude: 126.978,
    address: "Seoul, South Korea",
    name: "Seoul Site"
  },
  {
    id: 2,
    latitude: 35.1796,
    longitude: 129.0756,
    address: "Busan, South Korea",
    name: "Busan Site"
  },
  {
    id: 3,
    latitude: 37.4563,
    longitude: 126.7052,
    address: "Incheon, South Korea",
    name: "Incheon Site"
  }
];

const alerts = [
  {
    summary: "High CPU Usage",
    status: "firing",
    topic_id: "seoul/cpu",
    alertname: "CPUHigh",
    description: "CPU usage has exceeded 90%",
    job: "server-monitor",
    severity: "critical",
    startsAt: "2023-07-23T10:00:00Z",
    endsAt: "2023-07-23T10:30:00Z"
  },
  {
    summary: "Memory Leak",
    status: "resolved",
    topic_id: "busan/memory",
    alertname: "MemoryLeak",
    description: "Memory usage is steadily increasing",
    job: "server-monitor",
    severity: "warning",
    startsAt: "2023-07-22T08:00:00Z",
    endsAt: "2023-07-22T09:00:00Z"
  },
  {
    summary: "Disk Space Low",
    status: "firing",
    topic_id: "incheon/disk",
    alertname: "DiskLow",
    description: "Disk space is below 10%",
    job: "server-monitor",
    severity: "critical",
    startsAt: "2023-07-23T12:00:00Z",
    endsAt: "2023-07-23T12:45:00Z"
  }
];

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
    const [router_id, device_id] = data.topic_id.split('/');
    let device_id_number = device_id;

    if (device_id.includes('=')) {
      device_id_number = device_id.split('=')[1];
    }

    if (!groupedData[router_id]) {
      groupedData[router_id] = { agrData: [], mqttData: [] };
    }
    groupedData[router_id].mqttData.push({ ...data, topic_id: `${router_id}/${device_id_number}` });
  });

  return groupedData;
};

const useHighlightUpdate = (
  latestAgrData: AgrData | null,
  latestMqttData: ElicitData | RadarUsbData | RadarWifiData | null
): { [key: string]: { agr: boolean; mqtt: boolean; timestamp: string; type: string } } => {
  const [highlightedRouters, setHighlightedRouters] = useState<{ [key: string]: { agr: boolean; mqtt: boolean; timestamp: string; type: string } }>({});
  const [timeouts, setTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({});

  const updateHighlight = (routerId: string, type: 'router' | 'mqtt') => {
    const timestamp = new Date().toLocaleTimeString();

    if (timeouts[routerId]) clearTimeout(timeouts[routerId]);

    setHighlightedRouters(prev => ({
      ...prev,
      [routerId]: { ...prev[routerId], [type]: true, timestamp, type }
    }));

    const timeout = setTimeout(() => {
      setHighlightedRouters(prev => ({
        ...prev,
        [routerId]: { ...prev[routerId], [type]: false }
      }));
      setTimeouts(prev => {
        const { [routerId]: _, ...rest } = prev;
        return rest;
      });
    }, 100);

    setTimeouts(prev => ({
      ...prev,
      [routerId]: timeout
    }));
  };

  useEffect(() => {
    if (latestAgrData) {
      const routerId = latestAgrData.data.router_id;
      updateHighlight(routerId, 'router');
    }
  }, [latestAgrData]);

  useEffect(() => {
    if (latestMqttData) {
      const [router_id, device_id] = latestMqttData.topic_id.split('/');
      let device_id_number = device_id;

      if (device_id.includes('=')) {
        device_id_number = device_id.split('=')[1];
      }

      updateHighlight(router_id, 'mqtt');
    }
  }, [latestMqttData]);

  return highlightedRouters;
};

export default function Home() {
  const { isConnected, agrDataDb, mqttDataDb, latestAgrData, latestMqttData } = useContext(Wss);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const groupedData = groupDataByRouterId(agrDataDb, mqttDataDb);
  const highlightedRouters = useHighlightUpdate(latestAgrData, latestMqttData);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="font-sans bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">A2UICT Dashboard</h1>
      <p className="mb-4 text-center">WebSocket Connected: {isConnected ? 'Yes' : 'No'}</p>

      {Object.entries(groupedData).map(([router_id, data]) => {
        if (router_id === 'unknown' || !/^[A-Za-z0-9]{4}$/.test(router_id)) return null;

        const isHighlightedAgr = highlightedRouters[router_id]?.agr;
        const isHighlightedMqtt = highlightedRouters[router_id]?.mqtt;
        const timestamp = highlightedRouters[router_id]?.timestamp;
        const updateType = highlightedRouters[router_id]?.type;
        const highlightClass = isHighlightedAgr ? 'text-yellow-500 font-bold' : isHighlightedMqtt ? 'text-blue-500 font-bold' : 'text-white';

        return (
          <div key={router_id} className={`border-b-4 pb-4 mb-6 ${isHighlightedAgr ? 'border-yellow-500' : isHighlightedMqtt ? 'border-blue-500' : 'border-gray-700'}`}>
            <h2 className={`cursor-pointer text-xl ${highlightClass} mb-2`} onClick={() => toggleSection(router_id)}>
              Router ID: {router_id} {timestamp && <span className="text-sm text-gray-500">({updateType} update at {timestamp})</span>}
            </h2>

            <div className="ml-4">
              <h3
                onClick={() => toggleSection(`${router_id}-agr`)}
                className={`cursor-pointer text-lg font-semibold mb-2 ${expandedSections[`${router_id}-agr`] ? 'text-yellow-500' : 'text-gray-400'}`}
              >
                {expandedSections[`${router_id}-agr`] ? '-' : '+'} AGR Data
              </h3>
              {expandedSections[`${router_id}-agr`] && data.agrData.map((agr, index) => (
                <div key={index} className="pl-6 border-l-2 border-gray-600 ml-4 mb-4">
                  <p><strong>Connection ID:</strong> {agr.connection_id}</p>
                  <h4 className="font-semibold text-gray-400">Docker Status</h4>
                  {agr.data.docker_values.value.state && agr.data.docker_values.value.state.map((docker, i) => (
                    <p key={i}>{docker.name}: {docker.ps.Status} (Running: {docker.ps.Running ? 'Yes' : 'No'})</p>
                  ))}
                  <h4 className="font-semibold text-gray-400">System Status</h4>
                  <p>CPU Usage: {agr.data.system_values.value.cpu_usage}</p>
                  <p>Memory Usage: {agr.data.system_values.value.mem_usage}</p>
                  <p>Uptime: {agr.data.system_values.value.uptime}</p>
                </div>
              ))}

              <h3
                onClick={() => toggleSection(`${router_id}-mqtt`)}
                className={`cursor-pointer text-lg font-semibold mb-2 ${expandedSections[`${router_id}-mqtt`] ? 'text-blue-500' : 'text-gray-400'}`}
              >
                {expandedSections[`${router_id}-mqtt`] ? '-' : '+'} MQTT Data
              </h3>
              {expandedSections[`${router_id}-mqtt`] && data.mqttData.map((mqtt, index) => (
                <div key={index} className="pl-6 border-l-2 border-gray-600 ml-4 mb-4">
                  <p><strong>Topic ID:</strong> {mqtt.topic_id}</p>
                  <p>Data: {JSON.stringify(mqtt.data, null, 2)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <AlertTable alerts={alerts} />

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Site Locations</h2>
        <Site siteData={sites} />
      </div>
    </div>
  );
}
