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
  where
} from "firebase/firestore";
import { X, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { db, auth } from "../firebase";
import { SharePost } from "../types";

interface CommunityChatProps {
  post: SharePost;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt?: any;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({
  post,
  onClose
}) => {
  const { t } = useTranslation();

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const currentUser = auth.currentUser;

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
console.log("MEU UID:", currentUser.uid);
console.log("AUTOR DO POST:", post.authorId);
console.log("NOME DO POST:", post.userName);
console.log("RED LIKED BY:", post.redLikedBy);
console.log("================================");
console.log("CHAT DEBUG - post:", post);
console.log("CHAT DEBUG - redLikedBy:", (post as any).redLikedBy);



    // Somos o autor da publicação.
    if (currentUser.uid === post.authorId) {
      const redLikedBy = Array.isArray((post as any).redLikedBy)
        ? (post as any).redLikedBy
        : [];

      const otherUser = redLikedBy.find(
        (uid: string) => uid !== currentUser.uid
      );

      return otherUser || null;
    }

    // Somos a pessoa que deu ❤️.
    return post.authorId || null;
  };

  // Criar ou encontrar a conversa
  useEffect(() => {
    let cancelled = false;

    const createOrFindChat = async () => {
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

        console.log("CHAT - MEU UID:", myUid);
        console.log("CHAT - AUTOR DO POST:", post.authorId);

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

          console.log(
            "CHAT EXISTENTE ENCONTRADO:",
            existingChat.id
          );

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
          const redLikedBy = Array.isArray(post.redLikedBy)
            ? post.redLikedBy
            : [];

          otherUserId =
            redLikedBy.find(
              (uid: string) => uid !== myUid
            ) || null;
        }

        if (!otherUserId || otherUserId === myUid) {
          console.log(
            "Ainda não foi possível identificar o outro participante."
          );

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

          console.log("NOVO CHAT CRIADO:", newChatId);
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
  }, [post.id, post.authorId]);

  // Escutar mensagens em tempo real
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(
      db,
      "chats",
      chatId,
      "messages"
    );

    const messagesQuery = query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const loadedMessages: ChatMessage[] =
          snapshot.docs.map((messageDoc) => ({
            id: messageDoc.id,
            ...(messageDoc.data() as Omit<ChatMessage, "id">)
          }));

        setMessages(loadedMessages);
      },
      (error) => {
        console.error("Erro ao carregar mensagens:", error);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    const text = message.trim();

    if (!text || !currentUser || sending) {
      return;
    }

    setSending(true);

    try {
      let activeChatId = chatId;

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

      // Atualizar última mensagem do chat.
      await updateDoc(
        doc(db, "chats", activeChatId),
        {
          lastMessage: text,
          lastMessageAt: serverTimestamp()
        }
      );

      setMessage("");

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/30 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[650px] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden">

        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#FFF8F4]">
          <div>
            <h2 className="text-sm font-black text-[#4E3B36]">
              {t("communityChat")}
            </h2>

            <p className="text-[10px] text-[#C97B5E] font-semibold mt-0.5">
              {post.userName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#C97B5E] transition-colors"
            aria-label={t("close")}
          >
            <X size={18} />
          </button>
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

                <p className="text-xs font-bold text-[#4E3B36]">
                  {t("chatEmpty")}
                </p>

                <p className="text-[10px] text-slate-400 mt-1">
                  {t("chatStartMessage")}
                </p>
              </div>
            </div>

          ) : (
            messages.map((item) => {
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
                        ? "bg-[#C97B5E] text-white rounded-br-md"
                        : "bg-white text-[#4E3B36] border border-slate-100 rounded-bl-md"
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
              className="flex-1 resize-none rounded-2xl bg-[#FAF5F0] border border-[#E5A88B]/10 px-4 py-3 text-xs text-[#4E3B36] outline-none focus:border-[#C97B5E]/30"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="w-11 h-11 shrink-0 rounded-2xl bg-[#C97B5E] text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
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
