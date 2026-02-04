import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cartService } from "../services";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data?.cart ?? data ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      refreshCart().catch(() => {
        // ignore
      });
    }

    const onAuthChanged = () => {
      const t = localStorage.getItem("token");
      if (!t) {
        setCart(null);
        return;
      }
      refreshCart().catch(() => {
        // ignore
      });
    };

    // Keep cart badge in sync without requiring refresh.
    window.addEventListener("auth:changed", onAuthChanged);
    window.addEventListener("storage", onAuthChanged);
    return () => {
      window.removeEventListener("auth:changed", onAuthChanged);
      window.removeEventListener("storage", onAuthChanged);
    };
  }, [refreshCart]);

  const addItem = useCallback(
    async (payload) => {
      const data = await cartService.addToCart(payload);
      await refreshCart();
      return data;
    },
    [refreshCart],
  );

  const updateItem = useCallback(
    async (payload) => {
      const data = await cartService.updateCartItem(payload);
      await refreshCart();
      return data;
    },
    [refreshCart],
  );

  const removeItem = useCallback(
    async (productId) => {
      const data = await cartService.removeCartItem(productId);
      await refreshCart();
      return data;
    },
    [refreshCart],
  );

  const clear = useCallback(async () => {
    const data = await cartService.clearCart();
    setCart(null);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      setCart,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, refreshCart, addItem, updateItem, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
