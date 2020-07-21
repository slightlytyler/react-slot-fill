import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

// Types

type Fill = any;

// Components

type SlotFillContextValue = {
  fills: {
    [name: string]: Array<Fill>;
  };
  pushFill: (name: string, fill: Fill) => void;
  popFill: (name: string) => void;
};

const defaultContextValue = {
  fills: {},
  pushFill: () => {},
  popFill: () => {}
} as SlotFillContextValue;

const SlotFillContext = React.createContext(defaultContextValue);

type SlotFillProviderProps = {
  children: NonNullable<React.ReactNode>;
};

export function SlotFillProvider(props: SlotFillProviderProps) {
  const { children } = props;
  const [fills, setFills] = useState<SlotFillContextValue['fills']>({});
  const pushFill = useCallback(
    (slotName: string, fill: NonNullable<React.ReactNode>) =>
      setFills((prevFills) => {
        const fillsForSlot = prevFills[slotName] || [];
        const nextFillsForSlot = [...fillsForSlot, fill];
        return {
          ...prevFills,
          [slotName]: nextFillsForSlot
        };
      }),
    []
  );
  const popFill = useCallback(
    (slotName: string) =>
      setFills((prevFills) => {
        const fillsForSlot = prevFills[slotName];
        const nextFillsForSlot = [...fillsForSlot];
        nextFillsForSlot.pop();
        return {
          ...prevFills,
          [slotName]: nextFillsForSlot
        };
      }),
    []
  );
  const value = useMemo(() => ({ fills, pushFill, popFill }), [
    fills,
    pushFill,
    popFill
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
  const { fills } = useContext(SlotFillContext);
  const fillsForSlot = fills[name] || [];
  return children(fillsForSlot);
}

type FillProps = {
  children: NonNullable<React.ReactNode>;
  name: string;
};

export function Fill(props: FillProps) {
  const { children, name } = props;
  const { pushFill, popFill } = useContext(SlotFillContext);
  useEffect(() => {
    pushFill(name, children);
    return () => popFill(name);
  }, [children, name]);
  return null;
}
