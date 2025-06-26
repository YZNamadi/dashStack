import React from 'react';
import { useDrag } from 'react-dnd';

interface SidebarItemProps {
  type: string;
  children: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ type, children }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="p-2 mt-2 border rounded-md cursor-grab hover:bg-gray-200"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {children}
    </div>
  );
};

export default SidebarItem; 