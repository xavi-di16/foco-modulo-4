import {
    addDoc,
    collection,
    connectFirestoreEmulator,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import type { Firestore, Timestamp } from 'firebase/firestore';
import type { Task, TaskInput, TaskRecord } from '../types/task';
import { getFirebaseApp, useEmulators } from './firebase';

let db: Firestore | undefined;

function getTaskDatabase() {
    if (!db) {
        const instance = getFirestore(getFirebaseApp());
        if (useEmulators) connectFirestoreEmulator(instance, '127.0.0.1', 8080);
        db = instance;
    }
    return db;
}

export interface TaskSnapshot {
    tasks: Task[];
    order: string[];
}

export function watchTasks(userId: string, onChange: (snapshot: TaskSnapshot) => void, onError: (error: Error) => void) {
    const db = getTaskDatabase();
    const ownedTasks = query(collection(db, 'tasks'), where('userId', '==', userId));
    const orderRef = doc(db, 'taskOrders', userId);
    let tasks: Task[] | undefined;
    let order: string[] | undefined;
    let failed = false;

    function notify() {
        if (!failed && tasks && order) onChange({ tasks, order });
    }

    function reportError(error: Error) {
        failed = true;
        onError(error);
    }

    const stopTasks = onSnapshot(ownedTasks, snapshot => {
        tasks = snapshot.docs.map(document => {
            const data = document.data({ serverTimestamps: 'estimate' }) as TaskRecord<Timestamp | null>;
            return {
                ...data,
                id: document.id,
                createdAt: data.createdAt?.toMillis() ?? 0,
                updatedAt: data.updatedAt?.toMillis() ?? 0,
            };
        });
        notify();
    }, reportError);

    const stopOrder = onSnapshot(orderRef, snapshot => {
        const data = snapshot.data() as { ids: string[] } | undefined;
        order = data?.ids ?? [];
        notify();
    }, reportError);

    return () => {
        stopTasks();
        stopOrder();
    };
}

export async function createTask(userId: string, input: TaskInput) {
    await addDoc(collection(getTaskDatabase(), 'tasks'), {
        ...input,
        userId,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export function editTask(id: string, input: TaskInput) {
    return updateDoc(doc(getTaskDatabase(), 'tasks', id), { ...input, updatedAt: serverTimestamp() });
}

export function completeTask(id: string, completed: boolean) {
    return updateDoc(doc(getTaskDatabase(), 'tasks', id), { completed, updatedAt: serverTimestamp() });
}

export function deleteTask(id: string) {
    return deleteDoc(doc(getTaskDatabase(), 'tasks', id));
}

export function saveTaskOrder(userId: string, ids: string[]) {
    return setDoc(doc(getTaskDatabase(), 'taskOrders', userId), { ids });
}

export function taskErrorMessage(error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if (code === 'permission-denied') return 'Firestore no autorizó la operación. Revisá las reglas del proyecto.';
    if (code === 'not-found') return 'La tarea ya no está disponible.';
    if (code === 'unavailable') return 'Firestore no está disponible. Revisá tu conexión y volvé a intentar.';
    return 'No se pudo completar la operación. Volvé a intentar.';
}
