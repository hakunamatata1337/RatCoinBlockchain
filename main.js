const crypto = require("crypto"),
  SHA256 = (message) =>
    crypto.createHash("sha256").update(message).digest("hex");
const EC = require("elliptic").ec,
  ec = new EC("secp256k1");

class Block {
  constructor(timestamp = "", data = []) {
    this.timestamp = timestamp;
    this.data = data;
    this.hash = this.getHash();
    this.prevHash = "";
    this.nonce = 0;
  }

  getHash() {
    return SHA256(
      this.prevHash + this.timestamp + JSON.stringify(this.data) + this.nonce
    );
  }

  mine(difficulty) {
    // Basically, it loops until our hash starts with
    // the string 0...000 with length of <difficulty>.
    while (!this.hash.startsWith(Array(difficulty + 1).join("0"))) {
      // We increases our nonce so that we can get a whole different hash.
      this.nonce++;
      // Update our new hash with the new nonce value.
      this.hash = this.getHash();
    }
  }

  hasValidTransactions(chain) {
    return this.data.every((transaction) =>
      transaction.isValid(transaction, chain)
    );
  }
}

class Blockchain {
  constructor() {
    this.chain = [new Block(Date.now().toString())];
    this.difficulty = 1;
    this.blockTime = 30000;
    this.reward = 297;
    this.transactions = [];
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(block) {
    block.prevHash = this.getLastBlock().hash;

    block.hash = block.getHash();

    block.mine(this.difficulty);

    this.difficulty +=
      Date.now() - parseInt(this.getLastBlock().timestamp) < this.blockTime
        ? 1
        : -1;

    this.chain.push(Object.freeze(block));
  }

  addTransaction(transaction) {
    this.transactions.push(transaction);
  }

  mineTransactions(rewardAddress) {
    this.addBlock(
      new Block(Date.now().toString(), [
        new Transaction(CREATE_REWARD_ADDRESS, rewardAddress, this.reward),
        ...this.transactions,
      ])
    );

    this.transactions = [];
  }

  getBalance(address) {
    let balance = 0;

    this.chain.forEach((block) => {
      block.data.forEach((transaction) => {
        if (transaction.from === address) {
          balance -= transaction.amount;
        }

        if (transaction.to === address) {
          balance += transaction.amount;
        }
      });
    });

    return balance;
  }

  isValid(blockchain = this) {
    // Iterate over the chain, we need to set i to 1 because there are nothing before the genesis block, so we start at the second block.
    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain.chain[i];
      const prevBlock = blockchain.chain[i - 1];

      // Check validation
      if (
        currentBlock.hash !== currentBlock.getHash() ||
        prevBlock.hash !== currentBlock.prevHash
      ) {
        return false;
      }

      return true;
    }
  }
}

class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
  }

  sign(keyPair) {
    // Check if the public key matches the "from" address of the transaction
    if (keyPair.getPublic("hex") === this.from) {
      // Sign the transaction
      this.signature = keyPair
        .sign(SHA256(this.from + this.to + this.amount), "base64")
        .toDER("hex");
    }
  }

  isValid(tx, chain) {
    return (
      tx.from &&
      tx.to &&
      tx.amount &&
      chain.getBalance(tx.from) >= tx.amount &&
      ec
        .keyFromPublic(tx.from, "hex")
        .verify(SHA256(tx.from + tx.to + tx.amount + tx.gas), tx.signature)
    );
  }
}

module.exports = { Block, Blockchain };
