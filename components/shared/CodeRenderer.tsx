"use client";

import React from "react";

interface CodeRendererProps {
  html: string;
}

export default function CodeRenderer({ html }: CodeRendererProps) {
  // This helper splits the string into text and code blocks
  // It looks for <code>...</code> tags
  const parts = html.split(/(<code>[\s\S]*?<\/code>)/g);

  return (
    <div className="leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith("<code>") && part.endsWith("</code>")) {
          // Extract content between <code> tags
          const codeContent = part.replace(/<\/?code>/g, "");
          return (
            <div key={i} className="my-4 relative group">
              <div className="absolute -inset-y-2 -inset-x-4 bg-gray-100/50 rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" />
              <pre className="relative overflow-x-auto p-4 bg-gray-100 text-gray-800 rounded-xl font-mono text-sm shadow-sm border border-gray-200">
                <code className="selection:bg-indigo-100">{codeContent.trim()}</code>
              </pre>
            </div>
          );
        }
        
        // Render normal text, preserving other HTML (like <strong> or <br>)
        return (
          <span 
            key={i} 
            dangerouslySetInnerHTML={{ __html: part }} 
            className="text-gray-900"
          />
        );
      })}
    </div>
  );
}
