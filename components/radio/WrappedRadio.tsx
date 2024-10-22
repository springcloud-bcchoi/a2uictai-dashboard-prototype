import React from 'react';
import { useSelected } from './RadioContext'; // RadioContext 가져오기

const WrappedRadio = (prop: { options: string[]; Component: React.FC<any> }) => {
    const { options, Component } = prop;

    // useSelected에서 반환된 값을 selectedContext로 받아옵니다.
    const selectedContext = useSelected();
    const selected = selectedContext ? selectedContext.selected : null;
    const setSelected = selectedContext ? selectedContext.setSelected : () => {};

    const isAllChipSelected = selected === '';

    const handleOptionClick = (option: string) => {
        if (option === '전체' || selected === option) {
            // '전체' chip 클릭 시, 다른 모든 chip을 선택 해제
            setSelected('');
        } else {
            setSelected(option);
        }
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // 2x2 그리드 설정
            gap: '2px', // 그리드 항목 간격
        }}>
            {options.map((option, index) => {
                const isAllChip = option === '전체';
                const color = isAllChip
                    ? (isAllChipSelected ? 'primary' : 'default')
                    : (selected === option ? 'primary' : 'default');
                const variant = isAllChip
                    ? (isAllChipSelected ? 'filled' : 'outlined')
                    : (selected === option ? 'filled' : 'outlined');

                return (
                    <Component
                        key={index}
                        label={option}
                        onClick={() => handleOptionClick(option)}
                        color={color}
                        variant={variant}
                        style={{ margin: 4 }}
                    />
                );
            })}
        </div>
    );
};

export default WrappedRadio;
