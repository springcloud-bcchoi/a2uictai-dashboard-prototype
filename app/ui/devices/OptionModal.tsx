import styles from './OptionModal.module.css';

interface OptionModalProps {
    modalState: {
        isOpen: boolean;
        leftOption: string;
        rightOption: string;
    };
    toggleModal: () => void;
    // isOpen: boolean; // 모달 열림 상태
    leftOptions?: string[]; // 왼쪽 옵션 목록
    rightOptions?: string[]; // 오른쪽 옵션 목록 (선택적)
    onApply: () => void; // 적용 버튼 클릭 시 호출되는 함수
    setSelectedLeftOption: (option: string) => void; // 왼쪽 옵션 선택 시 호출되는 함수
    setSelectedRightOption: (option: string) => void; // 오른쪽 옵션 선택 시 호출되는 함수 (선택적)
}

const OptionModal: React.FC<OptionModalProps> = ({
    modalState,
    toggleModal,
    // isOpen,
    leftOptions,
    rightOptions,
    onApply,
    setSelectedLeftOption,
    setSelectedRightOption, // 이 부분은 optional이므로 필요할 때만 사용할 수 있습니다.
  }) => {
    // if (!isOpen) return null;
  
    return (
    <div>
        <button
            className={`${styles.optionButton}`}
            onClick={toggleModal}
        >
            <span>{modalState.leftOption}·{modalState.rightOption}</span>
            <span>▼</span>
        </button>
        { modalState.isOpen && <div className={`${styles.modalContainer}`}>
        <div className={`${styles.modalContent}`}>
            {/* 왼쪽 옵션 */}
            {leftOptions && (
            <div className={styles.leftOptions}>
                <ul>
                    {leftOptions.map((option, index) => (
                    <li key={index} onClick={() => setSelectedLeftOption(option)}>
                        {option}
                    </li>
                    ))}
                </ul>
            </div>
            )}

            {/* 구분선 */}
            <div style={{ width: '1px', backgroundColor: '#000', marginRight: '10px' }} />

            {/* 오른쪽 옵션 */}
            {rightOptions && (
            <div className={styles.rightOptions}>
                <ul>
                {rightOptions.map((option, index) => (
                    <li key={index} onClick={() => setSelectedRightOption(option??'전체')}>
                    {option}
                    </li>
                ))}
                </ul>
            </div>
            )}
        </div>
        <div className={`${styles.buttonContainer}`}>
        <button className={`${styles.applyButton}`} onClick={onApply}>
            적용
        </button>
        </div>
        </div>}
    </div>
    );
};

export default OptionModal;