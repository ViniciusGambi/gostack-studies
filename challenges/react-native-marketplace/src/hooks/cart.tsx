import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem(
        '@RNMarketplace-products',
      );
      loadedProducts && setProducts(JSON.parse(loadedProducts));
    }

    loadProducts();
  }, []);

  const saveProducts = useCallback(async (productsToSave: Product[]) => {
    setProducts(productsToSave);
    await AsyncStorage.setItem(
      '@RNMarketplace-products',
      JSON.stringify(productsToSave),
    );
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(item => item.id === product.id);
      if (productExists) {
        const updatedProducts = products.map(
          (item): Product =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : { ...item },
        );
        saveProducts(updatedProducts);
      } else {
        const updatedProducts = [...products, { ...product, quantity: 1 }];
        saveProducts(updatedProducts);
      }
    },

    [products, saveProducts],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : { ...item },
      );
      saveProducts(updatedProducts);
    },
    [products, saveProducts],
  );

  const decrement = useCallback(
    async id => {
      const filteredProducts = products.filter(
        item => item.id !== id || item.quantity > 1,
      );
      const updatedProducts = filteredProducts.map(item =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : { ...item },
      );
      saveProducts(updatedProducts);
    },
    [products, saveProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
