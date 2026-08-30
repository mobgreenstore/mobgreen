import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function ResponsiveDataView({
  table,
  mobile,
  className,
}: {
  table: ReactNode;
  mobile: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="md:hidden">{mobile}</div>
      <div className="hidden md:block">{table}</div>
    </div>
  );
}

export function DataTable({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-xs">
      <table
        className={cn(
          "w-full min-w-[44rem] border-collapse text-left text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function DataTableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface-subtle", className)} {...props} />;
}

export function DataTableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-border", className)} {...props} />
  );
}

export function DataTableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-surface-subtle/60", className)}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "h-11 px-4 text-xs font-semibold tracking-[0.06em] text-foreground-subtle uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3.5 align-middle", className)} {...props} />
  );
}

export function DataTableCaption({
  className,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn("sr-only", className)} {...props} />;
}

export function DataList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-3", className)} {...props} />;
}

export function DataListItem({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-xs",
        className,
      )}
      {...props}
    />
  );
}
