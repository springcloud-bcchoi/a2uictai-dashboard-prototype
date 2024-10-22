import {
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import React, { KeyboardEvent } from 'react';
import { useSearch } from './SearchContext';

export function SearchBar(props: {
  variant?: string;
  background?: string;
  placeholder?: string;
  borderRadius?: string | number;
  [x: string]: any;
}) {
  // Pass the computed styles into the `__css` prop
  const {
    variant,
    background,
    placeholder,
    borderRadius,
    ...rest
  } = props;

  // Chakra Color Mode
  const searchIconColor = useColorModeValue('gray.700', 'white');
  const inputBg = useColorModeValue('secondaryGray.300', 'navy.900');
  const inputText = useColorModeValue('gray.700', 'gray.100');

  const { searchTerm, setSearchTerm } = useSearch();
  const [inputValue, setInputValue] = React.useState<string>(''); // 입력값을 상태로 관리

  // 엔터 키가 눌렸을 때 검색어를 업데이트하는 함수
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchTerm(inputValue);
    }
  };

  // 검색 버튼을 눌렀을 때 검색어를 업데이트하는 함수
  const handleSearchClick = () => {
    setSearchTerm(inputValue);
  };

  // 입력 필드의 값을 상태로 관리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <InputGroup {...rest}>
      <Input
        variant="search"
        fontSize="sm"
        bg={background ? background : inputBg}
        color={inputText}
        fontWeight="500"
        _placeholder={{ color: 'gray.400', fontSize: '14px' }}
        borderRadius={borderRadius ? borderRadius : '30px'}
        placeholder={placeholder ? placeholder : 'Search...'}
        value={inputValue} // 상태로 관리하는 입력값을 사용
        onChange={handleChange} // 입력값 상태 업데이트
        onKeyDown={handleKeyDown} // 엔터 키 입력 시 검색어 업데이트
      />
      <InputRightElement>
        <IconButton
          aria-label="search-button"
          bg="inherit"
          borderRadius="inherit"
          _active={{
            bg: 'inherit',
            transform: 'none',
            borderColor: 'transparent',
          }}
          _hover={{
            background: 'none',
          }}
          _focus={{
            background: 'none',
            boxShadow: 'none',
          }}
          icon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />} //color={searchIconColor} w="15px" h="15px"
          onClick={handleSearchClick} // 검색 버튼 클릭 시 검색어 업데이트
        />
      </InputRightElement>
    </InputGroup>
  );
}
