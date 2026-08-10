import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CatalogEntry, productFromCatalogEntry, searchCatalog } from '../catalog';
import DismissKeyboardView from '../components/DismissKeyboardView';
import ScreenHeader from '../components/ScreenHeader';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const results = useMemo(() => searchCatalog(query).slice(0, 40), [query]);

  const openEntry = (entry: CatalogEntry) => {
    const product = productFromCatalogEntry(entry);
    navigation.navigate('Result', { product, origin: 'search' });
  };

  const renderItem = ({ item }: { item: CatalogEntry }) => (
    <Pressable style={[styles.row, { backgroundColor: colors.card }]} onPress={() => openEntry(item)}>
      <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.category, { color: colors.subtext }]}>{item.category}</Text>
    </Pressable>
  );

  return (
    <DismissKeyboardView style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Search" />
      <View style={styles.body}>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Can't scan a barcode? Look a product up by name.
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="e.g. Protein Bar"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.trim().length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>Start typing to search the catalog.</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No matches for "{query}".</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.syntheticKey}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
