import React from 'react'

export const GradientBackground = ({children, style}) => {
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#F9FBFF,#EAF2FF)',padding:'18px',...style}}>
      {children}
    </div>
  )
}