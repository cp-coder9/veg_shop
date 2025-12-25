import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface InvoicePDFData {
  invoiceId: string;
  invoiceDate: Date;
  dueDate: Date;
  customerName: string;
  customerAddress: string | null;
  items: {
    productName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    total: number;
  }[];
  subtotal: number;
  creditApplied: number;
  total: number;
  status: string;
}

export class PDFGenerator {
  /**
   * Generate invoice PDF and return as buffer
   */
  async generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .text('INVOICE', { align: 'center' })
          .moveDown();

        // Business info (left side)
        doc
          .fontSize(10)
          .text('Organic Vegetable Business', 50, 120)
          .text('Fresh Produce Delivery', 50, 135)
          .moveDown();

        // Invoice details (right side)
        doc
          .fontSize(10)
          .text(`Invoice #: ${data.invoiceId.substring(0, 8).toUpperCase()}`, 350, 120)
          .text(`Date: ${data.invoiceDate.toLocaleDateString('en-ZA')}`, 350, 135)
          .text(`Due Date: ${data.dueDate.toLocaleDateString('en-ZA')}`, 350, 150)
          .text(`Status: ${data.status.toUpperCase()}`, 350, 165);

        // Customer info
        doc
          .fontSize(12)
          .text('Bill To:', 50, 200)
          .fontSize(10)
          .text(data.customerName, 50, 220);

        if (data.customerAddress) {
          doc.text(data.customerAddress, 50, 235);
        }

        // Line separator
        doc
          .moveTo(50, 270)
          .lineTo(550, 270)
          .stroke();

        // Table header
        const tableTop = 290;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Item', 50, tableTop)
          .text('Qty', 300, tableTop)
          .text('Unit', 350, tableTop)
          .text('Price', 400, tableTop)
          .text('Total', 480, tableTop, { align: 'right' });

        // Table items
        doc.font('Helvetica');
        let yPosition = tableTop + 20;

