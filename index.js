const { Telegraf, Scenes, session  } = require('telegraf');
const { Keyboard } = require('telegram-keyboard');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs } = require("firebase/firestore");
const {db} = require('./users')
const { WizardScene } = Scenes; // Move this line here
const express = require('express')
const app = express();
const PORT = 4100

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const adminChatId = 6156133103;

const keyboard = Keyboard.make(["Murojaat yo'llash"]).reply()
const Adminkeyboard = Keyboard.make(["Murojaatchilar"]).reply()

// Scene 1: Name Scene
const nameScene = new WizardScene('nameScene',
    (ctx) => {
        ctx.reply("Ism va familiyangizni kiriting:");
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.session.fullName = ctx.message.text;
        await ctx.reply("Murojaatingizni kiriting:");
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.session.ideas = ctx.message.text;
        // Save to Firestore
        await saveToFirestore(ctx, ctx.session);
        ctx.reply("Murojaatingiz qabul qilindi!");
        return ctx.scene.leave();
    }
);


async function forwardToAdmin(ctx, data) {
    // Replace ADMIN_CHAT_ID with the chat ID of the admin

    try {
        // Forward the message to the admin
        await ctx.telegram.forwardMessage(adminChatId, ctx.message.chat.id, ctx.message.message_id);
    } catch (error) {
        console.error("Error forwarding message to admin:", error);
    }
}

async function saveToFirestore(ctx, data) {
    console.log("Session data:", data);
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
    ideasArray.push(data.ideas);

    // Save the updated data back to Firestore
    await setDoc(userRef, {
        name: first_name || "",
        username: username || "", // In case username is undefined
        user_id: user_id,
        ideas: ideasArray
    });

    // Forward the user's name and ideas to admin
    await forwardToAdmin(ctx, data);
}

// Scene 2: Ideas Scene
const ideasScene = new WizardScene('ideasScene',
    (ctx) => {
        ctx.reply("Murojaatingizni kiriting:");
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.session.ideas = ctx.message.text;
        // Save to Firestore
        await saveToFirestore(ctx.session);
        ctx.reply("Ma'lumotlar qabul qilindi!");
        return ctx.scene.leave();
    }
);

// Middleware to handle `/start` command
const stage = new Scenes.Stage([nameScene, ideasScene]); 


// Initialize Telegraf bot
const bot = new Telegraf('6788302229:AAH5CnCyaZGLvakxEE2lJnlj1ARjMaXRhEA');

bot.use(session());
bot.use(stage.middleware());

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
    // Leave the current scene
    ctx.scene.leave();
});

// Command handler for "Murojaat yo'llash"
bot.hears("Murojaat yo'llash", async (ctx) => {
    // Start the Name Scene
    ctx.scene.enter('nameScene');
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


bot.launch();