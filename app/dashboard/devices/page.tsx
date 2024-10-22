"use client"

import { SiteData } from '@/app/service/site';
import Site from '@/components/map/Site';
import Radio from '@/components/radio/RadioBox';
import { SelectedProvider } from '@/components/radio/RadioContext';
import WrappedRadio from '@/components/radio/WrappedRadio';
// import { SearchBar } from '@/components/searchbar/SearchBar';
import { SearchBar } from '@/components/searchbar/SearchBar';
import SkeletonLoader from '@/components/SkeletonLoader';
import { lusitana } from '@/public/fonts/fonts';
// import { getRouters } from '@/app/lib/actions';
// import { RevenueChartSkeleton } from '@/app/ui/skeletons';
import dynamic from 'next/dynamic';
// import { Router } from 'next/router';
import { Suspense, useContext, useEffect, useRef, useState } from 'react';
import styles from './page.module.css';
import { AgrData, ElicitData, RadarUsbData, RadarWifiData, Wss, AlertData, TubeTrailerData } from '@/components/Wss';
import { buttonData, deviceData, doorData, radarWifiData } from '@/app/service/Devices';
import OptionModal from '@/app/ui/devices/OptionModal';
import { SearchProvider, useSearch } from '@/components/searchbar/SearchContext';
import { useDisclosure } from '@chakra-ui/react';
import NotSearched from '@/components/searchbar/NotSearched';

const useDeviceUpdate = (latestMqttData: ElicitData | RadarUsbData | RadarWifiData | TubeTrailerData | null
): { [key: string]: { mqtt: boolean; timestamp: string; type: string } } => {
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

      updateHighlight(device_id, 'mqtt');
    }
  }, [latestMqttData]);

  return highlightedRouters;
};

export default function Page(){
  const { searchTerm, setSearchTerm } = useSearch();

  const deviceOptions = ['도어', '버튼', '레이더'];
  const optionsHeader = {
    first: '장소',
    second: '게이트웨이',
    third: '디바이스',
  };

  const { isConnected, agrDataDb, mqttDataDb, latestAgrData, latestMqttData, alertDataDb } = useContext(Wss);

  const [modalState, setModalState] = useState({
    first: { isOpen: false, leftOption: '장소', rightOption: '전체'},//headerText: '장소·전체' },
    second: { isOpen: false, leftOption: '게이트웨이', rightOption: '전체'},//headerText: '게이트웨이·전체' },
    third: { isOpen: false, leftOption: '디바이스', rightOption: '전체'}//headerText: '디바이스·전체' },
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
  
  // 도어, 버튼, 레이더 데이터 추출
  const deviceDb = deviceData(mqttDataDb);
  // const doorDb = doorData(mqttDataDb);
  // const buttonDb = buttonData(mqttDataDb);
  // const radarWifiDb = radarWifiData(mqttDataDb);
  const devicesUpdateTime = useDeviceUpdate(latestMqttData);
  const routerID = [
    ...deviceDb.map(item => item.router_id),
  ];
  const deviceID = [
    ...deviceDb.map(item => item.device_id),
  ];

  const filteredDevicesBySearch = searchTerm ? deviceDb.filter(device => {
    if ('data' in device) {
      if ('address' in device.data) {
        // ElicitData 타입일 경우
        return device.data.address.toLowerCase().includes(searchTerm.toLowerCase());
      } else if ('uid' in device.data) {
        // RadarWifiData 타입일 경우
        return device.data.uid.toLowerCase().includes(searchTerm.toLowerCase());
      }
    }
    return false;
  }) : [];
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    isOpen: isOpenSearchError,
    onOpen: openSearchError,
    onClose: closeSearchError
  } = useDisclosure();

  const displayDeviceDb = filteredDevicesBySearch.length > 0 ? filteredDevicesBySearch : deviceDb;

  useEffect(() => {
    if(searchTerm != '' ){
        if(filteredDevicesBySearch.length == 0 ){
            setErrorMessage("검색된 장비가 없습니다.");
            openSearchError();
            setSearchTerm('');
        }
    } 
  }, [searchTerm]);

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
          <div className='mb-4'>
            <SearchBar width='600px' placeholder="장치를 검색하세요." me="10px"  border='3px solid black'/>
          </div>


          <div className='mb-4'>
            {/* <section className={`${styles.flexSection}`}>
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

              <OptionModal
                modalState={modalState.second}
                toggleModal={() => toggleModal('second')}
                leftOptions={['게이트웨이']}
                rightOptions={['전체', ...routerID]}
                setSelectedLeftOption={(option) =>
                  setModalOptions('second', option, modalState.second.rightOption)
                }
                setSelectedRightOption={(option) =>
                  setModalOptions('second', modalState.second.leftOption, option)
                }
                onApply={() => applyModal('second')}
              />

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
            </section> */}
          </div>

          {displayDeviceDb
//  .sort((a, b) => {
//   const timestampA = devicesUpdateTime[a.device_id]?.timestamp;
//   const timestampB = devicesUpdateTime[b.device_id]?.timestamp;

//   // console.log("timestampA: ", timestampA);
//   // console.log("parseTime(timestampA): ", parseTime(timestampA));
//   // console.log("timestampB: ", timestampB);
//   // console.log("parseTime(timestampB): ", parseTime(timestampB));

//   return parseTime(timestampB) - parseTime(timestampA); // 최신 시간부터 정렬
// })
  .map((device) => {
    const timestamp = devicesUpdateTime[device.device_id]?.timestamp;

    return (
      <div className='mb-4' style={{ border: "2px solid black" }} key={device.device_id}>
        <div className='border-b-4 mb-4'>
          <span className='mr-16'>
            게이트웨이 MAC주소 : {device.router_id}
          </span>
          <span className='mr-16'>
            장치 :&nbsp;
            {('event_type' in device.data) 
              ? (device.data.event_type === 'motion' ? `레이더_와이파이(${device.data.uid})` : null) 
              : ('elementType' in device.data 
                ? (device.data.elementType === '3' ? `도어(${device.data.address})` : device.data.elementType === '4' ? `버튼(${device.data.address})` : null) 
                : null)}
          </span>
          <span>
            일시 :&nbsp;
            <span className={timestamp ? 'text-sm text-blue-500' : ''}>
              {timestamp ? `device update at ${timestamp}` 
                : ('date' in device.data 
                  ? new Date(device.data.date).toISOString().slice(0, 19).replace('T', ' ')
                  : null)}
            </span>
          </span>
        </div>
        <div>
          {Object.entries(device.data).map(([key, value]) => (
            <span key={key} className='mr-8'>
              {key}: {value}
            </span>
          ))}
        </div>
      </div>
    )
  })}
      </main>
  );
}