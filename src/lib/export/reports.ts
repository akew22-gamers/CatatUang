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
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(20)
  doc.setTextColor(79, 70, 229)
  doc.text('CatatUang', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Laporan Ringkasan Keuangan', pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128)
  doc.text(`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, pageWidth / 2, 40, { align: 'center' })

  if (data.walletName) {
    doc.text(`Dompet: ${data.walletName}`, pageWidth / 2, 48, { align: 'center' })
  }

  const tableData = [
    ['Total Pemasukan', formatCurrency(data.totalIncome)],
    ['Total Pengeluaran', formatCurrency(data.totalExpense)],
    ['Selisih', formatCurrency(data.selisih)],
    ['Saldo Saat Ini', formatCurrency(data.totalSaldo)]
  ]

  autoTable(doc, {
    startY: 60,
    head: [['Kategori', 'Nilai']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80, halign: 'right' }
    }
  })

  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
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
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(20)
  doc.setTextColor(79, 70, 229)
  doc.text('CatatUang', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Laporan Aktivitas Keuangan', pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128)
  doc.text(`Periode: ${formatDate(data.startDate)} - ${formatDate(data.endDate)}`, pageWidth / 2, 40, { align: 'center' })

  if (data.walletName) {
    doc.text(`Dompet: ${data.walletName}`, pageWidth / 2, 48, { align: 'center' })
  }

  doc.text(`Saldo Awal: ${formatCurrency(data.initialBalance)}`, 14, 58)

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
    startY: 65,
    head: [['No', 'Tanggal', 'Jenis', 'User', 'Keterangan', 'Pemasukan', 'Pengeluaran', 'Saldo']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 40 },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' }
    }
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Saldo Akhir: ${formatCurrency(data.finalBalance)}`, 14, finalY + 10)

  const pageCount = doc.getNumberOfPages()
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
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
    [`Saldo Awal: ${data.initialBalance}`],
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
    [`Saldo Akhir: ${data.finalBalance}`],
    [],
    ['Dicetak pada:', new Date().toLocaleDateString('id-ID')]
  ]

  const ws = XLSX.utils.aoa_to_sheet([...headerData, ...tableData, ...footerData])
  ws['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
    { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas')
  XLSX.writeFile(wb, `laporan-aktivitas-${formatDate(data.startDate)}-${formatDate(data.endDate)}.xlsx`)
}