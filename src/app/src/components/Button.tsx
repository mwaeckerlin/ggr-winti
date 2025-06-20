import React, {useState} from 'react'

const Spinner = () => <div className="spinner"></div>

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<any> | any
}

const Button: React.FC<ButtonProps> = ({children, onClick, disabled, ...props}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick) return

    setIsLoading(true)
    try {
      await onClick(event)
    } catch (error) {
      // The handler in App.tsx is responsible for user-facing errors.
      console.error('Button onClick handler failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button className="action-button" disabled={disabled || isLoading} onClick={handleClick} {...props}>
      <span className={isLoading ? 'loading-text' : ''}>{children}</span>
      {isLoading && <Spinner />}
    </button>
  )
}

export default Button 