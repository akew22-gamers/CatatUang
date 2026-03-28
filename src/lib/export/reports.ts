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

const MARGIN = 10
const PAGE_WIDTH = 210
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

  doc.setFontSize(18)
  doc.setTextColor(79, 70, 229)
  doc.text('CatatUang', PAGE_WIDTH / 2, MARGIN + 8, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Laporan Ringkasan Keuangan', PAGE_WIDTH / 2, MARGIN + 18, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' })

  if (data.walletName) {
    doc.text(`Dompet: ${data.walletName}`, PAGE_WIDTH / 2, MARGIN + 32, { align: 'center' })
  }

  const tableData = [
    ['Total Pemasukan', formatCurrency(data.totalIncome)],
    ['Total Pengeluaran', formatCurrency(data.totalExpense)],
    ['Selisih', formatCurrency(data.selisih)],
    ['Saldo Saat Ini', formatCurrency(data.totalSaldo)]
  ]

  const colWidth = USABLE_WIDTH / 2

  autoTable(doc, {
    startY: MARGIN + 40,
    head: [['Kategori', 'Nilai']],
    body: tableData,
    theme: 'striped',
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: colWidth },
      1: { cellWidth: colWidth, halign: 'right' }
    }
  })

  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Halaman ${i} dari ${pageCount}`,
      PAGE_WIDTH / 2,
      297 - MARGIN,
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

  doc.setFontSize(18)
  doc.setTextColor(79, 70, 229)
  doc.text('CatatUang', PAGE_WIDTH / 2, MARGIN + 8, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Laporan Aktivitas Keuangan', PAGE_WIDTH / 2, MARGIN + 18, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, PAGE_WIDTH / 2, MARGIN + 26, { align: 'center' })

  if (data.walletName) {
    doc.text(`Dompet: ${data.walletName}`, PAGE_WIDTH / 2, MARGIN + 32, { align: 'center' })
  }

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Saldo Awal: ${formatCurrency(data.initialBalance)}`, MARGIN, MARGIN + 40)

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

  const colWidths = [10, 22, 22, 25, 40, 25, 25, 25]

  autoTable(doc, {
    startY: MARGIN + 46,
    head: [['No', 'Tanggal', 'Jenis', 'User', 'Keterangan', 'Pemasukan', 'Pengeluaran', 'Saldo']],
    body: tableData,
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'center' },
      1: { cellWidth: colWidths[1], halign: 'center' },
      2: { cellWidth: colWidths[2], halign: 'center' },
      3: { cellWidth: colWidths[3] },
      4: { cellWidth: colWidths[4] },
      5: { cellWidth: colWidths[5], halign: 'right' },
      6: { cellWidth: colWidths[6], halign: 'right' },
      7: { cellWidth: colWidths[7], halign: 'right' }
    }
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Saldo Akhir: ${formatCurrency(data.finalBalance)}`, MARGIN, finalY + 8)

  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Halaman ${i} dari ${pageCount}`,
      PAGE_WIDTH / 2,
      297 - MARGIN,
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