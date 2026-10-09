import { usePaystackPayment } from 'react-paystack';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export const useDocumentPayment = ({
  email,
  documentType,
  documentId,
  amount,
  promoCode,
  metadata,
  onSuccess,
}: {
  email: string;
  documentType: string;
  documentId: string;
  amount: number;
  promoCode?: string;
  metadata?: any;
  onSuccess: (reference: string) => void;
}) => {
  const [publicKey, setPublicKey] = useState(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'documents'));
        if (docSnap.exists()) {
          const settings = docSnap.data();
          if (settings.payment?.paystackPublicKey) {
            setPublicKey(settings.payment.paystackPublicKey);
          }
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const config = {
    reference: `CB_DOC_${documentId}_${Date.now()}`,
    email,
    amount: amount * 100, // Convert to kobo
    publicKey: publicKey || 'pk_test_placeholder',
    metadata: {
      ...metadata,
      custom_fields: [
        {
          display_name: "Document Type",
          variable_name: "document_type",
          value: documentType,
        },
        {
          display_name: "Document ID",
          variable_name: "document_id", 
          value: documentId,
        },
        {
          display_name: "Promo Code",
          variable_name: "promo_code",
          value: promoCode || 'none',
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const pay = () => {
    if (!email) {
      toast.error('Please enter your email to proceed');
      return;
    }

    if (!publicKey) {
      toast.error('Payment system is not configured. Please contact support.');
      return;
    }

    initializePayment({
      onSuccess: async (response: any) => {
        try {
          // Verify reference exists
          if (!response?.reference) {
            toast.error('Payment verification failed');
            return;
          }

          // Save payment to Firestore
          await addDoc(collection(db, 'document_payments'), {
            reference: response.reference,
            documentType,
            documentId,
            email,
            amount: amount,
            promoCode: promoCode || null,
            status: 'success',
            paidAt: serverTimestamp(),
          });

          // Save to localStorage so user can re-download
          const paid = JSON.parse(
            localStorage.getItem('hj_paid_docs') || '{}'
          );
          paid[documentId] = {
            paid: true,
            reference: response.reference
          };
          localStorage.setItem('hj_paid_docs', JSON.stringify(paid));
          
          onSuccess(response.reference);
        } catch (error) {
          console.error('Error saving payment:', error);
          toast.error('Payment successful but failed to update records. Please contact support.');
          // Still unlock since payment went through
          onSuccess(response.reference);
        }
      },
      onClose: () => {
        toast.info('Payment cancelled');
      },
    });
  };

  return { pay };
};
