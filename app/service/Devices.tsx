import { ElicitData, RadarUsbData, RadarWifiData, TubeTrailerData, HydrogenProductionStationData, RadarWifiDataFCV, RadarWifiDataFV } from "@/components/Wss";

export interface ModifyElicitData {
    topic_id: string;
    data: {
      date: string;
      rssi: string;
      address: string;
      battery: string;
      event: string;
      event_type: string;
    };
  }

export interface GroupedDeviceData extends Omit<ModifyElicitData, 'data'>, Omit<RadarWifiData, 'data'> {
    router_id: string;
    device_id: string;
    data: ModifyElicitData['data'] | RadarWifiData['data']; // 두 가지 타입을 모두 허용
}

export interface GroupedElicitData extends ModifyElicitData {
    router_id: string;
    device_id: string;
}

// export interface GroupedRadarWifiData extends RadarWifiData {
//     router_id: string;
//     device_id: string;
// }
// export type GroupedRadarWifiData = RadarWifiData & {
//   router_id: string;
//   device_id: string;
//   data: (RadarWifiDataFCV["data"] & { radar_type: 'FCV' }) | (RadarWifiDataFV["data"] & { radar_type: 'FV' });
// };
export interface UnifiedRadarData {
  router_id: string;
  device_id: string;
  data: {
    Det: string;
    HR: string;
    BR: string;
    spo2: string;
    fall: string;
    rssi: string;
    IP: string;
    MAC: string;
    radar_type: 'FCV' | 'FV';
  }
}


export interface GroupedHydrogenProductionStationData extends HydrogenProductionStationData {
    router_id: string;
    device_id: string;
}

export interface GroupedTubeTrailerData extends TubeTrailerData {
  router_id: string;
  device_id: string;
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
            const modifiedData:ModifyElicitData = {
                ...data,
                data: {
                  ...data.data,
                  event_type: data.data.elementType, // elementType을 event_type으로 대체
                },
            };
            groupedData.push({ ...modifiedData, router_id, device_id });
          } else if (device_id.includes('room3') || device_id.includes('Test')) {
            const radarData: GroupedDeviceData = {
                ...data,
                router_id,
                device_id,
                data: data.data as RadarWifiData['data'] // RadarWifiData 타입으로 명시적 단언
              };
              groupedData.push(radarData);
          }
      });

      return groupedData;
}

export const doorData = (mqttDataDb: any[]):GroupedElicitData[] => {
    const groupedData:GroupedElicitData[] = [];
    
    mqttDataDb.filter((data): data is ElicitData => 'address' in data.data && data.data.address !== undefined && data.data.address.includes('DOOR'))
    .forEach(data => {
        if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
        const [router_id, device_id] = data.topic_id.split('/');
        const modifiedData:ModifyElicitData = {
            ...data,
            data: {
              ...data.data,
              event_type: data.data.elementType, // elementType을 event_type으로 대체
            },
        };
        groupedData.push({ ...modifiedData, router_id, device_id });
      });

      return groupedData;
}

export const buttonData = (mqttDataDb: any[]):GroupedElicitData[] => {
    const groupedData:GroupedElicitData[] = [];
    mqttDataDb.filter((data): data is ElicitData => 'address' in data.data && data.data.address !== undefined && data.data.address.includes('BTN'))
    .forEach(data => {
        if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
        const [router_id, device_id] = data.topic_id.split('/');
        const modifiedData:ModifyElicitData = {
            ...data,
            data: {
              ...data.data,
              event_type: data.data.elementType, // elementType을 event_type으로 대체
            },
        };
        groupedData.push({ ...modifiedData, router_id, device_id });
      });

      return groupedData;
}

// export const radarWifiData = (mqttDataDb: any[]):GroupedRadarWifiData[] => {
  
//     const groupedData:GroupedRadarWifiData[] = [];
    
//     mqttDataDb.filter((data): data is RadarWifiData => 'heart' in data.data)
//     .forEach(data => {
//         if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
//         const [router_id, device_id] = data.topic_id.split('/');
//         // if (device_id.includes('room3') || device_id.includes('Test')) {
//         //     // RadarWifiData인 경우 device_id가 'room'을 포함하면 push
//         //   }
//           groupedData.push({ ...data, router_id, device_id });
//       });

//       return groupedData;
// }
// export const radarWifiData = (mqttDataDb: any[]): GroupedRadarWifiData[] => {
//   const groupedData: GroupedRadarWifiData[] = [];

