import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}
interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const products = [...cart] // COPIA OS DADOS DO ESTADO CART PARA A VARIAVEL PRODUCTS
    
      const productFounded = products.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`).then(response => response.data)

      const stockProduct = stock.amount

      const currentProductAmount = productFounded ? productFounded.amount : 0

      const amount = currentProductAmount + 1

      if(amount > stockProduct ){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(productFounded){
        productFounded.amount = amount
      } else {
        const product = await api.get(`/products/${productId}`).then(response => response.data)
        const newProduct = {
          ...product,amount:1
        }
        products.push(newProduct)
      }

      setCart(products)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(products))



    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const products = [...cart]

      const productFounded = products.find(product => product.id === productId)
      console.log(productFounded)
      if(productFounded){

        const stillProducts = products.filter(product=> (product.id != productId))
        console.log(stillProducts)
        setCart(stillProducts)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(stillProducts))
      } else {
        throw Error()
      }
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0){
        return 
      }

      const stock = await api.get(`/stock/${productId}`).then(response => response.data)
      const currentStock = stock.amount
      
      if(amount > currentStock){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const products = [...cart]  

      const productFounded = products.find(product => product.id === productId)
    
      if(productFounded){
        productFounded.amount = amount
        setCart(products)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(products))
      } else {

      throw Error()
        
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
