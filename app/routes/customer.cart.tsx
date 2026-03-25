import { useMemo } from "react";
import { Link, useOutletContext, useNavigate } from "react-router";
import { type CustomerContextData } from "./customer";
import { Minus, Plus, Trash2, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    setCart,
    restaurants,
    handleCheckout,
    checkoutLoading,
    checkoutSuccess,
    checkoutError,
    paymentPhoneNumber,
    setPaymentPhoneNumber,
  } = useOutletContext<CustomerContextData>();

  const cartItems = useMemo(() => {
    const items: Array<{ menuItemId: string; quantity: number; price: number; name: string; restaurantId: string; restaurantName: string }> = [];

    for (const [menuItemId, quantity] of Object.entries(cart)) {
      for (const restaurant of restaurants) {
        const menuItem = (restaurant.menuItems ?? []).find((item) => item.id === menuItemId);
        if (menuItem) {
          items.push({
            menuItemId,
            quantity,
            price: menuItem.price,
            name: menuItem.name,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
          });
          break;
        }
      }
    }
    return items;
  }, [cart, restaurants]);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartRestaurantId = cartItems[0]?.restaurantId ?? null;
  const cartRestaurantName = cartItems[0]?.restaurantName ?? null;

  const updateCart = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[menuItemId] || 0;
      const next = Math.max(0, current + delta);
      const nextCart = { ...prev, [menuItemId]: next };
      if (next === 0) delete nextCart[menuItemId];
      return nextCart;
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[menuItemId];
      return next;
    });
  };

  if (cartItems.length === 0) {
    if (checkoutSuccess) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-ull bg-green-50 text-green-600 shadow-xl shadow-green-100 ring-4 ring-white">
            <CreditCard className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Order Placed!</h2>
          <p className="max-w-xs text-muted-foreground">{checkoutSuccess}</p>
          <div className="flex gap-3">
             <Link to="/customer/orders" className="btn-primary px-6 py-2.5">Track Order</Link>
             <Link to="/customer" className="btn-outline px-6 py-2.5">Home</Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center animate-fade-in">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-surface shadow-xl shadow-border/50">
            <span className="text-6xl">🛒</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
        <p className="text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Link to="/customer" className="mt-4 btn-primary px-8 py-3 w-auto md:w-auto">
          Start Ordering
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-32 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-hover">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Shopping Cart</h1>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-surface-hover/50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ordering from</span>
            <p className="font-bold text-lg text-brand-red">{cartRestaurantName}</p>
        </div>

        <ul className="divide-y divide-border">
          {cartItems.map((item) => (
            <li key={item.menuItemId} className="flex items-center justify-between p-4 sm:p-6 transition hover:bg-surface-hover/30">
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-foreground">{item.name}</h3>
                <p className="text-sm font-semibold text-brand-red">{formatCurrency(item.price)}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl bg-surface-hover p-1 shadow-inner">
                  <button 
                    onClick={() => updateCart(item.menuItemId, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted-foreground hover:bg-white hover:text-brand-red shadow-sm transition-all"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                  <button 
                    onClick={() => updateCart(item.menuItemId, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted-foreground hover:bg-white hover:text-brand-red shadow-sm transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <button 
                    onClick={() => removeFromCart(item.menuItemId)} 
                    className="text-muted-foreground hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        
        <div className="border-t border-border bg-surface-hover/20 p-6">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-muted-foreground">Delivery Fee</span>
                <span className="font-medium text-brand-red">Free</span>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-border/50">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-black">{formatCurrency(cartTotal)}</span>
            </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold">Payment Method</h2>
        
        <div className="space-y-4">
            <div className="relative">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block ml-1">M-Pesa Number</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">🇰🇪 +254</span>
                    <input
                        type="tel"
                        placeholder="712 345 678"
                        className="input-field pl-20"
                        value={paymentPhoneNumber}
                        onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                    />
                </div>
            </div>

            {checkoutError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                    Error: {checkoutError}
                </div>
            )}
            
            <Button 
                onClick={() => cartRestaurantId && handleCheckout(cartRestaurantId)} 
                disabled={checkoutLoading || !paymentPhoneNumber}
                className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-brand-red/20 active:scale-95 transition-all"
            >
                {checkoutLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Processing Payment...</span>
                ) : (
                    `Place Order • ${formatCurrency(cartTotal)}`
                )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Secure payment via Daraja API</p>
        </div>
      </div>
    </div>
  );
}