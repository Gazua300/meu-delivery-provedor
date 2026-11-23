export interface Restaurant {
  id: string;
  name: string;
  email: string;
  category: string;
  logourl: string;
  phone: string;
  address: string;
}

export interface Products{
    category:string
    description:string
    id:string
    name:string
    photoUrl:string
    price:number
    stock:number
    provider:string
}

export interface User{
    id:string
    username:string
    email:string
    phone:string
    street:string
    number:string
    neighbourhood:string
    city:string
    state:string
    complement:string
}

export interface Order {
  id: string;
  product: string;
  price: string;
  moment: Date;
  quantity: number;
  total: string;
  address: string;
  state: 'REQUESTED' | 'FINISHED' | 'EXPIRED' | string;
  paymentmethod?: string;
  payment_status?: string | null;
  payment_approved_at?: Date | string | null;
  archived_at?: Date | string | null;
  client: string;
}

export interface GroupedProducts {
  state: string;
  items: Order[];
  total: number;
}