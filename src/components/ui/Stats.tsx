import { For, type Component, type JSX } from "solid-js";

interface StatItem {
  title: string;
  value: string | number;
  desc?: string;
  icon?: JSX.Element;
}

interface StatsProps {
  items: StatItem[];
  class?: string;
  vertical?: boolean;
}

const Stats: Component<StatsProps> = (props) => {
  const classes = () => {
    let base = "w-full stats";
    if (props.vertical) base += " stats-vertical";
    if (props.class) base += ` ${props.class}`;
    return base;
  };

  return (
    <div class={classes()}>
      <For each={props.items}>
        {(item) => (
          <div class="stat">
            {item.icon && (
              <div class="stat-figure text-secondary">{item.icon}</div>
            )}
            <div class="stat-title">{item.title}</div>
            <div class="stat-value">{item.value}</div>
            {item.desc && <div class="stat-desc">{item.desc}</div>}
          </div>
        )}
      </For>
    </div>
  );
};

export default Stats;
