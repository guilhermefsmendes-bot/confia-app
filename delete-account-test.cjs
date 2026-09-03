const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInAnonymously,
  deleteUser
} = require("firebase/auth");

const {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc
} = require("firebase/firestore");


const firebaseConfig = {
  apiKey: "AIzaSyAwtwdj3eyWl12DNh1Evsot9kICaj4c3PU",
  authDomain: "confia-b952e.firebaseapp.com",
  projectId: "confia-b952e",
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


async function test() {

  // Criar utilizador
  await signInAnonymously(auth);

  const user = auth.currentUser;

  console.log("Utilizador:", user.uid);


  // Criar post
  const post = await addDoc(collection(db,"posts"),{
    authorId:user.uid,
    message:"Teste eliminação conta",
    yellowLikes:0,
    greenLikes:0,
    redLikes:0,
    yellowLikedBy:[],
    greenLikedBy:[],
    redLikedBy:[]
  });

  console.log("Post criado:",post.id);


  // Criar chat
  const chatId = "teste-delete-" + Date.now();

  await setDoc(doc(db,"chats",chatId),{
    participants:[
      user.uid,
      "utilizador-teste"
    ],
    postId:post.id,
    authorId:user.uid
  });


  console.log("Chat criado:",chatId);


  // Simular eliminação
  await deleteDoc(doc(db,"posts",post.id));
  await deleteDoc(doc(db,"chats",chatId));


  console.log("Dados apagados");


  await deleteUser(user);

  console.log("Conta apagada com sucesso");

}

test();
