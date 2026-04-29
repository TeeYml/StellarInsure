import { describe, expect, it } from "vitest";

import {
  formatBytes,
  getAcceptedFileTypes,
  getFileTypeLabel,
  validateFile,
  validateFiles,
} from "./file-validation";

const createMockFile = (name: string, size: number, type: string): File => {
  return new File([""], name, { type });
};

describe("file-validation", () => {
  describe("formatBytes", () => {
    it("formats bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1023)).toBe("1023 B");
    });

    it("formats kilobytes correctly", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(10240)).toBe("10 KB");
    });

    it("formats megabytes correctly", () => {
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1572864)).toBe("1.5 MB");
      expect(formatBytes(10485760)).toBe("10 MB");
    });

    it("formats gigabytes correctly", () => {
      expect(formatBytes(1073741824)).toBe("1 GB");
      expect(formatBytes(1610612736)).toBe("1.5 GB");
    });
  });

  describe("getFileTypeLabel", () => {
    it("returns labels for known types", () => {
      expect(getFileTypeLabel("image/*")).toBe("Images");
      expect(getFileTypeLabel("video/*")).toBe("Videos");
      expect(getFileTypeLabel("audio/*")).toBe("Audio");
      expect(getFileTypeLabel("application/pdf")).toBe("PDF documents");
      expect(getFileTypeLabel(".pdf")).toBe("PDF documents");
    });

    it("returns labels for image extensions", () => {
      expect(getFileTypeLabel(".jpg")).toBe("JPEG images");
      expect(getFileTypeLabel(".jpeg")).toBe("JPEG images");
      expect(getFileTypeLabel(".png")).toBe("PNG images");
      expect(getFileTypeLabel(".gif")).toBe("GIF images");
    });

    it("returns the type for unknown types", () => {
      expect(getFileTypeLabel(".xyz")).toBe(".xyz");
      expect(getFileTypeLabel("application/octet-stream")).toBe(
        "application/octet-stream",
      );
    });
  });

  describe("getAcceptedFileTypes", () => {
    it("returns comma-separated types", () => {
      expect(getAcceptedFileTypes({ acceptedTypes: [".pdf", "image/*"] })).toBe(
        ".pdf, image/*",
      );
    });

    it("returns empty string when no types specified", () => {
      expect(getAcceptedFileTypes({})).toBe("");
    });
  });

  describe("validateFile", () => {
    it("validates file with no options", () => {
      const file = createMockFile("test.pdf", 1024, "application/pdf");
      const result = validateFile(file);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates accepted types with extension", () => {
      const file = createMockFile("test.pdf", 1024, "application/pdf");
      const result = validateFile(file, { acceptedTypes: [".pdf"] });
      expect(result.isValid).toBe(true);
    });

    it("rejects invalid file extension", () => {
      const file = createMockFile("test.pdf", 1024, "application/pdf");
      const result = validateFile(file, { acceptedTypes: [".jpg"] });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Invalid file type");
    });

    it("validates accepted MIME type", () => {
      const file = createMockFile("test.jpg", 1024, "image/jpeg");
      const result = validateFile(file, { acceptedTypes: ["image/jpeg"] });
      expect(result.isValid).toBe(true);
    });

    it("validates MIME type with wildcard", () => {
      const file = createMockFile("test.png", 1024, "image/png");
      const result = validateFile(file, { acceptedTypes: ["image/*"] });
      expect(result.isValid).toBe(true);
    });

    it("validates max size", () => {
      const file = createMockFile("test.pdf", 2048, "application/pdf");
      const result = validateFile(file, { maxSizeBytes: 1024 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("exceeds");
    });

    it("validates min size", () => {
      const file = createMockFile("test.pdf", 512, "application/pdf");
      const result = validateFile(file, { minSizeBytes: 1024 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("below");
    });

    it("accepts file within size bounds", () => {
      const file = createMockFile("test.pdf", 1024, "application/pdf");
      const result = validateFile(file, {
        minSizeBytes: 512,
        maxSizeBytes: 2048,
      });
      expect(result.isValid).toBe(true);
    });

    it("is case-insensitive for extensions", () => {
      const file = createMockFile("test.PDF", 1024, "application/pdf");
      const result = validateFile(file, { acceptedTypes: [".pdf"] });
      expect(result.isValid).toBe(true);
    });

    it("combines multiple validation errors", () => {
      const file = createMockFile("test.jpg", 4096, "image/jpeg");
      const result = validateFile(file, {
        acceptedTypes: [".pdf"],
        maxSizeBytes: 1024,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("validateFiles", () => {
    it("validates multiple files", () => {
      const files = [
        createMockFile("test1.pdf", 1024, "application/pdf"),
        createMockFile("test2.pdf", 1024, "application/pdf"),
      ];
      const result = validateFiles(files, { acceptedTypes: [".pdf"] });
      expect(result.isValid).toBe(true);
    });

    it("validates max files limit", () => {
      const files = [
        createMockFile("test1.pdf", 1024, "application/pdf"),
        createMockFile("test2.pdf", 1024, "application/pdf"),
      ];
      const result = validateFiles(files, { maxFiles: 1 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Only 1 file");
    });

    it("collects errors from all invalid files", () => {
      const files = [
        createMockFile("test1.pdf", 1024, "application/pdf"),
        createMockFile("test2.jpg", 1024, "image/jpeg"),
      ];
      const result = validateFiles(files, { acceptedTypes: [".pdf"] });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});