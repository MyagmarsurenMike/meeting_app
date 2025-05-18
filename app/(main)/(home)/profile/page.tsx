"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AvatarSelector from "@/components/AvatarSelector";
import { Input }from "@/components/ui/input";

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    bio: "",
    joined: "",
    profileImage: "/assets/profile-placeholder.png",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    imageUrl: "",
  });
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    error: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState("");

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token") || "";
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        if (!data.success || !data.user) {
          throw new Error("Invalid response format");
        }

        const userData = data.user;
        const joinDate = new Date(userData.createdAt || Date.now());
        const formattedDate = joinDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        setUser({
          name:
            `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
            userData.username ||
            "Anonymous User",
          email: userData.email || "",
          bio: userData.bio || "No bio available",
          joined: formattedDate,
          profileImage: userData.imageUrl || "/assets/profile-placeholder.png",
        });
      } catch (err) {
        setError("Could not load your profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setEditForm({
        firstName,
        lastName,
        bio: user.bio === "No bio available" ? "" : user.bio,
        imageUrl:
          user.profileImage === "/assets/profile-placeholder.png"
            ? ""
            : user.profileImage,
      });
      setSelectedAvatar(user.profileImage);
    }
  }, [isEditing, user]);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdateStatus({ loading: true, error: "" });

    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          bio: editForm.bio,
          imageUrl: selectedAvatar || user.profileImage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUser((prevUser) => ({
        ...prevUser,
        name:
          `${editForm.firstName || ""} ${editForm.lastName || ""}`.trim() ||
          "Anonymous User",
        bio: editForm.bio || "No bio available",
        profileImage: selectedAvatar || "/assets/profile-placeholder.png",
      }));
      setIsEditing(false);
      setUpdateStatus({ loading: false, error: "" });
    } catch (err) {
      setUpdateStatus({
        loading: false,
        error: "Failed to update profile. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-xl">Loading your profile...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
        <Link href="/" className="mt-4 text-blue-600 hover:underline">
          Return to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center pt-20 px-4 sm:px-8 md:px-16 bg-gray-50 pb-16">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Profile header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        </div>

        {/* Profile content */}
        <div className="p-6 md:p-8">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4 md:w-1/3">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-blue-100 shadow-md">
                    <Image
                      src={selectedAvatar || "/assets/profile-placeholder.png"}
                      alt="Profile Preview"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <AvatarSelector
                    selectedAvatar={selectedAvatar}
                    onSelect={setSelectedAvatar}
                  />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            firstName: e.target.value,
                          })
                        }
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bio: e.target.value })
                      }
                      rows={4}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us a little about yourself..."
                    />
                  </div>

                  {updateStatus.error && (
                    <p className="text-red-500 text-sm">{updateStatus.error}</p>
                  )}

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateStatus.loading}
                      className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {updateStatus.loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center gap-4 md:w-1/3 my-auto">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg">
                  <Image
                    src={user.profileImage}
                    alt="Profile"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow hover:shadow-md"
                >
                  Edit Profile
                </button>
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-1">
                  {user.name}
                </h2>
                <p className="text-gray-600 mb-5 text-sm">{user.email}</p>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    About
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{user.bio}</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">
                    Member since {user.joined}
                  </p>
                </div>
                <div className="border-t border-gray-200 mb-2 mt-4 pt-4">
                  <h3 className="text-x font-semibold text-gray-700 my-2">Description</h3>
                  <div className="border-1 rounded-lg h-32 my-2">
                    {/* <Input type="text" /> */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 mb-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
