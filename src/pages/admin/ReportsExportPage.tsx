import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { FacultyProfile } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import {
  FileSpreadsheet,
  Download,
  FileText,
  FileCode,
  Filter,
  Building2,
  Sparkles,
  Printer,
  RefreshCw,
  Check,
  BarChart3,
  Loader2
} from 'lucide-react';
import { AdminVisualAnalytics } from './AdminVisualAnalytics';
import { Badge, Button, SegmentedTabs, ToastNotice } from '../../components/common/UIComponents';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  roleDisplay: string;
  roleKey: string;
  department: string;
  year: number;
  info: string;
  location: string;
  avatar: string;
  isVerified: boolean;
}

export const ReportsExportPage: React.FC = () => {
  const { alumniList, studentList, facultyList } = useData();

  // Mode Switcher: Visual Charts vs Document Exporter
  const [activeViewMode, setActiveViewMode] = useState<'analytics' | 'export'>('analytics');

  // Export Filter Parameters
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYearStart, setSelectedYearStart] = useState<number>(2010);
  const [selectedYearEnd, setSelectedYearEnd] = useState<number>(2026);
  const [reportTitle, setReportTitle] = useState<string>('VIT Institutional Multi-Category Accreditation & Audit Report');
  
  // Specific Exporting Format Loading State
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | 'docx' | 'csv' | null>(null);
  const isExporting = exportingFormat !== null;

  // Export Success Toast State with Exit Animation
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportLeaving, setExportLeaving] = useState<boolean>(false);

  const triggerSuccessMsg = (msg: string) => {
    setExportLeaving(false);
    setExportSuccessMsg(msg);
    setTimeout(() => {
      setExportLeaving(true);
      setTimeout(() => {
        setExportSuccessMsg(null);
        setExportLeaving(false);
      }, 200);
    }, 4000);
  };

  // Combine All User Categories (Students, Alumni, Faculty, Admin)
  const combinedUserRecords: UserRecord[] = [
    ...studentList.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      roleDisplay: 'Student',
      roleKey: 'student',
      department: s.department,
      year: s.graduationYear || 2026,
      info: `PRN: ${s.prn} • CGPA: ${s.cgpa}`,
      location: 'Enrolled Student',
      avatar: s.avatar,
      isVerified: true
    })),
    ...alumniList.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      roleDisplay: 'Alumni',
      roleKey: 'alumni',
      department: a.department,
      year: a.graduationYear,
      info: `${a.company} • ${a.designation}`,
      location: a.location,
      avatar: a.avatar,
      isVerified: !!a.isVerified
    })),
    ...facultyList.map((t: FacultyProfile) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      roleDisplay: 'Faculty',
      roleKey: 'faculty',
      department: t.department,
      year: 2026,
      info: `${t.designation} • ${t.specialization}`,
      location: 'VIT Wadala Campus',
      avatar: t.avatar,
      isVerified: true
    })),
    {
      id: 'admin-1',
      name: 'Dr. Sunita Rawat',
      email: 'admin@vit.edu.in',
      roleDisplay: 'Admin (Cell Head)',
      roleKey: 'admin',
      department: 'CMPN',
      year: 2026,
      info: 'Alumni Cell Head & Professor',
      location: 'VIT Wadala Campus',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      isVerified: true
    }
  ];

  const filteredRecords = combinedUserRecords.filter(item => {
    if (selectedRole !== 'All' && item.roleKey !== selectedRole) return false;
    if (selectedDept !== 'All' && item.department !== selectedDept) return false;
    if (item.year < selectedYearStart || item.year > selectedYearEnd) return false;
    return true;
  });

  const handleExportPDF = () => {
    setExportingFormat('pdf');
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 297, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('VIDYALANKAR INSTITUTE OF TECHNOLOGY, MUMBAI', 14, 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text('NAAC "A+" Grade & NBA Accredited • Wadala (E), Mumbai 400037', 14, 18);

      doc.setTextColor(220, 220, 220);
      doc.setFontSize(9);
      doc.text(`Report: ${reportTitle}`, 14, 24);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`Generated Date: ${new Date().toLocaleDateString('en-IN')}`, 230, 12);
      doc.text(`Category: ${selectedRole.toUpperCase()} | Dept: ${selectedDept}`, 230, 17);
      doc.text(`Batch Span: ${selectedYearStart} - ${selectedYearEnd}`, 230, 22);

      const rows = filteredRecords.map((item, idx) => [
        (idx + 1).toString(),
        item.name,
        item.roleDisplay,
        item.department,
        item.year.toString(),
        item.info,
        item.location,
        item.email
      ]);

      autoTable(doc, {
        startY: 34,
        head: [['#', 'Name', 'Category Role', 'Dept', 'Year', 'Details / Employer / PRN', 'Location', 'Email Address']],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [10, 10, 10],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [10, 10, 10]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 14, right: 14 }
      });

      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Page ${i} of ${totalPages} • Institutional Audit Record (Students, Alumni, Faculty & Admin) • VIT Wadala`,
          14,
          200
        );
        doc.text('Registrar Seal & Signature', 230, 200);
      }

      doc.save(`VIT_Accreditation_Report_${selectedRole}_${Date.now()}.pdf`);
      triggerSuccessMsg(`Successfully generated PDF report (${filteredRecords.length} records).`);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportExcel = () => {
    setExportingFormat('excel');
    try {
      const exportData = filteredRecords.map((item, idx) => ({
        'Serial No': idx + 1,
        'Full Name': item.name,
        'User Role': item.roleDisplay,
        'Department': item.department,
        'Graduation Year': item.year,
        'Details / Organization / PRN': item.info,
        'Location / Campus': item.location,
        'Email Address': item.email
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Institutional Roster');

      XLSX.writeFile(workbook, `VIT_Accreditation_Data_${selectedRole}_${Date.now()}.xlsx`);
      triggerSuccessMsg(`Excel workbook exported successfully (${filteredRecords.length} records).`);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportDOCX = async () => {
    setExportingFormat('docx');
    try {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'VIDYALANKAR INSTITUTE OF TECHNOLOGY, MUMBAI',
                    bold: true,
                    size: 28,
                    color: '0A0A0A'
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Accredited NAAC "A+" • Multi-Category Institutional Report (Students, Alumni, Faculty & Admin)',
                    italics: true,
                    size: 20,
                    color: '6B7280'
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generated Date: ${new Date().toLocaleDateString('en-IN')} | Role: ${selectedRole} | Dept: ${selectedDept} | Total: ${filteredRecords.length}`,
                    size: 18,
                    color: '64748B'
                  })
                ]
              }),
              new Paragraph({ text: '' }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Name', bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dept', bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Year', bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Details / Company / PRN', bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Email', bold: true })] })] })
                    ]
                  }),
                  ...filteredRecords.map(
                    item =>
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph(item.name)] }),
                          new TableCell({ children: [new Paragraph(item.roleDisplay)] }),
                          new TableCell({ children: [new Paragraph(item.department)] }),
                          new TableCell({ children: [new Paragraph(item.year.toString())] }),
                          new TableCell({ children: [new Paragraph(item.info)] }),
                          new TableCell({ children: [new Paragraph(item.email)] })
                        ]
                      })
                  )
                ]
              })
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `VIT_Institutional_Report_${Date.now()}.docx`);
      triggerSuccessMsg(`Word Document (.docx) generated successfully.`);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportCSV = () => {
    setExportingFormat('csv');
    try {
      const headers = ['Sr No', 'Name', 'Role Category', 'Department', 'Year', 'Details / Company / PRN', 'Email'];
      const rows = filteredRecords.map((item, idx) => [
        idx + 1,
        `"${item.name}"`,
        `"${item.roleDisplay}"`,
        item.department,
        item.year,
        `"${item.info}"`,
        item.email
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `VIT_Records_${selectedRole}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerSuccessMsg('CSV raw data exported.');
    } catch (err) {
      console.error(err);
    } finally {
      setExportingFormat(null);
    }
  };

  const modeOptions = [
    { id: 'analytics' as const, label: 'Visual Analytics Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'export' as const, label: `Accreditation Exporter (${combinedUserRecords.length})`, icon: <FileSpreadsheet className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">
            Analytics & Accreditation Center
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            Interactive visual charts and institutional audit reporting for <strong>Students</strong>, <strong>Alumni</strong>, and <strong>Faculty</strong>.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <SegmentedTabs
          options={modeOptions}
          activeTab={activeViewMode}
          onChange={(tab) => setActiveViewMode(tab)}
          className="self-start sm:self-auto"
        />
      </div>

      {activeViewMode === 'analytics' ? (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
          <AdminVisualAnalytics />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <ToastNotice
            message={exportSuccessMsg}
            onClose={() => setExportSuccessMsg(null)}
            className="mb-4"
          />

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <h2 className="text-sm font-bold text-[#0A0A0A] tracking-tight flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#0A0A0A]" />
                Report Parameters & User Category Selector
              </h2>
              <button
                onClick={() => {
                  setSelectedRole('All');
                  setSelectedDept('All');
                  setSelectedYearStart(2010);
                  setSelectedYearEnd(2026);
                }}
                className="text-xs text-[#6B7280] hover:text-[#0A0A0A] font-bold flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="sm:col-span-2">
                <label className="app-label text-[#0A0A0A] font-bold">Report Header Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                />
              </div>

              <div>
                <label className="app-label text-[#0A0A0A] font-bold">User Category Filter</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                >
                  <option value="All">All Categories (Students, Alumni, Faculty & Admin)</option>
                  <option value="student">Enrolled Students Only</option>
                  <option value="alumni">Graduated Alumni Only</option>
                  <option value="faculty">College Faculty Only</option>
                  <option value="admin">Platform Admins Only</option>
                </select>
              </div>

              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Department Filter</label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                >
                  <option value="All">All Departments (7)</option>
                  <option value="CMPN">Computer Engg (CMPN)</option>
                  <option value="INFT">Information Tech (INFT)</option>
                  <option value="EXTC">Electronics & Telecom (EXTC)</option>
                  <option value="EXCS">Electronics & Computer (EXCS)</option>
                  <option value="BIOM">Biomedical Engg (BIOM)</option>
                  <option value="MCA">MCA Department</option>
                  <option value="MBA">MMS / MBA Dept</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280] font-bold mb-3 uppercase tracking-wider">
                Choose Output Export Format:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PDF Export Button */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="p-4 rounded-xl bg-[#0A0A0A] hover:bg-[#222222] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-none flex items-center justify-between group cursor-pointer disabled:cursor-not-allowed"
                >
                  {exportingFormat === 'pdf' ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm text-white">Generating...</p>
                        <p className="text-[10px] text-neutral-400 font-normal">Building PDF Document</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 group-hover:scale-105 transition-transform" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm">Export Official PDF</p>
                        <p className="text-[10px] text-neutral-400 font-normal">VIT Format & Header</p>
                      </div>
                    </div>
                  )}
                  {exportingFormat !== 'pdf' && <Download className="w-4 h-4 text-neutral-400" />}
                </button>

                {/* Excel Export Button */}
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#0A0A0A] hover:bg-[#FAFAFA] active:scale-[0.99] disabled:opacity-50 text-[#0A0A0A] font-bold text-xs transition-all shadow-none flex items-center justify-between group cursor-pointer disabled:cursor-not-allowed"
                >
                  {exportingFormat === 'excel' ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0A0A0A]" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm">Generating...</p>
                        <p className="text-[10px] text-[#6B7280] font-normal">Building Workbook</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 group-hover:scale-105 transition-transform" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm">Export Excel (.xlsx)</p>
                        <p className="text-[10px] text-[#6B7280] font-normal">Multi-sheet workbook</p>
                      </div>
                    </div>
                  )}
                  {exportingFormat !== 'excel' && <Download className="w-4 h-4 text-[#6B7280]" />}
                </button>

                {/* Word Export Button */}
                <button
                  onClick={handleExportDOCX}
                  disabled={isExporting}
                  className="p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#0A0A0A] hover:bg-[#FAFAFA] active:scale-[0.99] disabled:opacity-50 text-[#0A0A0A] font-bold text-xs transition-all shadow-none flex items-center justify-between group cursor-pointer disabled:cursor-not-allowed"
                >
                  {exportingFormat === 'docx' ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0A0A0A]" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm">Generating...</p>
                        <p className="text-[10px] text-[#6B7280] font-normal">Building Word DOCX</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <FileCode className="w-5 h-5 group-hover:scale-105 transition-transform" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm">Export Word (.docx)</p>
                        <p className="text-[10px] text-[#6B7280] font-normal">Editable document report</p>
                      </div>
                    </div>
                  )}
                  {exportingFormat !== 'docx' && <Download className="w-4 h-4 text-[#6B7280]" />}
                </button>

                {/* CSV Export Button */}
                <button
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#0A0A0A] hover:bg-[#FAFAFA] active:scale-[0.99] disabled:opacity-50 text-[#0A0A0A] font-bold text-xs transition-all shadow-none flex items-center justify-between group cursor-pointer disabled:cursor-not-allowed"
                >
                  {exportingFormat === 'csv' ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0A0A0A]" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm">Generating...</p>
                        <p className="text-[10px] text-[#6B7280] font-normal">Building CSV File</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Printer className="w-5 h-5 group-hover:scale-105 transition-transform" />
                      <div className="text-left">
                        <p className="font-extrabold text-sm">Export CSV Data</p>
                        <p className="text-[10px] text-[#6B7280] font-normal">Raw comma-separated file</p>
                      </div>
                    </div>
                  )}
                  {exportingFormat !== 'csv' && <Download className="w-4 h-4 text-[#6B7280]" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
