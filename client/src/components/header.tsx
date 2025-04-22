import React from "react";

export default function Header() {
  return (
    <header className="bg-primary text-white shadow-card">
      <div className="container mx-auto px-md py-sm flex items-center justify-between">
        <div className="flex items-center space-x-sm">
          <span className="material-icons text-2xl">gavel</span>
          <h1 className="text-h3 font-semibold leading-heading">LegalAssist AI</h1>
        </div>
        <div className="flex items-center space-x-md">
          <button className="bg-white/20 hover:bg-white/30 hover:shadow-hover rounded-full p-2 transition-all duration-300">
            <span className="material-icons text-sm">help_outline</span>
          </button>
          <button className="bg-white/20 hover:bg-white/30 hover:shadow-hover rounded-full p-2 transition-all duration-300">
            <span className="material-icons text-sm">settings</span>
          </button>
          <div className="h-10 w-10 rounded-full bg-secondary/90 flex items-center justify-center shadow-sm hover:shadow-hover hover:scale-[1.02] transition-all duration-300">
            <span className="text-sm font-medium">JD</span>
          </div>
        </div>
      </div>
    </header>
  );
}
