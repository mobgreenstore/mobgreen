// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { ArchiveDialog } from "./archive-dialog";
import { FilterBar } from "./filter-bar";
import { ImageUploader } from "./image-uploader";
import { OrderStatusTimeline } from "./order-status-timeline";
import { PageHeader } from "./page-header";
import { WeightPriceEditor } from "./weight-price-editor";

afterEach(cleanup);

describe("admin composition contracts", () => {
  it("composes page and filter landmarks", () => {
    render(
      <>
        <PageHeader title="Products" description="Manage the catalog." />
        <FilterBar search={<input aria-label="Search" />} />
      </>,
    );
    expect(screen.getByRole("heading", { name: "Products" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Filters" })).toBeInTheDocument();
  });

  it("passes selected files through the upload interface", () => {
    const onFilesSelected = vi.fn();
    const { container } = render(
      <ImageUploader onFilesSelected={onFilesSelected} />,
    );
    const file = new File(["image"], "image.webp", { type: "image/webp" });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it("renders honest empty editor and timeline states", () => {
    render(
      <>
        <WeightPriceEditor
          options={[]}
          onAdd={() => undefined}
          onUpdate={() => undefined}
          onRemove={() => undefined}
        />
        <OrderStatusTimeline events={[]} />
      </>,
    );
    expect(
      screen.getByText("Add at least one purchasable option."),
    ).toBeVisible();
    expect(screen.getByText("No status history is available.")).toBeVisible();
  });

  it("provides a specialized archive confirmation", () => {
    render(
      <ArchiveDialog
        trigger={<Button>Archive item</Button>}
        itemName="this item"
        onArchive={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Archive item" })).toBeVisible();
  });
});
