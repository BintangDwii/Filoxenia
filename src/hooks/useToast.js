import { useCallback, useEffect, useRef, useState } from 'react';

export const useToast = (duration = 3000) => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback(
    (message, type = 'success') => {
      setToast({ message, type });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { toast, showToast };
};
