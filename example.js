const { Client, Location, Poll, List, Buttons, LocalAuth } = require("./index");
const express = require("express");
const qrcode = require("qrcode");
const cors = require("cors"); // Adicione esta linha
// Inicializa o servidor Express
const app = express();
app.use(cors()); // Adicione esta linha

const client = new Client({
  authStrategy: new LocalAuth(),
  // proxyAuthentication: { username: 'username', password: 'password' },
  puppeteer: {
    args: ["--no-sandbox", "--disabled-setupid-sandbox"],
    headless: true,
  },
});

// Rota para fornecer o QR Code em formato JSON
app.get("/qrcode", (req, res) => {
  if (!qrCodeData) {
    res.json({ status: "loading", message: "Carregando sistema!" });
  } else if (qrCodeData === "READY") {
    res.json({ status: "ready", message: "Já funcional..." });
  } else {
    res.json({ status: "waiting", qrCode: qrCodeData });
  }
});

async function getPiada() {
  try {
    const response = await fetch("http://192.168.3.57:3003/piadas");
    const data = await response.json();
    return data.data.texto; // Retorna o valor "texto" da resposta
  } catch (error) {
    console.error("Erro ao buscar piada", error);
    return null; // Retorna null em caso de erro
  }
}
var vlrmin;
var vlrmax;
const extractNumber = (message) => {
  const parts = message.split(" ");
  if (parts.length > 1) {
    return parts[1].trim();
    // Retorna o segundo elemento, que é o número
  }
  return null;
};
async function getPlayers(minprice, maxprice) {
  try {
    // Faz a requisição para a nova API de scraping de jogadores
    const response = await fetch(
      `http://192.168.3.57:3005/jogadores?minprice=${minprice}&maxprice=${maxprice}`
    );
    const data = await response.text(); // Usamos text() pois a resposta é uma string simples
    return data; // Retorna a lista de jogadores e seus preços
  } catch (error) {
    console.error("Erro ao buscar jogadores", error);
    return null; // Retorna null em caso de erro
  }
}

// client initialize does not finish a at ready now.
client.initialize();

client.on("loading_screen", (percent, message) => {
  console.log("LOADING SCREEN", percent, message);
});

let qrCodeData = "";

// Rota para exibir o QR Code em uma página web
app.get("/", (req, res) => {
  if (!qrCodeData) {
    res.send("<h1>Carregando sistema!</h1>");
  } else if (qrCodeData == "READY") {
    res.send("<h1>Já funcional...</h1>");
  } else {
    res.send(`
            <html>
                <head>
                    <title>WhatsApp QR Code</title>
                </head>
                <body>
                    <h1>Escaneie o QR Code com seu celular</h1>
                    <img src="${qrCodeData}" alt="QR Code">
                </body>
            </html>
        `);
  }
});

// Inicializa o servidor na porta 3001
app.listen(3001, () => {
  console.log("Servidor rodando em http://localhost:3001");
});
// Pairing code only needs to be requested once
let pairingCodeRequested = false;
client.on("qr", async (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log("QR RECEIVED", qr);
  qrcode.toDataURL(qr, (err, url) => {
    if (err) {
      console.error("Erro ao gerar QR Code:", err);
      return;
    }
    qrCodeData = url;
  });
  // paiuting code example
  const pairingCodeEnabled = false;
  if (pairingCodeEnabled && !pairingCodeRequested) {
    const pairingCode = await client.requestPairingCode("96170100100"); // enter the target phone number
    console.log("Pairing code enabled, code: " + pairingCode);
    pairingCodeRequested = true;
  }
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", async () => {
  console.log("READY");
  qrCodeData = "READY";
  const debugWWebVersion = await client.getWWebVersion();
  console.log(`WWebVersion = ${debugWWebVersion}`);

  client.pupPage.on("pageerror", function (err) {
    console.log("Page error: " + err.toString());
  });
  client.pupPage.on("error", function (err) {
    console.log("Page error: " + err.toString());
  });
});
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Lista de variações possíveis de entrada
const variations = [
  "bom dia",
  "Bom dia",
  "BOM DIA",
  "bOm DiA",
  "buenos dias",
  "Buenos dias",
  "BUENOS DIAS",
  "bom diaa",
  "Bom diaa",
  "bommm dia",
  "bom diaaa",
  "bom-dia",
  "bomdia",
  "boa manhã",
  "Boa manhã",
  "bom dya",
  "good morning",
  "Good morning",
  "GOOD MORNING",
];

