import { For, Show, type JSX } from "solid-js";

interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], item: T) => JSX.Element;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  class?: string;
  zebra?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

function Table<T extends Record<string, any>>(
  props: TableProps<T>,
): JSX.Element {
  const classes = () => {
    let base = "table w-full";
    if (props.zebra) base += " table-zebra";
    if (props.hoverable) base += " table-hover";
    if (props.compact) base += " table-compact";
    if (props.class) base += ` ${props.class}`;
    return base;
  };

  const getAlignment = (align?: string) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div class="overflow-x-auto">
      <table class={classes()}>
        <thead>
          <tr>
            <For each={props.columns}>
              {(column) => (
                <th
                  class={getAlignment(column.align)}
                  style={column.width ? { width: column.width } : {}}
                >
                  {column.title}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <Show
            when={!props.loading && props.data.length > 0}
            fallback={
              <tr>
                <td
                  colspan={props.columns.length}
                  class="text-center py-8 text-base-content/60"
                >
                  <Show
                    when={!props.loading}
                    fallback={
                      <div class="flex items-center justify-center gap-2">
                        <span class="loading loading-spinner loading-sm"></span>
                        Loading...
                      </div>
                    }
                  >
                    {props.emptyMessage || "No data available"}
                  </Show>
                </td>
              </tr>
            }
          >
            <For each={props.data}>
              {(item) => (
                <tr>
                  <For each={props.columns}>
                    {(column) => (
                      <td class={getAlignment(column.align)}>
                        <Show
                          when={column.render}
                          fallback={String(item[column.key] ?? "")}
                        >
                          {column.render!(item[column.key], item)}
                        </Show>
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>
    </div>
  );
}

export default Table;
