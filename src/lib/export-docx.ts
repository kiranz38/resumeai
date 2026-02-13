import type { ProOutput } from "./schema";

/**
 * Generate a DOCX file from ProOutput.
 */
export async function generateDOCX(result: ProOutput): Promise<Blob> {
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

  const r = result.tailoredResume;

  // Name & headline
  children.push(
    new Paragraph({
      children: [new TextRun({ text: r.name.toUpperCase(), bold: true, size: 28 })],
      spacing: { after: 60 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: r.headline, size: 22 })],
      spacing: { after: 200 },
    })
  );

  // Professional summary
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: r.summary, size: 22 })],
      spacing: { after: 200 },
    })
  );

  // Experience
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "EXPERIENCE", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );

  for (const exp of r.experience) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${exp.title.toUpperCase()} \u2014 ${exp.company}`, bold: true, size: 22 }),
          ...(exp.period ? [new TextRun({ text: ` (${exp.period})`, size: 20, color: "6B7280" })] : []),
        ],
        spacing: { before: 150, after: 60 },
      })
    );
    for (const bullet of exp.bullets) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: bullet, size: 22 })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
    }
  }

  // Education
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "EDUCATION", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );
  for (const edu of r.education) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${edu.degree} \u2014 ${edu.school}${edu.year ? `, ${edu.year}` : ""}`, size: 22 })],
        spacing: { after: 60 },
      })
    );
  }

  // Skills
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "SKILLS", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );
  for (const group of r.skills) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${group.category}: `, bold: true, size: 22 }),
          new TextRun({ text: group.items.join(", "), size: 22 }),
        ],
        spacing: { after: 60 },
      })
    );
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

  for (const paragraph of result.coverLetter.paragraphs) {
    if (paragraph.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: paragraph.trim(), size: 22 })],
          spacing: { after: 200 },
        })
      );
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
