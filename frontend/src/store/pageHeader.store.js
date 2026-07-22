import { create } from 'zustand';

const usePageHeaderStore = create((set) => ({
  title: '',
  actions: null,
  setPageHeader: (title, actions = null) => set({ title, actions }),
}));

export default usePageHeaderStore;
