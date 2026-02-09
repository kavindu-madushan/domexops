import React, { useState, useEffect } from 'react';
import { Calculator, StickyNote, X, Minimize2, Plus, Minus, Divide, X as Multiply, Equal } from 'lucide-react';
import { toast } from '../services/toast';

export const ToolsOverlay: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'calc' | 'notes' | null>(null);

  return (
    <>
      {/* Floating Action Button Group */}
      <div className="fixed bottom-6 right-20 z-40 flex flex-col gap-3">
         <button 
           onClick={() => setActiveTool(activeTool === 'notes' ? null : 'notes')}
           className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 ${activeTool === 'notes' ? 'bg-yellow-400 text-yellow-900 rotate-12' : 'bg-white text-slate-600 hover:text-yellow-600'}`}
           title="Sticky Notes"
         >
           <StickyNote size={24} />
         </button>
         <button 
           onClick={() => setActiveTool(activeTool === 'calc' ? null : 'calc')}
           className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 ${activeTool === 'calc' ? 'bg-indigo-600 text-white rotate-12' : 'bg-white text-slate-600 hover:text-indigo-600'}`}
           title="Calculator"
         >
           <Calculator size={24} />
         </button>
      </div>

      {/* Tool Windows */}
      {activeTool === 'calc' && <CalculatorWindow onClose={() => setActiveTool(null)} />}
      {activeTool === 'notes' && <NotesWindow onClose={() => setActiveTool(null)} />}
    </>
  );
};

const CalculatorWindow = ({ onClose }: { onClose: () => void }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');

  const handleNum = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOp = (op: string) => {
    setExpression(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      // Basic eval replacement for safety
      const safeExp = (expression + display).replace(/[^0-9+\-*/.]/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(safeExp); 
      setDisplay(String(result));
      setExpression('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const btnClass = "h-12 rounded-lg font-bold text-lg transition-colors active:scale-95 flex items-center justify-center";
  const numClass = `${btnClass} bg-slate-100 hover:bg-slate-200 text-slate-700`;
  const opClass = `${btnClass} bg-indigo-50 hover:bg-indigo-100 text-indigo-600`;

  return (
    <div className="fixed bottom-24 right-20 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="bg-slate-900 p-3 flex justify-between items-center">
         <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <Calculator size={14} /> Quick Calc
         </span>
         <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
      </div>
      <div className="p-4 bg-slate-50 border-b border-slate-200 text-right">
         <div className="text-xs text-slate-400 h-4">{expression}</div>
         <div className="text-3xl font-mono font-bold text-slate-800 truncate">{display}</div>
      </div>
      <div className="p-3 grid grid-cols-4 gap-2">
         <button onClick={handleClear} className={`${btnClass} col-span-3 bg-rose-50 text-rose-600 hover:bg-rose-100`}>AC</button>
         <button onClick={() => handleOp('/')} className={opClass}><Divide size={18} /></button>
         
         {[7,8,9].map(n => <button key={n} onClick={() => handleNum(String(n))} className={numClass}>{n}</button>)}
         <button onClick={() => handleOp('*')} className={opClass}><Multiply size={18} /></button>

         {[4,5,6].map(n => <button key={n} onClick={() => handleNum(String(n))} className={numClass}>{n}</button>)}
         <button onClick={() => handleOp('-')} className={opClass}><Minus size={18} /></button>

         {[1,2,3].map(n => <button key={n} onClick={() => handleNum(String(n))} className={numClass}>{n}</button>)}
         <button onClick={() => handleOp('+')} className={opClass}><Plus size={18} /></button>

         <button onClick={() => handleNum('0')} className={`${numClass} col-span-2`}>0</button>
         <button onClick={() => handleNum('.')} className={numClass}>.</button>
         <button onClick={handleEqual} className={`${btnClass} bg-indigo-600 text-white hover:bg-indigo-700`}><Equal size={18} /></button>
      </div>
    </div>
  );
};

const NotesWindow = ({ onClose }: { onClose: () => void }) => {
  const [note, setNote] = useState(() => localStorage.getItem('logipro_sticky_note') || '');

  useEffect(() => {
    localStorage.setItem('logipro_sticky_note', note);
  }, [note]);

  return (
    <div className="fixed bottom-24 right-20 z-50 w-64 h-64 bg-yellow-100 rounded-2xl shadow-2xl border border-yellow-200/50 flex flex-col animate-in zoom-in-95 duration-200 transform rotate-1">
      <div className="bg-yellow-200/50 p-3 flex justify-between items-center rounded-t-2xl cursor-move">
         <span className="text-yellow-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <StickyNote size={14} /> Scratchpad
         </span>
         <button onClick={onClose} className="text-yellow-700/50 hover:text-yellow-800"><Minimize2 size={16} /></button>
      </div>
      <textarea 
        className="flex-1 bg-transparent p-4 text-slate-700 text-sm font-medium resize-none focus:outline-none placeholder-yellow-800/30"
        placeholder="Type quick notes here... (Auto-saved)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="p-2 text-[10px] text-yellow-800/40 text-center font-bold">
        Local Storage Enabled
      </div>
    </div>
  );
};