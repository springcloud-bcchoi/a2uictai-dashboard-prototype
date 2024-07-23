'use client';

import { useContext, useState, useEffect } from "react";
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, AlertData, Wss } from '@/components/Wss';
import Site from "@/components/Site";

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

const alerts: AlertData[] = [
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
    const router_id = data.topic_id.split('/')[0]; // Assuming the topic_id format is router_id/device_id
    if (!groupedData[router_id]) {
      groupedData[router_id] = { agrData: [], mqttData: [] };
    }
    groupedData[router_id].mqttData.push(data);
  });

  return groupedData;
};

const useHighlightUpdate = (
  latestAgrData: AgrData | null,
  latestMqttData: ElicitData | RadarUsbData | RadarWifiData | null
): { [key: string]: { agr: boolean; mqtt: boolean } } => {
  const [highlightedRouters, setHighlightedRouters] = useState<{ [key: string]: { agr: boolean; mqtt: boolean } }>({});

  useEffect(() => {
    if (latestAgrData) {
      const routerId = latestAgrData.data.router_id;
      setHighlightedRouters(prev => ({
        ...prev,
        [routerId]: { ...prev[routerId], agr: true }
      }));
      const timeout = setTimeout(() => {
        setHighlightedRouters(prev => ({
          ...prev,
          [routerId]: { ...prev[routerId], agr: false }
        }));
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [latestAgrData]);

  useEffect(() => {
    if (latestMqttData) {
      const routerId = latestMqttData.topic_id.split('/')[0];
      setHighlightedRouters(prev => ({
        ...prev,
        [routerId]: { ...prev[routerId], mqtt: true }
      }));
      const timeout = setTimeout(() => {
        setHighlightedRouters(prev => ({
          ...prev,
          [routerId]: { ...prev[routerId], mqtt: false }
        }));
      }, 100);
      return () => clearTimeout(timeout);
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
        const highlightClass = isHighlightedAgr ? 'text-yellow-500 font-bold' : isHighlightedMqtt ? 'text-blue-500 font-bold' : 'text-white';

        return (
          <div key={router_id} className={`border-b-4 pb-4 mb-6 ${isHighlightedAgr ? 'border-yellow-500' : isHighlightedMqtt ? 'border-blue-500' : 'border-gray-700'}`}>
            <h2 className={`cursor-pointer text-xl ${highlightClass} mb-2`} onClick={() => toggleSection(router_id)}>
              Router ID: {router_id}
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

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Alert Data</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 text-white text-sm">
            <thead>
            <tr>
              <th className="px-4 py-2">Summary</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Topic ID</th>
              <th className="px-4 py-2">Alert Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Job</th>
              <th className="px-4 py-2">Severity</th>
              <th className="px-4 py-2">Starts At</th>
              <th className="px-4 py-2">Ends At</th>
            </tr>
            </thead>
            <tbody>
            {alerts.map((alert, index) => (
              <tr
                key={index}
                className={`border-b border-gray-600 ${alert.status === 'firing' ? 'bg-red-600' : 'bg-gray-700'}`}
              >
                <td className="px-4 py-2">{alert.summary}</td>
                <td className="px-4 py-2">{alert.status}</td>
                <td className="px-4 py-2">{alert.topic_id}</td>
                <td className="px-4 py-2">{alert.alertname}</td>
                <td className="px-4 py-2">{alert.description}</td>
                <td className="px-4 py-2">{alert.job}</td>
                <td className="px-4 py-2">{alert.severity}</td>
                <td className="px-4 py-2">{alert.startsAt}</td>
                <td className="px-4 py-2">{alert.endsAt}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Site Locations</h2>
        <Site siteData={sites} />
      </div>
    </div>
  );
}
