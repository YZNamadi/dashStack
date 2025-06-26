import { create } from 'zustand';

export interface CanvasComponent {
  id: string;
  type: string; // e.g., 'Button', 'Table'
  props: Record<string, any>;
  position: { x: number; y: number };
}

interface CanvasState {
  components: CanvasComponent[];
  addComponent: (component: Omit<CanvasComponent, 'id' | 'position'>, position: { x: number, y: number }) => void;
  moveComponent: (id: string, position: { x: number; y: number }) => void;
  updateComponentProps: (id: string, props: Record<string, any>) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  components: [],
  addComponent: (component, position) => {
    const newComponent: CanvasComponent = {
      ...component,
      id: `${component.type}-${Date.now()}`,
      position,
    };
    set((state) => ({
      components: [...state.components, newComponent],
    }));
  },
  moveComponent: (id, position) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, position } : c
      ),
    }));
  },
  updateComponentProps: (id, props) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, props: { ...c.props, ...props } } : c
      ),
    }));
  },
})); 