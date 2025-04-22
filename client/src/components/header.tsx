import React from "react";

export default function Header() {
  return (
    <header className="bg-primary-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="material-icons">description</span>
          <h1 className="text-xl font-semibold">LegalAssist AI</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all">
            <span className="material-icons text-sm">help_outline</span>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all">
            <span className="material-icons text-sm">settings</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
        </div>
      </div>
    </header>
  );
}
