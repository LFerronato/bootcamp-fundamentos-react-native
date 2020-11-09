import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { isReturnStatement } from 'typescript';

interface Product {
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
      const cart = await AsyncStorage.getItem('cart');
      if (cart) setProducts(JSON.parse(cart));
    }

    loadProducts();
  }, []);

  // useEffect(() => {
  //   async function updateAsyncStorage(): Promise<void> {
  //     await AsyncStorage.setItem('cart', JSON.stringify(products));
  //   }
  //   updateAsyncStorage();
  // }, [products]);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      if (products.some(p => p.id === product.id)) {
        setProducts(state =>
          state.map(p => {
            if (p.id === product.id) p.quantity += 1;
            return p;
          }),
        );
      } else {
        setProducts(state => [
          ...state,
          {
            ...product,
            quantity: 1,
          },
        ]);
      }
      await AsyncStorage.setItem('cart', JSON.stringify(products));
    },

    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(state =>
        state.map(p => {
          if (p.id === id) p.quantity += 1;
          return p;
        }),
      );
      await AsyncStorage.setItem('cart', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(state =>
        state
          .map(p => {
            if (p.id === id) p.quantity -= 1;
            return p;
          })
          .filter(p => p.quantity > 0),
      );
      await AsyncStorage.setItem('cart', JSON.stringify(products));
    },
    [products],
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
