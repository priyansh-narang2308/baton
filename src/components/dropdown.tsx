"use client";

// Adapted from AlignUI's Dropdown (Radix dropdown-menu), restyled with Baton's tokens. `Picker` replaces the
// native <select> everywhere: same value/onChange contract, but rich rows (avatar, sublabel, presence, badge).
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { cx } from "./ui";

const panel =
  "z-[60] overflow-hidden rounded-2xl bg-surface p-2 shadow-xl ring-1 ring-inset ring-border flex flex-col gap-1 " +
  "data-[side=bottom]:origin-top data-[side=top]:origin-bottom data-[state=open]:animate-[dropdown-in_140ms_ease-out]";

export const Root = DropdownMenuPrimitive.Root;
export const Trigger = DropdownMenuPrimitive.Trigger;
export const RadioGroup = DropdownMenuPrimitive.RadioGroup;

export const Content = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, ...rest }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cx(panel, "w-[300px] max-h-[min(360px,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto", className)} {...rest} />
  </DropdownMenuPrimitive.Portal>
));
Content.displayName = "DropdownContent";

const itemBase =
  "group/item relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg p-2 text-sm text-text outline-none transition duration-150 ease-out data-[highlighted]:bg-surface-2 data-[disabled]:cursor-not-allowed data-[disabled]:text-text-3";

export const RadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...rest }, ref) => (
  <DropdownMenuPrimitive.RadioItem ref={ref} className={cx(itemBase, className)} {...rest}>
    {children}
    <span className="flex-1" />
    <DropdownMenuPrimitive.ItemIndicator>
      <Check className="size-4 text-accent" aria-hidden />
    </DropdownMenuPrimitive.ItemIndicator>
  </DropdownMenuPrimitive.RadioItem>
));
RadioItem.displayName = "DropdownRadioItem";

export function Label({ className, ...rest }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cx("px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-3", className)} {...rest} />;
}

export function Separator() {
  return <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />;
}

export type PickerOption = {
  value: string;
  label: string;
  /** Second line, e.g. "Lead · Gate 3". */
  sublabel?: string;
  /** Shows a round initial avatar for people. */
  avatar?: boolean;
  /** Presence dot on the avatar: true online, false offline, undefined/null not tracked. */
  online?: boolean | null;
  /** Small pill on the right, e.g. "Owner". */
  badge?: string;
};

/**
 * Drop-in replacement for a native <select>. `value` "" with a `placeholder` means nothing chosen. When `emptyLabel`
 * is set, "" is also a real choice (e.g. "All locations") and is listed first.
 */
export function Picker({
  value,
  onChange,
  options,
  placeholder = "Choose…",
  emptyLabel,
  label,
  id,
  ariaLabel,
  variant = "field",
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  emptyLabel?: string;
  /** Heading inside the menu. */
  label?: string;
  id?: string;
  ariaLabel?: string;
  /** "field" matches form inputs; "pill" matches the board's filter chips. */
  variant?: "field" | "pill";
  className?: string;
  disabled?: boolean;
}) {
  const current = options.find((o) => o.value === value);
  const shown = current?.label ?? (value === "" && emptyLabel ? emptyLabel : placeholder);
  const muted = !current && !(value === "" && emptyLabel);
  const all: PickerOption[] = emptyLabel ? [{ value: "", label: emptyLabel }, ...options] : options;

  return (
    <Root modal={false}>
      <Trigger
        id={id}
        disabled={disabled}
        aria-label={ariaLabel ? `${ariaLabel}: ${shown}` : undefined}
        className={cx(
          "group inline-flex min-w-0 items-center gap-2 border border-border bg-surface text-left text-sm outline-none transition-[border-color,box-shadow] duration-150",
          "hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25 data-[state=open]:border-accent disabled:opacity-60",
          variant === "pill" ? "h-9 rounded-full pl-3.5 pr-2.5" : "h-11 w-full rounded-xl px-3",
          className,
        )}
      >
        {current?.avatar && <Avatar name={current.label} online={current.online} size="sm" />}
        <span className={cx("min-w-0 flex-1 truncate", muted && "text-text-3")}>{shown}</span>
        <ChevronDown className="size-4 shrink-0 text-text-3 transition-transform duration-150 group-data-[state=open]:rotate-180" aria-hidden />
      </Trigger>
      <Content align="start" className="w-[max(var(--radix-dropdown-menu-trigger-width),240px)]">
        {label && <Label>{label}</Label>}
        <RadioGroup value={value} onValueChange={onChange}>
          {all.map((o) => (
            <RadioItem key={o.value || "__empty"} value={o.value}>
              {o.avatar && <Avatar name={o.label} online={o.online} />}
              <span className="min-w-0">
                <span className="block truncate">{o.label}</span>
                {o.sublabel && <span className="mt-0.5 block truncate text-xs text-text-3">{o.sublabel}</span>}
              </span>
              {o.badge && (
                <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">{o.badge}</span>
              )}
            </RadioItem>
          ))}
        </RadioGroup>
      </Content>
    </Root>
  );
}

function Avatar({ name, online, size = "md" }: { name: string; online?: boolean | null; size?: "sm" | "md" }) {
  return (
    <span className={cx("relative grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white", size === "sm" ? "size-6 text-[11px]" : "size-8 text-xs")} aria-hidden>
      {name.slice(0, 1).toUpperCase()}
      {online != null && (
        <span className={cx("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface", online ? "bg-done" : "bg-border-strong")} />
      )}
    </span>
  );
}

/** Sublabel for a crew member row: role, simulated marker and presence, in words (the dot alone isn't enough). */
export function crewSublabel(c: { role: "lead" | "volunteer"; online: boolean | null; isSimulated?: boolean }) {
  return [c.role === "lead" ? "Lead" : "Volunteer", c.isSimulated ? "simulated" : null, c.online === true ? "online" : c.online === false ? "offline" : null]
    .filter(Boolean)
    .join(" · ");
}
