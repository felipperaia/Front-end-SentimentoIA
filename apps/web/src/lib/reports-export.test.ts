import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ApiModule = typeof import("./api");

type AnchorMock = {
  href: string;
  download: string;
  click: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

function installStorageMocks() {
  const storage = new Map<string, string>();
  const localStorageMock = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: localStorageMock,
  });
}

function installDomMocks(): { anchor: AnchorMock; createElementMock: ReturnType<typeof vi.fn> } {
  const anchor: AnchorMock = {
    href: "",
    download: "",
    click: vi.fn(),
    remove: vi.fn(),
  };

  const createElementMock = vi.fn(() => anchor);
  const appendChildMock = vi.fn();

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: createElementMock,
      body: { appendChild: appendChildMock },
      documentElement: {
        lang: "pt-BR",
      },
    },
  });

  (globalThis.URL as unknown as { createObjectURL?: (blob: Blob) => string }).createObjectURL = vi
    .fn()
    .mockReturnValue("blob:mock");
  (globalThis.URL as unknown as { revokeObjectURL?: (url: string) => void }).revokeObjectURL = vi
    .fn()
    .mockImplementation(() => {});

  return { anchor, createElementMock };
}

async function loadApiModule(): Promise<ApiModule> {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "http://localhost:8000");
  return import("./api");
}

describe("report exports client contract", () => {
  beforeEach(() => {
    installStorageMocks();
    installDomMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses canonical CSV endpoint and keeps custom filename from Reports", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("col1,col2\n1,2", {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": 'attachment; filename="server-side.csv"',
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = await loadApiModule();
    const customFilename = "dados-captados-acme-2026-05-01-2026-05-31.csv";

    await api.downloadReport("csv", {
      company_slug: "acme",
      from: "2026-05-01",
      to: "2026-05-31",
      filename: customFilename,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/reports/export/mentions.csv");
    expect(url).toContain("companySlug=acme");
    expect(url).toContain("from=2026-05-01");
    expect(url).toContain("to=2026-05-31");

    const anchor = (document.createElement as unknown as ReturnType<typeof vi.fn>).mock.results[0]
      .value as AnchorMock;
    expect(anchor.download).toBe(customFilename);
    expect(anchor.click).toHaveBeenCalledTimes(1);
  });

  it("uses canonical insights endpoint and keeps custom PDF filename", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([37, 80, 68, 70]), {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="insights-backend.pdf"',
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = await loadApiModule();
    const customFilename = "insights-acme-2026-05-01-2026-05-31.pdf";

    await api.sentimentApi.exportInsightsPdf({
      companySlug: "acme",
      from: "2026-05-01",
      to: "2026-05-31",
      limit: 120,
      filename: customFilename,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/reports/export/insights.pdf");
    expect(url).toContain("companySlug=acme");
    expect(url).toContain("limit=120");

    const anchor = (document.createElement as unknown as ReturnType<typeof vi.fn>).mock.results[0]
      .value as AnchorMock;
    expect(anchor.download).toBe(customFilename);
    expect(anchor.click).toHaveBeenCalledTimes(1);
  });
});
