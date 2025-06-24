import React from 'react'

interface FormGroupProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

// FormGroup-Komponente für einheitliche Formular-Gruppierung
const FormGroup: React.FC<FormGroupProps> = ({children, style, className}) => (
  <div className={`form-group${className ? ' ' + className : ''}`} style={style}>
    {children}
  </div>
)

export default FormGroup 