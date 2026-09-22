import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  where,
  limit
} from "firebase/firestore";
import { X, Send, Shield, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { db } from "../firebaseFirestore";
import { auth } from "../firebaseAuth";
import { SharePost } from "../types";

import { emitCompanionInteraction } from "../data/reactive/companionBrain/companionInteractionEvents";
import { blockCircleParticipant, reportCircleParticipant, requestCircleParticipantRemoval, leaveExperienceMatchCircle, subscribeBlockedUserIds } from "../data/community/experienceMatchingService";

interface CommunityChatProps {
  post: SharePost;
  onClose: () => void;
  initialChatId?: string | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt?: any;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({
  post,
  onClose,
  initialChatId = null
}) => {
  const { t } = useTranslation();

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isExperienceGroup = Boolean(initialChatId?.startsWith("circle_"));
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [safetyTarget, setSafetyTarget] = useState<string | null>(null);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  const currentUser = auth.currentUser;

  useEffect(() => subscribeBlockedUserIds(setBlockedUserIds), []);

  /*
   * Descobre com quem a conversa deve acontecer.
   *
   * Se somos o autor da publicação:
   *   -> procuramos quem deu ❤️
   *
   * Se somos quem deu ❤️:
   *   -> conversamos com o autor da publicação.
   */
  const getOtherUserId = (): string | null => {
    if (!currentUser) return null;

    // Somos o autor da publicação.
    if (currentUser.uid === post.authorId) {
      const reactedUserIds = [
        ...(Array.isArray((post as any).yellowLikedBy) ? (post as any).yellowLikedBy : []),
        ...(Array.isArray((post as any).greenLikedBy) ? (post as any).greenLikedBy : []),
        ...(Array.isArray((post as any).redLikedBy) ? (post as any).redLikedBy : [])
      ];

      const otherUser = reactedUserIds.find(
        (uid: string) => uid !== currentUser.uid
      );

      return otherUser || null;
    }

    // Somos a pessoa que deu ❤️.
    return post.authorId || null;
  };

  useEffect(() => {
    if (!isExperienceGroup || !initialChatId) return;
    const stop = onSnapshot(doc(db, "experienceMatchCircles", initialChatId), snap => {
      const data = snap.data();
      setGroupParticipants(Array.isArray(data?.participants) ? data.participants : []);
      setChatId(snap.exists() ? initialChatId : null);
      setLoading(false);
    });
    return () => stop();
  }, [isExperienceGroup, initialChatId]);

  // Criar ou encontrar a conversa
  useEffect(() => {
    let cancelled = false;

    const createOrFindChat = async () => {
      if (isExperienceGroup) return;
      try {
        setLoading(true);

        let user = auth.currentUser;

        if (!user) {
          await new Promise<void>((resolve, reject) => {
            const unsubscribeAuth = auth.onAuthStateChanged((authUser) => {
              unsubscribeAuth();

              if (authUser) {
                resolve();
              } else {
                reject(new Error("Utilizador não autenticado."));
              }
            });
          });

          user = auth.currentUser;
        }

        if (!user || !post.authorId || cancelled) {
          setLoading(false);
          return;
        }

        const myUid = user.uid;

        // Uma notificação não lida identifica uma conversa concreta.
        // Usar esse ID evita abrir o chat errado quando várias pessoas
        // responderam à mesma publicação.
        if (initialChatId) {
          const requestedChat = await getDoc(doc(db, "chats", initialChatId));
          const requestedData = requestedChat.data();
          if (
            requestedChat.exists() &&
            Array.isArray(requestedData?.participants) &&
            requestedData.participants.includes(myUid) &&
            requestedData.postId === post.id
          ) {
            if (!cancelled) {
              setChatId(initialChatId);
              setLoading(false);
            }
            return;
          }
        }

        /*
         * PRIMEIRO:
         * Procuramos diretamente uma conversa existente
         * para este utilizador e esta publicação.
         *
         * Isto permite que A e B encontrem exatamente
         * o mesmo chat, mesmo que redLikedBy já não contenha
         * o UID do outro utilizador.
         */
        const chatsQuery = query(
          collection(db, "chats"),
          where("participants", "array-contains", myUid),
          where("postId", "==", post.id)
        );

        const chatsSnapshot = await getDocs(chatsQuery);

        if (!chatsSnapshot.empty) {
          const existingChat = chatsSnapshot.docs[0];

          if (import.meta.env.DEV) {
            console.debug("[Confia] Existing private chat found.");
          }

          if (!cancelled) {
            setChatId(existingChat.id);
            setLoading(false);
          }

          return;
        }

        /*
         * Se não existe chat, tentamos descobrir o outro
         * utilizador para criar a conversa.
         */
        let otherUserId: string | null = null;

        if (myUid !== post.authorId) {
          otherUserId = post.authorId;
        } else {
          const reactedUserIds = [
            ...(Array.isArray(post.yellowLikedBy) ? post.yellowLikedBy : []),
            ...(Array.isArray(post.greenLikedBy) ? post.greenLikedBy : []),
            ...(Array.isArray(post.redLikedBy) ? post.redLikedBy : [])
          ];

          otherUserId =
            reactedUserIds.find(
              (uid: string) => uid !== myUid
            ) || null;
        }

        if (!otherUserId || otherUserId === myUid) {
          if (import.meta.env.DEV) {
            console.debug("[Confia] Private chat participant is not available yet.");
          }

          setLoading(false);
          return;
        }

        const participants = [
          myUid,
          otherUserId
        ].sort();

        const newChatId =
          `${post.id}_${participants[0]}_${participants[1]}`;

        const chatRef = doc(db, "chats", newChatId);
        const chatSnapshot = await getDoc(chatRef);

        if (!chatSnapshot.exists()) {
          await setDoc(chatRef, {
            participants,
            postId: post.id,
            authorId: post.authorId,
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastMessageAt: serverTimestamp()
          });
        }

        if (!cancelled) {
          setChatId(newChatId);
          setLoading(false);
        }

      } catch (error) {
        console.error("Erro ao iniciar chat:", error);

        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    createOrFindChat();

    return () => {
      cancelled = true;
    };
  }, [post.id, post.authorId, initialChatId, isExperienceGroup]);

  // Escutar mensagens em tempo real
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(
      db,
      isExperienceGroup ? "experienceMatchCircles" : "chats",
      chatId,
      "messages"
    );

    // Mantemos a conversa limitada às 100 mensagens mais recentes.
    // Isto evita leituras ilimitadas à medida que a conversa cresce.
    const messagesQuery = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const loadedMessages: ChatMessage[] =
          snapshot.docs
            .map((messageDoc) => ({
              id: messageDoc.id,
              ...(messageDoc.data() as Omit<ChatMessage, "id">)
            }))
            .reverse();

        setMessages(loadedMessages);
      },
      (error) => {
        console.error("Erro ao carregar mensagens:", error);
      }
    );

    return () => unsubscribe();
  }, [chatId, isExperienceGroup]);

  const handleSend = async () => {
    const text = message.trim();

    if (!text || !currentUser || sending) {
      return;
    }

    setSending(true);

    try {
      let activeChatId = chatId;

      if (isExperienceGroup && activeChatId) {
        await addDoc(collection(db, "experienceMatchCircles", activeChatId, "messages"), { senderId: currentUser.uid, text, createdAt: serverTimestamp() });
        emitCompanionInteraction("community_interaction", "community");
        setMessage("");
        return;
      }

      // Se o chat ainda não foi criado, cria/encontra agora.
      if (!activeChatId) {
        const otherUserId = getOtherUserId();

        if (!otherUserId) {
          console.error(
            "Não foi possível identificar o outro participante."
          );
          return;
        }

        if (otherUserId === currentUser.uid) {
          console.error(
            "Tentativa de criar conversa consigo próprio."
          );
          return;
        }

        const participants = [
          currentUser.uid,
          otherUserId
        ].sort();

        const newChatId =
          `${post.id}_${participants[0]}_${participants[1]}`;

        const chatRef = doc(db, "chats", newChatId);
        const chatSnapshot = await getDoc(chatRef);

        if (!chatSnapshot.exists()) {
          await setDoc(chatRef, {
            participants,
            postId: post.id,
            authorId: post.authorId,
            createdAt: serverTimestamp(),
            lastMessage: "",
            lastMessageAt: serverTimestamp()
          });
        }

        activeChatId = newChatId;
        setChatId(newChatId);
      }

      // Enviar mensagem.
      await addDoc(
        collection(
          db,
          "chats",
          activeChatId,
          "messages"
        ),
        {
          senderId: currentUser.uid,
          text,
          createdAt: serverTimestamp()
        }
      );

      // Atualizar última mensagem do chat e indicar
      // qual participante ainda não a leu.
      const activeChatRef = doc(db, "chats", activeChatId);
      const activeChatSnapshot = await getDoc(activeChatRef);

      const activeParticipants: string[] =
        activeChatSnapshot.exists() &&
        Array.isArray(activeChatSnapshot.data().participants)
          ? activeChatSnapshot.data().participants
          : [];

      const unreadBy = activeParticipants.filter(
        (uid: string) => uid !== currentUser.uid
      );

      await updateDoc(
        activeChatRef,
        {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          lastSenderId: currentUser.uid,
          unreadBy
        }
      );

      emitCompanionInteraction(
        "community_interaction",
        "community"
      );

      setMessage("");

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSending(false);
    }
  };

  const safetyAction = async (action: "block" | "report" | "remove" | "leave") => {
    if (!isExperienceGroup || !chatId || !currentUser || safetyBusy) return;
    setSafetyBusy(true);
    try {
      if (action === "leave") { await leaveExperienceMatchCircle(chatId); onClose(); return; }
      if (!safetyTarget) return;
      if (action === "block") { await blockCircleParticipant(chatId, safetyTarget); if (groupParticipants.length === 2) onClose(); }
      if (action === "report") await reportCircleParticipant(chatId, safetyTarget, "Comportamento inadequado na conversa de grupo");
      if (action === "remove") await requestCircleParticipantRemoval(chatId, safetyTarget);
      setSafetyOpen(false); setSafetyTarget(null);
    } catch (error) { console.error("Erro na ação de segurança da comunidade:", error); } finally { setSafetyBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/30 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[650px] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden">

        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#FFF8F4]">
          <div>
            <h2 className="text-sm font-black text-[#2F2926]">
              {isExperienceGroup ? t("experienceMatching.groupName") : t("communityChat")}
            </h2>

            <p className="text-[10px] text-[#934A38] font-semibold mt-0.5">
              {isExperienceGroup ? t("experienceMatching.groupMembers", { count: groupParticipants.length }) : post.userName}
            </p>
          </div>

          <div className="flex items-center gap-2">
          {isExperienceGroup && <button type="button" onClick={() => setSafetyOpen(v => !v)} className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-500" aria-label={t("communitySafety.menu")}><MoreVertical size={17}/></button>}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#934A38] transition-colors"
            aria-label={t("close")}
          >
            <X size={18} />
          </button></div>
        </div>
        {isExperienceGroup && safetyOpen && <div className="border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-[#6D5A53]"><Shield size={14}/>{t("communitySafety.title")}</div>
          <div className="mt-2 flex gap-2 overflow-x-auto">{groupParticipants.filter(uid => uid !== currentUser?.uid).map((uid,index)=><button key={uid} type="button" onClick={()=>setSafetyTarget(uid)} className={(safetyTarget===uid?"bg-[#3F2C27] text-white":"bg-[#F7F5F2] text-[#6D5A53]")+" shrink-0 rounded-full px-3 py-2 text-[9px] font-bold"}>{t("communitySafety.participant",{count:index+1})}</button>)}</div>
          {safetyTarget && <div className="mt-3 grid grid-cols-2 gap-2"><button disabled={safetyBusy} onClick={()=>safetyAction("block")} className="rounded-xl bg-[#FFF1EC] p-2 text-[9px] font-black text-[#A6533D]">{groupParticipants.length===2?t("communitySafety.endAndBlock"):t("communitySafety.block")}</button><button disabled={safetyBusy} onClick={()=>safetyAction("report")} className="rounded-xl bg-[#FFF1EC] p-2 text-[9px] font-black text-[#A6533D]">{t("communitySafety.report")}</button>{groupParticipants.length>=3&&<button disabled={safetyBusy} onClick={()=>safetyAction("remove")} className="col-span-2 rounded-xl bg-[#F7F5F2] p-2 text-[9px] font-black text-[#6D5A53]">{t("communitySafety.requestRemoval")}</button>}</div>}
          <button disabled={safetyBusy} onClick={()=>safetyAction("leave")} className="mt-3 w-full py-2 text-[9px] font-bold text-slate-500">{t("communitySafety.leave")}</button>
          <p className="mt-1 text-[9px] leading-4 text-slate-400">{t("communitySafety.privateNote")}</p>
        </div>}

        {/* Contexto da conversa: mantém visível a publicação que originou o apoio. */}
        <div className="border-b border-slate-100 bg-white px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFF3EC] px-2.5 py-1 text-[9px] font-black text-[#934A38]">
              {post.feeling}
            </span>
            {post.topic && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                #{post.topic.replace(/-/g, " ")}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-5 text-[#6D5A53]">
            {post.message}
          </p>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFCFA]">

          {loading ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs text-slate-400">
                {t("chatLoading")}
              </span>
            </div>

          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center px-8">
              <div>
                <div className="text-3xl mb-3">💬</div>

                <p className="text-xs font-bold text-[#2F2926]">
                  {t("chatEmpty")}
                </p>

                <p className="text-[10px] text-slate-400 mt-1">
                  {t("chatStartMessage")}
                </p>
              </div>
            </div>

          ) : (
            messages.filter(item => item.senderId === currentUser?.uid || !blockedUserIds.includes(item.senderId)).map((item) => {
              const mine =
                item.senderId === currentUser?.uid;

              return (
                <div
                  key={item.id}
                  className={`flex ${
                    mine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      mine
                        ? "bg-[#934A38] text-white rounded-br-md"
                        : "bg-white text-[#2F2926] border border-slate-100 rounded-bl-md"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Campo de mensagem */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-end gap-2">

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("chatPlaceholder")}
              maxLength={2000}
              rows={1}
              className="flex-1 resize-none rounded-2xl bg-[#F7F5F2] border border-[#B85F48]/10 px-4 py-3 text-xs text-[#2F2926] outline-none focus:border-[#934A38]/30"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="w-11 h-11 shrink-0 rounded-2xl bg-[#934A38] text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
              aria-label={t("chatSend")}
            >
              <Send size={17} />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
