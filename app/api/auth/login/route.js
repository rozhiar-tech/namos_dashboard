import { NextResponse } from "next/server";

// Simple authentication - in production, you should validate against a database
// For now, we'll accept any phone/password and return an admin user
// You can add proper validation later
export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { message: "Phone and password are required" },
        { status: 400 }
      );
    }

    // TODO: Replace this with actual authentication logic
    // For now, accept any credentials and return an admin user
    // In production, validate against your database/backend
    
    // If you have an external backend, you can proxy the request:
    // const backendUrl = process.env.BACKEND_API_URL || "http://95.111.224.58:3001/api";
    // const response = await fetch(`${backendUrl}/auth/login`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ phone, password }),
    // });
    // return NextResponse.json(await response.json());

    // Mock response for now
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const user = {
      id: 1,
      phone: phone,
      role: "admin",
      fullName: "Admin User",
    };

    return NextResponse.json({
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

