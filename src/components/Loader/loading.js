import React from 'react'
import { LoadingOverlay } from '@mantine/core';
export default function loading() {
  return (
    <div>
       <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
    </div>
  )
}
