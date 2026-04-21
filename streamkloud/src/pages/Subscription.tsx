import { useState } from 'react';
import { Check, Crown, Zap, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'daily',
    name: 'Daily Pass',
    price: 'UGX 1,000',
    period: 'day',
    description: 'Perfect for a quick music fix',
    features: ['Ad-free listening', 'High quality audio', 'Unlimited skips'],
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'weekly',
    name: 'Weekly Jam',
    price: 'UGX 7,000',
    period: 'week',
    description: 'Great for your weekly commute',
    features: ['Everything in Daily', 'Offline mode', 'Exclusive badges'],
    icon: Star,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: 'UGX 30,000',
    period: 'month',
    description: 'The most popular choice',
    features: ['Everything in Weekly', 'Early access to new releases', 'Artist support'],
    icon: Crown,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    popular: true
  },
  {
    id: 'annual',
    name: 'Annual Legend',
    price: 'UGX 366,000',
    period: 'year',
    description: 'Best value for true fans',
    features: ['Everything in Monthly', '2 months free', 'VIP support', 'Limited edition NFT'],
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  }
];

export function Subscription() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    setLoading(planId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const expiryDate = new Date();
      if (planId === 'daily') expiryDate.setDate(expiryDate.getDate() + 1);
      if (planId === 'weekly') expiryDate.setDate(expiryDate.getDate() + 7);
      if (planId === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
      if (planId === 'annual') expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      await updateDoc(userRef, {
        subscription: {
          plan: planId,
          status: 'active',
          expiryDate: expiryDate.toISOString()
        }
      });
      alert(`Successfully subscribed to ${planId} plan!`);
    } catch (error) {
      console.error('Error subscribing:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-4">
            Choose Your <span className="text-orange-500">Rhythm</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Unlock the full potential of StreamKloud. Ad-free music, offline listening, and exclusive content await.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-300",
                plan.popular 
                  ? "bg-zinc-900 border-orange-500/50 shadow-2xl shadow-orange-500/10 scale-105 z-10" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", plan.bg)}>
                <plan.icon className={cn("w-6 h-6", plan.color)} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-x-1 mb-4">
                <span className="text-3xl font-black text-white">{plan.price}</span>
                <span className="text-zinc-500">/{plan.period}</span>
              </div>
              <p className="text-zinc-400 text-sm mb-8">{plan.description}</p>

              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-x-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null || !user}
                className={cn(
                  "w-full h-12 rounded-xl font-bold transition-all",
                  plan.popular 
                    ? "bg-orange-500 hover:bg-orange-600 text-black" 
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                )}
              >
                {loading === plan.id ? 'Processing...' : user ? 'Subscribe Now' : 'Log in to Subscribe'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
