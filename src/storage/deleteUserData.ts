import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
  type WriteBatch,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db } from "../firebaseFirestore";
import { auth } from "../firebaseAuth";

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

  // 4. Procurar denúncias e bloqueios criados pelo utilizador.
  // Estes documentos também contêm identificadores pessoais e devem ser
  // removidos quando o utilizador elimina a própria conta.
  const reportsQuery = query(
    collection(db, "reports"),
    where("reporterId", "==", uid)
  );
  const blocksQuery = query(
    collection(db, "blocks"),
    where("blockerId", "==", uid)
  );

  const [reportsSnapshot, blocksSnapshot] = await Promise.all([
    getDocs(reportsQuery),
    getDocs(blocksQuery),
  ]);

  // 5–7. Preparar operações e executá-las em lotes seguros.
  // Firestore limita cada batch a 500 operações; 400 deixa margem para
  // futuras alterações e impede que a eliminação falhe com contas grandes.
  const operations: Array<(batch: WriteBatch) => void> = [];
  const queueDelete = (ref: Parameters<WriteBatch["delete"]>[0]) => operations.push(batch => batch.delete(ref));
  const queueUpdate = (ref: Parameters<WriteBatch["update"]>[0], data: Record<string, unknown>) => operations.push(batch => batch.update(ref, data));

  const ownedPostIds = new Set(postsSnapshot.docs.map(postDoc => postDoc.id));
  postsSnapshot.forEach(postDoc => queueDelete(postDoc.ref));

  const reactionSnapshots = [yellowSnapshot, greenSnapshot, redSnapshot];
  const processedPosts = new Set<string>();
  reactionSnapshots.forEach(snapshot => {
    snapshot.forEach(postDoc => {
      // A post owned by the user is already queued for deletion. Never queue
      // an update for the same document in the same batch.
      if (ownedPostIds.has(postDoc.id) || processedPosts.has(postDoc.id)) return;
      processedPosts.add(postDoc.id);
      const data = postDoc.data();
      const updates: Record<string, unknown> = {};

      for (const reaction of ["yellow", "green", "red"] as const) {
        const users = data[`${reaction}LikedBy`];
        if (!Array.isArray(users)) continue;
        const filtered = users.filter((id: unknown) => id !== uid);
        if (filtered.length !== users.length) {
          updates[`${reaction}LikedBy`] = filtered;
          updates[`${reaction}Likes`] = filtered.length;
        }
      }
      if (Object.keys(updates).length) queueUpdate(postDoc.ref, updates);
    });
  });

  reportsSnapshot.forEach(reportDoc => queueDelete(reportDoc.ref));
  blocksSnapshot.forEach(blockDoc => queueDelete(blockDoc.ref));

  for (const chatDoc of chatsSnapshot.docs) {
    const data = chatDoc.data();
    const deletingOwnedChat = data.authorId === uid;
    const messagesSnapshot = await getDocs(collection(db, "chats", chatDoc.id, "messages"));
    messagesSnapshot.forEach(messageDoc => {
      // When removing an owned chat, delete its full message subcollection.
      // Firestore does not cascade subcollection deletes with the parent doc.
      if (deletingOwnedChat || messageDoc.data().senderId === uid) {
        queueDelete(messageDoc.ref);
      }
    });
    const participants = Array.isArray(data.participants) ? data.participants : [];
    const remainingParticipants = participants.filter((participant: unknown) => participant !== uid);

    // O campo authorId identifica estruturalmente o autor da conversa e as
    // regras não permitem alterá-lo. Se o autor apagar a conta, remover o
    // chat inteiro evita deixar uma conversa sem autor válido.
    if (remainingParticipants.length === 0 || data.authorId === uid) {
      queueDelete(chatDoc.ref);
      continue;
    }

    const updates: Record<string, unknown> = {
      participants: remainingParticipants,
      lastMessage: "",
      lastMessageAt: null,
    };
    queueUpdate(chatDoc.ref, updates);
  }

  for (let start = 0; start < operations.length; start += 400) {
    const batch = writeBatch(db);
    operations.slice(start, start + 400).forEach(operation => operation(batch));
    await batch.commit();
  }

  // 7. Limpar dados locais da aplicação
  localStorage.clear();

  // 8. Apagar a conta anónima Firebase
  await deleteUser(user);
}
