const crypto = require('crypto')
const secret = process.env.ENCRYPTED_SECRET || 'vonageCSEwhatsappAgent'

const encrypt = (apiKey) => {
    const iv = Buffer.from(crypto.randomBytes(16));
    const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(secret), iv);
    const encryptedApiKey = Buffer.concat([
        cipher.update(apiKey), 
        cipher.final(),
    ]);
    return {
        iv: iv.toString('hex'),
        apiKey: encryptedApiKey.toString('hex')
    }
};

const decrypt = (encryption) =>  {
    const decipher = crypto.createDecipheriv(
        'aes-256-ctr',
        Buffer.from(secret),
        Buffer.from(encryption.iv, "hex")
    );
    const decryptedApiKey = Buffer.concat([
        decipher.update(Buffer.from(encryption.apiKey, 'hex')), 
        decipher.final(),
    ]);
    return decryptedApiKey.toString()
}

module.exports = {encrypt, decrypt}