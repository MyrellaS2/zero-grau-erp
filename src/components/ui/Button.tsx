import type {
 ButtonHTMLAttributes,
 ReactNode
} from "react"

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "success" | "danger" | "secondary"
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const colors = {
    primary: "bg-blue-800 hover:bg-blue-900 text-white",
    success: "bg-green-700 hover:bg-green-800 text-white",
    danger: "bg-red-700 hover:bg-red-800 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800"
  }

  return (
    <button
      {...props}
      className={`
        px-5
        py-2
        rounded-lg
        font-semibold
        transition-all
        ${colors[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button