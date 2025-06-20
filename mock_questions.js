import mongoose from "mongoose";
import Question from "./models/Question.js";
import dotenv from "dotenv";
dotenv.config();

const questions = [
  {
    questiontitle: "How to print \"Hello, World!\" in Python?",
    questionbody: "I'm new to programming and just started learning Python. I want to print the text \"Hello, World!\" on the screen.\nWhat is the correct syntax to do this in Python?",
    questiontags: ["python", "beginners", "print", "syntax"],
    userposted: "MockUser",
    userid: "mockid1"
  },
  {
    questiontitle: "Why do we use 'using namespace std;' in C++?",
    questionbody: "While learning C++, I often see the line `using namespace std;` in many code examples.\nCan someone explain why it's used and if it's necessary? Are there cases where it should be avoided?",
    questiontags: ["c++", "namespaces", "std", "beginner"],
    userposted: "MockUser",
    userid: "mockid2"
  },
  {
    questiontitle: "How to reverse a string in Java without using built-in functions?",
    questionbody: "I want to reverse a string manually in Java without using built-in functions like `StringBuilder.reverse()`.\nCan anyone provide a simple way to do this using loops or arrays?",
    questiontags: ["java", "strings", "algorithms", "interview-question"],
    userposted: "MockUser",
    userid: "mockid3"
  },
  {
    questiontitle: "What is the difference between stack and heap memory in C?",
    questionbody: "I’m trying to understand how memory works in C. I’ve read about stack and heap memory, but I’m still confused.\nWhen exactly is each used, and what are the pros and cons of stack vs heap in terms of allocation, access speed, and scope?",
    questiontags: ["c", "memory-management", "stack", "heap"],
    userposted: "MockUser",
    userid: "mockid4"
  },
  {
    questiontitle: "Why does ESP32 development often use FreeRTOS with tasks instead of simple loops?",
    questionbody: "I'm building an IoT application using the ESP32 and noticed that many examples use FreeRTOS with tasks rather than a simple infinite loop (`while(1)`).\nWhy is this approach preferred? What benefits does task scheduling with FreeRTOS provide, especially for time-critical or multi-component systems?",
    questiontags: ["esp32", "freertos", "embedded", "rtos", "multitasking"],
    userposted: "MockUser",
    userid: "mockid5"
  }
];

async function insertQuestions() {
  await mongoose.connect(process.env.MONGODB_URL);
  await Question.insertMany(questions);
  console.log("Mock questions inserted.");
  process.exit();
}

insertQuestions();
