import type { Component, JSX } from "solid-js";

interface BadgeProps {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "neutral"
    | "success"
    | "warning"
    | "error"
    | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  children: JSX.Element;
  class?: string;
}

const Badge: Component<BadgeProps> = (props) => {
  const variant = () => {
    switch (props.variant) {
      case "primary":
        return "badge-primary";
      case "secondary":
        return "badge-secondary";
      case "accent":
        return "badge-accent";
      case "neutral":
        return "badge-neutral";
      case "success":
        return "badge-success";
      case "warning":
        return "badge-warning";
      case "error":
        return "badge-error";
      case "outline":
        return "badge-outline";
      default:
        return "";
    }
  };

  const size = () => {
    switch (props.size) {
      case "xs":
        return "badge-xs";
      case "sm":
        return "badge-sm";
      case "lg":
        return "badge-lg";
      default:
        return "badge-md";
    }
  };

  return (
    <div
      class={`badge whitespace-nowrap ${variant()} ${size()} ${props.class || ""}`}
    >
      {props.children}
    </div>
  );
};

export default Badge;
