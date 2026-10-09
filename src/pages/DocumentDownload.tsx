import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DocumentHTML } from '../components/DocumentPreview';
import html2pdf from 'html2pdf.js';
import { Download, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const DocumentDownload = () => {
  const { type, docId } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!docId) return;
      try {
        const snap = await getDoc(doc(db, 'user_documents', docId));
        if (snap.exists()) {
          setDocData(snap.data());
        } else {
          toast.error('Document not found');
          navigate('/my-documents');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [docId, navigate]);

  const handleDownload = async () => {
    const element = document.getElementById('printable-document');
    if (!element) return;

    setIsDownloading(true);
    try {
      const opt: any = {
        margin: 10,
        filename: `${docData.title || 'document'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(element).set(opt).save();
      toast.success('Download started!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!docData) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 no-print">
          <button 
            onClick={() => navigate('/my-documents')}
            className="flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-colors"
          >
            <ArrowLeft size={20} />
            Back to My Documents
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            {isDownloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download size={20} />
            )}
            Download PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <div id="printable-document" className="bg-white">
            <DocumentHTML data={docData.formData} type={type || 'cv'} />
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm no-print">
          <p>Reference: {docData.reference}</p>
          <p>Paid on {docData.paidAt?.toDate?.()?.toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentDownload;
