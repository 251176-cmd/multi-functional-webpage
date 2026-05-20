import { NextResponse } from "next/server";
import { z } from "zod";

type ChatMode = "support" | "faq" | "orders";

const ChatHistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(4000),
});

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  mode: z.enum(["support", "faq", "orders"]),
  history: z.array(ChatHistoryItemSchema).max(30),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

function normalize(s: string): string {
  // Purpose: Make lightweight intent checks stable (case, whitespace).
  return s.trim().toLowerCase();
}

function buildSuggestions(mode: ChatMode): string[] {
  // Purpose: Provide “different functions” as quick actions per mode.
  if (mode === "faq") {
    return ["What is this site?", "Where is the blog?", "How do I contact you?", "/help"];
  }
  if (mode === "orders") {
    return ["Track order #1234", "Refund policy", "Shipping times", "/help"];
  }
  return ["Reset my password", "Login help", "Admin login", "/help"];
}

function replyForFaq(message: string): string {
  const m = normalize(message);
  if (m.includes("blog")) return "You can browse posts on the Blog page. On the home page, use “View all” to see everything.";
  if (m.includes("contact")) return "Use the Contact page, or reply here with what you need and I’ll guide you to the right place.";
  if (m.includes("admin")) return "The admin area is under `/admin`. If OTP is enabled, you’ll be asked to verify before access.";
  if (m.includes("tech") || m.includes("stack")) return "This site is built with Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion.";
  return "I can answer questions about the site structure (pages, navigation, where to find things). Ask me what you’re trying to do.";
}

function replyForSupport(message: string): string {
  const m = normalize(message);
  if (m.includes("reset") && m.includes("password")) return "Try “Forgot password” on the login screen. If you don’t receive an email, check spam and confirm your email address is correct.";
  if (m.includes("login")) return "If login fails, double-check email/password, then try resetting your password. If your account needs verification, the API may require OTP first.";
  if (m.includes("otp")) return "OTP is a one-time code used to verify identity. If you’re not receiving it, confirm email settings and try again in a minute.";
  return "Tell me what you’re stuck on (login, OTP, password reset, admin access), and include any error message you see.";
}

function replyForOrders(message: string): string {
  const m = normalize(message);
  if (m.startsWith("track") || m.includes("order #") || m.includes("order")) {
    return "To track an order, send: `Track order #1234`. If you don’t have the number, share the email used at checkout.";
  }
  if (m.includes("refund")) return "Refunds are typically processed back to the original payment method after the return is received. Tell me your order number and I’ll outline the steps.";
  if (m.includes("shipping")) return "Shipping time depends on location and method. Share your region and whether it’s standard/express, and I’ll estimate timelines.";
  return "Ask about order tracking, shipping times, or refunds. If you have an order number, include it.";
}

function buildReply(req: ChatRequest): string {
  // Purpose: Provide deterministic, safe responses without external services.
  const msg = req.message.trim();
  const m = normalize(msg);

  // “Function” commands supported server-side as a fallback.
  if (m === "/help") {
    return "Commands: `/help`, `/clear`, `/export`. You can also switch modes (Support / FAQ / Orders) for different answers.";
  }

  if (req.mode === "faq") return replyForFaq(msg);
  if (req.mode === "orders") return replyForOrders(msg);
  return replyForSupport(msg);
}

/**
 * POST /api/chat
 *
 * Purpose:
 * - Provide lightweight “online chat” responses without an external provider.
 * - Offer mode-based behavior (Support / FAQ / Orders) and quick-action suggestions.
 *
 * Inputs:
 * - message: the user’s message.
 * - mode: which chat “function” is active.
 * - history: recent user/assistant messages for context (currently not used for deep reasoning).
 *
 * Output:
 * - JSON with reply and suggestions.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const reply = buildReply(parsed.data);
    const suggestions = buildSuggestions(parsed.data.mode);

    return NextResponse.json(
      {
        reply,
        suggestions,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

