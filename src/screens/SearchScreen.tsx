import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DismissKeyboardView from '../components/DismissKeyboardView';
import ScreenHeader from '../components/ScreenHeader';
import { RootStackParamList } from '../navigation/types';
import { lookupBarcode, SearchHit, searchProducts } from '../openFoodFacts';
import { useTheme } from '../theme';

const DEBOUNCE_MS = 400;
const NUTRISCORE_COLOR: Record<NonNullable<SearchHit['nutriScore']>, string> = {
  a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63E11',
};

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; hits: SearchHit[] }
  | { status: 'error' };

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSearch({ status: 'idle' });
      return;
    }
    setSearch({ status: 'loading' });
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchProducts(q, controller.signal)
        .then((hits) => setSearch({ status: 'done', hits }))
        .catch(() => {
          if (!controller.signal.aborted) setSearch({ status: 'error' });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const openHit = async (hit: SearchHit) => {
    if (opening) return;
    setOpening(hit.code);
    setOpenError(null);
    try {
      const result = await lookupBarcode(hit.code);
      if (result.status === 'found') {
        navigation.navigate('Result', { product: result.product, origin: 'search' });
      } else {
        setOpenError(`Couldn't load details for ${hit.name}.`);
      }
    } catch {
      setOpenError('Check your internet connection and try again.');
    } finally {
      setOpening(null);
    }
  };

  const renderItem = ({ item }: { item: SearchHit }) => (
    <Pressable style={[styles.row, { backgroundColor: colors.card }]} onPress={() => openHit(item)}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="contain" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.rowInfo}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.category, { color: colors.subtext }]} numberOfLines={1}>
          {[item.brand, item.quantity].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {opening === item.code ? (
        <ActivityIndicator style={styles.trailing} />
      ) : item.nutriScore ? (
        <View style={[styles.trailing, styles.nutriBadge, { backgroundColor: NUTRISCORE_COLOR[item.nutriScore] }]}>
          <Text style={styles.nutriBadgeText}>{item.nutriScore.toUpperCase()}</Text>
        </View>
      ) : null}
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
          placeholder="e.g. greek yogurt, Cheerios"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {openError && <Text style={styles.errorText}>{openError}</Text>}
        {search.status === 'idle' ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Search millions of products from Open Food Facts.
            </Text>
          </View>
        ) : search.status === 'loading' ? (
          <View style={styles.empty}>
            <ActivityIndicator />
          </View>
        ) : search.status === 'error' ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Couldn't reach the product database. Check your connection.
            </Text>
          </View>
        ) : search.hits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No matches for "{query}".</Text>
          </View>
        ) : (
          <FlatList
            data={search.hits}
            keyExtractor={(item) => item.code}
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
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  thumbPlaceholder: {
    backgroundColor: '#ddd',
  },
  rowInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    marginTop: 2,
  },
  trailing: {
    marginLeft: 10,
  },
  nutriBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutriBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
