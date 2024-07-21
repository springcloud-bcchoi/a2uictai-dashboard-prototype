'use client';

import React, {createContext, useState, useEffect, ReactNode, useRef} from 'react';


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

export interface ConnectionData {
  connection_id: string;
  data: {
    docker_values: DockerValues;
    auth: string;
    timestamp: string;
    sourceIp: string;
    system_values: SystemValues;
    robot_id: string;
    ack_values: string;
  };
}
export interface NotifyData {
  "tunnel_id": string,
  "tunnel_name": string,
  "alert_name": string,
  "name": string,
  "new_status": string,
  "timestamp": string
}
export interface AlertData {
  "summary": string,
  "status": string,
  "topic_id": string,
  "alertname": string,
  "description": string,
  "job": string,
  "severity": string,
  'startsAt': string,
  'endsAt': string,
}
export interface RobotData {
  topic_id: string;
  data: {
    docker_0_exit_code: number;
    docker_5_status: string;
    fix__svs_used: number;
    docker_3_status: string;
    docker_2_status: string;
    docker_4_status: string;
    a012_power_raw_voltage_V: number;
    docker_1_status: string;
    a012_power_raw_charge: number;
    docker_4_name: string;
    system_cpu_temp: number;
    system_mem_usage: string;
    fix_level: number;
    docker_3_name: string;
    costmap_level: number;
    camera_level: number;
    camera_freq: number;
    a012_power_raw_temperature: number;
    docker_4_exit_code: number;
    fix_latitude_: number;
    a012_velocity_raw_right_rear: number;
    a012_velocity_level: number;
    twist_cmd_freq: number;
    odom_freq: number;
    docker_1_exit_code: number;
    fix_horizontal_accuracy_: number;
    a012_velocity_raw_left_front: number;
    fix_height_above_msl_: number;
    scan_level: number;
    docker_0_status: string;
    odom_global_level: number;
    docker_2_name: string;
    docker_5_name: string;
    odom_gps_freq: number;
    system_mac_address: string;
    docker_5_exit_code: number;
    a012_velocity_raw_left_rear: number;
    docker_1_name: string;
    odom_level: number;
    docker_2_exit_code: number;
    costmap_freq: number;
    system_cpu_usage: number;
    twist_cmd_level: number;
    imu_freq: number;
    odom_gps_level: number;
    scan_freq: number;
    system_uptime: number;
    a012_power_raw_current_A: number;
    docker_0_name: string;
    fix_altitude_: number;
    timestamp: string;
    a012_power_freq: number;
    ublox_level: number;
    system_disk_usage: string;
    a012_velocity_freq: number;
    ublox_freq: number;
    a012_power_level: number;
    fix_longitude_: number;
    docker_3_exit_code: number;
    odom_global_freq: number;
    a012_velocity_raw_right_front: number;
    fix_vertical_accuracy_: number;
    system_level: number;
    imu_level: number;
    fix_itow_ms: number;
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
  amrData: ConnectionData | null;
  mqttData: RobotData | null;
  ackPromises: React.MutableRefObject<Map<string, (value: string | PromiseLike<string>) => void>>;
  amrDataDb: ConnectionData[];
  mqttDataDb: RobotData[];
  notifyDataDb: NotifyData[],
  alertDataDb: AlertData[],
  notifyData: NotifyData | null;
  alertData: AlertData | null;
}
export const Wss = createContext<WebSocketContextValue>({
  webSocket: null,
  isConnected: false,
  amrData: null,
  mqttData: null,
  ackPromises: { current: new Map() },
  amrDataDb: [],
  mqttDataDb: [],
  notifyDataDb: [],
  alertDataDb: [],
  notifyData: null,
  alertData: null,
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

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({children}) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [amrData, setAmrData] = useState<ConnectionData | null>(null);
  const [mqttData, setMqttData] = useState<RobotData | null>(null);
  const [amrDataDb, setAmrDataDb] = useState<ConnectionData[]>([]);
  const [mqttDataDb, setMqttDataDb] = useState<RobotData[]>([]);
  const [notifyDataDb, setNotifyDataDb] = useState<NotifyData[]>([]);
  const [alertDataDb, setAlertDataDb] = useState<AlertData[]>([]);
  const ackPromises = useRef<Map<string, (value: string | PromiseLike<string>) => void>>(new Map());
  const [notifyData, setNotifyData] = useState<NotifyData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  useEffect(() => {
    const wsUrl = 'wss://iwxu7qs5h3.execute-api.ap-northeast-2.amazonaws.com/dev';
    const ws = new WebSocket(wsUrl);
    setWebSocket(ws);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);

      // check done connection id & clean dummy data
      const args = {"command": "reload"};
      const message = {"type": "utils", "args": args};
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = async (event) => {
      try {
        const parsedData = JSON.parse(event.data);


        if (parsedData.agr_data_db) {
          console.log('agr_data_db', parsedData.agr_data_db);

        }
        if (parsedData.mqtt_data_db) {
          console.log('mqtt_data_db', parsedData.mqtt_data_db);

        }
        if (parsedData.agr_data) {
          console.log('agr_data', parsedData.agr_data);

        }
        if (parsedData.mqtt_data) {
          console.log('mqtt_data', parsedData.mqtt_data);

        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
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

  return <Wss.Provider
    value={{
      webSocket,
      isConnected,
      amrData,
      mqttData,
      ackPromises,
      mqttDataDb,
      amrDataDb,
      notifyDataDb,
      alertDataDb,
      notifyData,
      alertData,
    }}>{children}</Wss.Provider>;
};