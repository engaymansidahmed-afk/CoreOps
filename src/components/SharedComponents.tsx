/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Check, AlertTriangle, Clock, MapPin, Upload, Camera, Trash2, Edit3, X, Sparkles } from 'lucide-react';
import { useAppTheme } from './ThemeContext';

// --- Badge Component ---
interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  let text = status;
  let classes = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

  switch (status) {
    // Project & Task Statuses
    case 'active':
    case 'in_progress':
    case 'assigned':
      text = status === 'active' ? 'نشط' : (status === 'assigned' ? 'تم الإسناد' : 'جاري التنفيذ');
      classes = 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30';
      break;
    case 'completed':
    case 'done':
    case 'approved':
    case 'cleared':
      text = status === 'completed' ? 'مكتمل' : (status === 'done' ? 'تم الإنجاز' : (status === 'approved' ? 'مقبول' : 'تم التصفية'));
      classes = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30';
      break;
    case 'paused':
    case 'pending':
    case 'pending_admin':
    case 'pending_accountant':
      text = status === 'paused' ? 'متوقف مؤقتاً' : (status === 'pending' ? 'انتظار' : (status === 'pending_admin' ? 'انتظار موافقة الإدارة' : 'انتظار اعتماد المحاسب'));
      classes = 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30';
      break;
    case 'rejected':
    case 'damaged':
      text = status === 'rejected' ? 'مرفوض' : 'تالف / مفقود';
      classes = 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30';
      break;
    // Sales leads
    case 'new_lead':
      text = 'عميل محتمل جديد';
      classes = 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200 dark:border-violet-900/30 animate-pulse';
      break;
    case 'inspection':
      text = 'جاري المعاينة الفنية';
      classes = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/30';
      break;
    case 'quotation':
      text = 'تم تقديم عرض السعر';
      classes = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/30';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}>
      {text}
    </span>
  );
};

export const PriorityBadge: React.FC<BadgeProps> = ({ status }) => {
  let text = 'منخفضة';
  let classes = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

  if (status === 'high') {
    text = 'عالية جداً';
    classes = 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/30';
  } else if (status === 'medium') {
    text = 'متوسطة';
    classes = 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}>
      {text}
    </span>
  );
};

// --- Custom Toast Component ---
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
};

