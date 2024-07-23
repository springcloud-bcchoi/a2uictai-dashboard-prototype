'use client';

import { useContext, useState, useEffect } from "react";
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, NotifyData, AlertData, Wss } from '@/components/Wss';

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
  const { isConnected, agrDataDb, mqttDataDb, latestAgrData, latestMqttData, notifyDataDb, alertDataDb } = useContext(Wss);
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
        <h2 className="text-xl font-bold mb-4">Notify Data</h2>
        <table className="min-w-full bg-gray-800 text-white">
          <thead>
          <tr>
            <th className="px-4 py-2">Tunnel ID</th>
            <th className="px-4 py-2">Tunnel Name</th>
            <th className="px-4 py-2">Alert Name</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">New Status</th>
            <th className="px-4 py-2">Timestamp</th>
          </tr>
          </thead>
          <tbody>
          {notifyDataDb.map((notify: NotifyData, index: number) => (
            <tr key={index} className="bg-gray-700 border-b border-gray-600">
              <td className="px-4 py-2">{notify.tunnel_id}</td>
              <td className="px-4 py-2">{notify.tunnel_name}</td>
              <td className="px-4 py-2">{notify.alert_name}</td>
              <td className="px-4 py-2">{notify.name}</td>
              <td className="px-4 py-2">{notify.new_status}</td>
              <td className="px-4 py-2">{notify.timestamp}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Alert Data</h2>
        <table className="min-w-full bg-gray-800 text-white">
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
          {alertDataDb.map((alert: AlertData, index: number) => (
            <tr key={index} className="bg-gray-700 border-b border-gray-600">
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
  );
}
