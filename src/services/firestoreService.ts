import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  deleteField,
  updateDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../firebase/config.ts';
import { 
  User, 
  ApplicantProfile, 
  UploadedDocument, 
  FutureTwinScenario, 
  InterviewSession, 
  LearningGrowthPlan 
} from '../types/index.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// Users Collection
// ----------------------------------------------------

export async function syncUserToFirestore(user: User): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${user.id}`;
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      userId: user.id,
      email: user.email,
      displayName: user.fullName,
      role: user.role,
      phone: user.phone || '',
      createdAt: user.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Notice syncing user:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function fetchUserFromFirestore(userId: string): Promise<User | null> {
  if (!auth.currentUser) return null;
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        id: d.userId || snap.id,
        email: d.email,
        fullName: d.displayName || '',
        role: d.role,
        phone: d.phone || '',
        createdAt: d.createdAt
      };
    }
  } catch (err) {
    console.warn('[Firestore] Notice fetching user:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }
  return null;
}

// ----------------------------------------------------
// Profiles Collection
// ----------------------------------------------------

export async function syncProfileToFirestore(profile: ApplicantProfile): Promise<void> {
  if (!auth.currentUser) return;
  const path = `profiles/${profile.id}`;
  try {
    const profileRef = doc(db, 'profiles', profile.id);
    const dataToSave: any = {
      ...profile,
      userId: profile.userId,
      updatedAt: new Date().toISOString()
    };
    if (profile.videoIntro) {
      dataToSave.videoIntro = profile.videoIntro;
    } else {
      dataToSave.videoIntro = deleteField();
    }
    await setDoc(profileRef, dataToSave, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Notice syncing profile:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteVideoIntroFromFirestore(profileId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `profiles/${profileId}`;
  try {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, {
      videoIntro: deleteField(),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[Firestore] Notice deleting video intro:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }
}

export async function fetchProfileFromFirestore(profileId: string): Promise<ApplicantProfile | null> {
  if (!auth.currentUser) return null;
  const path = `profiles/${profileId}`;
  try {
    const profileRef = doc(db, 'profiles', profileId);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as ApplicantProfile;
    }
  } catch (err) {
    console.warn('[Firestore] Notice fetching profile:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }
  return null;
}

export async function fetchProfileByUserIdFromFirestore(userId: string): Promise<ApplicantProfile | null> {
  if (!auth.currentUser) return null;
  const path = 'profiles';
  try {
    const q = query(collection(db, 'profiles'), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as ApplicantProfile;
    }
  } catch (err) {
    console.warn('[Firestore] Notice querying profile by userId:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }
  return null;
}

export async function fetchAllProfilesFromFirestore(): Promise<ApplicantProfile[]> {
  if (!auth.currentUser) return [];
  const path = 'profiles';
  try {
    const snap = await getDocs(collection(db, 'profiles'));
    return snap.docs.map(d => d.data() as ApplicantProfile);
  } catch (err) {
    console.warn('[Firestore] Notice querying all profiles:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return [];
  }
}

export async function deleteProfileFromFirestore(profileId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `profiles/${profileId}`;
  try {
    await deleteDoc(doc(db, 'profiles', profileId));
  } catch (err) {
    console.warn('[Firestore] Notice deleting profile from Firestore:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

export function subscribeToProfile(
  profileId: string, 
  onUpdate: (profile: ApplicantProfile) => void
): Unsubscribe {
  if (!auth.currentUser) {
    return () => {};
  }
  const path = `profiles/${profileId}`;
  return onSnapshot(
    doc(db, 'profiles', profileId),
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as ApplicantProfile);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ----------------------------------------------------
// Documents Collection
// ----------------------------------------------------

export async function syncDocumentToFirestore(document: UploadedDocument, applicantId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `documents/${document.id}`;
  try {
    const docRef = doc(db, 'documents', document.id);
    await setDoc(docRef, {
      id: document.id,
      applicantId,
      type: document.type,
      fileName: document.fileName,
      fileSizeBytes: document.fileSizeBytes,
      mimeType: document.mimeType,
      status: document.status,
      uploadedAt: document.uploadedAt
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Notice syncing document to Firestore:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteDocumentFromFirestore(documentId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `documents/${documentId}`;
  try {
    await deleteDoc(doc(db, 'documents', documentId));
  } catch (err) {
    console.warn('[Firestore] Notice deleting document from Firestore:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// ----------------------------------------------------
// Scenarios Collection (FutureTwin)
// ----------------------------------------------------

export async function syncScenarioToFirestore(scenario: FutureTwinScenario): Promise<void> {
  if (!auth.currentUser) return;
  const path = `scenarios/${scenario.id}`;
  try {
    const scenarioRef = doc(db, 'scenarios', scenario.id);
    await setDoc(scenarioRef, {
      ...scenario,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Notice syncing scenario to Firestore:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteScenarioFromFirestore(scenarioId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `scenarios/${scenarioId}`;
  try {
    await deleteDoc(doc(db, 'scenarios', scenarioId));
  } catch (err) {
    console.warn('[Firestore] Notice deleting scenario:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// ----------------------------------------------------
// Interviews Collection (InterviewMirror)
// ----------------------------------------------------

export async function syncInterviewToFirestore(interview: InterviewSession): Promise<void> {
  if (!auth.currentUser) return;
  const path = `interviews/${interview.id}`;
  try {
    const interviewRef = doc(db, 'interviews', interview.id);
    await setDoc(interviewRef, {
      ...interview,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Notice syncing interview session to Firestore:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

// ----------------------------------------------------
// Learning Plans Collection (Gap2Growth)
// ----------------------------------------------------

export async function syncLearningPlanToFirestore(plan: LearningGrowthPlan): Promise<void> {
  if (!auth.currentUser) return;
  const path = `learning_plans/${plan.id}`;
  try {
    const planRef = doc(db, 'learning_plans', plan.id);
    await setDoc(planRef, {
      ...plan,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Notice syncing learning plan to Firestore:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}

export async function deleteLearningPlanFromFirestore(planId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `learning_plans/${planId}`;
  try {
    await deleteDoc(doc(db, 'learning_plans', planId));
  } catch (err) {
    console.warn('[Firestore] Notice deleting learning plan:', err);
    if (err instanceof Error && err.message.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

