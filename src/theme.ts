import { useAppData } from './context/AppDataContext';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  inputBackground: string;
  placeholder: string;
  accent: string;
  danger: string;
}

const light: ThemeColors = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#222222',
  subtext: '#888888',
  border: '#EEEEEE',
  inputBackground: '#FFFFFF',
  placeholder: '#999999',
  accent: '#1E8F4E',
  danger: '#E53935',
};

const dark: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#F2F2F2',
  subtext: '#9A9A9A',
  border: '#2C2C2C',
  inputBackground: '#242424',
  placeholder: '#7A7A7A',
  accent: '#4CAF50',
  danger: '#EF5350',
};

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const { profile } = useAppData();
  return { colors: profile.darkMode ? dark : light, isDark: profile.darkMode };
}
