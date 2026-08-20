/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, BookOpen, Code, AlertTriangle, Copy, Check, ChevronRight, Terminal as TerminalIcon, ShieldAlert } from 'lucide-react';

// Data Definitions
const CURRICULUM = [
  { id: '01', level: 1, title: 'The Mainframe Tour', duration: '15m', desc: 'Introduction to z/OS and the 3270 terminal.' },
  { id: '02', level: 1, title: 'TSO/ISPF Basics', duration: '20m', desc: 'Navigating datasets and members.' },
  { id: '03', level: 1, title: 'JCL Fundamentals', duration: '25m', desc: 'Job cards, EXEC statements, and DDs.' },
  { id: '04', level: 1, title: 'COBOL Hello World', duration: '18m', desc: 'Divisions, sections, and basic syntax.' },
  { id: '05', level: 1, title: 'Data Division', duration: '30m', desc: 'PIC clauses, COMP, and REDEFINES.' },
  { id: '06', level: 1, title: 'Procedure Division', duration: '28m', desc: 'PERFORM, IF, EVALUATE.' },
  { id: 'C1', level: 1, title: 'Capstone 1', duration: '1h', desc: 'Payslip Batch Generator.' },
  { id: '07', level: 2, title: 'Sequential Files', duration: '35m', desc: 'Reading and writing QSAM datasets.' },
  { id: '08', level: 2, title: 'Control Breaks', duration: '40m', desc: 'Single and multiple level control breaks.' },
  { id: '09', level: 2, title: 'VSAM Basics', duration: '45m', desc: 'KSDS structure and IDCAMS.' },
  { id: '10', level: 2, title: 'VSAM in COBOL', duration: '38m', desc: 'START, READ NEXT, REWRITE.' },
  { id: '11', level: 2, title: 'Subprograms', duration: '30m', desc: 'CALL, Linkage Section, static vs dynamic.' },
  { id: '12', level: 2, title: 'String Handling', duration: '25m', desc: 'INSPECT, STRING, UNSTRING.' },
  { id: '13', level: 2, title: 'Table Processing', duration: '40m', desc: 'OCCURS, SEARCH, SEARCH ALL.' },
  { id: '14', level: 2, title: 'Error Handling', duration: '20m', desc: 'File status codes and declaratives.' },
  { id: 'C2', level: 2, title: 'Capstone 2', duration: '2h', desc: 'Control-Break Batch Chain.' },
  { id: '15', level: 3, title: 'Db2 Concepts', duration: '45m', desc: 'Relational model on z/OS.' },
  { id: '16', level: 3, title: 'Embedded SQL', duration: '50m', desc: 'EXEC SQL, cursors, and SQLCA.' },
  { id: '17', level: 3, title: 'CICS Fundamentals', duration: '40m', desc: 'Online transaction processing.' },
  { id: '18', level: 3, title: 'BMS Maps', duration: '45m', desc: 'Screen definitions and attributes.' },
  { id: '19', level: 3, title: 'CICS Programming', duration: '55m', desc: 'SEND MAP, RECEIVE MAP, pseudo-conversational.' },
  { id: '20', level: 3, title: 'Advanced JCL', duration: '35m', desc: 'PROCs, symbolic parameters, GDGs.' },
  { id: '21', level: 3, title: 'Debugging', duration: '40m', desc: 'Reading dumps and CEDF.' },
  { id: '22', level: 3, title: 'Modernization', duration: '30m', desc: 'Zowe, APIs, and modern tools.' },
  { id: 'C3', level: 3, title: 'Capstone 3', duration: '3h', desc: 'Bank Statement Generator.' },
];

const ABENDS = [
  {
    code: 'S0C7',
    name: 'Data Exception',
    desc: 'Attempting to perform arithmetic on invalid numeric data (e.g., space in a COMP-3 field).',
    log: 'CEE3207S The system detected a data exception (System Completion Code=0C7).',
    fix: '01 WS-AMOUNT PIC S9(5)V99 COMP-3 VALUE ZERO.',
  },
  {
    code: 'S0C4',
    name: 'Protection Exception',
    desc: 'Attempting to access memory outside allocated bounds, often due to an uninitialized pointer.',
    log: 'CEE3204S The system detected a protection exception (System Completion Code=0C4).',
    fix: 'IF WS-INDEX <= 100\n    MOVE "X" TO WS-ARRAY (WS-INDEX)\nEND-IF',
  },
  {
    code: 'S806',
    name: 'Module Not Found',
    desc: 'System could not find executable module specified in EXEC PGM= or a dynamic call.',
    log: 'CSV003I REQUESTED MODULE NOT FOUND\nSYSTEM COMPLETION CODE=806',
    fix: '//STEPLIB  DD DSN=YOUR.LOAD.LIBRARY,DISP=SHR',
  }
];

