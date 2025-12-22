// Proxy utility to forward requests to the backend API
import { NextResponse } from "next/server";

const getBackendUrl = () => {
  // Get backend URL from environment variable or use default
  const backendUrl =
    process.env.BACKEND_API_URL || "http://95.111.224.58:3001/api";

  // Ensure it ends with /api
  if (!backendUrl.endsWith("/api")) {
    return backendUrl.endsWith("/") ? `${backendUrl}api` : `${backendUrl}/api`;
  }

  return backendUrl;
};

export async function proxyToBackend(path, request) {
  try {
    const backendBase = getBackendUrl();
    const url = `${backendBase}${path.startsWith("/") ? path : `/${path}`}`;

    // Get the authorization header from the incoming request
    const authHeader = request.headers.get("authorization");

    // Prepare headers

    const headers = {
      "Content-Type": "application/json",
    };

    // Only add Authorization header if it exists AND it's not a login/register endpoint
    // Login and register endpoints should not have Authorization headers
    const isAuthEndpoint =
      path.includes("/auth/login") || path.includes("/auth/register");
    if (authHeader && !isAuthEndpoint) {
      headers.Authorization = authHeader;
    }

    // Get request body if it exists
    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        body = await request.text();
      } catch (e) {
        // No body
      }
    }

    // Forward query parameters
    const urlObj = new URL(request.url);
    const searchParams = urlObj.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    // Make request to backend
    const response = await fetch(fullUrl, {
      method: request.method,
      headers,
      body: body || undefined,
    });

    // Get response body
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Log error responses for debugging
    if (!response.ok) {
      console.error(`Backend API error [${response.status}]:`, {
        path,
        url: fullUrl,
        status: response.status,
        response: responseData,
      });
    }

    // Return NextResponse with same status
    return NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { message: "Failed to connect to backend API", error: error.message },
      { status: 502 }
    );
  }
}