        data.items.forEach((item) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc
            .fontSize(9)
            .text(item.productName, 50, yPosition, { width: 240 })
            .text(item.quantity.toString(), 300, yPosition)
            .text(item.unit, 350, yPosition)
            .text(`R${item.pricePerUnit.toFixed(2)}`, 400, yPosition)
            .text(`R${item.total.toFixed(2)}`, 480, yPosition, { align: 'right' });

          yPosition += 20;
        });

        // Line separator before totals
        yPosition += 10;
        doc
          .moveTo(50, yPosition)
          .lineTo(550, yPosition)
          .stroke();

        // Totals
        yPosition += 20;
        doc
          .fontSize(10)
          .text('Subtotal:', 400, yPosition)
          .text(`R${data.subtotal.toFixed(2)}`, 480, yPosition, { align: 'right' });

        if (data.creditApplied > 0) {
          yPosition += 20;
          doc
            .text('Credit Applied:', 400, yPosition)
            .text(`-R${data.creditApplied.toFixed(2)}`, 480, yPosition, { align: 'right' });
        }

        yPosition += 20;
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('Total Due:', 400, yPosition)
          .text(`R${data.total.toFixed(2)}`, 480, yPosition, { align: 'right' });

        // Footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            'Thank you for your business!',
            50,
            750,
            { align: 'center', width: 500 }
          )
          .text(
            'Payment methods: Cash, Yoco, EFT',
            50,
            765,
            { align: 'center', width: 500 }
          );

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate packing list PDF and return as buffer
   */
  async generatePackingListPDF(data: PackingListPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .text('PACKING LIST', { align: 'center' })
          .moveDown();

        // Business info
        doc
          .fontSize(10)
          .text('Organic Vegetable Business', 50, 120)
          .text('Fresh Produce Delivery', 50, 135)
          .moveDown();

        // Order details (right side)
        doc
          .fontSize(10)
          .text(`Order #: ${data.orderId.substring(0, 8).toUpperCase()}`, 350, 120)
          .text(`Delivery Date: ${data.deliveryDate.toLocaleDateString('en-ZA')}`, 350, 135)
          .text(`Method: ${data.deliveryMethod.toUpperCase()}`, 350, 150);

        // Customer info
        doc
          .fontSize(12)
          .text('Customer:', 50, 200)
          .fontSize(10)
          .text(data.customerName, 50, 220);

        if (data.customerAddress) {
          doc.text(data.customerAddress, 50, 235);
        }

        // Special instructions
        if (data.specialInstructions) {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Special Instructions:', 50, 260)
            .font('Helvetica')
            .text(data.specialInstructions, 50, 275, { width: 500 });
        }

        // Line separator
        const tableTop = data.specialInstructions ? 310 : 270;
        doc
          .moveTo(50, tableTop)
          .lineTo(550, tableTop)
          .stroke();

        // Table header
        const headerTop = tableTop + 20;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Product', 50, headerTop)
          .text('Quantity', 400, headerTop)
          .text('Unit', 480, headerTop);

        // Table items
        doc.font('Helvetica');
        let yPosition = headerTop + 25;

        data.items.forEach((item) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc
            .fontSize(10)
            .text(item.productName, 50, yPosition, { width: 340 })
            .text(item.quantity.toString(), 400, yPosition)
            .text(item.unit, 480, yPosition);

          yPosition += 25;
        });

        // Footer
        doc
          .fontSize(8)
          .text(
            'Please check all items upon delivery',
            50,
            750,
            { align: 'center', width: 500 }
          );

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate batch packing list PDF for multiple orders
   */
  async generateBatchPackingListPDF(packingLists: PackingListPDFData[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF chunks
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        packingLists.forEach((data, index) => {
          // Add page break between packing lists (except for first one)
          if (index > 0) {
            doc.addPage();
          }

          // Header
          doc
            .fontSize(20)
            .text('PACKING LIST', { align: 'center' })
            .moveDown();

          // Business info
          doc
            .fontSize(10)
            .text('Organic Vegetable Business', 50, 120)
            .text('Fresh Produce Delivery', 50, 135)
            .moveDown();

          // Order details (right side)
          doc
            .fontSize(10)
            .text(`Order #: ${data.orderId.substring(0, 8).toUpperCase()}`, 350, 120)
            .text(`Delivery Date: ${data.deliveryDate.toLocaleDateString('en-ZA')}`, 350, 135)
            .text(`Method: ${data.deliveryMethod.toUpperCase()}`, 350, 150);

          // Customer info
          doc
            .fontSize(12)
            .text('Customer:', 50, 200)
            .fontSize(10)
            .text(data.customerName, 50, 220);

          if (data.customerAddress) {
            doc.text(data.customerAddress, 50, 235);
          }

          // Special instructions
          if (data.specialInstructions) {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .text('Special Instructions:', 50, 260)
              .font('Helvetica')
              .text(data.specialInstructions, 50, 275, { width: 500 });
          }

          // Line separator
          const tableTop = data.specialInstructions ? 310 : 270;
          doc
            .moveTo(50, tableTop)
            .lineTo(550, tableTop)
            .stroke();

          // Table header
          const headerTop = tableTop + 20;
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Product', 50, headerTop)
            .text('Quantity', 400, headerTop)
            .text('Unit', 480, headerTop);

          // Table items
          doc.font('Helvetica');
          let yPosition = headerTop + 25;

          data.items.forEach((item) => {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }

            doc
              .fontSize(10)
              .text(item.productName, 50, yPosition, { width: 340 })
              .text(item.quantity.toString(), 400, yPosition)
              .text(item.unit, 480, yPosition);

            yPosition += 25;
          });

          // Footer
          doc
            .fontSize(8)
            .text(
              'Please check all items upon delivery',
              50,
              750,
              { align: 'center', width: 500 }
            );
        });

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate invoice PDF and return as stream
   */
  generateInvoicePDFStream(data: InvoicePDFData): Readable {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Header
    doc
      .fontSize(20)
      .text('INVOICE', { align: 'center' })
      .moveDown();

    // Business info (left side)
    doc
      .fontSize(10)
      .text('Organic Vegetable Business', 50, 120)
      .text('Fresh Produce Delivery', 50, 135)
      .moveDown();

    // Invoice details (right side)
    doc
      .fontSize(10)
      .text(`Invoice #: ${data.invoiceId.substring(0, 8).toUpperCase()}`, 350, 120)
      .text(`Date: ${data.invoiceDate.toLocaleDateString('en-ZA')}`, 350, 135)
      .text(`Due Date: ${data.dueDate.toLocaleDateString('en-ZA')}`, 350, 150)
      .text(`Status: ${data.status.toUpperCase()}`, 350, 165);

    // Customer info
    doc
      .fontSize(12)
      .text('Bill To:', 50, 200)
      .fontSize(10)
      .text(data.customerName, 50, 220);

    if (data.customerAddress) {
      doc.text(data.customerAddress, 50, 235);
    }

    // Line separator
    doc
      .moveTo(50, 270)
      .lineTo(550, 270)
      .stroke();

    // Table header
    const tableTop = 290;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item', 50, tableTop)
      .text('Qty', 300, tableTop)
      .text('Unit', 350, tableTop)
      .text('Price', 400, tableTop)
      .text('Total', 480, tableTop, { align: 'right' });

    // Table items
    doc.font('Helvetica');
    let yPosition = tableTop + 20;

    data.items.forEach((item) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(9)
        .text(item.productName, 50, yPosition, { width: 240 })
        .text(item.quantity.toString(), 300, yPosition)
        .text(item.unit, 350, yPosition)
        .text(`R${item.pricePerUnit.toFixed(2)}`, 400, yPosition)
        .text(`R${item.total.toFixed(2)}`, 480, yPosition, { align: 'right' });

      yPosition += 20;
    });

    // Line separator before totals
    yPosition += 10;
    doc
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();

    // Totals
    yPosition += 20;
    doc
      .fontSize(10)
      .text('Subtotal:', 400, yPosition)
      .text(`R${data.subtotal.toFixed(2)}`, 480, yPosition, { align: 'right' });

    if (data.creditApplied > 0) {
      yPosition += 20;
      doc
        .text('Credit Applied:', 400, yPosition)
        .text(`-R${data.creditApplied.toFixed(2)}`, 480, yPosition, { align: 'right' });
    }

    yPosition += 20;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total Due:', 400, yPosition)
      .text(`R${data.total.toFixed(2)}`, 480, yPosition, { align: 'right' });

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Thank you for your business!',
        50,
        750,
        { align: 'center', width: 500 }
      )
      .text(
        'Payment methods: Cash, Yoco, EFT',
        50,
        765,
        { align: 'center', width: 500 }
      );

    // Finalize PDF
    doc.end();

    return doc as unknown as Readable;
  }
}

export interface PackingListPDFData {
  orderId: string;
  customerName: string;
  customerAddress: string | null;
  deliveryDate: Date;
  deliveryMethod: string;
  specialInstructions: string | null;
  items: {
    productName: string;
    quantity: number;
    unit: string;
  }[];
}

export const pdfGenerator = new PDFGenerator();