const CHEATSHEETS = [
  {
    title: '4-Division COBOL Skeleton',
    module: 'Module 05',
    code: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.

       DATA DIVISION.
       FILE SECTION.
       WORKING-STORAGE SECTION.
       01 WS-GREETING PIC X(20) VALUE 'HELLO, COBOL-LIST!'.

       PROCEDURE DIVISION.
           DISPLAY WS-GREETING.
           GOBACK.`
  },
  {
    title: 'Minimal JCL Batch Job',
    module: 'Module 06',
    code: `//JOB001   JOB (ACCT),'COBOL JOB',CLASS=A,MSGCLASS=X
//STEP1    EXEC PGM=HELLO
//STEPLIB  DD DSN=USER.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//SYSUDUMP DD SYSOUT=*
//`
  }
];

const EPISODE_TABS = [
  { title: "Scene 0", label: "Reusable Channel Intro", transcript: "Bienvenue au COBOL-list Show...", code: "" },
  { title: "Act 1", label: "The Hidden Engine", transcript: "Aujourd'hui, on explore la bête qui fait tourner l'économie mondiale...", code: "" },
  { title: "Act 2", label: "The Clearance & TSO", transcript: "Pour entrer, il nous faut nos accès RACF. Tapez votre commande de connexion.", code: "LOGON ZUSER01" },
  { title: "Act 3", label: "The Terminal & ISPF", transcript: "Et voici ISPF, notre interface principale pour le développement z/OS.", code: "ISPF" },
];

