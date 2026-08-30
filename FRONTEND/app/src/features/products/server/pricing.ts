export function majorToMinor(value: unknown) {
  if (typeof value !== "string") return "-1";
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return "-1";
  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").padEnd(2, "0");
  return (BigInt(whole) * 100n + BigInt(fraction || "0")).toString();
}
