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
          shading: { fill: "4F46E5" }, // Indigo header
          children: [new Paragraph({ children: [new TextRun({ text: "Từ vựng (IPA)", bold: true, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: "4F46E5" },
          children: [new Paragraph({ children: [new TextRun({ text: "Loại", bold: true, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: "4F46E5" },
          children: [new Paragraph({ children: [new TextRun({ text: "Level", bold: true, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: "4F46E5" },
          children: [new Paragraph({ children: [new TextRun({ text: "Nghĩa (VN)", bold: true, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          shading: { fill: "4F46E5" },
          children: [new Paragraph({ children: [new TextRun({ text: "Ví dụ", bold: true, color: "FFFFFF" })] })],
        }),
      ],
    }),
    ...vocabList.map((item) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ 
                children: [
                  new TextRun({ text: item.word, bold: true }),
                  new TextRun({ text: `\n${item.phonetic}`, italics: true, size: 20, color: "666666" })
                ] 
              })
            ],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.partOfSpeech })],
          }),
          new TableCell({
            children: [new Paragraph({ text: item.level || "?" })],
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
              top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
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
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  saveAs(blob, `Tu_vung_${new Date().toISOString().slice(0, 10)}.docx`);
};