export const ToastContainer: React.FC<{ toasts: Toast[]; onClose: (id: string) => void }> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let bgClass = 'bg-emerald-600 text-white';
        let icon = <Check className="w-5 h-5" />;
        
        if (toast.type === 'error') {
          bgClass = 'bg-rose-600 text-white';
          icon = <AlertTriangle className="w-5 h-5" />;
        } else if (toast.type === 'info') {
          bgClass = 'bg-slate-800 text-white border border-slate-700';
          icon = <Clock className="w-5 h-5 text-amber-400" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-xl transition-all transform translate-y-0 opacity-100 ${bgClass}`}
            id={`toast-${toast.id}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <p className="text-xs md:text-sm font-medium leading-relaxed font-sans text-right" style={{ direction: 'rtl' }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// --- Digital Signature Pad ---
interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  savedSignature?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, savedSignature }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const { primaryBg } = useAppTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e293b'; // dark gray
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        if (onClear) onClear();
      }
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Edit3 className="w-4 h-4 text-blue-500" />
          <span>توقيع العميل الإلكتروني المستهدف</span>
        </label>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>مسح التوقيع</span>
        </button>
      </div>

      {savedSignature ? (
        <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center min-h-[140px] relative">
          <img src={savedSignature} alt="Customer Signature" className="max-h-[100px] object-contain" referrerPolicy="no-referrer" />
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">✓ تم حفظ التوقيع بنجاح</span>
          <button
            type="button"
            onClick={clearCanvas}
            className="absolute top-2 right-2 p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 hover:text-rose-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[140px]">
          <canvas
            ref={canvasRef}
            width={400}
            height={140}
            className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 dark:opacity-10">
            <span className="text-xs text-slate-400 font-sans">وقع بإصبعك أو الماوس هنا</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Mock GPS & Map Component ---
interface GPSMapProps {
  pins: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'project' | 'lead';
    serviceType?: string;
  }>;
  onPinSelect?: (id: string, type: 'project' | 'lead') => void;
  activeId?: string;
  userLat?: number;
  userLng?: number;
}

export const GPSMap: React.FC<GPSMapProps> = ({ pins, onPinSelect, activeId, userLat = 24.7136, userLng = 46.6753 }) => {
  const { primaryBg, themeColor } = useAppTheme();
  const [selectedPin, setSelectedPin] = useState<any>(null);

  useEffect(() => {
    if (activeId) {
      const pin = pins.find(p => p.id === activeId);
      if (pin) setSelectedPin(pin);
    }
  }, [activeId, pins]);

  return (
    <div className="bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden shadow-inner relative flex flex-col h-[380px]">
      {/* Map Header Controls */}
      <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 pointer-events-auto">
          <MapPin className="w-4.5 h-4.5 text-rose-500 animate-bounce" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">رادار المواقع الجغرافية (الرياض)</span>
        </div>
        
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 pointer-events-auto font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span> مشاريع
          <span className="inline-block w-2 h-2 rounded-full bg-violet-500"></span> عملاء محتملون
          <span className="inline-block w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span> فني ميداني
        </div>
      </div>

      {/* Grid Canvas representation of Riyadh */}
      <div className="relative flex-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 flex items-center justify-center p-4">
        {/* Abstract Riyadh Road Map vector simulation */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-4 bg-slate-400 dark:bg-slate-600 transform -translate-y-1/2"></div>
          <div className="absolute top-0 bottom-0 left-1/3 w-4 bg-slate-400 dark:bg-slate-600"></div>
          <div className="absolute top-0 bottom-0 left-2/3 w-3 bg-slate-400 dark:bg-slate-600 transform rotate-12"></div>
          <div className="absolute top-1/4 bottom-0 left-0 right-0 h-3 bg-slate-400 dark:bg-slate-600 transform rotate-6"></div>
          
          {/* Radial Ring Roads */}
          <div className="absolute top-1/2 left-1/2 w-48 h-48 border-4 border-slate-400 dark:border-slate-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 border-2 border-slate-300 dark:border-slate-700 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* User simulated position */}
        <div 
          className="absolute z-20 cursor-help"
          style={{ top: '60%', left: '45%' }}
          title="موقعك الميداني الفعلي (Simulated GPS)"
        >
          <span className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500/40 rounded-full animate-ping"></span>
          <div className="w-3.5 h-3.5 bg-rose-600 rounded-full border-2 border-white shadow-lg relative">
            <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-[9px] text-white px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">موقع الفني</span>
          </div>
        </div>

        {/* Map Pins */}
        {pins.map((pin, i) => {
          // Spread pins across map dynamically so it looks beautiful
          const xPos = 20 + (pin.lng * 12345 % 60);
          const yPos = 15 + (pin.lat * 12345 % 70);
          const isSelected = selectedPin?.id === pin.id;
          const isProject = pin.type === 'project';
          
          let pinColor = isProject ? 'bg-blue-600 border-blue-200' : 'bg-violet-600 border-violet-200';
          if (isSelected) {
            pinColor = isProject ? 'bg-amber-500 border-amber-300 scale-125 ring-4 ring-amber-400/20' : 'bg-emerald-500 border-emerald-300 scale-125 ring-4 ring-emerald-400/20';
          }

          return (
            <button
              key={pin.id}
              onClick={() => {
                setSelectedPin(pin);
                if (onPinSelect) onPinSelect(pin.id, pin.type);
              }}
              style={{ top: `${yPos}%`, left: `${xPos}%` }}
              className={`absolute z-10 p-1.5 rounded-full border-2 shadow-lg transition-all duration-300 cursor-pointer ${pinColor}`}
              title={pin.name}
            >
              <MapPin className="w-4 h-4 text-white" />
            </button>
          );
        })}

        {/* Selected Pin Details Overlay Card */}
        {selectedPin && (
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg flex items-center justify-between gap-4 z-20 animate-fade-in">
            <div className="flex gap-2.5 items-start text-right" style={{ direction: 'rtl' }}>
              <div className={`p-2 rounded-lg ${selectedPin.type === 'project' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600'} shrink-0`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedPin.name}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <span>الإحداثيات: {selectedPin.lat.toFixed(4)}, {selectedPin.lng.toFixed(4)}</span>
                  <span>•</span>
                  <span>النوع: {selectedPin.type === 'project' ? 'مشروع جاري' : 'عميل محتمل'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${selectedPin.lat},${selectedPin.lng}`;
                  window.open(url, '_blank');
                }}
                className={`text-[10px] font-bold text-white px-2.5 py-1.5 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer ${primaryBg}`}
              >
                <span>خرائط Google</span>
              </button>
              <button
                onClick={() => setSelectedPin(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Click/Drag File Upload Simulator ---
interface FileUploadProps {
  onUpload: (base64OrUrl: string) => void;
  label?: string;
  accept?: string;
  previewImage?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, label = 'تحميل الفاتورة أو المستند', accept = 'image/*', previewImage }) => {
  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState<string | null>(previewImage || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mockContractingImages = [
    'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop', // invoice
    'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?q=80&w=400&auto=format&fit=crop', // maintenance 1
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop', // maintenance 2
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400&auto=format&fit=crop'  // construction
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultStr = event.target.result as string;
        setImage(resultStr);
        onUpload(resultStr);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateInvoice = () => {
    // Select a random sample invoice or work image
    const randomImg = mockContractingImages[Math.floor(Math.random() * mockContractingImages.length)];
    setImage(randomImg);
    onUpload(randomImg);
  };

  const handleRemove = () => {
    setImage(null);
    onUpload('');
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-right">{label}</label>
      
      {image ? (
        <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 p-3 flex items-center gap-3">
          <img 
            src={image} 
            alt="Uploaded Doc" 
            className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 text-right min-w-0" style={{ direction: 'rtl' }}>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">doc_uploaded_coreops.jpg</p>
            <p className="text-[10px] text-slate-400 font-mono">حجم الملف: 420 KB • تم الحفظ</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
            title="حذف المستند"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleChange}
          />
          
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full text-slate-500 dark:text-slate-400 mb-2">
            <Upload className="w-5 h-5" />
          </div>
          
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            اسحب وأفلت المستند هنا، أو تصفح الملفات
          </p>
          <p className="text-[10px] text-slate-400">
            يدعم صور الفواتير، التقارير الميدانية بصيغة PNG أو JPG أو PDF
          </p>

          {/* Quick Mock Simulation Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSimulateInvoice();
            }}
            className="mt-3 flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1 rounded-lg text-[10px] font-bold transition-all shadow cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>محاكاة التقاط الكاميرا / الفاتورة</span>
          </button>
        </div>
      )}
    </div>
  );
};
