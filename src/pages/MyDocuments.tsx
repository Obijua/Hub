import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  collection, query, where, 
  orderBy, getDocs 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

export const MyDocuments = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchDocuments(u.uid, u.email);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchDocuments = async (
    uid: string, 
    email: string | null
  ) => {
    try {
      // Fetch by userId OR by email as fallback
      const q = query(
        collection(db, 'user_documents'),
        where('userEmail', '==', email || ''),
        orderBy('paidAt', 'desc')
      );
      const snap = await getDocs(q);
      setDocuments(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getDocIcon = (type: string) => {
    switch(type) {
      case 'cv': return '📄';
      case 'proposal': return '📊';
      case 'business-plan': return '🏦';
      default: return '📋';
    }
  };

  const getDocLabel = (type: string) => {
    switch(type) {
      case 'cv': return 'Professional CV';
      case 'proposal': return 'Business Proposal';
      case 'business-plan': return 'Business Plan';
      default: return 'Document';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 
        dark:bg-gray-950 flex items-center 
        justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="font-black text-xl 
            text-gray-900 dark:text-white mb-2">
            Sign in to view your documents
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Your purchased documents are saved 
            to your account.
          </p>
          <Link to="/admin/login"
            className="block py-3 bg-primary text-white 
              font-black rounded-xl text-center">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 
      dark:bg-gray-950 px-4 py-8 max-w-2xl mx-auto">

      <div className="mb-8">
        <h1 className="font-black text-2xl 
          text-gray-900 dark:text-white mb-1">
          My Documents
        </h1>
        <p className="text-gray-500 text-sm">
          All your purchased documents. 
          Re-download anytime.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white 
              dark:bg-gray-900 rounded-2xl p-5 
              animate-pulse h-24" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📂</div>
          <h3 className="font-black text-gray-900 
            dark:text-white text-lg mb-2">
            No documents yet
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Build and purchase a document to see 
            it here.
          </p>
          <Link to="/documents"
            className="inline-block py-3 px-8 
              bg-primary text-white font-black 
              rounded-xl">
            Build a Document ✨
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id}
              className="bg-white dark:bg-gray-900 
                rounded-2xl p-5 border border-gray-100 
                dark:border-gray-800 
                flex items-center gap-4">

              <div className="w-12 h-12 bg-primary/10 
                rounded-xl flex items-center 
                justify-center text-2xl flex-shrink-0">
                {getDocIcon(doc.documentType)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 
                  dark:text-white text-sm line-clamp-1">
                  {doc.title || getDocLabel(doc.documentType)}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {getDocLabel(doc.documentType)} • 
                  Paid ₦{doc.amount?.toLocaleString()}
                </p>
                <p className="text-gray-400 text-[10px] mt-0.5">
                  {doc.paidAt?.toDate?.()
                    ?.toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }) || 'Recently'
                  }
                </p>
              </div>

              <Link
                to={`/documents/${doc.documentType}/download/${doc.id}`}
                className="flex-shrink-0 px-4 py-2.5 
                  bg-primary text-white font-black 
                  text-xs rounded-xl hover:bg-blue-900 
                  transition-all"
              >
                ⬇️ Download
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
