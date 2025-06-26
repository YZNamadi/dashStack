import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { useCanvasStore } from '../state/canvas.store';
import { DraggableComponent } from './DraggableComponent';

const Canvas: React.FC = () => {
  const { components, addComponent, moveComponent, updateComponentProps } = useCanvasStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(() => ({
    accept: ['Table', 'Button', 'Input', 'Text'], // Add all component types here
    drop: (item: { type: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasBounds) {
        const x = offset.x - canvasBounds.left;
        const y = offset.y - canvasBounds.top;
        addComponent({ type: item.type, props: {} }, { x, y });
      }
    },
  }));

  drop(canvasRef);

  const handleComponentAction = (componentId: string, action: string, data?: any) => {
    console.log(`Component ${componentId} action:`, action, data);
    // Handle component actions here (e.g., update UI, show notifications)
  };

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 p-10 bg-white border-2 border-dashed rounded-lg h-full"
    >
      {components.length === 0 && (
        <div className="text-center text-gray-400">
            <h1 className="text-2xl font-bold">Dashboard Canvas</h1>
            <p>Drag components here to build your UI</p>
        </div>
      )}
      {components.map((component) => (
        <DraggableComponent
          key={component.id}
          id={component.id}
          type={component.type}
          position={component.position}
          props={component.props}
          onMove={moveComponent}
          onAction={(action, data) => handleComponentAction(component.id, action, data)}
        />
      ))}
    </div>
  );
};

export default Canvas; 