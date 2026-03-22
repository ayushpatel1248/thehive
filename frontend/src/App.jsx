import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Siren, 
  Briefcase, 
  Search, 
  Settings, 
  Plus, 
  Bell, 
  User,
  ShieldAlert,
  Menu,
  FileCheck,
  X,
  Loader2,
  Sparkles,
  Terminal,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ------ COMPONENTS ------

const SeverityBadge = ({ severity }) => {
  const styles = {
    "Critical": "bg-red-600 text-white shadow-sm",
    "High": "bg-red-100 text-red-800 border-red-200 border",
    "Medium": "bg-orange-100 text-orange-800 border-orange-200 border",
    "Low": "bg-green-100 text-green-800 border-green-200 border",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider", styles[severity] || styles["Low"])}>
      {severity}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    "New": "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-purple-50 text-purple-700 border-purple-200",
    "Resolved": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={cn("px-2 py-1 rounded text-xs font-medium border", styles[status] || styles["New"])}>
      {status}
    </span>
  );
};


// ------ MAIN LAYOUT ------

export default function SOCDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI Panel State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedKql, setCopiedKql] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/alerts')
      .then(response => {
        setAlerts(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("API Error:", err);
        setError("Failed to load alerts");
        setLoading(false);
      });
  }, []);

  const handleRowClick = async (alert) => {
    setSelectedAlert(alert);
    setAnalysis(null);
    setIsAnalyzing(true);
    setCopiedKql(false);
    
    try {
      const threatRes = await axios.post('http://127.0.0.1:8000/threat-intel', alert);
      const aiRes = await axios.post('http://127.0.0.1:8000/analyze-alert', alert);
      
      setAnalysis({
        explanation: aiRes.data.explanation,
        investigation_steps: aiRes.data.investigation_steps,
        user_questions: aiRes.data.user_questions,
        url_analysis: threatRes.data.url_analysis,
        hash_analysis: threatRes.data.hash_analysis,
        overall_risk: threatRes.data.overall_risk,
        kql_query: "Generating KQL from AI Model...",
        report: "Drafting Incident Report from AI Model..."
      });
      setIsAnalyzing(false);

      try {
        const kqlRes = await axios.post('http://127.0.0.1:8000/generate-kql', alert);
        setAnalysis(prev => ({ ...prev, kql_query: kqlRes.data.kql_query }));
      } catch (err) {
        setAnalysis(prev => ({ ...prev, kql_query: "Failed to load KQL." }));
      }

      try {
        const reportRes = await axios.post('http://127.0.0.1:8000/generate-report', alert);
        setAnalysis(prev => ({ ...prev, report: reportRes.data.report }));
      } catch (err) {
        setAnalysis(prev => ({ ...prev, report: "Failed to draft report." }));
      }

    } catch (err) {
      console.error("Failed to fetch primary AI analysis", err);
      setAnalysis({ error: "Failed to generate AI analysis. Check backend logs or API Rate Limits." });
      setIsAnalyzing(false);
    }
  };

  const closePanel = () => {
    setSelectedAlert(null);
    setAnalysis(null);
    setCopiedKql(false);
  };

  const parseInvestigationSteps = (text) => {
    if (!text) return null;
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return (
      <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700">
        {lines.map((l, i) => (
          <li key={i} className="pl-1 leading-relaxed">{l.replace(/^[-\d.]+\s*/, '')}</li>
        ))}
      </ol>
    );
  };

  const parseReport = (text) => {
    if (!text) return null;
    // Replace ** ** to bold
    // Try to split logic into cards if sections are clearly defined
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.map((line, i) => {
      const isHeader = line.includes('Summary') || line.includes('Root Cause') || line.includes('Impact') || line.includes('Recommended Action');
      if (isHeader) {
        return <h4 key={i} className="text-sm font-bold text-slate-800 mt-5 mb-2 uppercase tracking-wide border-b border-slate-100 pb-1">{line.replace(/\*\*/g, '').replace(/:/g, '').trim()}</h4>
      }
      return <p key={i} className="text-[13px] text-slate-600 mb-2 leading-relaxed">{line.replace(/\*\*/g, '')}</p>
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKql(true);
    setTimeout(() => setCopiedKql(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-sm font-sans">
      
      <header className="h-14 bg-[#1e293b] text-white flex items-center justify-between px-4 shrink-0 shadow-md z-10">
        <div className="flex items-center space-x-6 h-full">
          <div className="flex items-center space-x-2 mr-4">
            <Menu className="w-5 h-5 text-slate-300 hover:text-white cursor-pointer" />
            <ShieldAlert className="w-6 h-6 text-blue-400 ml-2" />
            <span className="font-bold text-lg tracking-wide hidden md:block">TheHive</span>
          </div>

          <nav className="hidden lg:flex items-center space-x-1 h-full">
            <button className="h-full px-4 flex items-center space-x-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b-2 border-transparent">
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-medium">Dashboards</span>
            </button>
            <button className="h-full px-4 flex items-center space-x-2 text-white bg-slate-800 border-b-2 border-blue-500 transition-colors">
              <Siren className="w-4 h-4 text-blue-400" />
              <span className="font-medium">Alerts</span>
            </button>
            <button className="h-full px-4 flex items-center space-x-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b-2 border-transparent">
              <Briefcase className="w-4 h-4" />
              <span className="font-medium">Cases</span>
            </button>
            <button className="h-full px-4 flex items-center space-x-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b-2 border-transparent">
               <FileCheck className="w-4 h-4" />
               <span className="font-medium">Tasks</span>
             </button>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-medium transition-colors shadow-sm text-sm border border-blue-500">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Case</span>
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 hover:text-white ml-2 overflow-hidden">
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto overflow-auto p-4 sm:p-6 bg-slate-50 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Siren className="w-6 h-6 text-slate-700" />
            <h1 className="text-2xl font-normal text-slate-800 tracking-tight">Alerts</h1>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold select-none">
                  <th className="px-4 py-3 w-32 cursor-pointer hover:bg-slate-100">Severity</th>
                  <th className="px-4 py-3 w-36 cursor-pointer hover:bg-slate-100">Status</th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100">Title & ID</th>
                  <th className="px-4 py-3 w-64 hidden lg:table-cell">Tags</th>
                  <th className="px-4 py-3 w-48 cursor-pointer hover:bg-slate-100">Source</th>
                  <th className="px-4 py-3 w-20 text-center cursor-pointer hover:bg-slate-100">#Obs</th>
                  <th className="px-4 py-3 w-44 cursor-pointer hover:bg-slate-100">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Siren className="w-8 h-8 animate-pulse text-blue-400 mb-2" />
                        <span className="font-medium">Loading alerts...</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {error && !loading && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-red-500 font-medium">
                      {error}
                    </td>
                  </tr>
                )}
                
                {!loading && !error && alerts.length === 0 && (
                   <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                      Select an alert to start investigation.
                    </td>
                  </tr>
                )}

                {!loading && !error && alerts.map((alert) => (
                  <tr 
                    key={alert.id} 
                    onClick={() => handleRowClick(alert)}
                    className="group hover:bg-blue-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {alert.id}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {alert.tags && alert.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200 uppercase tracking-widest">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-slate-600 font-medium">
                      {"TheHive Intelligence"}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-center">
                      <span className="font-bold text-slate-600 group-hover:text-blue-700">
                        {alert.observables ? alert.observables.length : 0}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-slate-500 font-mono text-xs">
                      {alert.timestamp || alert.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* FULL SCREEN ALERT INVESTIGATION VIEW */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
           
           <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0 shadow-sm z-20">
              <div className="flex items-center space-x-4">
                 <button onClick={closePanel} className="text-slate-500 hover:text-slate-800 flex items-center p-2 rounded hover:bg-slate-100 transition-colors">
                    <X className="w-6 h-6 mr-2" />
                    <span className="font-bold text-[13px] uppercase tracking-wider">Close Investigation</span>
                 </button>
                 <div className="h-8 w-px bg-slate-300"></div>
                 <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedAlert.title}</h2>
                    <div className="text-[13px] text-slate-500 font-mono mt-0.5">{selectedAlert.id}</div>
                 </div>
              </div>
              <div className="flex items-center space-x-3">
                 <SeverityBadge severity={selectedAlert.severity} />
                 <StatusBadge status={selectedAlert.status} />
              </div>
           </div>
      
           <div className="flex flex-1 overflow-hidden">
              
              {/* LEFT COLUMN: RAW ALERT DETAILS */}
              <div className="w-[450px] shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-8 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 transition-all">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center border-b border-slate-200 pb-3">
                    <Activity className="w-5 h-5 mr-3 text-blue-600" />
                    Raw Alert Context
                 </h3>
      
                 <div className="mb-8">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Description</h4>
                    <p className="text-slate-700 text-[13px] leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded">
                       {selectedAlert.description || "No specific detailed description embedded within the alert payload."}
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                       <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Source System</span>
                       <span className="text-slate-800 font-semibold text-[13px]">{selectedAlert.source || "TheHive Intelligence"}</span>
                    </div>
                    <div>
                       <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Timestamp</span>
                       <span className="text-slate-800 font-mono text-xs">{selectedAlert.timestamp || selectedAlert.date}</span>
                    </div>
                 </div>
      
                 <div className="mb-8">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Trigger Tags</h4>
                    <div className="flex flex-wrap gap-2">
                       {selectedAlert.tags?.map(tag => (
                          <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-[11px] font-bold border border-slate-200 uppercase tracking-widest">
                             {tag}
                          </span>
                       ))}
                    </div>
                 </div>
      
                 <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center justify-between">
                       Observables Data
                       <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                          {selectedAlert.observables?.length || 0}
                       </span>
                    </h4>
                    <div className="space-y-2.5">
                       {selectedAlert.observables?.map((o, i) => (
                          <div key={i} className="flex flex-col p-3 bg-blue-50/50 border border-blue-100 rounded">
                             <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1.5">{o.type}</span>
                             <span className="font-mono text-slate-800 text-[13px] font-semibold break-all">{o.value}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
      
              {/* RIGHT COLUMN: AI COPILOT */}
              <div className="flex-1 bg-slate-100/50 overflow-y-auto p-10 relative">
                 
                 {isAnalyzing ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20 transition-opacity">
                          <div className="flex flex-col items-center text-center max-w-md">
                             <div className="relative">
                               <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6" />
                               <Sparkles className="w-6 h-6 text-purple-400 absolute bottom-6 right-0 animate-pulse" />
                             </div>
                             <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">TheHive Analysis Request</h3>
                             <p className="text-slate-500 text-sm mt-3 leading-relaxed font-medium">
                               Interrogating LLM endpoint, generating KQL queries, and validating Threat Intelligence via external APIs...
                             </p>
                          </div>
                       </div>
                 ) : analysis?.error ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
                          <div className="bg-red-50 text-red-700 p-8 rounded-xl shadow-xl border border-red-200 max-w-lg text-center font-medium">
                             <ShieldAlert className="w-14 h-14 mx-auto mb-6 text-red-500" />
                             {analysis.error}
                          </div>
                       </div>
                 ) : analysis && (
                       <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
                          
                          {/* Copilot Header */}
                          <div className="flex items-center justify-between mb-8">
                             <div className="flex items-center space-x-4">
                               <div className="p-3 bg-indigo-100 rounded-xl">
                                  <Sparkles className="w-8 h-8 text-indigo-700 drop-shadow-sm" />
                               </div>
                               <div>
                                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">TheHive Intelligence</h2>
                                  <p className="text-slate-500 text-[13px] font-medium mt-1">Automated generative reporting and playbook enrichment</p>
                               </div>
                             </div>
                             
                             {/* AI Risk Component */}
                             <div className="flex flex-col items-end">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Computed Threat Risk</span>
                                <div className={cn(
                                   "flex items-center px-4 py-1.5 rounded-full border shadow-sm font-bold text-sm tracking-wide",
                                   analysis.overall_risk === "High" ? "bg-red-50 text-red-700 border-red-200" :
                                   analysis.overall_risk === "Medium" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                   "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}>
                                  {analysis.overall_risk === "High" && <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />}
                                  {analysis.overall_risk === "Medium" && <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />}
                                  {analysis.overall_risk === "Low" && <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />}
                                  Risk Score: {analysis.overall_risk === "High" ? "9.4/10" : analysis.overall_risk === "Medium" ? "6.2/10" : "1.5/10"}
                                </div>
                             </div>
                          </div>
                          
                          {/* Top Row: Details & Threat Intel */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                             {/* AI Triage Card */}
                             <section className="bg-white p-7 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
                               <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center">
                                  <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
                                  Triage Explanation
                               </h3>
                               <div className="text-slate-700 text-[13px] font-medium leading-relaxed whitespace-pre-wrap">
                                  {analysis.explanation}
                               </div>
                             </section>
      
                             {/* Threat Intel Card */}
                             <section className="bg-white p-7 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
                               <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-5 flex items-center">
                                  <ShieldAlert className="w-4 h-4 mr-2 text-slate-800" />
                                  External T.I. Detections
                               </h3>
                               <div className="grid grid-cols-1 gap-4">
                                  
                                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start">
                                     {analysis.url_analysis && analysis.url_analysis.toLowerCase().includes("no threat") ? (
                                        <CheckCircle className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                                     ) : (
                                        <AlertTriangle className="w-5 h-5 mr-3 text-red-500 shrink-0 mt-0.5" />
                                     )}
                                     <div>
                                        <span className="font-bold text-[11px] uppercase tracking-widest text-slate-800 block mb-1">URL Analysis</span>
                                        <span className="text-slate-600 text-[13px] leading-relaxed font-medium">{analysis.url_analysis}</span>
                                     </div>
                                  </div>

                                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start">
                                     {analysis.hash_analysis && analysis.hash_analysis.toLowerCase().includes("no threat") ? (
                                        <CheckCircle className="w-5 h-5 mr-3 text-emerald-500 shrink-0 mt-0.5" />
                                     ) : (
                                        <AlertTriangle className="w-5 h-5 mr-3 text-red-500 shrink-0 mt-0.5" />
                                     )}
                                     <div>
                                        <span className="font-bold text-[11px] uppercase tracking-widest text-slate-800 block mb-1">File Hash Signatures</span>
                                        <span className="text-slate-600 text-[13px] leading-relaxed font-medium">{analysis.hash_analysis}</span>
                                     </div>
                                  </div>
                               </div>
                             </section>
                          </div>
      
                          {/* Investigation Steps Card */}
                          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
                               <FileCheck className="w-4 h-4 mr-3 text-emerald-600" />
                               Generated Investigation Steps
                            </h3>
                            <div className="pl-2">
                               {parseInvestigationSteps(analysis.investigation_steps)}
                            </div>
                          </section>
      
                          {/* Second Row: KQL & Questions */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                             {/* Editable KQL Terminal */}
                             <section className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 flex flex-col h-full overflow-hidden relative group">
                               <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Terminal className="w-4 h-4 mr-2 text-slate-400" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                       Kibana KQL Query
                                    </h3>
                                  </div>
                                  <button 
                                    onClick={() => copyToClipboard(analysis.kql_query)}
                                    className="flex items-center text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                                  >
                                    {copiedKql ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                    {copiedKql ? "Copied" : "Copy"}
                                  </button>
                               </div>
                               <div className="p-6 overflow-x-auto text-[13px] leading-relaxed font-mono text-blue-300">
                                  <pre className="whitespace-pre-wrap">{analysis.kql_query}</pre>
                               </div>
                             </section>
      
                             {/* User Context Queries */}
                             <section className="bg-white p-7 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
                               <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-5 flex items-center border-b border-slate-100 pb-3">
                                  <User className="w-4 h-4 mr-2 text-blue-600" />
                                  Suggested Context Email
                               </h3>
                               <div className="text-slate-700 text-[13px] font-medium leading-relaxed whitespace-pre-wrap bg-blue-50/50 p-4 border border-blue-100 rounded-lg">
                                  {analysis.user_questions}
                               </div>
                             </section>
                          </div>
      
                          {/* Drafted Report */}
                          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-800 mb-2 flex items-center border-b border-slate-100 pb-4">
                               <FileText className="w-4 h-4 mr-3 text-slate-600" />
                               Drafted Final Incident Report
                            </h3>
                            <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                               {parseReport(analysis.report)}
                            </div>
                          </section>
                       </div>
                 )}
      
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
