"use client";

import { Plus } from "lucide-react";
import {
  Button,
  DataTable,
  DataTableBody,
  DataTableCaption,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  ErrorState,
  InlineAlert,
  Pagination,
  Skeleton,
  SkeletonGroup,
  Spinner,
  StatusBadge,
} from "@/components/ui";

export function FeedbackFoundationsPreview() {
  return (
    <section
      aria-labelledby="feedback-heading"
      className="mt-10 border-t border-border pt-10"
    >
      <div>
        <h2 id="feedback-heading" className="heading-section">
          Feedback and data display
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Shared loading, status, empty, error, pagination, and responsive data
          structures.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <InlineAlert
          title="Information available"
          description="Use blue only for informational states."
          tone="info"
        />
        <InlineAlert
          title="Changes completed"
          description="Green communicates a successful outcome."
          tone="success"
        />
        <InlineAlert
          title="Action could not complete"
          description="Red is reserved for errors and destructive outcomes."
          tone="danger"
        />
        <InlineAlert
          title="Review this detail"
          description="Neutral feedback avoids unnecessary indication colors."
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-subtle p-4">
        <StatusBadge status="pending" />
        <StatusBadge status="confirmed" />
        <StatusBadge status="processing" />
        <StatusBadge status="completed" />
        <StatusBadge status="cancelled" />
        <Spinner label="Checking status" className="ml-auto" />
      </div>

      <SkeletonGroup
        label="Loading content preview"
        className="mt-6 grid gap-3 rounded-lg border border-border p-4"
      >
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-3/4 max-w-md" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="hidden h-20 sm:block" />
        </div>
      </SkeletonGroup>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <EmptyState
          compact
          title="Nothing here yet"
          description="Empty states explain what belongs here and offer one relevant next action."
          action={
            <Button>
              <Plus className="size-4" /> Add first item
            </Button>
          }
        />
        <ErrorState
          title="Unable to load this section"
          description="The error stays local to the affected area and provides a clear recovery action."
          onRetry={() => undefined}
        />
      </div>

      <div className="mt-6">
        <DataTable>
          <DataTableCaption>
            Empty responsive data-table structure
          </DataTableCaption>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Reference</DataTableHead>
              <DataTableHead>Name</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="text-right">Action</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            <DataTableRow>
              <td colSpan={4} className="p-0">
                <EmptyState
                  compact
                  title="No records available"
                  description="Real database records will appear here when their feature is implemented."
                  className="rounded-none border-0"
                />
              </td>
            </DataTableRow>
          </DataTableBody>
        </DataTable>
      </div>

      <Pagination
        currentPage={4}
        totalPages={12}
        getHref={(page) => `?preview-page=${page}`}
        className="mt-6"
        label="Component pagination preview"
      />
    </section>
  );
}
