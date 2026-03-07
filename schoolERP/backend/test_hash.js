import bcrypt from 'bcryptjs';

async function testHash() {
    const password = "123456";
    const hash = "$2b$10$cjIkMzgNNr3hWNAlOK/BqOG4ZsAAXfkGZjeZ9/8yZeQ.H.a9xEATy";

    try {
        const isMatch = await bcrypt.compare(password, hash);
        console.log("MATCH:", isMatch);
    } catch (e) {
        console.error("BCRYPT ERROR:", e.message);
    }
}

testHash();
