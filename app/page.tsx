'use client';

import { useContext, useState, useEffect, useRef } from "react";
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss, AlertData, TubeTrailerData } from '@/components/Wss';
import dynamic from 'next/dynamic';
import AlertTable from "@/components/AlertTable";
import Site from "@/components/map/Site";
import { fetchSiteData, SiteData } from "./service/site";
import { MoonIcon, PowerIcon, SunIcon, ArrowPathIcon} from "@heroicons/react/24/outline";
import { fetchRouterNames } from "./service/router";
import { filterAgrDataBySourceIp, groupDataByRouterId } from "./service/groupDataByRouterId";


const useHighlightUpdate = (
  latestAgrData: AgrData | null,
  latestMqttData: ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData | null
): { [key: string]: { agr: boolean; mqtt: boolean; timestamp: string; type: string } } => {
  const [highlightedRouters, setHighlightedRouters] = useState<{
    [key: string]: { agr: boolean; mqtt: boolean; timestamp: string; type: string }
  }>({});
  const timeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const updateHighlight = (routerId: string, type: 'agr' | 'mqtt') => {
    const timestamp = new Date().toLocaleTimeString();

    if (timeouts.current[routerId]) clearTimeout(timeouts.current[routerId]);

    setHighlightedRouters(prev => ({
      ...prev,
      [routerId]: { ...prev[routerId], [type]: true, timestamp, type }
    }));

    const timeout = setTimeout(() => {
      setHighlightedRouters(prev => ({
        ...prev,
        [routerId]: { ...prev[routerId], [type]: false }
      }));
      delete timeouts.current[routerId];
    }, 100);

    timeouts.current[routerId] = timeout;
  };

  useEffect(() => {
    if (latestAgrData) {
      const routerId = latestAgrData.data.router_id;
      updateHighlight(routerId, 'agr');
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
  const { isConnected, agrDataDb, mqttDataDb, latestAgrData, latestMqttData, alertDataDb } = useContext(Wss);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [routerNames, setRouterNames] = useState<{ [key: string]: string }>({});
  const [siteData, setSiteData] = useState<SiteData[]>([]);
  const groupedData = groupDataByRouterId(
    filterAgrDataBySourceIp(agrDataDb),
    mqttDataDb,
    alertDataDb
  );
  const highlightedRouters = useHighlightUpdate(latestAgrData, latestMqttData);

  useEffect(() => {
    const loadRouterNames = async () => {
      try {
        const routerData = await fetchRouterNames();
        const routerNameMap = routerData.reduce((acc, router) => {
          acc[router.routerId] = router.name;
          return acc;
        }, {} as { [key: string]: string });
        setRouterNames(routerNameMap);
      } catch (error) {
        console.error('Failed to fetch router names', error);
      }
    };

    loadRouterNames().then(r => null);
  }, []);

  useEffect(() => {
    const loadSiteData = async () => {
      try {
        const siteData = await fetchSiteData();
        setSiteData(siteData);
      } catch (error) {
        console.error('Failed to fetch site data', error);
      }
    };

    loadSiteData().then(r => null);
  }, []);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="font-sans bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">A2UICT Dashboard</h1>
      <div className="flex flex-col items-center justify-start">
        <p className="mb-4 text-center">WebSocket Connected: {isConnected ? 'Yes' : 'No'}</p>
        {!isConnected && (
          <div className="flex items-center text-red-500">
            <span>WebSocket Disconnected</span>
            <button
              className="flex ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
              onClick={() => window.location.reload()}
              // onClick={reconnect}
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Reload
            </button>
          </div>
        )}
      </div>
      {Object.entries(groupedData).map(([router_id, data]) => {
        if (router_id === 'unknown' || !/^[A-Za-z0-9]{4}$/.test(router_id)) return null;

        const routerName = routerNames[router_id] || '';
        const isHighlightedAgr = highlightedRouters[router_id]?.agr;
        const isHighlightedMqtt = highlightedRouters[router_id]?.mqtt;
        const timestamp = highlightedRouters[router_id]?.timestamp;
        const updateType = highlightedRouters[router_id]?.type === 'agr' ? 'router' : 'device';
        const highlightClass = isHighlightedAgr ? 'text-yellow-500 font-bold' : isHighlightedMqtt ? 'text-blue-500 font-bold' : 'text-white';

        return (
          <div key={router_id}
               className={`border-b-4 pb-4 mb-6 ${isHighlightedAgr ? 'border-yellow-500' : isHighlightedMqtt ? 'border-blue-500' : 'border-gray-700'}`}>
            <h2 className={`cursor-pointer text-xl ${highlightClass} mb-2`} onClick={() => toggleSection(router_id)}>
              Router ID: {router_id} {routerName && `(${routerName})`} {timestamp &&
                <span
                    className={`text-sm ${updateType === 'router' ? 'text-yellow-500' : 'text-blue-500'}`}>({updateType} update at {timestamp})</span>}
            </h2>

            <div className="ml-4">
              <h3
                onClick={() => toggleSection(`${router_id}-agr`)}
                className={`cursor-pointer text-lg font-semibold mb-2 ${expandedSections[`${router_id}-agr`] ? 'text-yellow-500' : 'text-gray-400'}`}
              >
                {expandedSections[`${router_id}-agr`] ? '-' : '+'} AGR Data
              </h3>
              {expandedSections[`${router_id}-agr`] && data.agrData.map((agr, index) => (
                <div key={index} className="pl-6 border-l-2 border-yellow-600 ml-4 mb-4">
                  <p><strong>Connection ID:</strong> {agr.connection_id}</p>
                  <div className="my-4"></div>
                  <h4 className="font-semibold text-gray-400">Docker Status</h4>
                  {agr.data.docker_values.value.state && agr.data.docker_values.value.state.map((docker, i) => (
                    <p key={i}>{docker.name}: {docker.ps.Status} (Running: {docker.ps.Running ? 'Yes' : 'No'})</p>
                  ))}
                  <div className="my-4"></div>
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
                <div key={index} className="pl-6 border-l-2 border-blue-600 ml-4 mb-4">
                  <p><strong>Topic ID:</strong> {mqtt.topic_id}</p>
                  <p>Data: {JSON.stringify(mqtt.data, null, 2)}</p>
                </div>
              ))}

              <h3
                onClick={() => toggleSection(`${router_id}-alerts`)}
                className={`cursor-pointer text-lg font-semibold mb-2 ${expandedSections[`${router_id}-alerts`] ? 'text-red-500' : 'text-gray-400'}`}
              >
                {expandedSections[`${router_id}-alerts`] ? '-' : '+'} Alerts
              </h3>
              {expandedSections[`${router_id}-alerts`] && data.alertData.map((alert, index) => (
                <div key={index} className="pl-6 border-l-2 border-red-600 ml-4 mb-4">
                  <p><strong>Summary:</strong> {alert.summary}</p>
                  <p><strong>Status:</strong> {alert.status}</p>
                  <p><strong>Description:</strong> {alert.description}</p>
                  <p><strong>Severity:</strong> {alert.severity}</p>
                  <p><strong>Starts At:</strong> {alert.startsAt}</p>
                  <p><strong>Ends At:</strong> {alert.endsAt}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <AlertTable alerts={alertDataDb} />

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Site Locations</h2>
        {siteData.length > 0 ? (
          <div className="h-[700px] overflow-y-scroll">
            <Site siteData={siteData} />
          </div>
        ) : (
          <p>Loading site data...</p>
        )}
      </div>
    </div>
  );
}
