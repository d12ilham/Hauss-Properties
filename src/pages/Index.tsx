import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "@/services/apiService";

const Index = () => {
  const isAuthenticated = apiService.isAuthenticated();
  const getCurrentUser = apiService.getCurrentUser();
  const navigate = useNavigate();

  console.log("getCurrentUser", getCurrentUser);

  const handleLogout = () => {
    apiService.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-black px-5 pt-8 pb-5 rounded-xl shadow-md w-96">
        <img
          src="/hauss-logo.png"
          alt=""
          className="w-28 h-28 object-contain mx-auto "
        />
        <div className="space-y-4">
          {!isAuthenticated ? (
            <Link
              to="/auth"
              className="block text-[#EC9B57] border border-[#EC9B57] px-5 py-3 rounded-xl hover:bg-[#EC9B57] hover:text-white transition-colors duration-300 no-underline"
            >
              Login to Dashboard
            </Link>
          ) : (
            <div className="text-white">
              <div className="flex gap-5 justify-center mt-5">
                <button
                  onClick={handleLogout}
                  className="text-[#EC9B57] hover:text-white"
                >
                  Logout
                </button>
                <Link
                  to="/dashboard"
                  className="text-[#EC9B57] border border-[#EC9B57] px-5 py-2 rounded-xl hover:bg-[#EC9B57] hover:text-white transition-colors duration-300 no-underline"
                >
                  Go to Dashboard
                </Link>
              </div>
              <p className="text-center text-sm mt-10">
                Logged in as: {getCurrentUser?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
