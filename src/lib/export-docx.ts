import type { ProOutput } from "./schema";
import { proOutputToDocument, type ProDocument } from "./pro-document";

/**
 * Generate a DOCX file from ProOutput.
 * Internally converts to ProDocument for consistent formatting across preview/export.
 */
export async function generateDOCX(result: ProOutput): Promise<Blob> {
  const proDoc = proOutputToDocument(result);
  return generateDOCXFromDocument(proDoc);
}

export async function generateDOCXFromDocument(proDoc: ProDocument): Promise<Blob> {
  const docx = await import("docx");

  const {
    Document,
    Paragraph,
    TextRun,
    AlignmentType,
    Packer,
    BorderStyle,
    TabStopPosition,
    TabStopType,
  } = docx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];
  const r = proDoc.resume;
  const cl = proDoc.coverLetter;

  const GRAY500 = "6B7280";
  const GRAY700 = "374151";
  const GRAY900 = "111827";
  const GRAY300 = "D1D5DB";

  // ── Resume: Header ──
  children.push(
    new Paragraph({
      children: [new TextRun({ text: r.name, bold: true, size: 36, color: GRAY900 })],
      spacing: { after: 40 },
    })
  );

  if (r.headline) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: r.headline, size: 22, color: GRAY500 })],
        spacing: { after: 60 },
      })
    );
  }

  // Contact row
  const contactParts: string[] = [];
  if (r.email) contactParts.push(r.email);
  if (r.phone) contactParts.push(r.phone);
  if (r.location) contactParts.push(r.location);
  if (r.links) contactParts.push(...r.links);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: GRAY500 })],
        spacing: { after: 200 },
      })
    );
  }

  // ── Section helper ──
  const addSection = (title: string) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 18,
            color: GRAY500,
            characterSpacing: 60,
          }),
        ],
        spacing: { before: 300, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY300 } },
      })
    );
  };

  // ── Professional Summary ──
  if (r.summary) {
    addSection("Professional Summary");
    children.push(
      new Paragraph({
        children: [new TextRun({ text: r.summary, size: 22, color: GRAY700 })],
        spacing: { after: 200 },
      })
    );
  }

  // ── Experience ──
  if (r.experience.length > 0) {
    addSection("Experience");
    for (const exp of r.experience) {
      // Company + location on same line
      const companyRuns: InstanceType<typeof TextRun>[] = [
        new TextRun({ text: exp.company, bold: true, size: 22, color: GRAY900 }),
      ];
      if (exp.location) {
        companyRuns.push(
          new TextRun({ text: "\t", size: 22 }),
          new TextRun({ text: exp.location, size: 18, color: GRAY500 })
        );
      }
      children.push(
        new Paragraph({
          children: companyRuns,
          spacing: { before: 160, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })
      );

      // Title + dates
      const titleRuns: InstanceType<typeof TextRun>[] = [
        new TextRun({ text: exp.title, size: 20, color: GRAY700 }),
      ];
      const dateParts = [exp.start, exp.end].filter(Boolean).join(" \u2013 ");
      if (dateParts) {
        titleRuns.push(
          new TextRun({ text: "\t", size: 20 }),
          new TextRun({ text: dateParts, size: 18, color: GRAY500 })
        );
      }
      children.push(
        new Paragraph({
          children: titleRuns,
          spacing: { after: 60 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })
      );

      // Bullets
      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: bullet, size: 20, color: GRAY700 })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }

      // Tech
      if (exp.tech && exp.tech.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Tech: ${exp.tech.join(", ")}`, size: 18, color: GRAY500 })],
            spacing: { after: 60 },
            indent: { left: 360 },
          })
        );
      }
    }
  }

  // ── Skills ──
  if (r.skills.groups.length > 0) {
    addSection("Skills");
    for (const g of r.skills.groups) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${g.label}: `, bold: true, size: 20, color: GRAY900 }),
            new TextRun({ text: g.items.join(" \u2022 "), size: 20, color: GRAY700 }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // ── Projects ──
  if (r.projects && r.projects.length > 0) {
    addSection("Projects");
    for (const p of r.projects) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: p.name, bold: true, size: 20, color: GRAY900 })],
          spacing: { before: 120, after: 40 },
        })
      );
      for (const b of p.bullets) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: b, size: 20, color: GRAY700 })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
      if (p.tech && p.tech.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Tech: ${p.tech.join(", ")}`, size: 18, color: GRAY500 })],
            spacing: { after: 40 },
            indent: { left: 360 },
          })
        );
      }
    }
  }

  // ── Education ──
  if (r.education && r.education.length > 0) {
    addSection("Education");
    for (const edu of r.education) {
      const eduRuns: InstanceType<typeof TextRun>[] = [
        new TextRun({ text: edu.school, bold: true, size: 20, color: GRAY900 }),
      ];
      if (edu.degree) {
        eduRuns.push(new TextRun({ text: ` \u2014 ${edu.degree}`, size: 20, color: GRAY700 }));
      }
      const dateParts = [edu.start, edu.end].filter(Boolean).join(" \u2013 ");
      if (dateParts) {
        eduRuns.push(
          new TextRun({ text: "\t", size: 20 }),
          new TextRun({ text: dateParts, size: 18, color: GRAY500 })
        );
      }
      children.push(
        new Paragraph({
          children: eduRuns,
          spacing: { after: 40 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })
      );
    }
  }

  // ── Certifications ──
  if (r.certifications && r.certifications.length > 0) {
    addSection("Certifications");
    children.push(
      new Paragraph({
        children: [new TextRun({ text: r.certifications.join(" \u2022 "), size: 20, color: GRAY700 })],
        spacing: { after: 100 },
      })
    );
  }

  // ── PAGE BREAK: Cover Letter ──
  children.push(
    new Paragraph({ children: [], pageBreakBefore: true })
  );

  // Date
  children.push(
    new Paragraph({
      children: [new TextRun({ text: cl.date, size: 22, color: GRAY500 })],
      spacing: { after: 200 },
    })
  );

  // Recipient
  if (cl.recipientLine) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Dear ${cl.recipientLine},`, size: 22, color: GRAY700 })],
        spacing: { after: 40 },
      })
    );
  }
  if (cl.company || cl.role) {
    const reLine = [cl.role && `Re: ${cl.role}`, cl.company].filter(Boolean).join(" at ");
    children.push(
      new Paragraph({
        children: [new TextRun({ text: reLine, size: 20, color: GRAY500 })],
        spacing: { after: 200 },
      })
    );
  }

  // Paragraphs
  for (const paragraph of cl.paragraphs) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: paragraph, size: 22, color: GRAY700 })],
        spacing: { after: 200 },
      })
    );
  }

  // Closing
  children.push(
    new Paragraph({
      children: [new TextRun({ text: cl.closing || "Sincerely,", size: 22, color: GRAY700 })],
      spacing: { before: 300, after: 200 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: cl.signatureName || r.name, bold: true, size: 22, color: GRAY900 })],
      spacing: { after: 100 },
    })
  );

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Generated by ResumeMate AI", color: "9CA3AF", size: 16, italics: true }),
      ],
      spacing: { before: 600 },
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
