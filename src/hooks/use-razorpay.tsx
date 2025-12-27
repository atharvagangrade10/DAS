"use client";

import React from "react";
import { toast } from "sonner";
import { RAZORPAY_KEY_ID } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { RazorpayOrderResponse } from "@/utils/api";

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  order: RazorpayOrderResponse;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

const useRazorpay = () => {
  const { user } = useAuth();
  const [isScriptLoaded, setIsScriptLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          setIsScriptLoaded(false);
          toast.error("Payment script failed to load.", {
            description: "Please check your network connection.",
          });
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    if (!window.Razorpay) {
      loadScript("https://checkout.razorpay.com/v1/checkout.js");
    } else {
      setIsScriptLoaded(true);
    }
  }, []);

  const displayRazorpay = React.useCallback(({ order, onSuccess, onFailure }: PaymentOptions) => {
    if (!isScriptLoaded || !window.Razorpay) {
      toast.error("Razorpay script not loaded yet. Please try again.");
      return;
    }

    if (!user) {
        toast.error("Authentication error", { description: "User details missing." });
        return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount, // Amount is in smallest currency unit (e.g., paise)
      currency: order.currency,
      name: "DAS Yatra Registration",
      description: `${order.yatra_name} - ${order.fee_category}`,
      order_id: order.order_id,
      handler: (response: any) => {
        // Payment successful, call backend to verify and finalize registration
        onSuccess(response);
      },
      prefill: {
        name: user.full_name,
        email: user.email || "",
        contact: user.phone,
      },
      notes: {
        yatra_id: order.order_id, // Using order_id for simplicity, should be yatra_id if needed
        fee_category: order.fee_category,
        participant_id: user.user_id,
      },
      theme: {
        color: "#3b82f6", // Tailwind blue-500
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
        onFailure(response.error);
    });
    rzp.open();
  }, [isScriptLoaded, user]);

  return {
    isRazorpayReady: isScriptLoaded,
    displayRazorpay,
  };
};

export default useRazorpay;