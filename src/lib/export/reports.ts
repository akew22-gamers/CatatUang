import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface SummaryReportData {
  totalIncome: number
  totalExpense: number
  totalSaldo: number
  selisih: number
  startDate: string
  endDate: string
  walletName?: string
}

export interface ActivityReportRow {
  no: number
  tanggal: string
  jenis: string
  user: string
  keterangan: string
  pemasukan: string
  pengeluaran: string
  saldo: string
}

export interface ActivityReportData {
  rows: ActivityReportRow[]
  startDate: string
  endDate: string
  walletName?: string
  initialBalance: number
  finalBalance: number
}

const MARGIN = 15
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const USABLE_WIDTH = PAGE_WIDTH - (MARGIN * 2)

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function generateSummaryPDF(data: SummaryReportData): void {
  const doc = new jsPDF({
    format: 'a4',
    unit: 'mm'
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('CatatUang', PAGE_WIDTH / 2, MARGIN + 5, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Laporan Ringkasan Keuangan', PAGE_WIDTH / 2, MARGIN + 11, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, PAGE_WIDTH / 2, MARGIN + 17, { align: 'center' })

  if (data.walletName) {
    doc.text(`Dompet: ${data.walletName}`, PAGE_WIDTH / 2, MARGIN + 23, { align: 'center' })
  }

  const tableData = [
    ['Total Pemasukan', formatCurrency(data.totalIncome)],
    ['Total Pengeluaran', formatCurrency(data.totalExpense)],
    ['Selisih', formatCurrency(data.selisih)],
    ['Saldo Saat Ini', formatCurrency(data.totalSaldo)]
  ]

  const colWidth = USABLE_WIDTH / 2

  autoTable(doc, {
    startY: MARGIN + 30,
    head: [['Kategori', 'Nilai']],
    body: tableData,
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: USABLE_WIDTH,
    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontSize: 12,
      halign: 'center',
      cellPadding: 3
    },
    styles: {
      font: 'helvetica',
      fontSize: 12,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: colWidth },
      1: { cellWidth: colWidth, halign: 'right' }
    }
  })

  const pageCount = doc.getNumberOfPages()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Halaman ${i} dari ${pageCount}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - MARGIN,
      { align: 'center' }
    )
  }

  doc.save(`laporan-ringkasan-${formatDate(data.startDate)}-${formatDate(data.endDate)}.pdf`)
}

export function generateSummaryXLSX(data: SummaryReportData): void {
  const wb = XLSX.utils.book_new()

  const summaryData = [
    ['CatatUang - Laporan Ringkasan Keuangan'],
    [`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`],
    data.walletName ? [`Dompet: ${data.walletName}`] : [],
    [],
    ['Kategori', 'Nilai'],
    ['Total Pemasukan', data.totalIncome],
    ['Total Pengeluaran', data.totalExpense],
    ['Selisih', data.selisih],
    ['Saldo Saat Ini', data.totalSaldo],
    [],
    ['Dicetak pada:', new Date().toLocaleDateString('id-ID')]
  ]

  const ws = XLSX.utils.aoa_to_sheet(summaryData)
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Ringkasan')
  XLSX.writeFile(wb, `laporan-ringkasan-${formatDate(data.startDate)}-${formatDate(data.endDate)}.xlsx`)
}

export function generateActivityPDF(data: ActivityReportData): void {
  const doc = new jsPDF({
    format: 'a4',
    unit: 'mm'
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text('CatatUang', PAGE_WIDTH / 2, MARGIN + 5, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Laporan Aktivitas Keuangan', PAGE_WIDTH / 2, MARGIN + 11, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(80, 80, 80)
  doc.text(`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, PAGE_WIDTH / 2, MARGIN + 17, { align: 'center' })

  if (data.walletName) {
    doc.text(`Dompet: ${data.walletName}`, PAGE_WIDTH / 2, MARGIN + 23, { align: 'center' })
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Saldo Awal: ${formatCurrency(data.initialBalance)}`, MARGIN, MARGIN + 31)

  const tableData = data.rows.map(row => [
    row.no,
    row.tanggal,
    row.jenis,
    row.user,
    row.keterangan,
    row.pemasukan,
    row.pengeluaran,
    row.saldo
  ])

  autoTable(doc, {
    startY: MARGIN + 36,
    head: [['No', 'Tanggal', 'Jenis', 'User', 'Keterangan', 'Pemasukan', 'Pengeluaran', 'Saldo']],
    body: tableData,
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: USABLE_WIDTH,
    headStyles: {
      font: 'helvetica',
      fontStyle: 'bold',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontSize: 10,
      halign: 'center',
      cellPadding: 2
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' }
    }
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Saldo Akhir: ${formatCurrency(data.finalBalance)}`, MARGIN, finalY + 7)

  const pageCount = doc.getNumberOfPages()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Halaman ${i} dari ${pageCount}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - MARGIN,
      { align: 'center' }
    )
  }

  doc.save(`laporan-aktivitas-${formatDate(data.startDate)}-${formatDate(data.endDate)}.pdf`)
}

export function generateActivityXLSX(data: ActivityReportData): void {
  const wb = XLSX.utils.book_new()

  const headerData = [
    ['CatatUang - Laporan Aktivitas Keuangan'],
    [`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`],
    data.walletName ? [`Dompet: ${data.walletName}`] : [],
    [`Saldo Awal: ${formatCurrency(data.initialBalance)}`],
    [],
    ['No', 'Tanggal', 'Jenis', 'User', 'Keterangan', 'Pemasukan', 'Pengeluaran', 'Saldo']
  ]

  const tableData = data.rows.map(row => [
    row.no,
    row.tanggal,
    row.jenis,
    row.user,
    row.keterangan,
    row.pemasukan || '',
    row.pengeluaran || '',
    row.saldo
  ])

  const footerData = [
    [],
    [`Saldo Akhir: ${formatCurrency(data.finalBalance)}`],
    [],
    ['Dicetak pada:', new Date().toLocaleDateString('id-ID')]
  ]

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...tableData, ...footerData])
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
    { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas')
  XLSX.writeFile(wb, `laporan-aktivitas-${formatDate(data.startDate)}-${formatDate(data.endDate)}.xlsx`)
}