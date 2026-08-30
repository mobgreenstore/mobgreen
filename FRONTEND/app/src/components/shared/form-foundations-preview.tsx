"use client";

import { AtSign } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Checkbox,
  FieldDescription,
  FieldError,
  FieldGroup,
  FormField,
  Label,
  RadioGroup,
  RadioOption,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@/components/ui";
import { SUPPORTED_CURRENCIES, WEIGHT_UNITS } from "@/config/commerce";

export function FormFoundationsPreview() {
  const [enabled, setEnabled] = useState(true);

  return (
    <form className="grid gap-10" onSubmit={(event) => event.preventDefault()}>
      <section aria-labelledby="text-controls-heading" className="grid gap-5">
        <div>
          <h2 id="text-controls-heading" className="heading-section">
            Text controls
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Labels, guidance, validation, and input states share one spacing and
            accessibility contract.
          </p>
        </div>

        <FieldGroup>
          <FormField id="preview-name" hasDescription>
            <Label required>Display name</Label>
            <TextField
              placeholder="Enter a clear name"
              required
              autoComplete="off"
            />
            <FieldDescription>
              Use a short, recognizable label.
            </FieldDescription>
          </FormField>

          <FormField id="preview-email">
            <Label>Email address</Label>
            <TextField
              type="email"
              inputMode="email"
              placeholder="name@example.com"
              leading={<AtSign aria-hidden="true" className="size-4" />}
              autoComplete="email"
            />
          </FormField>
        </FieldGroup>

        <FormField id="preview-error" invalid hasError>
          <Label required>Reference</Label>
          <TextField defaultValue="Unavailable value" required />
          <FieldError>
            This value is already in use. Choose another one.
          </FieldError>
        </FormField>

        <FormField id="preview-description" hasDescription>
          <Label optional>Description</Label>
          <TextArea placeholder="Add concise supporting information" />
          <FieldDescription>
            Keep important information direct and easy to scan.
          </FieldDescription>
        </FormField>

        <FieldGroup>
          <FormField id="preview-disabled" disabled hasDescription>
            <Label>Disabled field</Label>
            <TextField value="Unavailable during this step" readOnly />
            <FieldDescription>
              This control cannot currently be changed.
            </FieldDescription>
          </FormField>

          <FormField id="preview-read-only" hasDescription>
            <Label>Read-only field</Label>
            <TextField value="MOB GREENS" readOnly />
            <FieldDescription>
              This value is available for reference.
            </FieldDescription>
          </FormField>
        </FieldGroup>
      </section>

      <section
        aria-labelledby="select-controls-heading"
        className="grid gap-5 border-t border-border pt-10"
      >
        <div>
          <h2 id="select-controls-heading" className="heading-section">
            Selection controls
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Native controls preserve predictable keyboard and form behavior
            across mobile and desktop devices.
          </p>
        </div>

        <FieldGroup>
          <FormField id="preview-currency" hasDescription>
            <Label required>Currency</Label>
            <Select defaultValue="GBP" required>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.label}
                </option>
              ))}
            </Select>
            <FieldDescription>
              The selected currency belongs to the entered price.
            </FieldDescription>
          </FormField>

          <FormField id="preview-unit" hasDescription>
            <Label required>Weight unit</Label>
            <Select defaultValue="G" required>
              {WEIGHT_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label} ({unit.shortLabel})
                </option>
              ))}
            </Select>
            <FieldDescription>
              MOB GREENS supports grams and kilograms.
            </FieldDescription>
          </FormField>
        </FieldGroup>

        <RadioGroup
          name="preview-fulfillment"
          legend="Fulfillment preference"
          description="This demonstrates selection behavior only. No fulfillment logic is connected."
          orientation="horizontal"
        >
          <RadioOption
            value="pickup"
            label="Pickup"
            description="Collect from the designated location."
            defaultChecked
          />
          <RadioOption
            value="delivery"
            label="Delivery"
            description="Receive goods at a provided address."
          />
        </RadioGroup>

        <div className="grid gap-2 rounded-lg border border-border bg-surface p-4 sm:p-5">
          <Checkbox
            id="preview-confirmation"
            label="Require confirmation"
            description="Use checkboxes for independent choices that may be selected together."
            defaultChecked
          />
          <Checkbox
            id="preview-disabled-checkbox"
            label="Unavailable option"
            description="Disabled choices remain readable while clearly inactive."
            disabled
          />
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <Switch
            id="preview-visibility"
            label="Visible setting"
            description="Use switches for settings that take effect immediately."
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
        </div>
      </section>

      <section
        aria-labelledby="actions-heading"
        className="grid gap-5 border-t border-border pt-10"
      >
        <div>
          <h2 id="actions-heading" className="heading-section">
            Form actions
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Primary actions remain obvious; secondary actions retain less visual
            weight.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary">Cancel</Button>
          <Button type="submit">Save changes</Button>
        </div>
      </section>
    </form>
  );
}
