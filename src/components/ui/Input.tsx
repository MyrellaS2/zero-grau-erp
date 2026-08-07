import type { InputHTMLAttributes } from "react"

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {}

function Input({
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={`
        w-full
        border
        border-gray-300
        rounded-lg
        p-2
        outline-none
        focus:ring-2
        focus:ring-blue-700
        focus:border-blue-700
        transition-all
        ${className}
      `}
    />
  )
}

export default Input