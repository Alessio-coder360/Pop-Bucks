
import { useEffect, useState } from 'react';

export default function useIntersectionObserver(ref, options) {
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      options
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, options]);
  return isVisible;
}