const TerminalEmulator = () => {
  const [history, setHistory] = useState<{type: 'in'|'out', text: string}[]>([
    { type: 'out', text: 'ENTER LOGON COMMAND' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim()) return;
    const cmd = input.trim().toUpperCase();
    
    let output = '';
    switch(cmd) {
      case 'LOGON ZUSER01': output = 'ICH70001I ZUSER01 LAST ACCESS AT 08:30...\nIKJ56700I ZUSER01 LOGON IN PROGRESS'; break;
      case 'ISPF': output = 'ENTERING ISPF...'; break;
      case 'RUN HELLO': output = '** EXECUTION STARTED **\nDISPLAY \'HELLO MAINFRAME WORLD\'\nMAXCC 0000 - SUCCESSFUL'; break;
      case 'SHOW SOC7': output = 'CEE3207S The system detected a data exception (System Completion Code=0C7).'; break;
      case 'HELP': output = 'AVAILABLE COMMANDS: LOGON, ISPF, RUN, SHOW, CLEAR'; break;
      case 'CLEAR': 
        setHistory([]);
        setInput('');
        return;
      default: output = `COMMAND UNRECOGNIZED: ${cmd}`;
    }

    setHistory(prev => [...prev, { type: 'in', text: cmd }, { type: 'out', text: output }]);
    setInput('');
  };

  return (
    <div className="surface rounded-xl p-2 h-[450px] flex flex-col">
      <div className="bg-[#222] h-6 flex items-center px-4 justify-between rounded-t-lg shrink-0 border-b border-black">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
        <span className="text-[10px] font-mono text-white/40">IBM-3270-MODEL-2 [24x80]</span>
      </div>
      <div className="crt-screen flex-1 rounded-b-lg p-6 overflow-hidden flex flex-col relative font-crt text-xl uppercase">
        <div className="absolute inset-0 pointer-events-none terminal-scanline opacity-30 z-20"></div>
        
        <div className="flex-1 overflow-y-auto space-y-1.5 z-30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex justify-between border-b border-phosphor/20 pb-2 mb-2 terminal-glow text-phosphor">
            <span>Z/OS V2.4</span>
            <span>SYSTEM Z</span>
          </div>
          {history.map((line, i) => (
            <div key={i} className={`terminal-glow ${line.type === 'in' ? 'text-phosphor' : 'text-phosphor/80 whitespace-pre-wrap'}`}>
              {line.type === 'in' ? `> ${line.text}` : line.text}
            </div>
          ))}
          <form onSubmit={handleCommand} className="flex items-center mt-2">
            <span className="mr-2 terminal-glow text-phosphor/50">{'>'}</span>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none terminal-glow text-phosphor caret-amber focus:ring-0 uppercase w-full"
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />
          </form>
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 relative group tactile-btn">
      {copied ? <Check className="w-4 h-4 text-phosphor" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-white" />}
      {copied && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-phosphor text-midnight text-xs rounded font-bold whitespace-nowrap z-50">
          Copied to clipboard!
        </span>
      )}
    </button>
  );
}

export default function App() {
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState(0);

  const filteredModules = levelFilter === 'all' ? CURRICULUM : CURRICULUM.filter(m => m.level === levelFilter);

  return (
    <div className="h-full bg-midnight text-slate-300 font-sans selection:bg-phosphor/30 flex flex-col overflow-hidden">
      
      {/* Navigation */}
      <nav className="glass-nav h-14 px-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-phosphor flex items-center justify-center rounded">
              <span className="text-midnight font-bold text-xs font-mono">01</span>
            </div>
            <span className="font-extrabold tracking-tight text-white text-lg">THE COBOL-LIST SHOW</span>
          </div>
          <div className="h-4 w-px bg-white/10 mx-2 hidden lg:block"></div>
          <div className="hidden lg:flex gap-6 text-sm font-medium opacity-60">
            <a href="#curriculum" className="hover:opacity-100 transition-opacity">Modules</a>
            <a href="#terminal" className="hover:opacity-100 transition-opacity">3270 Console</a>
            <a href="#abend" className="hover:opacity-100 transition-opacity">ABEND Clinic</a>
            <a href="#cheatsheet" className="hover:opacity-100 transition-opacity">Cheat Sheets</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg items-center gap-3 text-xs">
            <Search className="w-3 h-3 opacity-40" />
            <span className="opacity-40">Search...</span>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</kbd>
          </div>
          <button className="bg-phosphor text-midnight px-4 py-1.5 rounded-lg text-sm font-bold tactile-btn hover:brightness-110">
            Full Manual v1.0
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto grid xl:grid-cols-12 gap-6 items-start h-full">
          
          <div className="xl:col-span-7 flex flex-col gap-6">
            
            {/* Hero Section */}
            <section className="surface rounded-xl p-8 flex flex-col justify-center min-h-[320px]">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-phosphor/10 text-phosphor text-[10px] font-bold rounded border border-phosphor/20 uppercase tracking-widest">
                  Hosted by Razin
                </span>
                <span className="text-white/40 text-[10px]">&bull;</span>
                <span className="text-white/60 text-[10px] uppercase tracking-widest">90-Day Mainframe Career</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[0.9] mb-6 tracking-tighter">
                The Titan Running <br/> The Global Economy. <br/>
                <span className="text-phosphor">Demystified.</span>
              </h1>
              
              <p className="text-slate-400 text-sm md:text-base max-w-md mb-8 leading-relaxed">
                From zero to job-ready in 90 days. Master COBOL, JCL, and z/OS through practical capstones and interactive deep dives.
              </p>

              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-phosphor font-bold text-2xl font-mono">22</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-40">Modules</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-phosphor font-bold text-2xl font-mono">03</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-40">Capstones</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-phosphor font-bold text-2xl font-mono">90</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-40">Day Path</span>
                </div>
              </div>
            </section>

            {/* Featured Episode & Curriculum in a grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Featured Episode Spotlight */}
              <section id="episode" className="surface rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[11px] font-bold text-phosphor tracking-widest uppercase">Featured Episode</h3>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Episode 01: The Mainframe Tour</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-amber font-bold uppercase">Module 01</span>
                      <span className="text-[10px] text-slate-500 font-mono">96s / 13 Clips</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    {EPISODE_TABS.map((tab, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`text-left px-3 py-2 rounded-lg border transition-all tactile-btn ${
                          activeTab === idx 
                            ? 'bg-white/10 border-phosphor/50 shadow-[0_0_15px_rgba(163,230,53,0.1)]' 
                            : 'bg-transparent border-transparent hover:bg-white/5'
                        }`}
                      >
                        <div className={`text-[10px] font-bold mb-0.5 ${activeTab === idx ? 'text-phosphor' : 'text-slate-500'}`}>
                          {tab.title}
                        </div>
                        <div className={`text-xs font-semibold ${activeTab === idx ? 'text-white' : 'text-slate-400'}`}>
                          {tab.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="bg-midnight rounded-xl border border-white/5 p-4 flex flex-col justify-center min-h-[160px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transcript</h4>
                        <p className="text-sm text-slate-300 italic font-medium leading-relaxed">
                          "{EPISODE_TABS[activeTab].transcript}"
                        </p>
                      </div>
                      {EPISODE_TABS[activeTab].code && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Syntax</h4>
                          <div className="flex items-center justify-between bg-[#151D30] border border-white/10 rounded-lg p-3">
                            <code className="font-mono text-phosphor text-sm">{EPISODE_TABS[activeTab].code}</code>
                            <CopyButton text={EPISODE_TABS[activeTab].code} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* 22-Module Curriculum Roadmap */}
              <section id="curriculum" className="surface rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold text-phosphor tracking-widest uppercase">Curriculum Map</h3>
                  <span className="text-[10px] mono opacity-40">90 DAYS</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {[
                    { id: 'all', label: `All` },
                    { id: 1, label: 'Lvl 1' },
                    { id: 2, label: 'Lvl 2' },
                    { id: 3, label: 'Lvl 3' },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setLevelFilter(filter.id as any)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all tactile-btn ${
                        levelFilter === filter.id 
                          ? 'bg-white/10 text-white shadow' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-2 content-start overflow-y-auto pr-2 max-h-[320px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                  {filteredModules.map((module) => (
                    <div 
                      key={module.id} 
                      className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold ${
                        module.id.startsWith('C') 
                          ? 'bg-amber text-white' 
                          : 'bg-phosphor text-midnight'
                      }`}
                      title={module.title}
                    >
                      {module.id}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
          
          <div className="xl:col-span-5 flex flex-col gap-6">
            {/* Terminal */}
            <section id="terminal" className="surface rounded-xl p-2 flex flex-col h-[450px]">
              <TerminalEmulator />
            </section>

            {/* The Junior ABEND Clinic */}
            <section id="abend" className="surface rounded-xl p-4 flex-1 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-amber tracking-widest uppercase">Junior ABEND Clinic</h3>
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-bold rounded uppercase tracking-tighter">
                  Triage Tool
                </span>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent h-full">
                {ABENDS.map(abend => (
                  <div key={abend.code} className="border border-white/5 rounded-lg p-4 bg-black/20 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{abend.code}</span>
                      <span className="text-[10px] text-white/40">{abend.name}</span>
                    </div>
                    
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {abend.desc}
                    </p>

                    <div className="mt-2 flex items-start justify-between bg-white/5 p-2 rounded gap-2">
                      <code className="text-[10px] font-mono text-phosphor whitespace-pre-wrap break-words flex-1 leading-tight">
                        {abend.fix}
                      </code>
                      <CopyButton text={abend.fix} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Developer Cheat Sheet Drawer */}
            <section id="cheatsheet" className="surface rounded-xl p-4 flex flex-col gap-3 max-h-[300px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[11px] font-bold text-phosphor tracking-widest uppercase">Cheat Sheets</h3>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
                {CHEATSHEETS.map((sheet, idx) => (
                  <div key={idx} className="bg-black/20 border border-white/5 rounded-lg overflow-hidden flex flex-col">
                    <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <h3 className="font-bold text-white text-xs">{sheet.title}</h3>
                      <CopyButton text={sheet.code} />
                    </div>
                    <div className="p-3 bg-midnight overflow-x-auto">
                      <pre className="font-mono text-[10px] text-slate-300 leading-relaxed">
                        <code>{sheet.code}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 px-6 border-t border-white/5 flex items-center justify-between bg-[#151D30] shrink-0 z-50">
        <div className="flex items-center gap-6">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">YouTube: @cobol.list</span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest">&copy; {new Date().getFullYear()} The COBOL-list Show</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-phosphor">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-phosphor animate-pulse"></span>
            SYSTEM ONLINE
          </span>
          <span className="text-white/20">|</span>
          <span>CPU: 12%</span>
          <span className="text-white/20">|</span>
          <span>USER: Z001</span>
        </div>
      </footer>
    </div>
  );
}
