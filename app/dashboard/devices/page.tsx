"use client"

import { useRouter } from 'next/navigation';

import { SiteData } from '@/app/service/site';
import Site from '@/components/map/Site';
import Radio from '@/components/radio/RadioBox';
import { SelectedProvider } from '@/components/radio/RadioContext';
// import WrappedRadio from '@/components/radio/WrappedRadio';
// import { SearchBar } from '@/components/searchbar/SearchBar';
import { SearchBar } from '@/components/searchbar/SearchBar';
import SkeletonLoader from '@/components/SkeletonLoader';
import { lusitana } from '@/public/fonts/fonts';
// import { getRouters } from '@/app/lib/actions';
// import { RevenueChartSkeleton } from '@/app/ui/skeletons';
import dynamic from 'next/dynamic';
// import { Router } from 'next/router';
import { Suspense, useContext, useEffect, useRef, useState } from 'react';
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss, AlertData, TubeTrailerData, HydrogenProductionStationData } from '@/components/Wss';
import { buttonData, deviceData, doorData, GroupedDeviceData, GroupedElicitData, GroupedHydrogenProductionStationData, GroupedTubeTrailerData, hydrogenProductionStationData, ModifyElicitData, radarWifiData, tubeTrailerData } from '@/app/service/Devices';
import OptionModal from '@/app/ui/devices/OptionModal';
import { SearchProvider, useSearch } from '@/components/searchbar/SearchContext';
import { useDisclosure } from '@chakra-ui/react';
import NotSearched from '@/components/searchbar/NotSearched';

const useDeviceUpdate = (latestMqttData: ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData | HydrogenProductionStationData | null
): { [key: string]: { mqtt: boolean; timestamp: string; type: string } } => {
  const [highlightedRouters, setHighlightedRouters] = useState<{
    [key: string]: { agr: boolean; mqtt: boolean; timestamp: string; type: string }
  }>({});
  const timeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const updateHighlight = (topicId: string, type: 'agr' | 'mqtt') => {
    const timestamp = new Date().toLocaleTimeString();

    if (timeouts.current[topicId]) clearTimeout(timeouts.current[topicId]);

    setHighlightedRouters(prev => ({
      ...prev,
      [topicId]: { ...prev[topicId], [type]: true, timestamp, type }
    }));

    const timeout = setTimeout(() => {
      setHighlightedRouters(prev => ({
        ...prev,
        [topicId]: { ...prev[topicId], [type]: false }
      }));
      delete timeouts.current[topicId];
    }, 100);

    timeouts.current[topicId] = timeout;
  };

  // useEffect(() => {
  //   if (latestAgrData) {
  //     const routerId = latestAgrData.data.router_id;
  //     updateHighlight(routerId, 'agr');
  //   }
  // }, [latestAgrData]);

  useEffect(() => {
    if (latestMqttData) {
      const [router_id, device_id] = latestMqttData.topic_id.split('/');
      // let device_id_number = device_id;

      // if (device_id.includes('=')) {
      //   device_id_number = device_id.split('=')[1];
      // }

      updateHighlight(latestMqttData.topic_id, 'mqtt');
    }
  }, [latestMqttData]);

  return highlightedRouters;
};

