import React, { useState } from 'react';
import {
  ExternalLink,
  Search,
  Sparkles,
  BookOpen,
  FileText,
  GraduationCap,
  Code2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Badge, Button } from '../../components/common/UIComponents';

interface ResourceItem {
  id: string;
  category: 'Interview Prep' | 'Resume Tips' | 'Higher Education' | 'Skill Development' | 'Career Guidance';
  title: string;
  author: string;
  readTime: string;
  snippet: string;
  linkText: string;
}

export const CareerResourcesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const resources: ResourceItem[] = [
    {
      id: 'res-1',
      category: 'Interview Prep',
      title: 'Cracking Google & Microsoft Technical Interviews (DSA + System Design)',
      author: 'Rushabh Sanghavi (SDE-2 Google, VIT Alumnus 2018)',
      readTime: '8 min read',
      snippet: 'A comprehensive roadmap covering key LeetCode patterns (Two Pointers, Graphs, Dynamic Programming) and HLD principles for final-year VITians.',
      linkText: 'Read Full DSA Guide'
    },
    {
      id: 'res-2',
      category: 'Resume Tips',
      title: 'ATS-Friendly Tech Resume Template for Off-Campus Applications',
      author: 'Priya Kulkarni (Senior PM Microsoft, VIT Alumnus 2019)',
      readTime: '5 min read',
      snippet: 'Download the single-page LaTeX & Word resume format that passed Google and Microsoft HR screening with bullet-point impact metrics.',
      linkText: 'Download ATS Template (.docx)'
    },
    {
      id: 'res-3',
      category: 'Higher Education',
      title: 'Guide to MS in US & Tuition-Free German Universities for Engineers',
      author: 'Neha Deshmukh (TU Munich M.Sc., VIT Alumnus 2016)',
      readTime: '12 min read',
      snippet: 'Breakdown of GRE/TOEFL requirements, SOP drafting strategies, LOR requests from VIT professors, and DAAD scholarships for Germany.',
      linkText: 'Explore MS Roadmap'
    },
    {
      id: 'res-4',
      category: 'Skill Development',
      title: 'Full-Stack Cloud Architecture: React, Node.js, Docker & AWS',
      author: 'Rushil Dahisaria (Azure SDE Microsoft, VIT Alumnus 2020)',
      readTime: '10 min read',
      snippet: 'Step-by-step tutorial on deploying containerized microservices to cloud infrastructure with CI/CD pipelines.',
      linkText: 'Start Learning Path'
    },
    {
      id: 'res-5',
      category: 'Career Guidance',
      title: 'Quantitative Finance & Algorithmic Trading Career Track',
      author: 'Rohan Mehta (VP Morgan Stanley, VIT Alumnus 2017)',
      readTime: '7 min read',
      snippet: 'How CMPN/INFT students can leverage C++, linear algebra, and data structures to break into high-frequency quantitative engineering roles.',
      linkText: 'Read Quant Guide'
    }
  ];

  const filteredResources = resources.filter(res => {
    if (selectedCategory !== 'All' && res.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return res.title.toLowerCase().includes(q) || res.snippet.toLowerCase().includes(q) || res.author.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-xs">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <Badge variant="indigo" size="sm">Academic Learning Hub</Badge>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] tracking-tight mt-1">
            Career Resources & Roadmaps
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
            Curated placement guides, ATS resume templates, interview cheatsheets, and higher education roadmaps authored by VIT Wadala alumni.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="emerald" size="md" icon={<Sparkles className="w-3.5 h-3.5 text-[#065F46]" />}>
            Verified Alumni Content
          </Badge>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl shadow-none flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search guides by title, skill, or author..."
            className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-xs text-[#0A0A0A] focus:outline-none focus:bg-white focus:border-[#0A0A0A] font-medium transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
          {(['All', 'Interview Prep', 'Resume Tips', 'Higher Education', 'Skill Development', 'Career Guidance'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#0A0A0A] text-white shadow-none'
                  : 'text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredResources.map(res => (
          <div
            key={res.id}
            className="bg-white border border-[#E5E7EB] p-6 rounded-xl shadow-none hover:border-[#0A0A0A] transition-all duration-150 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="indigo" size="sm">{res.category}</Badge>
                <span className="text-[10px] font-mono font-bold text-[#9CA3AF]">{res.readTime}</span>
              </div>

              <h3 className="font-display font-bold text-[#0A0A0A] text-base leading-snug">
                {res.title}
              </h3>

              <p className="text-xs text-[#374151] leading-relaxed font-medium">
                {res.snippet}
              </p>

              <div className="pt-2 flex items-center gap-2 text-[11px] text-[#6B7280] font-medium border-t border-[#E5E7EB]">
                <span>Authored by <strong className="text-[#0A0A0A]">{res.author}</strong></span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => alert(`Opening resource: ${res.title}`)}
              className="w-full"
              icon={<ExternalLink className="w-3.5 h-3.5 text-[#0A0A0A]" />}
            >
              {res.linkText}
            </Button>
          </div>
        ))}
      </div>

    </div>
  );
};
