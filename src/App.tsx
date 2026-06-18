import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, Database, Activity, ShieldCheck, FileCode, CheckCircle2, Terminal, Info, LayoutDashboard, Settings, Boxes, Coffee, Users, Eye, Calendar, Hash, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface Stage {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  details: string[];
}

// Format DateTime Helper
const formatDateTime = (dateStr: string, timeStr: string) => {
  if (!dateStr) return "N/A";
  const d = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  let t = timeStr ? timeStr.substring(0, 4).replace(/(\d{2})(\d{2})/, '$1:$2') : "";
  return t ? `${d} ${t}` : d;
};

// Modality Badge Helper
const ModalityBadge = ({ type }: { type: string }) => {
  let colors = "bg-slate-800 text-slate-300";
  if (type === 'CT') colors = "bg-teal-500/10 text-teal-400 border border-teal-500/20";
  else if (type === 'MR') colors = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
  else if (['CR', 'DX'].includes(type)) colors = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
  else if (type === 'US') colors = "bg-green-500/10 text-green-400 border border-green-500/20";

  return <span className={`px-2 py-0.5 rounded font-mono text-xs font-semibold ${colors}`}>{type || "N/A"}</span>;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'clinical' | 'config'>('clinical');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Mock Orthanc Data for Preview
  const mockStudies = [
    {
      ID: "b6b6fdeb-6612d4fb-5bd1b046-24e5a593-9c5950d7",
      IsStable: true,
      PatientMainDicomTags: { PatientName: "NGUYEN^VAN^A", PatientID: "2023001" },
      MainDicomTags: { StudyDate: "20231024", StudyTime: "083215", StudyInstanceUID: "uid-1", AccessionNumber: "ACC827192", StudyDescription: "CT SỌ NÃO KHÔNG THUỐC" },
      Modality: "CT",
      InstancesCount: 320
    },
    {
      ID: "c1c1fdeb-7712d4fb-5bd1b046-24e5a593-9c5950d8",
      IsStable: false,
      PatientMainDicomTags: { PatientName: "TRAN^THI^B", PatientID: "2023002" },
      MainDicomTags: { StudyDate: "20231025", StudyTime: "142000", StudyInstanceUID: "uid-2", AccessionNumber: null, StudyDescription: "MR KHỚP GỐI (P)" },
      Modality: "MR",
      InstancesCount: 145
    },
    {
      ID: "d2c1fdeb-8812d4fb-5bd1b046-24e5a593-9c5950d9",
      IsStable: true,
      PatientMainDicomTags: { PatientName: "LE^VAN^C", PatientID: "2023003" },
      MainDicomTags: { StudyDate: "20231026", StudyTime: "091530", StudyInstanceUID: "uid-3", AccessionNumber: "ACC092834", StudyDescription: "XQ NGỰC THẲNG" },
      Modality: "CR",
      InstancesCount: 1
    }
  ];

  const totalStudies = mockStudies.length;
  const totalPages = Math.ceil(totalStudies / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentStudies = mockStudies.slice(startIndex, startIndex + rowsPerPage);

  const stages: Stage[] = [
    {
      id: 1,
      title: 'Backend Core (Orthanc + Postgres)',
      description: 'Setup the primary DICOM server with persistent database.',
      status: 'completed',
      details: [
        'Docker Compose configuration created',
        'PostgreSQL plugin integrated for metadata storage',
        'Volume mapping for persistent data storage defined',
        'Environment variables for security configured'
      ]
    },
    {
      id: 2,
      title: 'Frontend Viewer (OHIF)',
      description: 'Integrate the open-source OHIF Viewer for DICOM visualization.',
      status: 'completed',
      details: [
        'OHIF Docker image setup',
        'CORS & DICOMweb bridging',
        'Viewer configuration (app-config.js)'
      ]
    },
    {
      id: 3,
      title: 'Custom API & Extensions',
      description: 'Extend system functionality with Python/Node.js.',
      status: 'completed',
      details: [
        'Next.js 14 App Router + shadcn/ui skeleton',
        'Server Actions calling internal Orthanc REST API',
        'Docker integration & environment propagation'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 border-r border-slate-800/50 bg-[#0d0d0f] flex flex-col items-center py-8 z-50">
        <div className="mb-12">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Boxes className="text-white h-6 w-6" />
          </div>
        </div>
        
        <div className="flex flex-col gap-8">
          <NavButton active={activeTab === 'clinical'} onClick={() => setActiveTab('clinical')} icon={<Users size={22} />} />
          <NavButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<Settings size={22} />} />
        </div>

        <div className="mt-auto pb-4">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </nav>

      <main className="pl-20 min-h-screen">
        {/* Content Area */}
        <div className="p-8 w-full h-full flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'clinical' && (
              <motion.div
                key="clinical"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6 flex-1 w-full"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <h1 className="text-2xl font-bold text-slate-100">Danh sách Ca chụp</h1>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <label htmlFor="rows" className="text-sm text-slate-400 font-medium whitespace-nowrap">
                        Rows per page:
                      </label>
                      <select
                        id="rows"
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none min-w-[4rem] text-center cursor-pointer"
                      >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="w-px h-6 bg-slate-800"></div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 border border-slate-700/60 rounded-lg bg-slate-900/50 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 border border-slate-700/60 rounded-lg bg-slate-900/50 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0d0d0f] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-medium tracking-wider text-left">Accession</th>
                        <th className="px-6 py-4 font-medium tracking-wider text-left">Bệnh Nhân</th>
                        <th className="px-6 py-4 font-medium tracking-wider text-left">Modality</th>
                        <th className="px-6 py-4 font-medium tracking-wider text-left">Mô tả</th>
                        <th className="px-6 py-4 font-medium tracking-wider text-left">Ngày chụp</th>
                        <th className="px-6 py-4 font-medium tracking-wider text-left">Trạng thái</th>
                        <th className="px-6 py-4 font-medium tracking-wider text-center">Instances</th>
                        <th className="px-6 py-4 font-medium tracking-wider text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentStudies.map((study) => {
                        const acc = study.MainDicomTags?.AccessionNumber || null;
                        const name = (study.PatientMainDicomTags?.PatientName || "Unknown Patient").replace(/\^/g, ' ');
                        const pid = study.PatientMainDicomTags?.PatientID || "N/A";
                        const desc = study.MainDicomTags?.StudyDescription || "N/A";
                        const isStable = study.IsStable ?? true;

                        return (
                          <tr key={study.ID} className="hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-4 text-left">
                              <span className={acc ? "text-cyan-400 font-mono text-xs" : "text-slate-500 font-mono text-xs"}>
                                {acc || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-left">
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-sm tracking-wide">{name}</span>
                                <span className="text-slate-400 text-xs mt-0.5">PID-{pid}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-left">
                              <ModalityBadge type={study.Modality} />
                            </td>
                            <td className="px-6 py-4 text-slate-300 text-sm max-w-[200px] truncate" title={desc}>
                              {desc}
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-sm">
                              {formatDateTime(study.MainDicomTags?.StudyDate, study.MainDicomTags?.StudyTime)}
                            </td>
                            <td className="px-6 py-4 text-left">
                              {isStable ? (
                                <span className="inline-flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-xs font-medium">Hoàn tất</span>
                              ) : (
                                <span className="inline-flex items-center bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-md text-xs font-medium">Đang nhận</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-300 font-mono text-sm">
                              {study.InstancesCount || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <a 
                                href={`http://localhost:3000/viewer?StudyInstanceUIDs=${study.MainDicomTags?.StudyInstanceUID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 rounded-lg transition-all font-medium text-xs shadow-sm hover:shadow-emerald-500/10 focus:ring-2 focus:ring-emerald-500/40 outline-none"
                              >
                                <ExternalLink size={14} /> Mở bằng OHIF
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Ports & Connectivity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-blue-500" />
                      Network Ports
                    </h3>
                    <div className="space-y-3">
                      <PortRow label="Next.js Dashboard" port="80" protocol="HTTP" />
                      <PortRow label="OHIF Viewer" port="3000" protocol="HTTP" />
                      <PortRow label="Orthanc Web (Portal)" port="8042" protocol="HTTP" />
                      <PortRow label="DICOM Protocol" port="4242" protocol="TCP" />
                      <PortRow label="PostgreSQL" port="5432" protocol="TCP" />
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Security Strategy (.env)
                    </h3>
                    <div className="space-y-3">
                      <CredRow label="Infrastructure as Code" user="No Hardcoded IPs" pass="Enforced" />
                      <CredRow label="Secret Management" user="envsubst" pass="Dynamic" />
                      <CredRow label="Installer Script" user="install.sh" pass="Automated" isNote />
                    </div>
                  </div>
                </div>

                {/* File Links */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                  <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <FileCode className="text-blue-500" />
                    Turnkey Package Structure
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ConfigItem title="install.sh" path="./install.sh" />
                    <ConfigItem title="docker-compose.yml" path="./docker-compose.yml" />
                    <ConfigItem title="app/page.tsx" path="./dashboard/app/page.tsx" />
                    <ConfigItem title="app/actions.ts" path="./dashboard/app/actions.ts" />
                    <ConfigItem title="Dockerfile" path="./dashboard/Dockerfile" />
                    <ConfigItem title="app-config.js.template" path="./config_templates/app-config.js.template" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

function NavButton({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`relative p-3 rounded-xl transition-all duration-200 group ${
        active ? 'text-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      {active && (
        <motion.div 
          layoutId="nav-active" 
          className="absolute -right-1 top-2 bottom-2 w-0.5 bg-blue-500 rounded-full" 
        />
      )}
    </button>
  );
}

function StatCard({ title, value, sub, icon }: { title: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="p-6 bg-[#0d0d0f] border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        {icon}
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function ConfigItem({ title, path }: { title: string; path: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/20 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-all group">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
          <FileCode className="text-slate-400 group-hover:text-blue-400 transition-colors" size={18} />
        </div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-[10px] font-mono text-slate-500">{path}</div>
        </div>
      </div>
      <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">READY</div>
    </div>
  );
}

function PortRow({ label, port, protocol }: { label: string; port: string; protocol: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold text-blue-400">{port}</span>
        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{protocol}</span>
      </div>
    </div>
  );
}

function CredRow({ label, user, pass, isNote }: { label: string; user: string; pass: string; isNote?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="text-right">
        <div className="text-xs font-mono text-slate-200">{user}</div>
        {!isNote && <div className="text-[10px] font-mono text-slate-600">{pass}</div>}
      </div>
    </div>
  );
}

function LogLine({ type, text }: { type: 'info' | 'success' | 'warning'; text: string }) {
  const colors = {
    info: 'text-slate-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400'
  };
  const symbols = {
    info: '[*]',
    success: '[OK]',
    warning: '[!]'
  };
  return (
    <div className="flex gap-4">
      <span className={`shrink-0 ${colors[type]} opacity-50 tracking-widest`}>{symbols[type]}</span>
      <span className={colors[type]}>{text}</span>
    </div>
  );
}
