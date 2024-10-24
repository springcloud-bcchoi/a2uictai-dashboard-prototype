import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss, AlertData, TubeTrailerData } from '@/components/Wss';

interface GroupedData {
    [router_id: string]: {
      agrData: AgrData[];
      mqttData: (ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[];
      alertData: AlertData[];
    };
}

export const filterAgrDataBySourceIp = (agrDataDb: AgrData[]): AgrData[] => {
    return agrDataDb.filter(data => data.data.sourceIp);
};

export const groupDataByRouterId = (agrDataDb: AgrData[], mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[], alertDataDb: AlertData[]): GroupedData => {
    const groupedData: GroupedData = {};
  
    agrDataDb.forEach(data => {
      const { router_id } = data.data;
      if (!groupedData[router_id]) {
        groupedData[router_id] = { agrData: [], mqttData: [], alertData: [] };
      }
      groupedData[router_id].agrData.push(data);
    });
  
    mqttDataDb.forEach(data => {
      if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
  
      const [router_id, device_id] = data.topic_id.split('/');
      let device_id_number = device_id;
  
      if (device_id.includes('=')) {
        device_id_number = device_id.split('=')[1];
      }
  
      if (!groupedData[router_id]) {
        groupedData[router_id] = { agrData: [], mqttData: [], alertData: [] };
      }
      groupedData[router_id].mqttData.push({ ...data, topic_id: `${router_id}/${device_id_number}` });
    });
  
    alertDataDb.forEach(data => {
      const { topic_id } = data;
      const [router_id] = topic_id.split('/');
      if (!groupedData[router_id]) {
        groupedData[router_id] = { agrData: [], mqttData: [], alertData: [] };
      }
      groupedData[router_id].alertData.push(data);
    });
  
    return groupedData;
  };