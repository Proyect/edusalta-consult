/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw,
  Paperclip,
  Trash2,
  File,
  Search, 
  FileText, 
  MessageSquare, 
  Download, 
  ExternalLink, 
  Menu, 
  X, 
  ChevronRight, 
  Info,
  Send,
  Loader2,
  FileSearch,
  BookOpen,
  LayoutDashboard,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Resolution, Message } from './types';
import { GoogleGenAI } from "@google/genai";

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-100 shadow-sm' 
        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
    }`}
  >
    <Icon size={20} className={active ? 'text-emerald-600' : 'text-zinc-400'} />
    <span className="text-sm">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
  </button>
);

function ResolutionCard({ resolution }: { resolution: Resolution }) {
  return (
    <div className="group bg-white border border-zinc-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <FileText size={12} />
          Resolución
        </div>
        <span className="text-[11px] font-mono text-zinc-400">{resolution.date}</span>
      </div>
      <h3 className="text-zinc-900 font-semibold text-base mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
        {resolution.title}
      </h3>
      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
        <span className="flex items-center gap-1">
          <Download size={14} className="opacity-70" />
          {resolution.downloads} descargas
        </span>
      </div>
      <div className="flex gap-2">
        <a 
          href={resolution.downloadUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            resolution.downloadUrl === '#' 
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
              : 'bg-zinc-900 text-white hover:bg-emerald-600'
          }`}
          onClick={(e) => resolution.downloadUrl === '#' && e.preventDefault()}
        >
          <Download size={16} />
          {resolution.downloadUrl === '#' ? 'No disponible' : 'Descargar'}
        </a>
        <a 
          href={resolution.pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`w-11 h-11 flex items-center justify-center border rounded-xl transition-colors ${
            resolution.pdfUrl === '#' 
              ? 'border-zinc-100 text-zinc-200 cursor-not-allowed' 
              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
          onClick={(e) => resolution.pdfUrl === '#' && e.preventDefault()}
        >
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'resolutions' | 'assistant' | 'forms'>('resolutions');
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [forms, setForms] = useState<{title: string, desc: string, url: string, status?: 'checking' | 'ok' | 'error'}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isAiFormSearching, setIsAiFormSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy tu asistente de EduSalta. ¿En qué puedo ayudarte hoy? Puedo buscar resoluciones, formularios o explicarte trámites docentes.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchResolutions();
    initializeForms();
  }, []);

  const initializeForms = () => {
    const initialForms = [
      { title: 'Declaración Jurada de Cargos', desc: 'Formulario para informar situación de revista.', url: 'https://dges-sal.infd.edu.ar/sitio/upload/form_declarac_jurada_REV_3.pdf' },
      { title: 'Solicitud de Licencia', desc: 'Trámite para pedidos de licencia médica o personal.', url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/2-solicitud-de-licencia' },
      { title: 'Certificación de Servicios', desc: 'Documento para acreditar antigüedad y servicios.', url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/3-certificacion-de-servicios' },
      { title: 'Formulario de Salario Familiar', desc: 'Para el cobro de asignaciones familiares.', url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/4-formulario-de-salario-familiar' },
      { title: 'Alta de Seguro de Vida', desc: 'Formulario para el alta en el seguro de vida obligatorio.', url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/5-alta-seguro-de-vida' },
      { title: 'Baja de Seguro de Vida', desc: 'Formulario para la baja en el seguro de vida.', url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/6-baja-seguro-de-vida' },
      { title: 'Solicitud de Traslado', desc: 'Formulario para solicitar traslado de establecimiento.', url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/7-solicitud-de-traslado' },
      { title: 'Reclamo de Haberes', desc: 'Formulario para reclamos relacionados con el sueldo.', url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/8-reclamo-de-haberes' }
    ];
    setForms(initialForms);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchResolutions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proxy/resoluciones');
      if (!response.ok) throw new Error('Network response was not ok');
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const items: Resolution[] = [];
      
      // Try multiple selectors to find the documents
      let containers = doc.querySelectorAll('h4, .edocman-document-title, .document-title');
      
      if (containers.length === 0) {
        // Fallback: look for links that look like resolutions
        const links = Array.from(doc.querySelectorAll('a')).filter(a => 
          a.textContent?.includes('Res. Min.') || 
          a.href.includes('/resoluciones/')
        );
        
        links.forEach((link, index) => {
          const title = link.textContent?.trim() || 'Sin título';
          const pdfUrl = link.href.startsWith('http') ? link.href : `https://www.edusalta.gov.ar${link.getAttribute('href')}`;
          
          items.push({
            id: `res-fallback-${index}`,
            title,
            date: 'Consultar documento',
            downloads: '-',
            downloadUrl: pdfUrl,
            pdfUrl: pdfUrl
          });
        });
      } else {
        containers.forEach((h, index) => {
          const links = h.querySelectorAll('a');
          const titleLink = links.length > 1 ? links[1] : links[0];
          
          if (!titleLink) return;

          const title = titleLink.textContent?.trim() || 'Sin título';
          const pdfUrl = titleLink.getAttribute('href')?.startsWith('http') 
            ? titleLink.getAttribute('href')! 
            : `https://www.edusalta.gov.ar${titleLink.getAttribute('href')}`;
          
          // Find the parent or next sibling that contains metadata
          let metadataText = '';
          let downloadUrl = pdfUrl;
          
          let current: HTMLElement | null = h as HTMLElement;
          let foundMetadata = false;
          
          // Look in parent and siblings for metadata
          const parent = h.parentElement;
          if (parent) {
            metadataText = parent.textContent || '';
            const downloadLink = parent.querySelector('a[href*="/file"]');
            if (downloadLink) {
              downloadUrl = `https://www.edusalta.gov.ar${downloadLink.getAttribute('href')}`;
            }
          }

          const dateMatch = metadataText.match(/Publicado el (\d+ \w+ \d+)/);
          const downloadsMatch = metadataText.match(/(\d+) descargas/);

          items.push({
            id: `res-${index}`,
            title,
            date: dateMatch ? dateMatch[1] : 'Fecha desconocida',
            downloads: downloadsMatch ? downloadsMatch[1] : '0',
            downloadUrl,
            pdfUrl: pdfUrl || '#'
          });
        });
      }

      // Filter out duplicates and empty titles
      const uniqueItems = items.filter((item, index, self) =>
        item.title !== 'Sin título' &&
        index === self.findIndex((t) => t.title === item.title)
      );

      setResolutions(uniqueItems);
    } catch (error) {
      console.error('Error fetching resolutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiResolutionSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsAiSearching(true);
    setLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const response = await ai.models.generateContent({
        model,
        contents: `Busca resoluciones ministeriales de educación de Salta relacionadas con: "${searchQuery}". 
        Devuelve una lista de objetos JSON con el formato: 
        [{"title": "Nombre de la Resolución", "downloadUrl": "URL_DEL_PDF", "date": "Fecha o Año"}]
        Solo devuelve el JSON, nada más. Si no encuentras enlaces directos, busca en el Boletín Oficial de Salta o EduSalta.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const aiResults = JSON.parse(response.text || "[]");
      
      const formattedResults: Resolution[] = aiResults.map((res: any, index: number) => ({
        id: `ai-res-${Date.now()}-${index}`,
        title: res.title || 'Resolución encontrada por IA',
        date: res.date || 'Reciente',
        downloads: 'IA',
        downloadUrl: res.downloadUrl || '#',
        pdfUrl: res.downloadUrl || '#'
      }));

      if (formattedResults.length > 0) {
        setResolutions(prev => [...formattedResults, ...prev]);
      } else {
        // Fallback if AI returns no JSON but text
        console.log("AI search returned no structured data");
      }
    } catch (error) {
      console.error('Error in AI resolution search:', error);
    } finally {
      setIsAiSearching(false);
      setLoading(false);
    }
  };

  const handleAiFormSearch = async () => {
    if (!formSearchQuery.trim()) return;
    
    setIsAiFormSearching(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const response = await ai.models.generateContent({
        model,
        contents: `Busca enlaces directos de descarga para formularios docentes de EduSalta relacionados con: "${formSearchQuery}". 
        Devuelve una lista de objetos JSON con el formato: 
        [{"title": "Nombre del Formulario", "desc": "Breve descripción", "url": "URL_DE_DESCARGA_DIRECTA"}]
        Solo devuelve el JSON, nada más. Prioriza enlaces de edusalta.gov.ar o sitios oficiales de Salta.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const aiResults = JSON.parse(response.text || "[]");
      
      if (aiResults.length > 0) {
        setForms(aiResults);
      }
    } catch (error) {
      console.error('Error in AI form search:', error);
    } finally {
      setIsAiFormSearching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const data = base64.split(',')[1];
      setSelectedFile({
        data,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() && !selectedFile) return;

    const userText = userInput.trim() || (selectedFile ? `He adjuntado un archivo: ${selectedFile.name}` : "");
    const newMessages: Message[] = [...chatMessages, { role: 'user', text: userText }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const parts: any[] = [{ text: userText }];
      if (selectedFile) {
        parts.push({
          inlineData: {
            data: selectedFile.data,
            mimeType: selectedFile.mimeType
          }
        });
      }

      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: `Eres un asistente experto en normativa educativa de Salta, Argentina (EduSalta). 
          Tu objetivo es ayudar a los docentes a encontrar resoluciones, formularios y trámites.
          Usa un tono profesional, amable y servicial.
          
          MARCO NORMATIVO CLAVE (SALTA):
          1. Estatuto del Educador (Ley N° 6830): Regula la carrera docente (Inicial, Primaria, Secundaria). Cubre ingreso, estabilidad, derechos/deberes (Arts. 6-11), remuneraciones, traslados y permutas (Arts. 30, 32).
          2. Disciplina: Junta Calificadora de Méritos y Disciplina. Decreto N° 2734/07 (Reglamento de Investigaciones Administrativas). Sanciones: amonestación, suspensión, cesantía/exoneración.
          3. Licencias: Decreto N° 4118 (Enfermedad, maternidad, estudio, causas particulares).
          4. Procedimientos: Reglamento General de Escuelas (gestión diaria). Decreto N° 152/22 (Manual de Procedimientos actualizado).
          5. Otros: Ley 5348 (Procedimientos Administrativos), Res. 5130/11 (Ascensos Provisorios).

          Si el usuario adjunta un documento o imagen, analízalo para ayudarle con su consulta.
          Si el usuario pregunta por una resolución específica, intenta buscarla en la web si no tienes la información.
          Si el usuario pregunta por un formulario, busca el enlace directo en el sitio de EduSalta.
          Optimiza los procesos tediosos explicando paso a paso cómo realizar los trámites.
          Responde siempre en español.`,
          tools: [{ googleSearch: {} }],
        },
        history: chatMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
      });

      const response = await chat.sendMessage({ message: { parts } as any });
      setChatMessages([...newMessages, { role: 'model', text: response.text || 'Lo siento, no pude procesar tu solicitud.' }]);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setChatMessages([...newMessages, { role: 'model', text: 'Hubo un error al conectar con el asistente. Por favor, intenta de nuevo.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredResolutions = resolutions.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">EduSalta</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Asistente Docente</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="space-y-2 flex-1">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Resoluciones" 
          active={activeTab === 'resolutions'} 
          onClick={() => { setActiveTab('resolutions'); setIsSidebarOpen(false); }} 
        />
        <SidebarItem 
          icon={MessageSquare} 
          label="Asistente IA" 
          active={activeTab === 'assistant'} 
          onClick={() => { setActiveTab('assistant'); setIsSidebarOpen(false); }} 
        />
        <SidebarItem 
          icon={FileSearch} 
          label="Formularios" 
          active={activeTab === 'forms'} 
          onClick={() => { setActiveTab('forms'); setIsSidebarOpen(false); }} 
        />
      </nav>

      <div className="mt-auto pt-6 border-t border-zinc-100">
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Info size={14} />
            <span className="text-xs font-medium">Información Útil</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Esta herramienta optimiza la búsqueda de normativa oficial para docentes de Salta.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-zinc-900 font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white border-r border-zinc-200 flex flex-col p-6 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-zinc-200 flex-col p-6">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center gap-0 lg:gap-4 overflow-hidden">
              <h2 className="text-base lg:text-xl font-bold text-zinc-900 truncate">
                {activeTab === 'resolutions' && 'Normativa y Resoluciones'}
                {activeTab === 'assistant' && 'Asistente Inteligente'}
                {activeTab === 'forms' && 'Buscador de Formularios'}
              </h2>
              {activeTab === 'resolutions' && (
                <span className="hidden sm:inline-block bg-zinc-100 text-zinc-500 px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium w-fit">
                  {filteredResolutions.length} documentos
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {activeTab === 'resolutions' && (
              <button 
                onClick={fetchResolutions}
                disabled={loading}
                className="p-2.5 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50"
                title="Actualizar resoluciones"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
            {(activeTab === 'resolutions' || activeTab === 'forms') && (
              <div className="relative hidden sm:flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={activeTab === 'resolutions' ? "Buscar resolución..." : "Buscar formulario..."}
                    value={activeTab === 'resolutions' ? searchQuery : formSearchQuery}
                    onChange={(e) => activeTab === 'resolutions' ? setSearchQuery(e.target.value) : setFormSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && activeTab === 'resolutions' && handleAiResolutionSearch()}
                    className="pl-10 pr-4 py-2.5 bg-zinc-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm w-40 lg:w-64 transition-all outline-none"
                  />
                </div>
                {activeTab === 'resolutions' && (
                  <button 
                    onClick={handleAiResolutionSearch}
                    disabled={isAiSearching || !searchQuery.trim()}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                  >
                    {isAiSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Búsqueda IA</span>
                  </button>
                )}
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0">
              <Info size={20} />
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        {(activeTab === 'resolutions' || activeTab === 'forms') && (
          <div className="sm:hidden px-4 py-3 bg-white border-b border-zinc-100 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder={activeTab === 'resolutions' ? "Buscar resolución..." : "Buscar formulario..."}
                value={activeTab === 'resolutions' ? searchQuery : formSearchQuery}
                onChange={(e) => activeTab === 'resolutions' ? setSearchQuery(e.target.value) : setFormSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && activeTab === 'resolutions' && handleAiResolutionSearch()}
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 border-transparent rounded-xl text-sm outline-none"
              />
            </div>
            {activeTab === 'resolutions' && (
              <button 
                onClick={handleAiResolutionSearch}
                disabled={isAiSearching || !searchQuery.trim()}
                className="bg-emerald-600 text-white p-2 rounded-xl disabled:opacity-50 shadow-lg shadow-emerald-600/10"
              >
                {isAiSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'resolutions' && (
              <motion.div 
                key="resolutions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"
              >
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 animate-pulse">
                      <div className="h-4 w-20 bg-zinc-100 rounded-full mb-4" />
                      <div className="h-6 w-full bg-zinc-100 rounded-lg mb-2" />
                      <div className="h-6 w-2/3 bg-zinc-100 rounded-lg mb-4" />
                      <div className="flex gap-2">
                        <div className="h-10 flex-1 bg-zinc-100 rounded-xl" />
                        <div className="h-10 w-11 bg-zinc-100 rounded-xl" />
                      </div>
                    </div>
                  ))
                ) : filteredResolutions.length > 0 ? (
                  filteredResolutions.map(res => (
                    <div key={res.id}>
                      <ResolutionCard resolution={res} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-400">
                    <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 mb-6">
                      <Search size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">No se encontraron resoluciones</h3>
                    <p className="text-sm mb-8 text-center max-w-xs text-zinc-500">
                      El portal oficial de EduSalta podría estar en mantenimiento. Prueba con nuestra búsqueda inteligente.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={handleAiResolutionSearch}
                        disabled={isAiSearching || !searchQuery.trim()}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isAiSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        {searchQuery ? `Buscar "${searchQuery}" con IA` : 'Búsqueda Inteligente'}
                      </button>
                      <button 
                        onClick={fetchResolutions}
                        className="bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Reintentar carga oficial
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'assistant' && (
              <motion.div 
                key="assistant"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col max-w-4xl mx-auto bg-white border border-zinc-200 rounded-2xl lg:rounded-3xl shadow-xl shadow-zinc-200/50 overflow-hidden"
              >
                {/* Chat Header */}
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-zinc-100 flex items-center gap-3 bg-emerald-50/30">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Asistente EduSalta</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">En línea</span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="relative group max-w-[90%] lg:max-w-[80%]">
                        <div className={`rounded-2xl p-3 lg:p-4 text-sm leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-zinc-900 text-white rounded-tr-none' 
                            : 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200'
                        }`}>
                          {msg.text}
                        </div>
                        {msg.role === 'model' && (
                          <button 
                            onClick={() => copyToClipboard(msg.text, i)}
                            className={`absolute -right-8 lg:-right-10 top-0 p-2 transition-all duration-200 ${
                              copiedIndex === i 
                                ? 'opacity-100 text-emerald-500' 
                                : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-zinc-400 hover:text-emerald-600'
                            }`}
                            title="Copiar texto"
                          >
                            {copiedIndex === i ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-100 border border-zinc-200 rounded-2xl rounded-tl-none p-3 lg:p-4 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 lg:p-4 border-t border-zinc-100 bg-zinc-50/50">
                  {selectedFile && (
                    <div className="mb-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                      <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white">
                        {selectedFile.mimeType.startsWith('image/') ? <File size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-emerald-900 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-emerald-600 uppercase font-bold">{selectedFile.mimeType.split('/')[1]}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedFile(null)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className="relative flex items-center gap-2">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,application/pdf"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 lg:w-12 lg:h-12 bg-white border border-zinc-200 text-zinc-500 rounded-xl lg:rounded-2xl flex items-center justify-center hover:bg-zinc-50 transition-all shrink-0"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input 
                      type="text" 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Pregunta algo..." 
                      className="flex-1 bg-white border border-zinc-200 rounded-xl lg:rounded-2xl px-4 lg:px-5 py-2.5 lg:py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={(!userInput.trim() && !selectedFile) || isTyping}
                      className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-600/20 shrink-0"
                    >
                      {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  <p className="text-[9px] lg:text-[10px] text-center text-zinc-400 mt-2 lg:mt-3">
                    Puedes adjuntar imágenes o PDFs para que el asistente los analice.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'forms' && (
              <motion.div 
                key="forms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-white border border-zinc-200 rounded-2xl lg:rounded-3xl p-5 lg:p-8 mb-6 lg:mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                        <FileSearch size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg lg:text-xl font-bold">Buscador de Formularios</h3>
                        <p className="text-zinc-500 text-xs lg:text-sm">Encuentra rápidamente los documentos que necesitas.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Buscar formulario..."
                          value={formSearchQuery}
                          onChange={(e) => setFormSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAiFormSearch()}
                          className="w-full pl-9 pr-4 py-2.5 bg-zinc-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm outline-none transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleAiFormSearch}
                        disabled={isAiFormSearching || !formSearchQuery.trim()}
                        className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                      >
                        {isAiFormSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        <span className="hidden sm:inline">Buscar con IA</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {forms.filter(f => f.title.toLowerCase().includes(formSearchQuery.toLowerCase()) || f.desc.toLowerCase().includes(formSearchQuery.toLowerCase()))
                    .map((form, i) => (
                      <div 
                        key={i} 
                        className="p-4 border border-zinc-100 rounded-xl lg:rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm lg:text-base text-zinc-900 group-hover:text-emerald-700 transition-colors">{form.title}</h4>
                          <div className="flex gap-2">
                            {form.url && form.url !== '#' ? (
                              <a 
                                href={form.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                title="Descargar formulario"
                              >
                                <Download size={16} />
                              </a>
                            ) : (
                              <button 
                                onClick={() => {
                                  setFormSearchQuery(form.title);
                                  handleAiFormSearch();
                                }}
                                className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors"
                                title="Buscar enlace con IA"
                              >
                                <Search size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] lg:text-xs text-zinc-500 leading-relaxed mb-3">{form.desc}</p>
                        
                        {(!form.url || form.url === '#') && (
                          <div className="flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md w-fit">
                            <Info size={12} />
                            <span>Enlace no disponible - Usa el buscador IA</span>
                          </div>
                        )}
                        
                        {form.url && form.url !== '#' && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Documento listo para descargar</span>
                            <ChevronRight size={12} />
                          </div>
                        )}
                      </div>
                    ))}
                    {formSearchQuery && forms.filter(f => f.title.toLowerCase().includes(formSearchQuery.toLowerCase()) || f.desc.toLowerCase().includes(formSearchQuery.toLowerCase())).length === 0 && (
                      <div className="col-span-full py-10 text-center text-zinc-400">
                        <p className="text-sm">No se encontraron formularios locales. Prueba con la búsqueda IA.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-white flex flex-col md:flex-row items-center gap-6 lg:gap-8 shadow-xl shadow-emerald-600/20">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl lg:text-2xl font-bold mb-2">¿No encuentras el formulario?</h3>
                    <p className="text-emerald-50 text-xs lg:text-sm opacity-90 leading-relaxed">
                      Pregúntale a nuestro asistente inteligente. Puede buscar en tiempo real en el portal de EduSalta.
                    </p>
                    <button 
                      onClick={() => setActiveTab('assistant')}
                      className="mt-4 lg:mt-6 bg-white text-emerald-700 px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm hover:bg-emerald-50 transition-colors"
                    >
                      Consultar al Asistente
                    </button>
                  </div>
                  <div className="hidden md:flex w-32 h-32 lg:w-48 lg:h-48 bg-white/10 rounded-full items-center justify-center backdrop-blur-sm">
                    <MessageSquare size={48} lg:size={64} className="text-white opacity-50" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
