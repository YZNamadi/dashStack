import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from './button';
import { VersionHistory } from './version-history';

const COMPONENTS = [
  { type: 'heading', label: 'Heading' },
  { type: 'text', label: 'Text' },
  { type: 'button', label: 'Button' },
  { type: 'input', label: 'Input' },
  { type: 'select', label: 'Select' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'table', label: 'Table' },
];

function PaletteItem({ type, label }: { type: string; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: type });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 border rounded mb-2 bg-white shadow-sm cursor-move flex items-center gap-2 transition-all ${isDragging ? 'opacity-50 ring-2 ring-blue-400' : 'hover:bg-slate-50'}`}
    >
      <span className="font-medium text-slate-700">{label}</span>
    </div>
  );
}

function CanvasDropArea({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] border-2 border-dashed rounded-xl p-6 bg-gradient-to-br from-slate-50 to-slate-100 transition-all ${isOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
    >
      {children}
      {isOver && <div className="text-center text-blue-500 font-semibold">Drop here</div>}
    </div>
  );
}

export interface CanvasElement {
  id: string;
  type: string;
}

export interface CanvasBuilderProps {
  layout: CanvasElement[];
  onChange: (layout: CanvasElement[]) => void;
}

export const CanvasBuilder: React.FC<CanvasBuilderProps & { pageId: string }> = ({ layout, onChange, pageId }) => {
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    // Reset nextId if layout changes (for new pages)
    setNextId(layout.length + 1);
  }, [layout]);

  const handleDragEnd = (event: any) => {
    const { over, active } = event;
    if (over && over.id === 'canvas') {
      const newLayout = [...layout, { id: `el-${nextId}`, type: active.id }];
      setNextId((id) => id + 1);
      onChange(newLayout);
    }
  };

  return (
    <div>
      <VersionHistory pageId={pageId} />
      <div className="flex gap-8">
        {/* Palette */}
        <div className="w-56 p-4 bg-white border rounded-xl shadow-md h-fit sticky top-8">
          <h3 className="font-bold mb-4 text-lg text-slate-800">Components</h3>
          {COMPONENTS.map((c) => (
            <PaletteItem key={c.type} type={c.type} label={c.label} />
          ))}
        </div>
        {/* Canvas */}
        <DndContext onDragEnd={handleDragEnd}>
          <CanvasDropArea>
            {layout.length === 0 && (
              <div className="text-slate-400 text-center py-16 text-lg font-medium">Drag components here</div>
            )}
            <div className="space-y-4">
              {layout.map((el) => (
                <div key={el.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 border border-slate-100 hover:shadow-md transition-all">
                  {el.type === 'heading' && <h2 className="text-2xl font-bold text-slate-800">Heading</h2>}
                  {el.type === 'text' && <span className="text-base text-slate-700">Sample text</span>}
                  {el.type === 'button' && <Button className="px-6 py-2 text-base">Button</Button>}
                  {el.type === 'input' && <input className="border rounded px-3 py-2 w-56 text-base" placeholder="Input" />}
                  {el.type === 'select' && (
                    <select className="border rounded px-3 py-2 w-56 text-base">
                      <option>Option 1</option>
                      <option>Option 2</option>
                    </select>
                  )}
                  {el.type === 'checkbox' && (
                    <label className="flex items-center gap-2 text-base">
                      <input type="checkbox" className="accent-blue-600 w-5 h-5" />
                      Checkbox
                    </label>
                  )}
                  {el.type === 'table' && (
                    <table className="border w-56 text-sm rounded overflow-hidden shadow">
                      <thead className="bg-slate-100">
                        <tr><th className="border px-3 py-2">Header</th></tr>
                      </thead>
                      <tbody>
                        <tr><td className="border px-3 py-2">Cell</td></tr>
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </CanvasDropArea>
        </DndContext>
      </div>
    </div>
  );
}; 