// Lista de respostas possíveis
const responses = [
  "Bom dia!!",
  "BOM DIA!!",
  "Bom dia fi, tudo bem?",
  "Bommm sou eu, o dia é só um detalhe! 🌞",
  "Buenos dias!",
  "salve!",
  "Um excelente dia pra você!",
  "Que seu dia seja incrível!",
  "Bom dia, fi!",
  "Dia",
  "Um ótimo dia",
  "Bom dia pra você",
  "Bom dia, chefe",
  "Bom dia, tudo certo?",
  "Bom dia, café? ☕",
  "Opa! Bom dia!",
];

client.on("message_create", async (msg) => {
  // Fired on all message creations, including your own
  let chat = await msg.getChat();
  if (msg.fromMe) {
    // do stuff here
  }

  if (msg.fromMe && msg.body.startsWith("!unpin")) {
    const pinnedMsg = await msg.getQuotedMessage();
    if (pinnedMsg) {
      // Will unpin a message
      const result = await pinnedMsg.unpin();
      console.log(result); // True if the operation completed successfully, false otherwise
    }
  } else if (msg.fromMe && msg.body.startsWith("Mor")) {
    sleep(1000);
    chat.sendMessage("Te amo");
  } else if (msg.fromMe && msg.body === "!piada") {
    sleep(3000);
    getPiada()
      .then((piada) => {
        chat.sendMessage("*piada das boas*\n\n" + piada);
      })
      .catch((error) => {
        chat.sendMessage("Erro ao buscar piada" + error);
      });
  } else if (msg.fromMe && msg.body === "!fifa" ) {
    //envia fifa pro parcero
    chat.sendMessage(
      "Bot *FIFA UT* do Felps\nQual valor mínimo quer buscar?\n\n_Responda com !vlrmin ou não funcionará. Exemplo: '!vlrmin 4000'_"
    );
  } else if (msg.fromMe && msg.body.startsWith("!vlrmin ")) {
    //envia fifa pro parcero
    vlrmin = extractNumber(msg.body);
    chat.sendMessage(
      "Bot *FIFA UT* do Felps\nQual valor máximo quer buscar?\n\n_Responda com !vlrmax ou não funcionará. Exemplo: '!vlrmax 15000'_"
    );
  } else if (msg.fromMe && msg.body.startsWith("!vlrmax ")) {
    //envia fifa pro parcero
    vlrmax = extractNumber(msg.body);
    getPlayers(vlrmin, vlrmax)
      .then((players) => {
        chat.sendMessage("*Jogadores e Preços*\n\n" + players);
      })
      .catch((error) => {
        chat.sendMessage("Erro ao buscar jogadores: " + error);
      });
  }
});
client.on("message", async (msg) => {
  console.log("MESSAGE RECEIVED", msg);
  let chat = await msg.getChat();
  const messageText = msg.body.toLowerCase();
  // if para bom dia
  if (
    variations.some((variation) => variation.toLowerCase() === messageText) &&
    !chat.isGroup
  ) {
    await sleep(2000);
    // Sorteia uma resposta
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    // Envia a resposta
    msg.reply(randomResponse);

    // Aguarda 2 segundos antes de responder
  } else if (msg.body === "ping" && !chat.isGroup) {
    client.sendMessage(msg.from, "pong");
  } else if (msg.body === "!piada") {
    //envia piada pro parcero
    msg.react("😂");
    sleep(3000);
    getPiada()
      .then((piada) => {
        chat.sendMessage("*piada das boas*\n\n" + piada);
      })
      .catch((error) => {
        chat.sendMessage("Erro ao buscar piada" + error);
      });
  } else if (msg.body === "!fifa" && !chat.isGroup) {
    //envia fifa pro parcero
    msg.reply(
      "Bot *FIFA UT* do Felps\nQual valor mínimo quer buscar?\n\n_Responda com !vlrmin ou não funcionará. Exemplo: '!vlrmin 4000'_"
    );
  } else if (msg.body.startsWith("!vlrmin ") && !chat.isGroup) {
    //envia fifa pro parcero
    vlrmin = extractNumber(msg.body);
    msg.reply(
      "Bot *FIFA UT* do Felps\nQual valor máximo quer buscar?\n\n_Responda com !vlrmax ou não funcionará. Exemplo: '!vlrmax 15000'_"
    );
  } else if (msg.body.startsWith("!vlrmax ") && !chat.isGroup) {
    //envia fifa pro parcero
    vlrmax = extractNumber(msg.body);
    getPlayers(vlrmin, vlrmax)
      .then((players) => {
        msg.reply("*Jogadores e Preços*\n\n" + players);
      })
      .catch((error) => {
        msg.reply("Erro ao buscar jogadores: " + error);
      });
  } else if (msg.body.startsWith("repete ") && !chat.isGroup) {
    msg.reply(msg.body.slice(7));
  } else if (msg.body === "!chats" && !chat.isGroup) {
    const chats = await client.getChats();
    client.sendMessage(msg.from, `The bot has ${chats.length} chats open.`);
  } else if (msg.body === "!info" && !chat.isGroup) {
    let info = client.info;
    client.sendMessage(
      msg.from,
      `
            *Connection info*
            User name: ${info.pushname}
            My number: ${info.wid.user}
            Platform: ${info.platform}
        `
    );
  } else if (msg.body === "!mediainfo" && msg.hasMedia && !chat.isGroup) {
    const attachmentData = await msg.downloadMedia();
    msg.reply(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
            Data (length): ${attachmentData.data.length}
        `);
  } else if (msg.body === "!quoteinfo" && msg.hasQuotedMsg && !chat.isGroup) {
    const quotedMsg = await msg.getQuotedMessage();

    quotedMsg.reply(`
            ID: ${quotedMsg.id._serialized}
            Type: ${quotedMsg.type}
            Author: ${quotedMsg.author || quotedMsg.from}
            Timestamp: ${quotedMsg.timestamp}
            Has Media? ${quotedMsg.hasMedia}
        `);
  } else if (msg.body === "!sendpoll" && !chat.isGroup) {
    /** By default the poll is created as a single choice poll: */
    await msg.reply(new Poll("Winter or Summer?", ["Winter", "Summer"]));
    /** If you want to provide a multiple choice poll, add allowMultipleAnswers as true: */
    await msg.reply(
      new Poll("Cats or Dogs?", ["Cats", "Dogs"], {
        allowMultipleAnswers: true,
      })
    );
    /**
     * You can provide a custom message secret, it can be used as a poll ID:
     * @note It has to be a unique vector with a length of 32
     */
    await msg.reply(
      new Poll("Cats or Dogs?", ["Cats", "Dogs"], {
        messageSecret: [
          1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      })
    );
  } /* else if (msg.body === '!resendmedia' && msg.hasQuotedMsg) {
			const quotedMsg = await msg.getQuotedMessage();
			if (quotedMsg.hasMedia) {
				const attachmentData = await quotedMsg.downloadMedia();
				client.sendMessage(msg.from, attachmentData, { caption: 'Here\'s your requested media.' });
			}
			if (quotedMsg.hasMedia && quotedMsg.type === 'audio') {
				const audio = await quotedMsg.downloadMedia();
				await client.sendMessage(msg.from, audio, { sendAudioAsVoice: true });
			}
		} else if (msg.body.startsWith('!status ')) {
			const newStatus = msg.body.split(' ')[1];
			await client.setStatus(newStatus);
			msg.reply(`Status was updated to *${newStatus}*`);
		}else if (msg.body === '!mute') {
			const chat = await msg.getChat();
			// mute the chat for 20 seconds
			const unmuteDate = new Date();
			unmuteDate.setSeconds(unmuteDate.getSeconds() + 20);
			await chat.mute(unmuteDate);
		} else if (msg.body === '!typing') {
			const chat = await msg.getChat();
			// simulates typing in the chat
			chat.sendStateTyping();
		} else if (msg.body === '!recording') {
			const chat = await msg.getChat();
			// simulates recording audio in the chat
			chat.sendStateRecording();
		} else if (msg.body === '!clearstate') {
			const chat = await msg.getChat();
			// stops typing or recording in the chat
			chat.clearState();
		}
		else if (msg.body === '!pin') {
			const chat = await msg.getChat();
			await chat.pin();
		} else if (msg.body === '!jumpto') {
			if (msg.hasQuotedMsg) {
				const quotedMsg = await msg.getQuotedMessage();
				client.interface.openChatWindowAt(quotedMsg.id._serialized);
			}
		} else if (msg.body === '!buttons') {
			let button = new Buttons('Button body', [{ body: 'bt1' }, { body: 'bt2' }, { body: 'bt3' }], 'title', 'footer');
			client.sendMessage(msg.from, button);
		} else if (msg.body === '!list') {
			let sections = [
				{ title: 'sectionTitle', rows: [{ title: 'ListItem1', description: 'desc' }, { title: 'ListItem2' }] }
			];
			let list = new List('List body', 'btnText', sections, 'Title', 'footer');
			client.sendMessage(msg.from, list);
		} else if (msg.body === '!reaction') {
			msg.react('👍');
		} else if (msg.body === '!edit') {
			if (msg.hasQuotedMsg) {
				const quotedMsg = await msg.getQuotedMessage();
				if (quotedMsg.fromMe) {
					quotedMsg.edit(msg.body.replace('!edit', ''));
				} else {
					msg.reply('I can only edit my own messages');
				}
			}
		} else if (msg.body === '!updatelabels') {
			const chat = await msg.getChat();
			await chat.changeLabels([0, 1]);
		} else if (msg.body === '!addlabels') {
			const chat = await msg.getChat();
			let labels = (await chat.getLabels()).map((l) => l.id);
			labels.push('0');
			labels.push('1');
			await chat.changeLabels(labels);
		} else if (msg.body === '!removelabels') {
			const chat = await msg.getChat();
			await chat.changeLabels([]);
		}else if (msg.body === '!statuses') {
			const statuses = await client.getBroadcasts();
			console.log(statuses);
			const chat = await statuses[0]?.getChat(); // Get user chat of a first status
			console.log(chat);
		}*/ else if (msg.body === "!pinmsg" && !chat.isGroup) {
    /**
     * Pins a message in a chat, a method takes a number in seconds for the message to be pinned.
     * WhatsApp default values for duration to pass to the method are:
     * 1. 86400 for 24 hours
     * 2. 604800 for 7 days
     * 3. 2592000 for 30 days
     * You can pass your own value:
     */
    const result = await msg.pin(60); // Will pin a message for 1 minute
    console.log(result); // True if the operation completed successfully, false otherwise
  }
});

client.on("message_ciphertext", (msg) => {
  // Receiving new incoming messages that have been encrypted
  // msg.type === 'ciphertext'
  msg.body = "Waiting for this message. Check your phone.";

  // do stuff here
});

client.on("message_revoke_everyone", async (after, before) => {
  // Fired whenever a message is deleted by anyone (including you)
  console.log(after); // message after it was deleted.
  if (before) {
    console.log(before); // message before it was deleted.
  }
});

client.on("message_revoke_me", async (msg) => {
  // Fired whenever a message is only deleted in your own view.
  console.log(msg.body); // message before it was deleted.
});

client.on("message_ack", (msg, ack) => {
  /*
	== ACK VALUES ==
	ACK_ERROR: -1
	ACK_PENDING: 0
	ACK_SERVER: 1
	ACK_DEVICE: 2
	ACK_READ: 3
	ACK_PLAYED: 4
	*/

  if (ack == 3) {
    // The message was read
  }
});

client.on("group_join", (notification) => {
  // User has joined or been added to the group.
  console.log("join", notification);
  notification.reply("User joined.");
});

client.on("group_leave", (notification) => {
  // User has left or been kicked from the group.
  console.log("leave", notification);
  notification.reply("User left.");
});

client.on("group_update", (notification) => {
  // Group picture, subject or description has been updated.
  console.log("update", notification);
});

client.on("change_state", (state) => {
  console.log("CHANGE STATE", state);
});

// Change to false if you don't want to reject incoming calls
let rejectCalls = true;

client.on("call", async (call) => {
  console.log("Call received, rejecting. GOTO Line 261 to disable", call);
  if (rejectCalls) await call.reject();
  await client.sendMessage(
    call.from,
    `[${call.fromMe ? "Outgoing" : "Incoming"}] Phone call from ${
      call.from
    }, type ${call.isGroup ? "group" : ""} ${
      call.isVideo ? "video" : "audio"
    } call. ${
      rejectCalls ? "This call was automatically rejected by the script." : ""
    }`
  );
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
});

client.on("contact_changed", async (message, oldId, newId, isContact) => {
  /** The time the event occurred. */
  const eventTime = new Date(message.timestamp * 1000).toLocaleString();

  console.log(
    `The contact ${oldId.slice(0, -5)}` +
      `${
        !isContact
          ? " that participates in group " +
            `${(await client.getChatById(message.to ?? message.from)).name} `
          : " "
      }` +
      `changed their phone number\nat ${eventTime}.\n` +
      `Their new phone number is ${newId.slice(0, -5)}.\n`
  );

  /**
   * Information about the @param {message}:
   *
   * 1. If a notification was emitted due to a group participant changing their phone number:
   * @param {message.author} is a participant's id before the change.
   * @param {message.recipients[0]} is a participant's id after the change (a new one).
   *
   * 1.1 If the contact who changed their number WAS in the current user's contact list at the time of the change:
   * @param {message.to} is a group chat id the event was emitted in.
   * @param {message.from} is a current user's id that got an notification message in the group.
   * Also the @param {message.fromMe} is TRUE.
   *
   * 1.2 Otherwise:
   * @param {message.from} is a group chat id the event was emitted in.
   * @param {message.to} is @type {undefined}.
   * Also @param {message.fromMe} is FALSE.
   *
   * 2. If a notification was emitted due to a contact changing their phone number:
   * @param {message.templateParams} is an array of two user's ids:
   * the old (before the change) and a new one, stored in alphabetical order.
   * @param {message.from} is a current user's id that has a chat with a user,
   * whos phone number was changed.
   * @param {message.to} is a user's id (after the change), the current user has a chat with.
   */
});

client.on("group_admin_changed", (notification) => {
  if (notification.type === "promote") {
    /**
     * Emitted when a current user is promoted to an admin.
     * {@link notification.author} is a user who performs the action of promoting/demoting the current user.
     */
    console.log(`You were promoted by ${notification.author}`);
  } else if (notification.type === "demote")
    /** Emitted when a current user is demoted to a regular user. */
    console.log(`You were demoted by ${notification.author}`);
});

client.on("group_membership_request", async (notification) => {
  /**
   * The example of the {@link notification} output:
   * {
   *     id: {
   *         fromMe: false,
   *         remote: 'groupId@g.us',
   *         id: '123123123132132132',
   *         participant: 'number@c.us',
   *         _serialized: 'false_groupId@g.us_123123123132132132_number@c.us'
   *     },
   *     body: '',
   *     type: 'created_membership_requests',
   *     timestamp: 1694456538,
   *     chatId: 'groupId@g.us',
   *     author: 'number@c.us',
   *     recipientIds: []
   * }
   *
   */
  console.log(notification);
  /** You can approve or reject the newly appeared membership request: */
  await client.approveGroupMembershipRequestss(
    notification.chatId,
    notification.author
  );
  await client.rejectGroupMembershipRequests(
    notification.chatId,
    notification.author
  );
});

client.on("message_reaction", async (reaction) => {
  console.log("REACTION RECEIVED", reaction);
});

client.on("vote_update", (vote) => {
  /** The vote that was affected: */
  console.log(vote);
});
