import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import type { FacultyProfile } from '../../types';
import { loadJsPdf, loadXlsx, loadDocx, exportCsvBlob, yieldToMainThread } from '../../utils/chunkedExporter';
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
import { getUserEmails } from '../../utils/userEmails';
import { getDepartmentDisplayName } from '../../utils/enumMappers';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  collegeEmail: string;
  personalEmail: string;
  roleDisplay: string;
  roleKey: string;
  department: string;
  year: number;
  info: string;
  location: string;
  avatar: string;
  isVerified: boolean;
}

interface ReportsExportPageProps {
  initialSubTab?: 'analytics' | 'export';
}

export const ReportsExportPage: React.FC<ReportsExportPageProps> = ({ initialSubTab = 'analytics' }) => {
  const { alumniList, studentList, facultyList, adminList, eventsList, eventRsvps } = useData();

  // Mode Switcher: Visual Charts vs Document Exporter
  const [activeViewMode, setActiveViewMode] = useState<'analytics' | 'export'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveViewMode(initialSubTab);
    }
  }, [initialSubTab]);

  // Export Filter Parameters
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedYearStart, setSelectedYearStart] = useState<number>(2010);
  const [selectedYearEnd, setSelectedYearEnd] = useState<number>(2026);
  const [reportTitle, setReportTitle] = useState<string>('VIT Institutional Multi-Category Accreditation & Audit Report');
  
  // Specific Exporting Format Loading State
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | 'docx' | 'csv' | 'naac' | null>(null);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
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

  // Helper to format faculty info cleanly without trailing bullets
  const formatFacultyInfo = (t: FacultyProfile) => {
    const isHod = t.isHod || (t.name && t.name.toUpperCase().includes('HOD'));
    const designation = isHod
      ? (t.designation?.toLowerCase().includes('hod') ? t.designation : `HOD & ${t.designation || 'Professor'}`)
      : (t.designation || 'Professor');

    const subDetail =
      (t.specialization && t.specialization.trim()) ||
      (t.employeeId && t.employeeId.trim() ? `Emp ID: ${t.employeeId.trim()}` : null);

    return subDetail ? `${designation} • ${subDetail}` : designation;
  };

  // Combine All User Categories (Students, Alumni, Faculty, Admin)
  const combinedUserRecords: UserRecord[] = [
    ...studentList.map(s => {
      const emails = getUserEmails(s);
      return {
        id: s.id,
        name: s.name,
        email: emails.displayEmail || '',
        collegeEmail: emails.collegeEmail || '',
        personalEmail: emails.personalEmail || '',
        roleDisplay: 'Student',
        roleKey: 'student',
        department: getDepartmentDisplayName(s.department),
        year: s.graduationYear || 2026,
        info: `PRN: ${s.prn} • CGPA: ${s.cgpa}`,
        location: 'Enrolled Student',
        avatar: s.avatar,
        isVerified: true
      };
    }),
    ...alumniList.map(a => {
      const emails = getUserEmails(a);
      return {
        id: a.id,
        name: a.name,
        email: emails.displayEmail || '',
        collegeEmail: emails.collegeEmail || '',
        personalEmail: emails.personalEmail || '',
        roleDisplay: 'Alumni',
        roleKey: 'alumni',
        department: getDepartmentDisplayName(a.department),
        year: a.graduationYear,
        info: a.company && a.designation ? `${a.company} • ${a.designation}` : (a.company || a.designation || 'Alumni'),
        location: a.location,
        avatar: a.avatar,
        isVerified: !!a.isVerified
      };
    }),
    ...facultyList.map((t: FacultyProfile) => {
      const emails = getUserEmails(t);
      return {
        id: t.id,
        name: t.name,
        email: emails.displayEmail || '',
        collegeEmail: emails.collegeEmail || '',
        personalEmail: emails.personalEmail || '',
        roleDisplay: 'Faculty',
        roleKey: 'faculty',
        department: getDepartmentDisplayName(t.department),
        year: 2026,
        info: formatFacultyInfo(t),
        location: 'VIT Wadala Campus',
        avatar: t.avatar,
        isVerified: true
      };
    }),
    ...(adminList && adminList.length > 0
      ? adminList.map(adm => {
          const emails = getUserEmails(adm);
          return {
            id: adm.id,
            name: adm.name,
            email: emails.displayEmail || '',
            collegeEmail: emails.collegeEmail || '',
            personalEmail: emails.personalEmail || '',
            roleDisplay: 'Admin',
            roleKey: 'admin',
            department: getDepartmentDisplayName(adm.department || 'CMPN'),
            year: 2026,
            info: adm.employeeId ? `Institutional Admin • Emp ID: ${adm.employeeId}` : 'Institutional Admin Cell',
            location: 'VIT Wadala Campus',
            avatar: adm.avatar,
            isVerified: true
          };
        })
      : [])
  ];

  const filteredRecords = combinedUserRecords.filter(item => {
    if (selectedRole !== 'All' && item.roleKey !== selectedRole) return false;
    if (selectedDept !== 'All' && item.department !== selectedDept) return false;
    if (item.year < selectedYearStart || item.year > selectedYearEnd) return false;
    return true;
  });

  const handleExportPDF = async () => {
    setExportingFormat('pdf');
    setExportProgress(10);
    try {
      const { jsPDF, autoTable } = await loadJsPdf();
      setExportProgress(25);
      await yieldToMainThread(10);

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

      setExportProgress(45);
      await yieldToMainThread(10);

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

      setExportProgress(65);
      await yieldToMainThread(10);

      (autoTable as any)(doc, {
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
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // #
          1: { cellWidth: 36 },                   // Name
          2: { cellWidth: 26 },                   // Category Role
          3: { cellWidth: 16, halign: 'center' }, // Dept
          4: { cellWidth: 15, halign: 'center' }, // Year
          5: { cellWidth: 64 },                   // Details / Employer / PRN
          6: { cellWidth: 42 },                   // Location
          7: { cellWidth: 60 }                    // Email Address
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2
        },
        margin: { left: 14, right: 14 }
      });

      setExportProgress(85);
      await yieldToMainThread(10);

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

      setExportProgress(95);
      await yieldToMainThread(10);

      doc.save(`VIT_Accreditation_Report_${selectedRole}_${Date.now()}.pdf`);
      setExportProgress(100);
      triggerSuccessMsg(`Successfully generated PDF report (${filteredRecords.length} records).`);
    } catch (err) {
      console.error('PDF export failed:', err);
      triggerSuccessMsg('Export encountered an issue. Please try again.');
    } finally {
      setExportingFormat(null);
      setExportProgress(null);
    }
  };

  const handleExportExcel = async () => {
    setExportingFormat('excel');
    setExportProgress(15);
    try {
      const XLSX = await loadXlsx();
      setExportProgress(35);
      await yieldToMainThread(10);

      const exportData = filteredRecords.map((item, idx) => ({
        'Serial No': idx + 1,
        'Full Name': item.name,
        'User Role': item.roleDisplay,
        'Department': item.department,
        'Graduation Year': item.year,
        'Details / Organization / PRN': item.info,
        'Location / Campus': item.location,
        'College Email': item.collegeEmail || 'Not provided',
        'Personal Email': item.personalEmail || 'Not provided'
      }));

      setExportProgress(60);
      await yieldToMainThread(10);

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-fit column widths based on maximum content and header length
      const keys = Object.keys(exportData[0] || {});
      const colWidths = keys.map(key => {
        let maxLen = key.length;
        exportData.forEach(row => {
          const val = (row as any)[key];
          if (val !== undefined && val !== null) {
            const str = String(val);
            if (str.length > maxLen) {
              maxLen = str.length;
            }
          }
        });
        // Header length + padding, min-width 12 ensures headers never truncate
        return { wch: Math.max(maxLen + 4, 12) };
      });
      worksheet['!cols'] = colWidths;

      setExportProgress(85);
      await yieldToMainThread(10);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Institutional Roster');

      XLSX.writeFile(workbook, `VIT_Accreditation_Data_${selectedRole}_${Date.now()}.xlsx`);
      setExportProgress(100);
      triggerSuccessMsg(`Excel workbook exported successfully (${filteredRecords.length} records).`);
    } catch (err) {
      console.error('Excel export failed:', err);
      triggerSuccessMsg('Export encountered an issue. Please try again.');
    } finally {
      setExportingFormat(null);
      setExportProgress(null);
    }
  };

  const handleExportDOCX = async () => {
    setExportingFormat('docx');
    setExportProgress(15);
    try {
      const { docx, saveAs } = await loadDocx();
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = docx;

      setExportProgress(35);
      await yieldToMainThread(10);

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
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'College Email', bold: true })] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Personal Email', bold: true })] })] })
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
                          new TableCell({ children: [new Paragraph(item.collegeEmail || '—')] }),
                          new TableCell({ children: [new Paragraph(item.personalEmail || '—')] })
                        ]
                      })
                  )
                ]
              })
            ]
          }
        ]
      });

      setExportProgress(75);
      await yieldToMainThread(10);

      const blob = await Packer.toBlob(doc);
      setExportProgress(95);
      saveAs(blob, `VIT_Institutional_Report_${Date.now()}.docx`);
      setExportProgress(100);
      triggerSuccessMsg(`Word Document (.docx) generated successfully.`);
    } catch (err) {
      console.error('Word export failed:', err);
      triggerSuccessMsg('Export encountered an issue. Please try again.');
    } finally {
      setExportingFormat(null);
      setExportProgress(null);
    }
  };

  const handleExportCSV = async () => {
    setExportingFormat('csv');
    setExportProgress(0);
    try {
      const headers = ['Sr No', 'Name', 'Role Category', 'Department', 'Year', 'Details / Company / PRN', 'College Email', 'Personal Email'];
      const rows = filteredRecords.map((item, idx) => [
        idx + 1,
        item.name,
        item.roleDisplay,
        item.department,
        item.year,
        item.info,
        item.collegeEmail || '',
        item.personalEmail || ''
      ]);

      await exportCsvBlob(
        `VIT_Records_${selectedRole}_${Date.now()}.csv`,
        headers,
        rows,
        progress => setExportProgress(progress)
      );

      triggerSuccessMsg('CSV raw data exported.');
    } catch (err) {
      console.error('CSV export failed:', err);
      triggerSuccessMsg('Export encountered an issue. Please try again.');
    } finally {
      setExportingFormat(null);
      setExportProgress(null);
    }
  };

  const handleExportNaacEvents = async () => {
    setExportingFormat('naac');
    setExportProgress(15);
    try {
      const XLSX = await loadXlsx();
      setExportProgress(35);
      await yieldToMainThread(10);

      const activeEvents = eventsList || [];
      const activeRsvps = eventRsvps || [];

      const naacRows = activeEvents.map((evt, idx) => {
        const rsvps = activeRsvps.filter(r => r.eventId === evt.id);
        const attendedCount = rsvps.filter(r => r.status === 'attended').length;
        const certsCount = rsvps.filter(r => !!r.certificateId || r.status === 'attended').length;
        const totalRegistrations = evt.registeredUserIds?.length || evt.rsvpsCount || rsvps.length || 0;
        const attendanceRate = totalRegistrations > 0
          ? `${Math.round((attendedCount / totalRegistrations) * 100)}%`
          : '0%';

        const speakersList = evt.speakers && evt.speakers.length > 0
          ? evt.speakers.map(s => `${s.name}${s.organization ? ` (${s.organization})` : ''}`).join('; ')
          : (evt.speakerName ? `${evt.speakerName}${evt.speakerCompany ? ` (${evt.speakerCompany})` : ''}` : 'Alumni Cell');

        return {
          'Sr No': idx + 1,
          'NAAC Criteria': '5.4.1 Alumni Engagement',
          'Activity / Session Title': evt.title,
          'Event Type': evt.type || 'Lecture',
          'Academic Department': evt.department || 'Institutional (All Depts)',
          'Session Date & Time': `${evt.date || ''} ${evt.time || ''}`.trim(),
          'Delivery Mode': evt.mode ? (evt.mode === 'online' ? 'Online' : evt.mode === 'hybrid' ? 'Hybrid' : 'On-Campus') : (evt.isOnline ? 'Online' : 'On-Campus'),
          'Campus Venue / Room / Link': evt.venueRoom || evt.locationOrUrl || 'VIT Campus',
          'Alumni Resource Person(s)': speakersList,
          'Host / Coordinator': `${evt.hostName || 'Faculty Coordinator'} (${evt.hostRole || 'Faculty'})`,
          'Total Registrations': totalRegistrations,
          'Actual Attendance': attendedCount,
          'Attendance Rate': attendanceRate,
          'Verifiable Certificates Issued': certsCount,
          'Event Status': evt.status || 'Completed',
          'Lifecycle Audit Status': evt.lifecycleStatus || 'published'
        };
      });

      setExportProgress(65);
      await yieldToMainThread(10);

      // Sheet 2: Quantitative Summary Metrics
      const totalSessions = activeEvents.length;
      const totalBeneficiaries = naacRows.reduce((acc, r) => acc + (Number(r['Actual Attendance']) || 0), 0);
      const totalRegistrations = naacRows.reduce((acc, r) => acc + (Number(r['Total Registrations']) || 0), 0);
      const totalCertificates = naacRows.reduce((acc, r) => acc + (Number(r['Verifiable Certificates Issued']) || 0), 0);

      const summaryRows = [
        { 'Metric Category': 'NAAC Accreditation Criterion', 'Details / Quantitative Value': '5.4.1 Alumni Contribution & Co-curricular Engagements' },
        { 'Metric Category': 'Institution', 'Details / Quantitative Value': 'Vidyalankar Institute of Technology (VIT), Mumbai (NAAC A+)' },
        { 'Metric Category': 'Total Sessions Documented', 'Details / Quantitative Value': totalSessions },
        { 'Metric Category': 'Total Registered Footfall', 'Details / Quantitative Value': totalRegistrations },
        { 'Metric Category': 'Verified Student Beneficiaries (Attended)', 'Details / Quantitative Value': totalBeneficiaries },
        { 'Metric Category': 'Tamper-Evident SHA-256 Certificates Generated', 'Details / Quantitative Value': totalCertificates },
        { 'Metric Category': 'Generated By Admin Authority', 'Details / Quantitative Value': 'Dr. Ravindra Sangale (NAAC Steering Committee Convener)' },
        { 'Metric Category': 'Audit Timestamp (IST)', 'Details / Quantitative Value': new Date().toLocaleString('en-IN') }
      ];

      const wsEvents = XLSX.utils.json_to_sheet(naacRows);
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

      // Auto fit columns for Sheet 1
      const keys1 = Object.keys(naacRows[0] || {});
      wsEvents['!cols'] = keys1.map(key => {
        let maxLen = key.length;
        naacRows.forEach(row => {
          const val = (row as any)[key];
          if (val !== undefined && val !== null) {
            const str = String(val);
            if (str.length > maxLen) maxLen = str.length;
          }
        });
        return { wch: Math.max(maxLen + 4, 12) };
      });

      // Auto fit columns for Sheet 2
      wsSummary['!cols'] = [{ wch: 45 }, { wch: 55 }];

      setExportProgress(85);
      await yieldToMainThread(10);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, wsSummary, '5.4.1 Executive Summary');
      XLSX.utils.book_append_sheet(workbook, wsEvents, '5.4.1 Detailed Event Roster');

      XLSX.writeFile(workbook, `VIT_NAAC_5.4.1_Alumni_Engagement_${Date.now()}.xlsx`);
      setExportProgress(100);
      triggerSuccessMsg(`NAAC 5.4.1 Alumni Engagement workbook (.xlsx) exported successfully (${naacRows.length} sessions).`);
    } catch (err) {
      console.error('NAAC export failed:', err);
      triggerSuccessMsg('Export encountered an issue. Please try again.');
    } finally {
      setExportingFormat(null);
      setExportProgress(null);
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
                  <option value="All">All Departments (5)</option>
                  <option value="CMPN">Computer Engg (CMPN)</option>
                  <option value="INFT">Information Tech (INFT)</option>
                  <option value="EXCS">Electronics & Computer (EXCS)</option>
                  <option value="EXTC">Electronics & Telecom (EXTC)</option>
                  <option value="BIOM">Biomedical Engg (BIOM)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              {isExporting && exportProgress !== null && (
                <div className="mb-5 p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-[#0A0A0A]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                      <span>Processing {exportingFormat?.toUpperCase()} export (time-sliced stream)...</span>
                    </div>
                    <span className="font-mono font-bold text-[#0A0A0A]">{exportProgress}%</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0A0A0A] h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-[#6B7280] font-semibold mb-3">
                Choose output export format:
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
                        <p className="font-extrabold text-sm text-white">Generating ({exportProgress ?? 0}%)...</p>
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
                        <p className="font-extrabold text-sm">Generating ({exportProgress ?? 0}%)...</p>
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
                        <p className="font-extrabold text-sm">Generating ({exportProgress ?? 0}%)...</p>
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
                        <p className="font-extrabold text-sm">Generating ({exportProgress ?? 0}%)...</p>
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

              {/* NAAC 5.4.1 Dedicated Accreditation Card */}
              <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="indigo" className="text-[10px]">NAAC Criteria 5.4.1</Badge>
                      <span className="text-xs font-bold text-[#0A0A0A]">Alumni Contribution & Engagement Audit</span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      Official multi-sheet Excel workbook with alumni guest lectures, workshops, attendance rates, speaker designations, and certificate records formatted for NAAC peer-team review.
                    </p>
                  </div>
                  <button
                    onClick={handleExportNaacEvents}
                    disabled={isExporting}
                    className="px-5 py-3 rounded-lg bg-[#0A0A0A] hover:bg-[#222222] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-none cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {exportingFormat === 'naac' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Generating NAAC Workbook ({exportProgress ?? 0}%)...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>Export NAAC 5.4.1 (.xlsx)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
