import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

const originalSurface = process.env.MOB_GREENS_SURFACE;

afterEach(() => {
  if (originalSurface === undefined) delete process.env.MOB_GREENS_SURFACE;
  else process.env.MOB_GREENS_SURFACE = originalSurface;
});

describe("presentation server separation", () => {
  it("keeps the admin server inside the admin workspace", () => {
    process.env.MOB_GREENS_SURFACE = "admin";
    const response = proxy(new NextRequest("http://localhost:3000/products"));
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin",
    );
  });

  it("migrates an existing admin-page session cookie to the API-safe root path", () => {
    process.env.MOB_GREENS_SURFACE = "admin";
    const response = proxy(
      new NextRequest("http://localhost:3000/admin/categories/new", {
        headers: { cookie: "mob-greens-admin=encrypted-session" },
      }),
    );
    expect(response.cookies.get("mob-greens-admin")).toMatchObject({
      value: "encrypted-session",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  });

  it("allows authenticated admin APIs on the admin server", () => {
    process.env.MOB_GREENS_SURFACE = "admin";
    const response = proxy(
      new NextRequest("http://localhost:3000/api/admin/images"),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("serves shared public images on the admin server", () => {
    process.env.MOB_GREENS_SURFACE = "admin";
    const response = proxy(
      new NextRequest("http://localhost:3000/images/partners/startselect.png"),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/favicon.ico", "/icon.png", "/apple-icon.png"])(
    "serves the shared metadata asset %s on the admin server",
    (pathname) => {
      process.env.MOB_GREENS_SURFACE = "admin";
      const response = proxy(
        new NextRequest(`http://localhost:3000${pathname}`),
      );
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("keeps admin routes off the storefront server", () => {
    process.env.MOB_GREENS_SURFACE = "store";
    const response = proxy(new NextRequest("http://localhost:3001/admin"));
    expect(response.headers.get("location")).toBe("http://localhost:3001/");
  });

  it("does not expose admin APIs on the storefront server", async () => {
    process.env.MOB_GREENS_SURFACE = "store";
    const response = proxy(
      new NextRequest("http://localhost:3001/api/admin/images"),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });
});
