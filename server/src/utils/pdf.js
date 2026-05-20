import PDFDocument from 'pdfkit';

const instituteName = 'North Lakhimpur University';

export function streamPaperPdf(res, paper, questions) {
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${paper.title.replaceAll(' ', '-')}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text(instituteName, { align: 'center' });
  doc.moveDown(0.4).fontSize(14).text(paper.title, { align: 'center' });
  const subject = [paper.subject_name, paper.subject_code ? `(${paper.subject_code})` : null].filter(Boolean).join(' ');
  doc.moveDown(0.4).fontSize(11).text(`Subject: ${subject}`, { align: 'center' });
  doc.moveDown().fontSize(10).text(`Total Marks: ${paper.total_marks}`);
  doc.text(`Duration: ${paper.duration_minutes} minutes`);
  if (paper.instructions) doc.moveDown().text(`Instructions: ${paper.instructions}`);
  doc.moveDown();

  questions.forEach((question, index) => {
    doc.fontSize(11).text(`${index + 1}. ${question.question_text}`, { continued: false });
    doc.fontSize(10).text(`Unit ${question.unit_number || '-'} | [${question.marks} marks]`, { align: 'right' });
    doc.moveDown(0.6);
  });

  doc.end();
}
