import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { api } from '../services/api';

interface ComponentProps {
  label?: string;
  datasourceId?: string;
  query?: string;
  workflowId?: string;
  placeholder?: string;
  data?: any[];
}

// A generic component renderer
const renderComponent = (type: string, props: ComponentProps = {}, onAction?: (action: string, data?: any) => void) => {
    switch(type) {
        case 'Button':
            return (
              <button 
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                onClick={() => {
                  if (props.workflowId) {
                    onAction?.('runWorkflow', { workflowId: props.workflowId });
                  }
                }}
              >
                {props.label || 'Button'}
              </button>
            );
        case 'Input':
            return (
              <input 
                type="text" 
                placeholder={props.placeholder || "Input field"} 
                className="p-2 border rounded w-48" 
              />
            );
        case 'Text':
            return <p className="text-gray-700">{props.label || 'Text Label'}</p>;
        case 'Table':
            return (
              <div className="p-4 border rounded bg-gray-50 min-w-64">
                <h3 className="font-medium mb-2">Table Component</h3>
                {props.data && props.data.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(props.data[0]).map(key => (
                          <th key={key} className="text-left py-1">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {props.data.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="py-1">{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </div>
            );
        default:
            return <div className="p-2 border border-red-500 rounded">Unknown Component</div>
    }
}

interface DraggableComponentProps {
  id: string;
  type: string;
  position: { x: number; y: number };
  props?: ComponentProps;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onAction?: (action: string, data?: any) => void;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({ 
  id, 
  type, 
  position, 
  props = {}, 
  onMove, 
  onAction 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'canvas-component', // A different type to distinguish from sidebar items
    item: { id, type },
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const newX = Math.round(position.x + delta.x);
        const newY = Math.round(position.y + delta.y);
        onMove(item.id, { x: newX, y: newY });
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [id, position, onMove]);

  const handleAction = async (action: string, data?: any) => {
    if (action === 'runWorkflow' && data?.workflowId) {
      try {
        const response = await api.post(`/workflows/${data.workflowId}/run`, {
          input: { componentId: id, timestamp: new Date().toISOString() }
        });
        console.log('Workflow executed:', response.data);
        onAction?.(action, { ...data, result: response.data });
      } catch (error) {
        console.error('Error running workflow:', error);
        onAction?.(action, { ...data, error: error });
      }
    }
  };

  return (
    <div
      ref={drag}
      className="absolute p-2"
      style={{ left: position.x, top: position.y, opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
    >
        {renderComponent(type, props, handleAction)}
    </div>
  );
}; 