import React, { createContext, useState, useMemo, ReactNode, useContext, useEffect } from 'react';

type DeviceRowObj = {
    connection: boolean,
	code: string;
	type: string;
    top: number,
    left: number,
	detection: number;
};

// 타입 정의
interface SelectedContextType {
    selected: string;
    setSelected: React.Dispatch<React.SetStateAction<string>>;
    filteredDeviceData: DeviceRowObj[]; // 필터링된 데이터를 포함
    setFilteredDeviceData: React.Dispatch<React.SetStateAction<DeviceRowObj[]>>;
}

export const SelectedContext = createContext<SelectedContextType | null>(null);

interface SelectedProviderProps {
    children: ReactNode;
    deviceData: DeviceRowObj[]; // 전체 데이터
}

export const SelectedProvider: React.FC<SelectedProviderProps> = ({ children, deviceData }) => {
    const [selected, setSelected] = useState<string>('');
    const [filteredDeviceData, setFilteredDeviceData] = useState<DeviceRowObj[]>(deviceData);

    // 필터링 로직
    useEffect(() => {
        if (selected === '') return setFilteredDeviceData(deviceData);
        return setFilteredDeviceData(deviceData.filter(device => selected === device.type));
    }, [selected, deviceData]);

    return (
        <SelectedContext.Provider value={{ selected, setSelected, filteredDeviceData, setFilteredDeviceData }}>
            {children}
        </SelectedContext.Provider>
    );
};

// Context 사용을 위한 커스텀 훅
export const useSelected = () => useContext(SelectedContext);