export default function Page(){
  const { searchTerm, setSearchTerm } = useSearch();
  // const router = useRouter();
  // const query = new URLSearchParams(window.location.search);

  // console.log("query: ",query);

  const deviceOptions = ['도어', '버튼', '레이더'];
  const optionsHeader = {
    first: '장소',
    second: '게이트웨이',
    third: '디바이스',
  };

  const { isConnected, agrDataDb, mqttDataDb, latestAgrData, latestMqttData, alertDataDb } = useContext(Wss);

  const [live, setLive] = useState<boolean>(false);
  const handleRadioClick = (live:boolean) => {
    setLive(!live);
  };

  const [modalState, setModalState] = useState({
    first: { isOpen: false, leftOption: '장소', rightOption: '전체'},
    second: { isOpen: false, leftOption: 'RouterId', rightOption: '전체'},
    third: { isOpen: false, leftOption: '디바이스', rightOption: '전체'}
  });
  // const [selectedLeftOption, setSelectedLeftOption] = useState('');
  // const [selectedRightOption, setSelectedRightOption] = useState('');

  const toggleModal = (modal:'first' | 'second' | 'third') => {
    setModalState((prev) => ({
      ...prev,
      [modal]: { ...prev[modal], isOpen: !prev[modal].isOpen },
    }));
  };

  const setModalOptions = (modal: 'first' | 'second' | 'third', leftOption?: string, rightOption?: string) => {
    setModalState((prev) => ({
      ...prev,
      [modal]: {
        ...prev[modal],
        ...( { leftOption: leftOption ?? optionsHeader[modal] }),
        ...( { rightOption: rightOption ?? "전체" }), // rightOption이 있는 경우에만 추가
      },
    }));
  };

  const applyModal = (modal: 'first' | 'second' | 'third') => {
    setModalState((prev) => ({
      ...prev,
      [modal]: { ...prev[modal], isOpen: false },
    }));
  };
  
  // 각 장비 데이터 추출
  // const deviceDb = deviceData(mqttDataDb);
  const doorDb = doorData(mqttDataDb);
  const buttonDb = buttonData(mqttDataDb);
  const radarWifiDb = radarWifiData(mqttDataDb);
  const hydrogenProductionStationDb = hydrogenProductionStationData(mqttDataDb);
  const tubeTrailerDb = tubeTrailerData(mqttDataDb);

  
  const deviceDb = [...doorDb, ...buttonDb, ...radarWifiDb, ...hydrogenProductionStationDb, ...tubeTrailerDb];

  const devicesUpdateTime = useDeviceUpdate(latestMqttData);
  const routerID = [
    ...deviceDb
      .map(item => {
        if (item.router_id === 'unknown' || !/^[A-Za-z0-9]{4}$/.test(item.router_id)) return null;
        return item.router_id;
      })
      .filter((id): id is string => id !== null), // 여기서 null 제거 및 타입 단언
  ];
  
  const deviceID = [
    ...deviceDb.map(item => item.device_id),
  ];

  useEffect(() => {
    setSearchTerm(''); 
  }, []);

  // 기기 필터
  const filteredDevicesByOptions = deviceDb.filter((device) => {
    // const firstMatch =
    //   modalState.first.rightOption === '전체' || device.location === modalState.first.rightOption;
    const secondMatch =
      modalState.second.rightOption === '전체' || device.router_id.includes(modalState.second.rightOption);
    // const thirdMatch =
    //   modalState.third.rightOption === '전체' || device.deviceType === modalState.third.rightOption;
  
    return secondMatch //firstMatch &&  && thirdMatch;
  });
  const filteredDevicesBySearch = searchTerm ? 
    (filteredDevicesByOptions.length > 0 ? filteredDevicesByOptions : deviceDb)
    .filter(device => {
    const routerId = device.router_id.toLowerCase().includes(searchTerm.toLowerCase());
    const deviceId = device.device_id.toLowerCase().includes(searchTerm.toLowerCase());
    // let deviceId = false;
    // // return routerId || deviceId;
    // if ('data' in device) {
    //   if ('address' in device.data) {
    //     // ElicitData 타입일 경우
    //     deviceId = device.data.address.toLowerCase().includes(searchTerm.toLowerCase());
    //   } else if ('uid' in device.data) {
    //     // RadarWifiData 타입일 경우
    //     deviceId = device.data.uid.toLowerCase().includes(searchTerm.toLowerCase());
    //   } else if ('guid' in device.data) {
    //     // RadarWifiData 타입일 경우
    //     deviceId = device.data.guid.toLowerCase().includes(searchTerm.toLowerCase());
    //   } 
    // }
    return routerId || deviceId;
  }) : [];
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    isOpen: isOpenSearchError,
    onOpen: openSearchError,
    onClose: closeSearchError
  } = useDisclosure();

  const displayDeviceDb = filteredDevicesBySearch.length > 0 ? 
                            filteredDevicesBySearch 
                            :  filteredDevicesByOptions.length > 0 ? 
                            filteredDevicesByOptions
                            : deviceDb;
  // const displayDeviceDb = filteredDevicesBySearch.length > 0 ? filteredDevicesBySearch : deviceDb;
  
  // 헬퍼 함수들
  const isRadar = (data:any) => 'radar_type' in data;
  const isHydrogenStation = (data:any) => 'fdet' in data;
  const isTubeTrailer = (data:any) => 'cuid' in data;

  // 장치별 그룹핑
  const groupedByType = {
    레이더와이파이: displayDeviceDb.filter((d) => isRadar(d.data)),
    수소충전생산기지: displayDeviceDb.filter((d) => isHydrogenStation(d.data)),
    튜브트레일러: displayDeviceDb.filter((d) => isTubeTrailer(d.data)),
  };

  useEffect(() => {
    if(searchTerm != '' ){
        if(filteredDevicesBySearch.length == 0 ){
            setErrorMessage("검색된 장비가 없습니다.");
            openSearchError();
            setSearchTerm('');
        }
    } 
  }, [filteredDevicesBySearch]);

  const parseTime = (timestamp: string) => {
    if (!timestamp) return 0; // timestamp가 없으면 0으로 처리
  
    // 오전/오후를 24시간 형식으로 변환
    const timeString = timestamp.replace("device update at ", "").trim();
    
    let [time, period] = timeString.split(' ');
    let [hour, minute, second] = time.split(':').map(Number);
  
    // 오전/오후에 따라 시간 변환
    if (period === "오후" && hour < 12) {
      hour += 12; // 오후 12시 이전은 12시간 더하기
    } else if (period === "오전" && hour === 12) {
      hour = 0; // 오전 12시는 0으로 변환
    }
  
    // Date 객체 생성
    const date = new Date(`1970-01-01T${hour}:${minute}:${second}`);
    // console.log(date);
    return date.getTime(); // 밀리초 단위로 반환
  };
  

  return (
    <main>
        <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
            장치관리
        </h1>
        <NotSearched isOpen={isOpenSearchError} onClose={closeSearchError} errorMessage={errorMessage} />
        <div className='mb-4' style={{display:'flex', flexDirection:"row", gap:"8px"}}>
          <SearchBar maxWidth='600px' placeholder="장치를 검색하세요." me="10px"  border='3px solid black'/>
        </div>


        <div className='mb-4'>
          <section className="flexSection">
            {/* <div className="optionContainer">
              <OptionModal
                modalState={modalState.first}
                toggleModal={() => toggleModal('first')}
                leftOptions={['장소', '요양병원']}
                rightOptions={['전체', '영남요양병원']}
                setSelectedLeftOption={(option) =>
                  setModalOptions('first', option, modalState.first.rightOption)
                }
                setSelectedRightOption={(option) =>
                  setModalOptions('first', modalState.first.leftOption, option)
                }
                onApply={() => applyModal('first')}
              />
            </div> */}
            <div className="optionContainer">
              <OptionModal
                modalState={modalState.second}
                toggleModal={() => toggleModal('second')}
                leftOptions={['RouterId']}
                rightOptions={['전체', ...Array.from(new Set(routerID))]}
                setSelectedLeftOption={(option) =>
                  setModalOptions('second', option, modalState.second.rightOption)
                }
                setSelectedRightOption={(option) =>
                  setModalOptions('second', modalState.second.leftOption, option)
                }
                onApply={() => applyModal('second')}
              />
            </div>
            {/* <div className="optionContainer">
              <OptionModal
                modalState={modalState.third}
                toggleModal={() => toggleModal('third')}
                leftOptions={['디바이스']}
                rightOptions={['전체', ...deviceOptions]}
                setSelectedLeftOption={(option) =>
                  setModalOptions('third', option, modalState.third.rightOption)
                }
                setSelectedRightOption={(option) =>
                  setModalOptions('third', modalState.third.leftOption, option)
                }
                onApply={() => applyModal('third')}
              />
            </div> */}
          </section>
        </div>

        {Object.entries(groupedByType).map(([type, devices]) => (
  <section key={type} className="mb-10">
    <h2 className="text-xl font-bold mb-4">{type}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device, index) => {
        const timestamp = devicesUpdateTime[`${device.router_id}/${device.device_id}`]?.timestamp;
        const data = device.data;

        return (
          <div key={index} className="p-4 border rounded-xl shadow bg-white">
            <div className="mb-2 text-sm text-gray-700 flex flex-wrap gap-4">
              <span><strong>TopicId:</strong> {device.router_id}/{device.device_id}</span>
              {/* <span><strong>MAC:</strong> {device.router_id}</span>
              <span><strong>ID:</strong> {device.device_id || data.guid || data.tuid}</span> */}
              <span>
                <strong>업데이트:</strong>{" "}
                {timestamp ? (
                  <span className="text-sm text-blue-500">{timestamp}</span>
                ) : (
                  <span className="text-sm">
                    {typeof data === "object" && data !== null
                      ? "last_update_time" in data
                        ? (data as any).last_update_time
                        : "timetbl" in data
                        ? (data as any).timetbl
                        : "-"
                      : "-"}
                  </span>
                )}
              </span>


            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {Object.entries(data)
              .map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-medium w-28">{key}:</span>
                  {["barr", "berr"].includes(key) ? (
                    <div className="overflow-x-auto whitespace-nowrap font-mono text-gray-600">
                      {value || '-'}
                    </div>
                  ) : (
                    <span className="text-gray-600">{value || '-'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </section>
))}

  </main>
);

}