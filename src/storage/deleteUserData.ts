import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  doc
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db, auth } from "../firebase";

export async function deleteAllUserData(): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Utilizador não autenticado.");
  }

  const uid = user.uid;

  // 1. Procurar todas as publicações do utilizador
  const postsQuery = query(
    collection(db, "posts"),
    where("authorId", "==", uid)
  );

  const postsSnapshot = await getDocs(postsQuery);

  // 2. Procurar todas as publicações onde o utilizador deixou uma reação
  const yellowQuery = query(
    collection(db, "posts"),
    where("yellowLikedBy", "array-contains", uid)
  );

  const greenQuery = query(
    collection(db, "posts"),
    where("greenLikedBy", "array-contains", uid)
  );

  const redQuery = query(
    collection(db, "posts"),
    where("redLikedBy", "array-contains", uid)
  );

  const [yellowSnapshot, greenSnapshot, redSnapshot] =
    await Promise.all([
      getDocs(yellowQuery),
      getDocs(greenQuery),
      getDocs(redQuery)
    ]);

  // 3. Procurar chats onde o utilizador participa
  const chatsQuery = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid)
  );

  const chatsSnapshot = await getDocs(chatsQuery);

  // 4. Usar batches para apagar/alterar os documentos
  const batch = writeBatch(db);

  // Apagar publicações criadas pelo utilizador
  postsSnapshot.forEach((postDoc) => {
    batch.delete(postDoc.ref);
  });

  // Retirar reações do utilizador
  const reactionSnapshots = [
    yellowSnapshot,
    greenSnapshot,
    redSnapshot
  ];

  const processedPosts = new Set<string>();

  reactionSnapshots.forEach((snapshot) => {
    snapshot.forEach((postDoc) => {
      if (processedPosts.has(postDoc.id)) return;

      processedPosts.add(postDoc.id);

      const data = postDoc.data();

      const updates: Record<string, unknown> = {};

      if (Array.isArray(data.yellowLikedBy)) {
        const users = data.yellowLikedBy.filter(
          (id: string) => id !== uid
        );

        if (users.length !== data.yellowLikedBy.length) {
          updates.yellowLikedBy = users;
          updates.yellowLikes = users.length;
        }
      }

      if (Array.isArray(data.greenLikedBy)) {
        const users = data.greenLikedBy.filter(
          (id: string) => id !== uid
        );

        if (users.length !== data.greenLikedBy.length) {
          updates.greenLikedBy = users;
          updates.greenLikes = users.length;
        }
      }

      if (Array.isArray(data.redLikedBy)) {
        const users = data.redLikedBy.filter(
          (id: string) => id !== uid
        );

        if (users.length !== data.redLikedBy.length) {
          updates.redLikedBy = users;
          updates.redLikes = users.length;
        }
      }

      if (Object.keys(updates).length > 0) {
        batch.update(postDoc.ref, updates);
      }
    });
  });

  // 5. Apagar mensagens e chats
  for (const chatDoc of chatsSnapshot.docs) {
    const messagesSnapshot = await getDocs(
      collection(db, "chats", chatDoc.id, "messages")
    );

    messagesSnapshot.forEach((messageDoc) => {
      batch.delete(messageDoc.ref);
    });

    batch.delete(chatDoc.ref);
  }

  // 6. Executar todas as alterações no Firestore
  await batch.commit();

  // 7. Limpar dados locais da aplicação
  localStorage.clear();

  // 8. Apagar a conta anónima Firebase
  await deleteUser(user);
}
