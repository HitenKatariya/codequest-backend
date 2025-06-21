import users from '../models/auth.js'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
export const signup = async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        const extinguser = await users.findOne({ email });
        if (extinguser) {
            return res.status(409).json({ message: "User already exist" });
        }
        const hashedpassword = await bcrypt.hash(password, 12);
        // Only add phone if provided
        const newUserData = {
            name,
            email,
            password: hashedpassword
        };
        if (phone) newUserData.phone = phone;
        const newuser = await users.create(newUserData);
        const token = jwt.sign({
            email: newuser.email, id: newuser._id
        }, process.env.JWT_SECRET, { expiresIn: "1h" }
        )
        res.status(200).json({ result: newuser, token });
    } catch (error) {
        // Print the full error stack for debugging
        console.error("Signup error:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message, stack: error.stack });
        } else {
            res.status(500).json({ message: "something went wrong...", error });
        }
        return;
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const extinguser = await users.findOne({ email });
        if (!extinguser) {
            return res.status(404).json({ message: "User does not exists" })
        }
        const ispasswordcrct = await bcrypt.compare(password, extinguser.password);
        if (!ispasswordcrct) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({
            email: extinguser.email, id: extinguser._id
        }, process.env.JWT_SECRET, { expiresIn: "1h" }
        )

        res.status(200).json({ result: extinguser, token })
    } catch (error) {
        res.status(500).json({ message: "something went wrong...", error: error.message })
        return
    }
}

// Mock user creation for testing
export const createMockUsers = async (req, res) => {
    const mockUsers = [
        { name: "Alice", email: "alice@example.com", password: "password123" },
        { name: "Bob", email: "bob@example.com", password: "password123" },
        { name: "Charlie", email: "charlie@example.com", password: "password123" }
    ];
    try {
        const results = [];
        for (const user of mockUsers) {
            const existing = await users.findOne({ email: user.email });
            if (!existing) {
                const hashedpassword = await bcrypt.hash(user.password, 12);
                const newuser = await users.create({
                    name: user.name,
                    email: user.email,
                    password: hashedpassword
                });
                results.push({ email: newuser.email, status: 'created' });
            } else {
                results.push({ email: user.email, status: 'already exists' });
            }
        }
        res.status(200).json({ message: "Mock users processed", results });
    } catch (error) {
        res.status(500).json({ message: "Error creating mock users", error: error.message });
    }
};

// Improved form submission feedback for signup and login is already handled above with clear error messages and status codes.
