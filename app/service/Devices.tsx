import { ElicitData, RadarUsbData, RadarWifiData, TubeTrailerData } from "@/components/Wss";

interface GroupedDeviceData extends Omit<ElicitData, 'data'>, Omit<RadarWifiData, 'data'> {
    router_id: string;
    device_id: string;
    data: ElicitData['data'] | RadarWifiData['data']; // 두 가지 타입을 모두 허용
}

interface GroupedElicitData extends ElicitData {
    router_id: string;
}

interface GroupedRadarWifiData extends RadarWifiData {
    router_id: string;
}

export const deviceData = (mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[]):GroupedDeviceData[] => {
    const groupedData:GroupedDeviceData[] = [];
    
    mqttDataDb
    .filter((data): data is (ElicitData | RadarWifiData) => {
        // ElicitData 또는 RadarUsbData만 필터링
        return 'data' in data && ('BR' in data.data || 'cuid' in data.data) === false; 
    })
    .forEach(data => {
        if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
        const [router_id, device_id] = data.topic_id.split('/');
        if ('elementType' in data.data) {
            // ElicitData인 경우 무조건 push
            groupedData.push({ ...data, router_id, device_id });
          } else if (device_id.includes('room3')) {
            // RadarWifiData인 경우 device_id가 'room'을 포함하면 push
            groupedData.push({ ...data, router_id, device_id });
          }
      });

      return groupedData;
}

export const doorData = (mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData)[]):GroupedElicitData[] => {
    const groupedData:GroupedElicitData[] = [];
    
    mqttDataDb.filter((data): data is ElicitData => 'address' in data.data && data.data.address !== undefined && data.data.address.includes('DOOR'))
    .forEach(data => {
        if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
        const [router_id, device_id] = data.topic_id.split('/');
        groupedData.push({ ...data, router_id });
      });

      return groupedData;
}

export const buttonData = (mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData)[]):GroupedElicitData[] => {
    const groupedData:GroupedElicitData[] = [];
    console.log(mqttDataDb);
    mqttDataDb.filter((data): data is ElicitData => 'address' in data.data && data.data.address !== undefined && data.data.address.includes('BTN'))
    .forEach(data => {
        if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
        const [router_id, device_id] = data.topic_id.split('/');
        groupedData.push({ ...data, router_id });
      });

      return groupedData;
}

export const radarWifiData = (mqttDataDb: (ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData)[]):GroupedRadarWifiData[] => {
    const groupedData:GroupedRadarWifiData[] = [];
    
    mqttDataDb.filter((data): data is RadarWifiData => 'heart' in data.data && data.topic_id.split('/')[1].includes('room'))
    .forEach(data => {
        if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
        const [router_id, uid] = data.topic_id.split('/');
        groupedData.push({ ...data, router_id });
      });

      return groupedData;
}