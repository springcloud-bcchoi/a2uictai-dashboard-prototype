'use client';

import React, { createContext, useState, useEffect, ReactNode, useRef } from 'react';

interface DockerState {
  name: string;
  ps: {
    Status: string;
    Restarting: boolean;
    Dead: boolean;
    ExitCode: number;
    Running: boolean;
    Error: string;
    FinishedAt: string;
    OOMKilled: boolean;
    Pid: number;
    StartedAt: string;
    Paused: boolean;
  };
  tags: string[];
}

interface DockerValues {
  level: number;
  value: {
    state: DockerState[];
  };
}

interface SystemValues {
  level: number;
  value: {
    disk_usage: string;
    mem_usage: string;
    cpu_usage: string;
    cpu_temp: number;
    mac_address: string;
    uptime: number;
  };
}

export interface AgrData {
  connection_id: string;
  data: {
    docker_values: DockerValues;
    auth: string;
    timestamp: string;
    sourceIp: string;
    system_values: SystemValues;
    router_id: string;
  };
}

export interface NotifyData {
  tunnel_id: string;
  tunnel_name: string;
  alert_name: string;
  name: string;
  new_status: string;
  timestamp: string;
}

export interface AlertData {
  summary: string;
  status: string;
  topic_id: string;
  alertname: string;
  description: string;
  job: string;
  severity: string;
  startsAt: string;
  endsAt: string;
}

export interface ElicitData {
  topic_id: string;
  data: {
    date: string;
    rssi: string;
    address: string;
    battery: string;
    event: string;
    elementType: string;
  };
}

export interface RadarUsbData {
  topic_id: string;
  data: {
    BR: string;
    date: string;
    Det: string;
    HR: string;
    Fall: string;
    ID: string;
    Dis: string;
  };
}

export interface RadarWifiData {
  topic_id: string;
  data: {
    date: string;
    no: string;
    rssi: string;
    ip: string;
    count: string;
    range: string;
    mac: string;
    heart: string;
    breath: string;
    uid: string;
    fall: string;
    event: string;
    presence: string;
  };
}

interface Ack {
  type: string;
  request_id: string;
  status: string;
  upload_url?: string;
}

interface WebSocketContextValue {
  webSocket: WebSocket | null;
  isConnected: boolean;
  agrData: AgrData | null;
  mqttData: ElicitData | RadarUsbData | RadarWifiData | null;
  ackPromises: React.MutableRefObject<Map<string, (value: string | PromiseLike<string>) => void>>;
  agrDataDb: AgrData[];
  mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData)[];
  notifyDataDb: NotifyData[];
  alertDataDb: AlertData[];
  notifyData: NotifyData | null;
  alertData: AlertData | null;
  elicitData: ElicitData[];
  radarUsbData: RadarUsbData[];
  radarWifiData: RadarWifiData[];
}

export const Wss = createContext<WebSocketContextValue>({
  webSocket: null,
  isConnected: false,
  agrData: null,
  mqttData: null,
  ackPromises: { current: new Map() },
  agrDataDb: [],
  mqttDataDb: [],
  notifyDataDb: [],
  alertDataDb: [],
  notifyData: null,
  alertData: null,
  elicitData: [],
  radarUsbData: [],
  radarWifiData: [],
});

interface WebSocketProviderProps {
  children: ReactNode;
}

// utils/convertData.ts
export const convertData = (data: any): any => {
  const result = { ...data };
  for (const key in result) {
    if (key === 'topic_id') {
      result[key] = String(result[key]);
    } else if (typeof result[key] === 'string' && !isNaN(Number(result[key]))) {
      result[key] = parseFloat(result[key]);
    } else if (typeof result[key] === 'object') {
      result[key] = convertData(result[key]);
    }
  }
  return result;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agrData, setAgrData] = useState<AgrData | null>(null);
  const [mqttData, setMqttData] = useState<ElicitData | RadarUsbData | RadarWifiData | null>(null);
  const [agrDataDb, setAgrDataDb] = useState<AgrData[]>([]);
  const [mqttDataDb, setMqttDataDb] = useState<(ElicitData | RadarUsbData | RadarWifiData)[]>([]);
  const [notifyDataDb, setNotifyDataDb] = useState<NotifyData[]>([]);
  const [alertDataDb, setAlertDataDb] = useState<AlertData[]>([]);
  const ackPromises = useRef<Map<string, (value: string | PromiseLike<string>) => void>>(new Map());
  const [notifyData, setNotifyData] = useState<NotifyData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [elicitData, setElicitData] = useState<ElicitData[]>([]);
  const [radarUsbData, setRadarUsbData] = useState<RadarUsbData[]>([]);
  const [radarWifiData, setRadarWifiData] = useState<RadarWifiData[]>([]);

  useEffect(() => {
    const wsUrl = 'wss://iwxu7qs5h3.execute-api.ap-northeast-2.amazonaws.com/dev';
    const ws = new WebSocket(wsUrl);
    setWebSocket(ws);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);

      // check done connection id & clean dummy data
      const args = { command: 'reload' };
      const message = { type: 'utils', args: args };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = async (event) => {
      try {
        const parsedData = JSON.parse(event.data);

        if (parsedData.agr_data_db) {
          setAgrDataDb(parsedData.agr_data_db.map((data: any) => convertData(data)));
          console.log('agr_data_db', parsedData.agr_data_db);
        }

        if (parsedData.mqtt_data_db) {
          const convertedMqttDataDb = parsedData.mqtt_data_db.map((data: any) => convertData(data));
          setMqttDataDb(convertedMqttDataDb);

          convertedMqttDataDb.forEach((data: ElicitData | RadarUsbData | RadarWifiData) => {
            if ((data as ElicitData).data.address) {
              setElicitData((prevData) => [...prevData, data as ElicitData]);
            } else if ((data as RadarUsbData).data.ID) {
              setRadarUsbData((prevData) => [...prevData, data as RadarUsbData]);
            } else if ((data as RadarWifiData).data.ip) {
              setRadarWifiData((prevData) => [...prevData, data as RadarWifiData]);
            }
          });
        }

        if (parsedData.agr_data) {
          setAgrData(convertData(parsedData.agr_data));
          console.log('agr_data', parsedData.agr_data);
        }

        if (parsedData.mqtt_data) {
          const convertedData = convertData(parsedData.mqtt_data);

          if (convertedData.data.address) {
            setElicitData((prevData) => [...prevData, convertedData as ElicitData]);
            setMqttData(convertedData as ElicitData);
          } else if (convertedData.data.ID) {
            setRadarUsbData((prevData) => [...prevData, convertedData as RadarUsbData]);
            setMqttData(convertedData as RadarUsbData);
          } else if (convertedData.data.ip) {
            setRadarWifiData((prevData) => [...prevData, convertedData as RadarWifiData]);
            setMqttData(convertedData as RadarWifiData);
          }

          console.log('mqtt_data', parsedData.mqtt_data);
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
      setWebSocket(null);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <Wss.Provider
      value={{
        webSocket,
        isConnected,
        agrData,
        mqttData,
        ackPromises,
        agrDataDb,
        mqttDataDb,
        notifyDataDb,
        alertDataDb,
        notifyData,
        alertData,
        elicitData,
        radarUsbData,
        radarWifiData,
      }}
    >
      {children}
    </Wss.Provider>
  );
};
