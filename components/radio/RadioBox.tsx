import React from 'react';

interface RadioProps {
    label: string;
    onClick: () => void;
    color?: 'default' | 'primary';
    variant?: 'filled' | 'outlined';
    style?: React.CSSProperties;
}

const Radio: React.FC<RadioProps> = ({ label, onClick, color = 'default', variant = 'outlined', style }) => {
    const baseStyle: React.CSSProperties = {
        display: 'flex', // 텍스트와 원형 버튼을 나란히 배치하기 위해 flex 사용
        alignItems: 'center',
        cursor: 'pointer',
        margin: '8px 0',
    };

    const radioStyle: React.CSSProperties = {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid #007bff',
        marginRight: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    // 선택 여부에 따라 원 안을 채우는 스타일 적용
    const selectedRadioStyle: React.CSSProperties = color === 'primary' ? {
        backgroundColor: '#007bff',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
    } : {};

    return (
        <div style={baseStyle} onClick={onClick}>
            <div style={radioStyle}>
                <div style={selectedRadioStyle}></div> {/* 선택된 경우 내부 원 */}
            </div>
            <span>{label}</span>
        </div>
    );
};

export default Radio;