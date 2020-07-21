import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react';
import { v4 as generateId } from 'uuid';

// Types

type Fill = any;

type SlotState = {
  fillsById: {
    [id: string]: Fill;
  };
  fillsOrder: Array<string>;
};

// Components

type SlotFillContextValue = {
  slots: {
    [slotName: string]: SlotState;
  };
  pushFill: (slotName: string, fill: Fill) => string;
  replaceFill: (slotName: string, id: string, fill: Fill) => void;
  removeFill: (slotName: string, id: string) => void;
};

const defaultContextValue = {
  slots: {},
  pushFill: () => '',
  replaceFill: () => {},
  removeFill: () => {}
} as SlotFillContextValue;

const SlotFillContext = React.createContext(defaultContextValue);

type SlotFillProviderProps = {
  children: NonNullable<React.ReactNode>;
};

export function SlotFillProvider(props: SlotFillProviderProps) {
  const { children } = props;
  const [slots, setSlots] = useState<SlotFillContextValue['slots']>({});
  const pushFill = useCallback((slotName: string, fill: Fill) => {
    const id = generateId();
    setSlots((prevSlots) => {
      const prevFillsById = prevSlots[slotName]?.fillsById || {};
      const prevFillsOrder = prevSlots[slotName]?.fillsOrder || [];
      return {
        ...prevSlots,
        [slotName]: {
          fillsById: {
            ...prevFillsById,
            [id]: fill
          },
          fillsOrder: [...prevFillsOrder, id]
        }
      };
    });
    return id;
  }, []);
  const replaceFill = useCallback(
    (slotName: string, id: string, fill: Fill) => {
      return setSlots((prevSlots) => ({
        ...prevSlots,
        [slotName]: {
          ...prevSlots[slotName],
          fillsById: {
            ...prevSlots[slotName].fillsById,
            [id]: fill
          }
        }
      }));
    },
    []
  );
  const removeFill = useCallback((slotName: string, id: string) => {
    return setSlots((prevSlots) => {
      const prevFillsById = prevSlots[slotName].fillsById;
      const prevFillsOrder = prevSlots[slotName].fillsOrder;
      const index = prevFillsOrder.findIndex((fillId) => id === fillId);
      const nextFillsById = { ...prevFillsById };
      delete nextFillsById[id];
      const nextFillsOrder = [...prevFillsOrder];
      nextFillsOrder.splice(index, 1);
      return {
        ...prevSlots,
        [slotName]: {
          fillsById: nextFillsById,
          fillsOrder: nextFillsOrder
        }
      };
    });
  }, []);
  const value = useMemo(() => ({ slots, pushFill, replaceFill, removeFill }), [
    slots,
    pushFill,
    replaceFill,
    removeFill
  ]);
  return (
    <SlotFillContext.Provider value={value}>
      {children}
    </SlotFillContext.Provider>
  );
}

type SlotProps = {
  children: (fills: Array<Fill>) => React.ReactElement<any>;
  name: string;
};

export function Slot(props: SlotProps) {
  const { children, name } = props;
  const { slots } = useSlotFill();
  const slotState = slots[name];
  if (!slotState) return children([]);
  const fills = orderedFills(slotState);
  return children(fills);
}

type FillProps = {
  children: Fill | ((prevFill: Fill) => Fill);
  name: string;
};

export function Fill(props: FillProps) {
  const { children, name } = props;
  const { slots, pushFill, replaceFill, removeFill } = useSlotFill();
  const idRef = useRef<string>();
  const output = useMemo(() => {
    if (typeof children === 'function') {
      const slotState = slots[name];
      const index = idRef.current
        ? slotState?.fillsOrder.findIndex((fillId) => idRef.current === fillId)
        : undefined;
      const prevIndex = index ? index - 1 : -1;
      const prevFillId = slotState?.fillsOrder[prevIndex];
      const prevFill = slotState?.fillsById[prevFillId];
      return children(prevFill);
    }
    return children;
  }, [children, name, slots]);
  useEffect(() => {
    const id = idRef.current;
    if (id) {
      replaceFill(name, id, output);
    } else {
      const newId = pushFill(name, output);
      idRef.current = newId;
    }
  }, [output, name]);
  useEffect(() => {
    return () => removeFill(name, idRef.current!);
  }, []);
  return null;
}

// Hooks

export function useSlotFill() {
  return useContext(SlotFillContext);
}

export function useFills(slotName: string) {
  const slots = useSlotFill().slots;
  const slotState = slots[slotName];
  if (!slotState) return [];
  const fills = orderedFills(slotState);
  return fills;
}

// Helpers

function orderedFills(slotState: SlotState) {
  const { fillsById, fillsOrder } = slotState;
  return fillsOrder.map((id) => fillsById[id]);
}
