import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, BorderStyle, HeadingLevel, AlignmentType } from "docx";
import FileSaver from "file-saver";
import { VocabItem } from "../types";

export const generateDoc = async (vocabList: VocabItem[], title: string = "Danh sách từ vựng") => {
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: "E0E7FF" },
          children: [new Paragraph({ children: [new TextRun({ text: "Từ vựng", bold: true })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: "E0E7FF" },
          children: [new Paragraph({ children: [new TextRun({ text: "Loại từ", bold: true })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: "E0E7FF" },
          children: [new Paragraph({ children: [new TextRun({ text: "Nghĩa", bold: true })] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          shading: { fill: "E0E7FF" },
          children: [new Paragraph({ children: [new TextRun({ text: "Ví dụ", bold: true })] })],
        }),
      ],
    }),
    ...vocabList.map((item) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: item.word })],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.partOfSpeech })],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.meaning })],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.example })],
          }),
        ],
      });
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
          }),
          new Paragraph({
            text: `Được tạo bởi VocabNote AI vào ngày ${new Date().toLocaleDateString('vi-VN')}`,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 800 },
            children: [new TextRun({ italics: true, size: 20, color: "888888" })]
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  // Handle file-saver import which might be a function or an object depending on the bundler/environment
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  saveAs(blob, `Tu_vung_${new Date().toISOString().slice(0, 10)}.docx`);
};