//   mqttDataDb
//     .filter((data): data is RadarWifiData => {
//       const d = data.data;
//       return d && ('presence' in d || 'state' in d);
//     })
//     .forEach(data => {
//       if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;

//       const [router_id, device_id] = data.topic_id.split('/');

//       // radar_type 추가
//       if ('presence' in data.data) {
//         groupedData.push({
//           ...data,
//           data: { ...data.data, radar_type: 'FCV' },
//           router_id,
//           device_id
//         });
//       } else if ('state' in data.data) {
//         groupedData.push({
//           ...data,
//           data: { ...data.data, radar_type: 'FV' },
//           router_id,
//           device_id
//         });
//       }
//     });

//   return groupedData;
// };
export const radarWifiData = (mqttDataDb: any[]): UnifiedRadarData[] => {
  const unifiedData: UnifiedRadarData[] = [];

  mqttDataDb
    .filter((data): data is RadarWifiData => {
      const d = data.data;
      return d && ('presence' in d || 'state' in d);
    })
    .forEach(data => {
      if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;

      const [router_id, device_id] = data.topic_id.split('/');

      if ('presence' in data.data) {
        // FCV 타입
        unifiedData.push({
          data: {
            Det: data.data.presence,
            HR: data.data.heart,
            BR: data.data.breath,
            spo2: '', // 없음
            fall: data.data.fall,
            rssi: data.data.radar_rssi,
            IP: data.data.device_ip,
            MAC: data.data.mac_address,
            radar_type: 'FCV'
          },
          router_id,
          device_id
        });
      } else if ('state' in data.data) {
        // FV 타입
        unifiedData.push({
          data: {
            Det: data.data.state,
            HR: data.data.heart,
            BR: data.data.breath,
            spo2: data.data.sp02,
            fall: data.data.drop,
            rssi: data.data.radar_rssi,
            IP: '', // 없음
            MAC: '', // 없음
            radar_type: 'FV'
          },
          router_id,
          device_id
        });
      }
    });

  return unifiedData;
};


export const hydrogenProductionStationData = (mqttDataDb: any[]):GroupedHydrogenProductionStationData[] => {
    const groupedData:GroupedHydrogenProductionStationData[] = [];
    
    mqttDataDb.filter((data): data is HydrogenProductionStationData => 'guid' in data.data)
    .forEach(data => {
        if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
    
        const [router_id, device_id] = data.topic_id.split('/');
        // if (device_id.includes('room3') || device_id.includes('Test')) {
        //     // RadarWifiData인 경우 device_id가 'room'을 포함하면 push
        //   }
          groupedData.push({ ...data, router_id, device_id });
      });

      return groupedData;
}

export const tubeTrailerData = (mqttDataDb: any[]):GroupedTubeTrailerData[] => {
  const groupedData:GroupedTubeTrailerData[] = [];
  
  mqttDataDb.filter((data): data is TubeTrailerData => 'sensor_node5' in data.data)
  .forEach(data => {
      if (data.topic_id.includes('ALIVE') || data.topic_id.includes('JOINCNF')) return;
      
      const [router_id, device_id] = data.topic_id.split('/');
      
      if (router_id === 'unknown' || !/^[A-Za-z0-9]{4}$/.test(router_id)) return null;
      groupedData.push({ ...data, router_id, device_id });
  });

  const topicMap: Record<string, [string,string]> = {};
  groupedData.forEach(item => {
      const data = item.data;
      const topicParts = item.topic_id.split("/"); 
      const key = topicParts[0];  
      const newValue = topicParts[1]; 

      // 기존 키가 이미 존재할 경우, timetbl 값을 비교하여 최신 데이터 반영
      if (topicMap[key]) {
          const existingTime = topicMap[key][1] ? new Date(topicMap[key][1]).getTime() : 0;
          const newTime = data?.timetbl ? new Date(data.timetbl).getTime() : 0;

          // 기존 값의 timetbl 값이 더 이전 것이면 새로운 데이터로 갱신
          if (newTime > existingTime) {
              topicMap[key] = [newValue, data.timetbl];
          }
      } else {
          // 키가 없으면 바로 추가
          topicMap[key] = [newValue, data.timetbl];
      }
  });

  // cuid가 동일한 데이터 중 timetbl가 가장 최신의 것만 나오도록 필터
  const filteredGroupedData = groupedData.filter(item => {
    const topicParts = item.topic_id.split("/");
    return topicMap[topicParts[0]] && topicMap[topicParts[0]][0] === topicParts[1];
  })

  return filteredGroupedData;
}