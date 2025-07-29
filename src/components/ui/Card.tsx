import type { Component, JSX } from "solid-js";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: JSX.Element;
  class?: string;
  compact?: boolean;
  bordered?: boolean;
  shadow?: boolean;
}

const Card: Component<CardProps> = (props) => {
  const classes = () => {
    let base = "card bg-base-100";
    if (props.compact) base += " card-compact";
    if (props.bordered) base += " card-bordered";
    if (props.shadow) base += " shadow-xl";
    if (props.class) base += ` ${props.class}`;
    return base;
  };

  return (
    <div class={classes()}>
      <div class="card-body">
        {props.title && (
          <h2 class="card-title">
            {props.title}
            {props.subtitle && (
              <div class="text-sm font-normal opacity-60">{props.subtitle}</div>
            )}
          </h2>
        )}
        {props.children}
      </div>
    </div>
  );
};

export default Card;
