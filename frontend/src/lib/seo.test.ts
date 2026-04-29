import { describe, expect, it, beforeEach } from "vitest";

import {
  absoluteUrl,
  buildMetadata,
  organizationStructuredData,
  webPageStructuredData,
  websiteStructuredData,
} from "./seo";

const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

describe("seo", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://stellarinsure.app";
  });
  describe("absoluteUrl", () => {
    it("returns absolute URL for root path", () => {
      expect(absoluteUrl("/")).toBe("https://stellarinsure.app/");
    });

    it("returns absolute URL for given pathname", () => {
      expect(absoluteUrl("/about")).toBe("https://stellarinsure.app/about");
    });

    it("appends trailing slash for nested paths", () => {
      expect(absoluteUrl("/policy/123")).toBe("https://stellarinsure.app/policy/123");
    });
  });

  describe("buildMetadata", () => {
    it("builds basic metadata", () => {
      const result = buildMetadata({
        title: "Test Page",
        description: "Test description",
        pathname: "/test",
      });

      expect(result.title).toBe("Test Page");
      expect(result.description).toBe("Test description");
      expect(result.keywords).toBeUndefined();
      expect(result.openGraph?.title).toBe("Test Page");
      expect(result.openGraph?.siteName).toBe("StellarInsure");
      expect(result.twitter?.card).toBe("summary_large_image");
    });

    it("includes keywords when provided", () => {
      const result = buildMetadata({
        title: "Test",
        description: "Desc",
        pathname: "/",
        keywords: ["insurance", "stellar"],
      });

      expect(result.keywords).toEqual(["insurance", "stellar"]);
    });

    it("sets type to article when specified", () => {
      const result = buildMetadata({
        title: "Article",
        description: "Desc",
        pathname: "/blog/post",
        type: "article",
      });

      expect(result.openGraph?.type).toBe("article");
    });

    it("defaults to website type", () => {
      const result = buildMetadata({
        title: "Page",
        description: "Desc",
        pathname: "/",
      });

      expect(result.openGraph?.type).toBe("website");
    });

    it("includes canonical URL", () => {
      const result = buildMetadata({
        title: "Test",
        description: "Desc",
        pathname: "/test",
      });

      expect(result.alternates?.canonical).toBe("https://stellarinsure.app/test");
    });
  });

  describe("organizationStructuredData", () => {
    it("returns organization schema", () => {
      const result = organizationStructuredData();

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("Organization");
      expect(result.name).toBe("StellarInsure");
      expect(result.url).toBe("https://stellarinsure.app/");
      expect(result.sameAs).toContain("https://github.com/ChaoLing140/StellarInsure");
    });
  });

  describe("websiteStructuredData", () => {
    it("returns website schema", () => {
      const result = websiteStructuredData();

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("WebSite");
      expect(result.name).toBe("StellarInsure");
      expect(result.url).toBe("https://stellarinsure.app/");
      expect(result.potentialAction).toBeDefined();
    });

    it("includes search action", () => {
      const result = websiteStructuredData();

      expect(result.potentialAction?.["@type"]).toBe("SearchAction");
    });
  });

  describe("webPageStructuredData", () => {
    it("returns webpage schema", () => {
      const result = webPageStructuredData({
        title: "Test Page",
        description: "Test description",
        pathname: "/test",
      });

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("WebPage");
      expect(result.name).toBe("Test Page");
      expect(result.description).toBe("Test description");
      expect(result.url).toBe("https://stellarinsure.app/test");
    });

    it("references the website", () => {
      const result = webPageStructuredData({
        title: "Page",
        description: "Desc",
        pathname: "/page",
      });

      expect(result.isPartOf?.["@type"]).toBe("WebSite");
      expect(result.isPartOf?.name).toBe("StellarInsure");
    });
  });
});