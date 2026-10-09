import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Post, Category, Subscriber } from '../types';

const POSTS_COLLECTION = 'posts';
const SUBSCRIBERS_COLLECTION = 'subscribers';

// --- Posts CRUD ---

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'authorUid'>) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to create a post');
    }

    return await addDoc(collection(db, POSTS_COLLECTION), {
      ...postData,
      authorUid: auth.currentUser.uid,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, POSTS_COLLECTION);
  }
};

export const updatePost = async (id: string, postData: Partial<Post>) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, id);
    return await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${POSTS_COLLECTION}/${id}`);
  }
};

export const deletePost = async (id: string) => {
  try {
    return await deleteDoc(doc(db, POSTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${POSTS_COLLECTION}/${id}`);
  }
};

export const getPost = async (id: string) => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${POSTS_COLLECTION}/${id}`);
  }
};

export const getPostBySlug = async (slug: string) => {
  try {
    const q = query(collection(db, POSTS_COLLECTION), where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Post;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, POSTS_COLLECTION);
  }
};

export const incrementViews = async (id: string) => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, id);
    return await updateDoc(postRef, {
      views: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${POSTS_COLLECTION}/${id}`);
  }
};

export const getAllPosts = async (options?: { category?: Category; featuredOnly?: boolean; limitCount?: number }) => {
  try {
    let q = query(collection(db, POSTS_COLLECTION), where('isActive', '==', true), orderBy('createdAt', 'desc'));

    if (options?.category) {
      q = query(q, where('category', '==', options.category));
    }

    if (options?.featuredOnly) {
      q = query(q, where('isFeatured', '==', true));
    }

    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, POSTS_COLLECTION);
  }
};

// Admin version (includes inactive posts)
export const getAdminPosts = async () => {
  try {
    const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, POSTS_COLLECTION);
  }
};

// --- Subscribers ---

export const subscribe = async (email: string) => {
  try {
    // Check if already subscribed
    const q = query(collection(db, SUBSCRIBERS_COLLECTION), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return await addDoc(collection(db, SUBSCRIBERS_COLLECTION), {
        email,
        subscribedAt: serverTimestamp(),
      });
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SUBSCRIBERS_COLLECTION);
  }
};

export const getSubscribersCount = async () => {
  try {
    const q = query(collection(db, SUBSCRIBERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SUBSCRIBERS_COLLECTION);
  }
};

export const getRecentSubscribers = async (limitCount: number = 5) => {
  try {
    const q = query(
      collection(db, SUBSCRIBERS_COLLECTION),
      orderBy('subscribedAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscriber));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SUBSCRIBERS_COLLECTION);
  }
};

// --- Ad Injection ---

export const injectAdsIntoContent = (content: string, frequency: number, maxAds: number): string => {
  if (!content || frequency <= 0) return content;
  
  // Split by paragraphs (handling both <p> and double newlines)
  let paragraphs = content.split(/<\/p>/i).filter(p => p?.trim() !== '');
  
  // If no <p> tags, try splitting by double newlines
  if (paragraphs.length <= 1) {
    paragraphs = content.split(/\n\s*\n/).filter(p => p?.trim() !== '');
  }

  if (paragraphs.length <= frequency) return content;

  let result = '';
  let adsPlaced = 0;

  paragraphs.forEach((p, index) => {
    // Add paragraph back with tags if they were there
    const pText = p.includes('<p') ? p + '</p>' : `<p>${p}</p>`;
    result += pText;
    
    // Inject ad after 'frequency' paragraphs, up to 'maxAds'
    // Don't inject after the very last paragraph
    if ((index + 1) % frequency === 0 && adsPlaced < maxAds && index < paragraphs.length - 1) {
      result += `
        <div class="my-8 flex justify-center ad-injected" data-ad-index="${adsPlaced}">
          <div id="in-article-ad-${adsPlaced}" class="w-full flex justify-center"></div>
        </div>
      `;
      adsPlaced++;
    }
  });

  return result;
};
