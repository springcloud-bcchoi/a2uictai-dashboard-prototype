'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

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
  topic_id:string, // # 장치고유ID
  data:{
    presence:string, // # 감지 여부
    detect_count:string, // # 부팅후 감지된 횟수
    heart:string // # Heart Rate
    breath:string, // # Breathing Rate
    range:string, // # 감지 거리
    fall:string, // # 낙상 여부
    radar_rssi:string, //# 장치 rssi 감도수
    event_type:string, // # motion type
    mac_address:string, // # 장치의 mac address
    device_ip:string,  //# wifi에 연결되 ip 주소
    uid:string, // # 장치이름 
  }
}

export interface TubeTrailerData {
  topic_id:string, // # 장치고유ID
  data:{
    cuid:string, 
    tuid:string 
    lon:string, 
    lat:string, 
    distance:string, 
    carState:string, 
    sensor_node1:string, 
    sensor_node2:string, 
    sensor_node3:string, 
    sensor_node4:string, 
    sensor_node5:string, 
    addon_node1:string,  
    addon_node2:string,  
    addon_node3:string, 
    last_update_time:string, 
    timetbl:string,  
  }
}

interface WebSocketContextValue {
  webSocket: WebSocket | null;
  isConnected: boolean;
  agrData: AgrData | null;
  mqttData: ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData | null;
  agrDataDb: AgrData[];
  mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[];
  notifyDataDb: NotifyData[];
  alertDataDb: AlertData[];
  notifyData: NotifyData | null;
  alertData: AlertData | null;
  elicitData: ElicitData[];
  radarUsbData: RadarUsbData[];
  radarWifiData: RadarWifiData[];
  tubeTrailerData: TubeTrailerData[];
  latestAgrData: AgrData | null;
  latestMqttData: ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData | null;
}

export const Wss = createContext<WebSocketContextValue>({
  webSocket: null,
  isConnected: false,
  agrData: null,
  mqttData: null,
  agrDataDb: [],
  mqttDataDb: [],
  notifyDataDb: [],
  alertDataDb: [],
  notifyData: null,
  alertData: null,
  elicitData: [],
  radarUsbData: [],
  radarWifiData: [],
  tubeTrailerData: [],
  latestAgrData: null,
  latestMqttData: null,
});

interface WebSocketProviderProps {
  children: ReactNode;
}

const updateAgrDataDb = (prevDb: AgrData[], newData: AgrData): AgrData[] => {
  const db = [...prevDb];
  const existingIndex = db.findIndex(item => item.data.router_id === newData.data.router_id);
  if (existingIndex !== -1) {
    db[existingIndex] = newData;
  } else {
    db.push(newData);
  }
  return db;
};

const updateMqttDataDb = (prevDb: (ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[], newData: ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData): (ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[] => {
  const db = [...prevDb];
  const existingIndex = db.findIndex(item => item.topic_id === newData.topic_id);
  if (existingIndex !== -1) {
    db[existingIndex] = newData;
  } else {
    db.push(newData);
  }
  return db;
};

const updateAlertDataDb = (prevDb: AlertData[], newData: AlertData): AlertData[] => {
  const db = [...prevDb];
  const existingIndex = db.findIndex(item => item.topic_id === newData.topic_id && item.alertname === newData.alertname);
  if (existingIndex !== -1) {
    db[existingIndex] = newData;
  } else {
    db.push(newData);
  }
  return db;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agrData, setAgrData] = useState<AgrData | null>(null);
  const [mqttData, setMqttData] = useState<ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData | null>(null);
  const [agrDataDb, setAgrDataDb] = useState<AgrData[]>([]);
  const [mqttDataDb, setMqttDataDb] = useState<(ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[]>([]);
  const [notifyDataDb, setNotifyDataDb] = useState<NotifyData[]>([]);
  const [alertDataDb, setAlertDataDb] = useState<AlertData[]>([]);
  const [notifyData, setNotifyData] = useState<NotifyData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [elicitData, setElicitData] = useState<ElicitData[]>([]);
  const [radarUsbData, setRadarUsbData] = useState<RadarUsbData[]>([]);
  const [radarWifiData, setRadarWifiData] = useState<RadarWifiData[]>([]);
  const [tubeTrailerData, setTubeTrailerData] = useState<TubeTrailerData[]>([]);
  const [latestAgrData, setLatestAgrData] = useState<AgrData | null>(null);
  const [latestMqttData, setLatestMqttData] = useState<ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData| null>(null);

  useEffect(() => {
    const wsUrl = 'wss://iwxu7qs5h3.execute-api.ap-northeast-2.amazonaws.com/dev';
    const ws = new WebSocket(wsUrl);
    setWebSocket(ws);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);

      if (parsedData.agr_data_db) {
        setAgrDataDb(parsedData.agr_data_db);
      }

      if (parsedData.mqtt_data_db) {
        setMqttDataDb(parsedData.mqtt_data_db);
      }

      if (parsedData.agr_data) {
        setAgrData(parsedData.agr_data);
        setAgrDataDb(prev => updateAgrDataDb(prev, parsedData.agr_data));
        setLatestAgrData(parsedData.agr_data);

      }

      if (parsedData.mqtt_data) {
        setMqttData(parsedData.mqtt_data);
        setMqttDataDb(prev => updateMqttDataDb(prev, parsedData.mqtt_data));
        setLatestMqttData(parsedData.mqtt_data);
      }
      if (parsedData.alert_data) {
        setAlertData(parsedData.alert_data);
        setAlertDataDb(prev => updateAlertDataDb(prev, parsedData.alert_data));
      }

      if (parsedData.alert_data_db) {
        setAlertDataDb(parsedData.alert_data_db);
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
        agrDataDb,
        mqttDataDb,
        notifyDataDb,
        alertDataDb,
        notifyData,
        alertData,
        elicitData,
        radarUsbData,
        radarWifiData,
        tubeTrailerData,
        latestAgrData,
        latestMqttData,

      }}
    >
      {children}
    </Wss.Provider>
  );
};
