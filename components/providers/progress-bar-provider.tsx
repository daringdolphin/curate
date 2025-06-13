"use client"

import React from "react"
import { AppProgressBar as ProgressBar } from "next-nprogress-bar"

const ProgressBarProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <ProgressBar
        height="2px"
        color="#1F6FEB"
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  )
}

export default ProgressBarProvider 