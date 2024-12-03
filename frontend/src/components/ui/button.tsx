import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  type?: "submit" | "button" | "reset";
  className?: string;
}

function Button({ text, type = "button", className, ...props }: ButtonProps): JSX.Element {
  return (
    <button className={className} type={type} {...props}>
      {text}
    </button>
  );
}

export { Button };
