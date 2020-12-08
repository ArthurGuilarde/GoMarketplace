import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

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
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        productExists.quantity += 1;

        setProducts(
          products.map(p =>
            p.id === product.id ? Object.assign(productExists) : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const delToCart = useCallback(
    id => {
      const arrayProducts = products.filter(p => p.id !== id);
      setProducts(arrayProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const selectedProduct = products.find(p => p.id === id);

      if (selectedProduct) {
        selectedProduct.quantity += 1;
        setProducts(
          products.map(p => (p.id === id ? Object.assign(selectedProduct) : p)),
        );
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const selectedProduct = products.find(p => p.id === id);

      if (selectedProduct && selectedProduct.quantity > 0) {
        selectedProduct.quantity -= 1;
        setProducts(
          products.map(p => (p.id === id ? Object.assign(selectedProduct) : p)),
        );

        if (selectedProduct.quantity === 0) {
          delToCart(id);
        }

        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      }
    },
    [products, delToCart],
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
