const {Telegraf, session, Stage, Markup}= require('telegraf')
const Scene = require ('telegraf/scenes/base')
const { Keyboard } = require('telegram-keyboard');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs } = require("firebase/firestore");
const {db} = require('./users')
const express = require('express')
const app = express();
const PORT = 4100

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const adminChatId = 6392652983;

const keyboard = Keyboard.make(["Murojaat yo'llash"]).reply()
const Adminkeyboard = Keyboard.make(["Murojaatchilar"]).reply()




async function forwardToAdmin(ctx) {

    try {
        // Forward the message to each admin
            await ctx.telegram.forwardMessage(adminChatId, ctx.message.chat.id, ctx.message.message_id);
    } catch (error) {
        console.error("Error forwarding message to admin:", error);
    }
}

async function saveToFirestore(ctx) {
    const { id: user_id, first_name, username } = ctx.message.chat;
    const userRef = doc(db, "users", `${user_id}`);

    // Get the current user data from Firestore
    const userSnapshot = await getDoc(userRef);
    let ideasArray = [];

    // If the user document exists, update the ideas array
    if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        ideasArray = userData.ideas || [];
    }

    // Add the new idea to the ideas array
    ideasArray.push(ctx.message.text);

    // Save the updated data back to Firestore
    await setDoc(userRef, {
        name: first_name || "",
        username: username || "", // In case username is undefined
        user_id: user_id,
        ideas: ideasArray
    });

    // Forward the user's name and ideas to admin
    await forwardToAdmin(ctx);
}



// Initialize Telegraf bot
const bot = new Telegraf('6788302229:AAH5CnCyaZGLvakxEE2lJnlj1ARjMaXRhEA');



bot.start((ctx) => {
    ctx.replyWithChatAction('typing');      
          if (ctx.message.chat.id === adminChatId) {
        ctx.replyWithHTML('Assalomu alaykum, <b>Admin</b>', Adminkeyboard);
    } else {
        setTimeout(async () => {
            ctx.replyWithHTML(`Assalomu alaykum, <b>${ctx.message.chat.first_name || ctx.message.chat.username}</b>!  <b>"XATIRCHI YOSHLARI"</b> kanali murojaat botiga xush kelibsiz!`, keyboard);
            await setDoc(doc(db, "users", `${ctx.message.chat.id}`), {
                name: `${ctx.message.chat.first_name}`,
                username: `${ctx.message.chat.username}`,
                user_id: `${ctx.message.chat.id}`,
            });
        }, 200);
    }
});


async function getAllUsers() {
  const usersCollection = collection(db, 'users');
  const usersSnapshot = await getDocs(usersCollection);
  const users = [];
  
  usersSnapshot.forEach((doc) => {
    users.push(doc.data());
  });

  return users;
}

// Modify your bot command to display all users
bot.hears('Murojaatchilar', async (ctx) => {
  ctx.reply('Barcha murojaatchilar...');
  
  try {
    const users = await getAllUsers();
    if (users.length > 0) {
      let usersList = "<b>Murojaatchilar ro'yxati:</b>\n\n";
      users.forEach(user => {
        usersList += `- <b>Ismi:</b> ${user.name || "Noma'lum"}\n <b>Username:</b> @${user.username || "Noma'lum"}\n <b>ID:</b> ${user.user_id}\n\n`;
      });
      ctx.replyWithHTML(usersList);
    } else {
      ctx.reply('Murojaatchi topilmadi.');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    ctx.reply('An error occurred while fetching users.');
  }
});


//Scene to request


const murojaatScene = new Scene('murojaatScene')

murojaatScene.enter(ctx=>ctx.reply('✍️ Murojaatingizni kiriting'))


murojaatScene.on('text', async (ctx)=>{
    const murojaatMatni = ctx.message.text
    if(!murojaatMatni){
        return ctx.reply('✍️ Murojaatingizni kiriting')
    }
    else{
        saveToFirestore(ctx)
        ctx.reply(' Murojaatingiz qabul qilindi')
        ctx.scene.leave();
    }
})


// Create a stage and register the scene
const stage = new Stage([murojaatScene]);
bot.use(session());
bot.use(stage.middleware());


bot.hears("Murojaat yo'llash", (ctx) => ctx.scene.enter('murojaatScene'));

bot.launch();
