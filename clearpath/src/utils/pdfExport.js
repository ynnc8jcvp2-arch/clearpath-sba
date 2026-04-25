import html2pdf from 'html2pdf.js';

export function exportTermSheetPDF(elementId, filename = 'ClearPath_TermSheet.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const opt = {
    margin: 0.5,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, logging: false },
    jsPDF: { orientation: 'portrait', unit: 'in', format: 'letter' }
  };

  html2pdf().set(opt).from(element).save();
}

export function exportTermSheetHTML(elementId, filename = 'ClearPath_TermSheet.html') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const html = element.innerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printTermSheet(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(element.innerHTML);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
