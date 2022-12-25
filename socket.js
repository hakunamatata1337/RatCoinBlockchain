
// BTW, I will import the required stuff too
const crypto = require("crypto"), SHA256 = message => crypto.createHash("sha256").update(message).digest("hex");
const { Block, Transaction, JeChain } = require("./main");
const EC = require("elliptic").ec, ec = new EC("secp256k1");

const MINT_PRIVATE_ADDRESS = "0700a1ad28a20e5b2a517c00242d3e25a88d84bf54dce9e1733e6096e6d6495e";
const MINT_KEY_PAIR = ec.keyFromPrivate(MINT_PRIVATE_ADDRESS, "hex");
const MINT_PUBLIC_ADDRESS = MINT_KEY_PAIR.getPublic("hex");

// Your key pair
const privateKey = process.env.PRIVATE_KEY || "62d101759086c306848a0c1020922a78e8402e1330981afe9404d0ecc0a4be3d";
const keyPair = ec.keyFromPrivate(privateKey, "hex");
const publicKey = keyPair.getPublic("hex");

// The real new code
const WS = require("ws");

const PORT = process.env.PORT || 3000;
const PEERS = process.env.PEERS ? process.env.PEERS.split(",") : [];
const MY_ADDRESS = process.env.MY_ADDRESS || "ws://localhost:3000";
const server = new WS.Server({ port: PORT });

console.log("Listening on PORT", PORT);

// I will add this one line for error handling:
process.on("uncaughtException", err => console.log(err));

// THE CONNECTION LISTENER
server.on("connection", async(socket, req) => {
    // Listens for messages
    socket.on("message", message => {
        // Parse the message from a JSON into an object 
        const _message = JSON.parse(message);

        switch(_message.type) {
            case "TYPE_HANDSHAKE":
                const nodes = _message.data;

                nodes.forEach(node => connect(node))

            // We will need to handle more types of messages in the future, so I have used a switch-case.
        }
    })
});

// THE CONNECT FUNCTION
async function connect(address) {
    // Get the socket from address
    const socket = new WS(address);

    // Connect to the socket using the "open" event
    socket.on("open", () => {
        // Send our address to the target 
        socket.send(JSON.stringify(produceMessage("TYPE_HANDSHAKE", [MY_ADDRESS])));
    });
}

function produceMessage(type, data) {
    return { type, data }
}