"use client";

import React from "react";

export default function UserProfile() {
  // Mock user data (replace with actual data from your API or context)
  const user = {
    username: "JohnDoe",
    _id: "1234567890abcdef",
    image: "https://via.placeholder.com/150", // Replace with actual image URL
  };

  return (
    <div className="container flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* User Image */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-md">
            <img
              src={user.image}
              alt={`${user.username}'s profile`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Username */}
          <h1 className="text-2xl font-semibold text-gray-800">
            {user.username}
          </h1>

          {/* User ID */}
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">User ID:</span>{" "}
            {user._id}
          </p>
        </div>
      </div>
    </div>
  );
}
