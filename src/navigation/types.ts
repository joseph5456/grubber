import { NavigatorScreenParams } from '@react-navigation/native';
import { Product } from '../types';

export type ResultOrigin = 'scan' | 'search' | 'history';

export type TabParamList = {
  Scanner: undefined;
  History: undefined;
  Search: undefined;
  Challenge: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Result: { product: Product; origin: ResultOrigin; scannedAt?: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
