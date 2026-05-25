import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const EXPORT_WIDTH_PX = 1100;
const EXPORT_SCALE = 3;

export async function downloadElementAsPDF(elementId, filename = 'invoice.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} was not found.`);

  const canvas = await html2canvas(element, {
    scale: EXPORT_SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: EXPORT_WIDTH_PX,
    onclone: (clonedDocument) => {
      const clonedElement = clonedDocument.getElementById(elementId);
      if (!clonedElement) return;

      clonedElement.style.position = 'relative';
      clonedElement.style.width = `${EXPORT_WIDTH_PX}px`;
      clonedElement.style.maxWidth = `${EXPORT_WIDTH_PX}px`;
      clonedElement.style.minHeight = 'auto';
      clonedElement.style.boxShadow = 'none';
      clonedElement.style.transform = 'none';
      clonedElement.style.margin = '0';
      clonedElement.style.overflow = 'visible';
      clonedElement.style.borderRadius = '0';
    }
  });

  if (!canvas.width || !canvas.height) {
    throw new Error('The invoice preview rendered as an empty canvas.');
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = (canvas.height * pageWidth) / canvas.width;
  const image = canvas.toDataURL('image/png', 1.0);

  let heightLeft = imageHeight;
  let position = 0;

  pdf.addImage(image, 'PNG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(image, 'PNG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
