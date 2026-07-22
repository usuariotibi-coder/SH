import { useEffect } from 'react';
import usePageHeaderStore from '../store/pageHeader.store';

// Publica el título y las acciones (botones) de la página actual para que
// el Topbar los muestre en su propia barra en vez de repetirlos en el contenido.
export default function usePageHeader(title, actions = null) {
  const setPageHeader = usePageHeaderStore((s) => s.setPageHeader);

  useEffect(() => {
    setPageHeader(title, actions);
  });

  useEffect(() => () => setPageHeader('', null), [setPageHeader]);
}
