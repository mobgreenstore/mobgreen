// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DataTable,
  DataTableBody,
  DataTableCaption,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "./data-table";
import { ErrorState } from "./error-state";
import { InlineAlert } from "./inline-alert";
import { getPaginationItems, Pagination } from "./pagination";
import { Skeleton, SkeletonGroup } from "./skeleton";
import { Spinner } from "./spinner";
import { StatusBadge } from "./status-badge";

afterEach(cleanup);

describe("feedback primitives", () => {
  it("announces loading without exposing decorative skeletons", () => {
    render(
      <>
        <Spinner label="Loading results" />
        <SkeletonGroup label="Loading table">
          <Skeleton />
        </SkeletonGroup>
      </>,
    );
    expect(
      screen.getByRole("status", { name: "Loading results" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading table" }),
    ).toBeInTheDocument();
  });

  it("uses alert semantics for errors", () => {
    render(
      <>
        <InlineAlert tone="danger" title="Could not save" />
        <ErrorState />
      </>,
    );
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });

  it("renders typed status text in addition to color", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeVisible();
  });
});

describe("data display primitives", () => {
  it("keeps semantic table structure", () => {
    render(
      <DataTable>
        <DataTableCaption>Accessible records</DataTableCaption>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Name</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody />
      </DataTable>,
    );
    expect(
      screen.getByRole("table", { name: "Accessible records" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
  });

  it("builds concise pagination ranges", () => {
    expect(getPaginationItems(1, 3)).toEqual([1, 2, 3]);
    expect(getPaginationItems(6, 12)).toEqual([
      1,
      "ellipsis",
      5,
      6,
      7,
      "ellipsis",
      12,
    ]);
  });

  it("marks the current page and disables boundary navigation", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={8}
        getHref={(page) => `/page/${page}`}
      />,
    );
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /previous/i })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
