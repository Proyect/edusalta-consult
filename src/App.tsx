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
  Check,
  CheckCircle,
  Star,
  Moon,
  Sun,
  Bell,
  ArrowRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Resolution, Message, Form } from './types';
import { GoogleGenAI } from "@google/genai";

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-100 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100'
    }`}
  >
    <Icon size={20} className={active ? 'text-emerald-600' : 'text-zinc-400'} />
    <span className="text-sm">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
  </button>
);

function ResolutionCard({ resolution, onToggleFavorite }: { resolution: Resolution, onToggleFavorite: (id: string) => void }) {
  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <FileText size={12} />
          Resolución
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onToggleFavorite(resolution.id)}
            className={`p-1.5 rounded-lg transition-colors ${resolution.isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <Star size={16} fill={resolution.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <span className="text-[11px] font-mono text-zinc-400">{resolution.date}</span>
        </div>
      </div>
      <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold text-base mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
        {resolution.title}
      </h3>
      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
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
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white'
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
              ? 'border-zinc-100 dark:border-zinc-800 text-zinc-200 cursor-not-allowed' 
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          }`}
          onClick={(e) => resolution.pdfUrl === '#' && e.preventDefault()}
        >
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
}

function FormCard({ form, onToggleFavorite, onOptimize }: { form: Form, onToggleFavorite?: (title: string) => void, onOptimize?: (title: string) => void }) {
  const isOfficial = form.url.includes('gov.ar') || form.url.includes('edu.ar');
  
  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2">
          {form.verified ? (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle size={12} />
              Verificado
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              <Info size={12} />
              Pendiente
            </div>
          )}
          {isOfficial && (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              Oficial
            </div>
          )}
          {form.category && (
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              {form.category}
            </div>
          )}
        </div>
        {onToggleFavorite && (
          <button 
            onClick={() => onToggleFavorite(form.title)}
            className={`p-1.5 rounded-lg transition-colors ${form.isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            <Star size={16} fill={form.isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
        {form.title}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 line-clamp-2 leading-relaxed">
        {form.desc}
      </p>

      <div className="flex gap-2">
        <a 
          href={form.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            form.url === '#' 
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white'
          }`}
          onClick={(e) => form.url === '#' && e.preventDefault()}
        >
          <Download size={18} />
          {form.url === '#' ? 'No disponible' : 'Descargar'}
        </a>
        {onOptimize && (
          <button 
            onClick={() => onOptimize(form.title)}
            className="w-11 h-11 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Optimizar con IA"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resolutions' | 'assistant' | 'forms'>('dashboard');
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const [favorites, setFavorites] = useState<{ resolutions: string[], forms: string[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : { resolutions: [], forms: [] };
    }
    return { resolutions: [], forms: [] };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    // Update local state to reflect favorites
    setResolutions(prev => prev.map(r => ({ ...r, isFavorite: favorites.resolutions.includes(r.id) })));
    setForms(prev => prev.map(f => ({ ...f, isFavorite: favorites.forms.includes(f.title) })));
  }, [favorites]);

  useEffect(() => {
    fetchResolutions();
    initializeForms();
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleFavoriteResolution = (id: string) => {
    setFavorites(prev => {
      const isFav = prev.resolutions.includes(id);
      return {
        ...prev,
        resolutions: isFav ? prev.resolutions.filter(rid => rid !== id) : [...prev.resolutions, id]
      };
    });
  };

  const toggleFavoriteForm = (title: string) => {
    setFavorites(prev => {
      const isFav = prev.forms.includes(title);
      return {
        ...prev,
        forms: isFav ? prev.forms.filter(t => t !== title) : [...prev.forms, title]
      };
    });
  };

  const initializeForms = () => {
    const initialForms: Form[] = [
      { 
        title: 'Declaración Jurada de Cargos', 
        desc: 'Formulario oficial para informar situación de revista (DGES/INFD). Requerido para altas y movimientos.', 
        url: 'https://dges-sal.infd.edu.ar/sitio/upload/form_declarac_jurada_REV_3.pdf',
        verified: true,
        category: 'Trámites'
      },
      { 
        title: 'Solicitud de Licencia (Art. 4118)', 
        desc: 'Formulario único para licencias con y sin goce de haberes. Asegúrese de marcar el casillero correspondiente.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/2-solicitud-de-licencia?task=document.download',
        verified: true,
        category: 'Licencias'
      },
      { 
        title: 'Certificación de Servicios', 
        desc: 'Documento necesario para acreditar antigüedad, trámites jubilatorios y subsidios.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/3-certificacion-de-servicios?task=document.download',
        verified: true,
        category: 'Trámites'
      },
      { 
        title: 'Salario Familiar (Asignaciones)', 
        desc: 'Formulario para el cobro de asignaciones familiares (Hijo, Escolaridad, Matrimonio).', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/4-formulario-de-salario-familiar?task=document.download',
        verified: true,
        category: 'Salarios'
      },
      { 
        title: 'Seguro de Vida Obligatorio', 
        desc: 'Declaración de beneficiarios y alta en el seguro de vida provincial docente.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/5-alta-seguro-de-vida?task=document.download',
        verified: true,
        category: 'Seguros'
      },
      { 
        title: 'Solicitud de Traslado', 
        desc: 'Formulario oficial para solicitar el traslado definitivo o transitorio entre instituciones.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/7-solicitud-de-traslado?task=document.download',
        verified: true,
        category: 'Trámites'
      },
      { 
        title: 'Reclamo de Haberes', 
        desc: 'Para presentar ante la Dirección de Administración por errores en liquidación o falta de pago.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/8-reclamo-de-haberes?task=document.download',
        verified: true,
        category: 'Salarios'
      },
      { 
        title: 'Concepto Profesional Docente', 
        desc: 'Formulario de calificación anual. Debe ser completado por el directivo y el docente.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/10-concepto-profesional-docente?task=document.download',
        verified: true,
        category: 'Trámites'
      },
      { 
        title: 'Inscripción Interinatos y Suplencias', 
        desc: 'Formulario para la ficha de inscripción ante la Junta de Calificación de Méritos.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/junta-de-calificacion/file/11-inscripcion-interinatos-y-suplencias?task=document.download',
        verified: true,
        category: 'Junta'
      },
      { 
        title: 'Certificado de Residencia', 
        desc: 'Declaración jurada de domicilio para acreditar residencia ante Recursos Humanos.', 
        url: 'https://www.edusalta.gov.ar/index.php/docentes/formularios/file/12-certificado-de-residencia?task=document.download',
        verified: true,
        category: 'Trámites'
      }
    ].map(f => ({ ...f, isFavorite: favorites.forms.includes(f.title) }));
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
            pdfUrl: pdfUrl,
            isFavorite: favorites.resolutions.includes(`res-fallback-${index}`)
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
            pdfUrl: pdfUrl || '#',
            isFavorite: favorites.resolutions.includes(`res-${index}`)
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
        contents: `Actúa como un buscador experto de normativa docente de Salta, Argentina. 
        Tu objetivo es encontrar resoluciones ministeriales (Res. Min.), decretos o disposiciones específicas relacionadas con: "${searchQuery}".
        
        FUENTES DE BÚSQUEDA PRIORITARIAS:
        1. Boletín Oficial de Salta (boletinoficialsalta.gob.ar) - Es la fuente legal definitiva.
        2. EduSalta (edusalta.gov.ar) - Portal oficial de educación.
        3. Ministerio de Educación, Cultura, Ciencia y Tecnología de Salta.
        
        ESTRATEGIA DE BÚSQUEDA:
        - Si el usuario pone un número (ej. "5130/11"), busca exactamente ese número de resolución.
        - Si el usuario busca un tema (ej. "titularización secundaria"), busca las resoluciones más recientes (2023-2025).
        - Intenta encontrar el enlace directo al PDF o a la página del Boletín Oficial que contiene el texto.
        
        FORMATO DE SALIDA (JSON):
        Devuelve una lista de objetos JSON con el formato: 
        [{"title": "Res. Min. N° XXX/YY - Descripción clara", "downloadUrl": "URL_DIRECTA_AL_PDF_O_BOLETIN", "date": "DD/MM/AAAA"}]
        
        IMPORTANTE: Solo devuelve el JSON. Si no encuentras resultados exactos, intenta buscar términos relacionados en el Boletín Oficial de Salta.`,
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
        contents: `Busca el enlace DIRECTO de descarga (PDF o DOCX) para el formulario docente de EduSalta: "${formSearchQuery}". 
        IMPORTANTE: El enlace debe ser el archivo final, no la página de inicio. 
        Prioriza dominios .gov.ar o .edu.ar de Salta. 
        Devuelve una lista de objetos JSON con el formato: 
        [{"title": "Nombre del Formulario", "desc": "Breve descripción", "url": "URL_DE_DESCARGA_DIRECTA"}]
        Solo devuelve el JSON, nada más.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const aiResults = JSON.parse(response.text || "[]");
      
      if (aiResults.length > 0) {
        const verifiedResults = aiResults.map((f: any) => ({ ...f, verified: true }));
        setForms(prev => {
          // Merge results: keep existing if same title, but update URL if AI found a better one
          const updated = [...prev];
          verifiedResults.forEach((newForm: any) => {
            const index = updated.findIndex(f => f.title.toLowerCase() === newForm.title.toLowerCase());
            if (index >= 0) {
              updated[index] = { ...updated[index], ...newForm };
            } else {
              updated.unshift(newForm);
            }
          });
          return updated;
        });
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight dark:text-white">EduSalta</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Asistente Docente</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="space-y-2 flex-1">
        <SidebarItem 
          icon={LayoutDashboard} 
          label="Inicio" 
          active={activeTab === 'dashboard'} 
          onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
        />
        <SidebarItem 
          icon={FileText} 
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

      <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {theme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
            Modo {theme === 'light' ? 'Claro' : 'Oscuro'}
          </div>
          <button 
            onClick={toggleTheme}
            className="w-10 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full relative transition-colors"
          >
            <motion.div 
              animate={{ x: theme === 'light' ? 2 : 22 }}
              className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
        
        <div className="px-4 py-3 bg-emerald-600 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Novedades</span>
          </div>
          <p className="text-[10px] leading-relaxed opacity-90">
            Se actualizaron las resoluciones de titularización 2024.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen bg-[#F8F9FA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden relative ${theme}`}>
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
      <aside className="hidden lg:flex w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col p-6">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col lg:flex-row lg:items-center gap-0 lg:gap-4 overflow-hidden">
              <h2 className="text-base lg:text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {activeTab === 'dashboard' && 'Panel de Control'}
                {activeTab === 'resolutions' && 'Normativa y Resoluciones'}
                {activeTab === 'assistant' && 'Asistente Inteligente'}
                {activeTab === 'forms' && 'Buscador de Formularios'}
              </h2>
              {activeTab === 'resolutions' && (
                <span className="hidden sm:inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-medium w-fit">
                  {filteredResolutions.length} documentos
                </span>
              )}
            </div>
          </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {activeTab === 'resolutions' && (
                <div className="hidden md:flex items-center gap-2 mr-4">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Accesos rápidos:</span>
                  {['Titularización', 'Traslados', 'Licencias', 'Seguro de Vida', 'Salario Familiar'].map(topic => (
                    <button
                      key={topic}
                      onClick={() => { setSearchQuery(topic); handleAiResolutionSearch(); }}
                      className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-[10px] font-medium transition-colors dark:text-zinc-400"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
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
                    className="pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm w-40 lg:w-64 transition-all outline-none dark:text-zinc-100"
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
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer shrink-0">
              <Info size={20} />
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        {(activeTab === 'resolutions' || activeTab === 'forms') && (
          <div className="sm:hidden px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder={activeTab === 'resolutions' ? "Buscar resolución..." : "Buscar formulario..."}
                value={activeTab === 'resolutions' ? searchQuery : formSearchQuery}
                onChange={(e) => activeTab === 'resolutions' ? setSearchQuery(e.target.value) : setFormSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && activeTab === 'resolutions' && handleAiResolutionSearch()}
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-transparent rounded-xl text-sm outline-none dark:text-zinc-100"
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
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Welcome Card */}
                <div className="relative overflow-hidden bg-emerald-600 rounded-3xl p-8 lg:p-12 text-white shadow-2xl shadow-emerald-600/20">
                  <div className="relative z-10 max-w-2xl">
                    <h3 className="text-3xl lg:text-4xl font-bold mb-4">¡Bienvenido, Docente!</h3>
                    <p className="text-emerald-50 text-lg mb-8 opacity-90">
                      Gestiona tus trámites, busca normativa oficial y descarga formularios de manera rápida y sencilla.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => setActiveTab('assistant')}
                        className="bg-white text-emerald-600 px-6 py-3 rounded-2xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-2"
                      >
                        <MessageSquare size={20} />
                        Consultar IA
                      </button>
                      <button 
                        onClick={() => setActiveTab('forms')}
                        className="bg-emerald-500/30 backdrop-blur-md border border-emerald-400/30 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-500/40 transition-all flex items-center gap-2"
                      >
                        <FileSearch size={20} />
                        Ver Formularios
                      </button>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                      <FileText size={24} />
                    </div>
                    <h4 className="text-2xl font-bold dark:text-white">{resolutions.length}</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Resoluciones disponibles</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                      <Star size={24} />
                    </div>
                    <h4 className="text-2xl font-bold dark:text-white">{favorites.resolutions.length + favorites.forms.length}</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Elementos favoritos</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                      <CheckCircle size={24} />
                    </div>
                    <h4 className="text-2xl font-bold dark:text-white">{forms.filter(f => f.verified).length}</h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Formularios verificados</p>
                  </div>
                </div>

                {/* Favorites Section */}
                {(favorites.resolutions.length > 0 || favorites.forms.length > 0) && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Star className="text-amber-500" fill="currentColor" size={20} />
                        Tus Favoritos
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {resolutions.filter(r => r.isFavorite).map(res => (
                        <div key={res.id}>
                          <ResolutionCard resolution={res} onToggleFavorite={toggleFavoriteResolution} />
                        </div>
                      ))}
                      {forms.filter(f => f.isFavorite).map(form => (
                        <div key={form.title}>
                          <FormCard form={form} onToggleFavorite={toggleFavoriteForm} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-6">
                  <h4 className="text-xl font-bold dark:text-white">Accesos Directos</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Licencias', icon: BookOpen, color: 'bg-purple-50 text-purple-600', tab: 'resolutions', query: 'Licencias' },
                      { label: 'Titularización', icon: CheckCircle, color: 'bg-blue-50 text-blue-600', tab: 'resolutions', query: 'Titularización' },
                      { label: 'Salarios', icon: FileText, color: 'bg-emerald-50 text-emerald-600', tab: 'forms', query: 'Salario' },
                      { label: 'Traslados', icon: ArrowRight, color: 'bg-amber-50 text-amber-600', tab: 'resolutions', query: 'Traslado' },
                    ].map((action, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setActiveTab(action.tab as any);
                          if (action.tab === 'resolutions') {
                            setSearchQuery(action.query);
                            handleAiResolutionSearch();
                          } else {
                            setFormSearchQuery(action.query);
                          }
                        }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-emerald-500 transition-all text-left group"
                      >
                        <div className={`w-12 h-12 ${action.color} dark:bg-opacity-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <action.icon size={24} />
                        </div>
                        <span className="font-bold dark:text-white">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

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
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 animate-pulse">
                      <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4" />
                      <div className="h-6 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-2" />
                      <div className="h-6 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-4" />
                      <div className="flex gap-2">
                        <div className="h-10 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                        <div className="h-10 w-11 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                      </div>
                    </div>
                  ))
                ) : filteredResolutions.length > 0 ? (
                  filteredResolutions.map(res => (
                    <div key={res.id}>
                      <ResolutionCard resolution={res} onToggleFavorite={toggleFavoriteResolution} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-400">
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mb-6">
                      <Search size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">No se encontraron resoluciones</h3>
                    <p className="text-sm mb-8 text-center max-w-xs text-zinc-500 dark:text-zinc-400">
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
                        className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
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
                className="h-full flex flex-col max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl lg:rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden"
              >
                {/* Chat Header */}
                <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-emerald-50/30 dark:bg-emerald-900/10">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm dark:text-white">Asistente EduSalta</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">En línea</span>
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
                            ? 'bg-zinc-900 dark:bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200 dark:border-zinc-700'
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
                      <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-tl-none p-3 lg:p-4 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 lg:p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  {selectedFile && (
                    <div className="mb-3 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-2 rounded-xl">
                      <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white">
                        {selectedFile.mimeType.startsWith('image/') ? <File size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">{selectedFile.mimeType.split('/')[1]}</p>
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
                      className="w-10 h-10 lg:w-12 lg:h-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-xl lg:rounded-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shrink-0"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input 
                      type="text" 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Pregunta algo..." 
                      className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl lg:rounded-2xl px-4 lg:px-5 py-2.5 lg:py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all dark:text-white"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={(!userInput.trim() && !selectedFile) || isTyping}
                      className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-600 text-white rounded-xl lg:rounded-2xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-600/20 shrink-0"
                    >
                      {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  <p className="text-[9px] lg:text-[10px] text-center text-zinc-400 dark:text-zinc-500 mt-2 lg:mt-3">
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
                className="space-y-8"
              >
                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    {['Todos', 'Licencias', 'Trámites', 'Salarios', 'Seguros', 'Junta'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFormSearchQuery(cat === 'Todos' ? '' : cat)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          (cat === 'Todos' && !formSearchQuery) || formSearchQuery === cat
                            ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {forms
                    .filter(f => 
                      f.title.toLowerCase().includes(formSearchQuery.toLowerCase()) || 
                      f.category?.toLowerCase().includes(formSearchQuery.toLowerCase()) ||
                      f.desc.toLowerCase().includes(formSearchQuery.toLowerCase())
                    )
                    .map((form) => (
                      <div key={form.title}>
                        <FormCard 
                          form={form} 
                          onToggleFavorite={toggleFavoriteForm}
                          onOptimize={(title) => {
                            setFormSearchQuery(title);
                            handleAiFormSearch();
                          }}
                        />
                      </div>
                    ))}
                </div>

                {forms.filter(f => 
                  f.title.toLowerCase().includes(formSearchQuery.toLowerCase()) || 
                  f.category?.toLowerCase().includes(formSearchQuery.toLowerCase()) ||
                  f.desc.toLowerCase().includes(formSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-400">
                      <FileSearch size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">No se encontraron formularios</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                      Prueba con otros términos o usa la Búsqueda IA para encontrar el documento oficial.
                    </p>
                  </div>
                )}

                <div className="bg-emerald-600 rounded-3xl p-8 lg:p-12 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-emerald-600/20 overflow-hidden relative">
                  <div className="relative z-10 flex-1 text-center md:text-left">
                    <h3 className="text-2xl lg:text-3xl font-bold mb-4">¿No encuentras el formulario?</h3>
                    <p className="text-emerald-50 text-base lg:text-lg opacity-90 leading-relaxed mb-8">
                      Nuestro asistente inteligente puede buscar en tiempo real en los portales oficiales de Salta para encontrar el enlace directo y actualizado.
                    </p>
                    <button 
                      onClick={() => setActiveTab('assistant')}
                      className="bg-white text-emerald-700 px-8 py-3.5 rounded-2xl font-bold text-sm lg:text-base hover:bg-emerald-50 transition-all shadow-lg"
                    >
                      Consultar al Asistente
                    </button>
                  </div>
                  <div className="relative z-10 hidden md:flex w-48 h-48 bg-white/10 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
                    <MessageSquare size={64} className="text-white opacity-50" />
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                </div>

                {isAiFormSearching && (
                  <div className="fixed bottom-8 right-8 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Verificando enlaces...</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Búsqueda Inteligente Activa</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
