// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";
import { FieldDescription, FieldError, FormField, Label } from "./form-field";
import { RadioGroup, RadioOption } from "./radio-group";
import { Select } from "./select";
import { Switch } from "./switch";
import { TextField } from "./text-field";

afterEach(cleanup);

describe("form field accessibility contract", () => {
  it("associates labels, guidance, errors, and invalid state", () => {
    render(
      <FormField id="email" invalid hasDescription hasError>
        <Label required>Email address</Label>
        <TextField type="email" required />
        <FieldDescription>Use the administrator email.</FieldDescription>
        <FieldError>Enter a valid email address.</FieldError>
      </FormField>,
    );

    const input = screen.getByRole("textbox", { name: /email address/i });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Use the administrator email. Enter a valid email address.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    );
  });

  it("inherits disabled state and exposes pending state", () => {
    const { rerender } = render(
      <FormField id="disabled" disabled>
        <Label>Unavailable</Label>
        <TextField />
      </FormField>,
    );
    expect(screen.getByRole("textbox", { name: "Unavailable" })).toBeDisabled();

    rerender(
      <FormField id="loading">
        <Label>Checking</Label>
        <TextField loading />
      </FormField>,
    );
    const loadingInput = screen.getByRole("textbox", { name: "Checking" });
    expect(loadingInput).toBeDisabled();
    expect(loadingInput).toHaveAttribute("aria-busy", "true");
  });

  it("labels a native select through the same field contract", async () => {
    const user = userEvent.setup();
    render(
      <FormField id="currency">
        <Label>Currency</Label>
        <Select defaultValue="GBP">
          <option value="GBP">British pound</option>
          <option value="EUR">Euro</option>
        </Select>
      </FormField>,
    );

    const select = screen.getByRole("combobox", { name: "Currency" });
    await user.selectOptions(select, "EUR");
    expect(select).toHaveValue("EUR");
  });
});

describe("choice controls", () => {
  it("toggles a checkbox from its visible label", async () => {
    const user = userEvent.setup();
    render(
      <Checkbox
        label="Require confirmation"
        description="Independent setting"
      />,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: "Require confirmation",
    });
    await user.click(screen.getByText("Require confirmation"));
    expect(checkbox).toBeChecked();
  });

  it("groups mutually exclusive radio options with a legend", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup name="fulfillment" legend="Fulfillment preference">
        <RadioOption value="pickup" label="Pickup" defaultChecked />
        <RadioOption value="delivery" label="Delivery" />
      </RadioGroup>,
    );

    expect(
      screen.getByRole("group", { name: "Fulfillment preference" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Delivery" }));
    expect(screen.getByRole("radio", { name: "Delivery" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Pickup" })).not.toBeChecked();
  });

  it("uses checkbox form semantics with the switch role", async () => {
    const user = userEvent.setup();
    render(<Switch label="Visible setting" description="Immediate setting" />);
    const control = screen.getByRole("switch", { name: "Visible setting" });
    await user.click(screen.getByText("Visible setting"));
    expect(control).toBeChecked();
  });
});
