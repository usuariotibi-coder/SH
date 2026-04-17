import { create } from 'zustand';
import api from '../api/axios.config';

const useCompanyStore = create((set, get) => ({
  companies: [],
  selectedCompanyId: null,

  fetchCompanies: async () => {
    try {
      const res = await api.get('/companies');
      set({ companies: res.data.data || res.data });
    } catch (err) {
      console.error('Error al cargar empresas:', err);
    }
  },

  selectCompany: (id) => set({ selectedCompanyId: id }),

  getSelectedCompany: () => {
    const { companies, selectedCompanyId } = get();
    return companies.find(c => c.id === selectedCompanyId);
  },
}));

export default useCompanyStore;
