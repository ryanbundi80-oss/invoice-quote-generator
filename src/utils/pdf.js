import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function downloadElementAsPDF(elementId, filename = 'invoice.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} was not found.`);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = (canvas.height * pageWidth) / canvas.width;

  let position = 0;
  let remainingHeight = imageHeight;
  const image = canvas.toDataURL('image/png');

  pdf.addImage(image, 'PNG', 0, position, pageWidth, imageHeight);
  remainingHeight -= pageHeight;

  while (remainingHeight > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(image, 'PNG', 0, position, pageWidth, imageHeight);
    remainingHeight -= pageHeight;
  }

  pdf.save(filename);
}
