import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

interface DownloadInvoicePDFParams {
  invoiceId: string;
  filename?: string;
}

export function useDownloadInvoicePDF() {
  return useMutation({
    mutationFn: async ({ invoiceId, filename }: DownloadInvoicePDFParams) => {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `invoice-${invoiceId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
  });
}
