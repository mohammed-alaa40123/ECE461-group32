import React from "react"

type ButtonProps = {
  text: string
  type : "submit" | "button" | "reset"
  className?: string
}

function Button({text, type, className}: ButtonProps): JSX.Element {
    return (
      <button
        className = {className}
        type = {type}
        >
          {text}
        </button>
    )
}

export { Button }