import type { ProGenerationResult } from "./types";

/**
 * Generate a DOCX file from Pro results.
 */
export async function generateDOCX(result: ProGenerationResult): Promise<Blob> {
  const docx = await import("docx");

  const {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    Packer,
    BorderStyle,
  } = docx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: "ResumeMate AI Pro Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Summary
  children.push(
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E40AF" } },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: result.summary, size: 22 })],
      spacing: { after: 200 },
    })
  );

  // Tailored Resume
  children.push(
    new Paragraph({
      text: "Tailored Resume",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E40AF" } },
    })
  );

  for (const line of result.tailoredResume.split("\n")) {
    if (!line.trim()) {
      children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      continue;
    }
    if (line === line.toUpperCase() && line.length > 2 && line.length < 40) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, bold: true, size: 24 })],
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.trimStart().startsWith("-") || line.trimStart().startsWith("*")) {
      const text = line.replace(/^\s*[-*]\s*/, "");
      children.push(
        new Paragraph({
          children: [new TextRun({ text, size: 22 })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Cover Letter
  children.push(
    new Paragraph({
      text: "Cover Letter",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E40AF" } },
    })
  );

  for (const paragraph of result.coverLetter.split("\n\n")) {
    if (paragraph.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: paragraph.trim(), size: 22 })],
          spacing: { after: 200 },
        })
      );
    }
  }

  // Skills Section
  if (result.skillsSectionRewrite) {
    children.push(
      new Paragraph({
        text: "Skills Section (Recommended)",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E40AF" } },
      })
    );
    for (const line of result.skillsSectionRewrite.split("\n")) {
      if (line.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  // Keyword Checklist
  if (result.keywordChecklist.length > 0) {
    children.push(
      new Paragraph({
        text: "Keyword Checklist",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E40AF" } },
      })
    );
    for (const item of result.keywordChecklist) {
      const prefix = item.found ? "[FOUND]" : "[MISSING]";
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${prefix} ${item.keyword}`,
              bold: !item.found,
              color: item.found ? "16A34A" : "DC2626",
              size: 20,
            }),
            ...(item.suggestion
              ? [
                  new TextRun({
                    text: ` - ${item.suggestion}`,
                    color: "6B7280",
                    size: 20,
                  }),
                ]
              : []),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Next Actions
  if (result.nextActions.length > 0) {
    children.push(
      new Paragraph({
        text: "Next Actions",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "1E40AF" } },
      })
    );
    result.nextActions.forEach((action, i) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${action}`, size: 22 })],
          spacing: { after: 100 },
        })
      );
    });
  }

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Generated by ResumeMate AI",
          color: "9CA3AF",
          size: 18,
          italics: true,
        }),
      ],
      spacing: { before: 600 },
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
