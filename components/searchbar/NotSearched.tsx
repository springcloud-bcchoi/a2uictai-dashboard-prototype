import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, Stack, Text, useDisclosure } from "@chakra-ui/react"
import React, { useEffect } from "react"

export default function NotSearched(props:{ isOpen:boolean, onClose:() => void, errorMessage:string|null}) {
    const {isOpen, onClose, errorMessage} = props;
    const cancelRef = React.useRef<HTMLButtonElement>(null);

  
    return (
      <>
        <AlertDialog
          motionPreset='slideInBottom'
          leastDestructiveRef={cancelRef}
          onClose={onClose}
          isOpen={isOpen}
          isCentered
        >
          <AlertDialogOverlay />
  
          <AlertDialogContent>
            <AlertDialogHeader>장비 정보</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
            <Stack spacing={1}>
              <Text color="gray" fontWeight="bold">
                {errorMessage}
              </Text>
            </Stack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                확인
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }